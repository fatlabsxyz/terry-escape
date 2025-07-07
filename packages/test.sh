#!/bin/bash

# could return multiple instances of the same repo:
# REPO_PATH=$(find ~ -type d -name "terry-escape" 2>/dev/null)
# echo "$REPO_PATH"

#            ###------- SET PATH HERE -------###
REPO_PATH="${HOME}/repos/fatsolutions/terry-escape"
#            ^^^------- SET PATH HERE -------^^^

PP="${REPO_PATH}/packages/"

COMMANDS=(
    "cd ${PP}gamemaster && pnpm start"
    "cd ${PP}client && pnpm andres"
    "cd ${PP}client && pnpm barto" 
    "cd ${PP}client && pnpm felipe"
    "cd ${PP}client && pnpm juan"
)

case "$1" in
    -b)
        BUILD_COMMANDS=(
            "cd ${PP}client && pnpm build"
            "cd ${PP}gamemaster && pnpm build"
        )
        # for building
        declare -a BUILD_PIDS

        for build in "${BUILD_COMMANDS[@]}"; do
            alacritty --hold -e bash -c "$build; exec bash" &
            BUILD_PIDS+=($!)
            sleep 8
        done
        for pid in "${BUILD_PIDS[@]}"; do 
            kill -TERM "$pid" 2>/dev/null
        done
        ;;
    *)
        ;;
esac

# for running
declare -a PIDS

rm -f /tmp/game_0

cleanup() {
    for pid in "${PIDS[@]}"; do
        kill -TERM "$pid" 2>/dev/null
    done
    echo "all gamers assasinated"
    exit 0
}

trap cleanup SIGINT

alacritty -e bash -c "${COMMANDS[0]}; exec bash" &
PIDS+=($!)

sleep 2

for cmd in "${COMMANDS[@]:1}"; do
    alacritty -e bash -c "$cmd; exec bash" &
    PIDS+=($!)
done

echo "press enter to kill all gamers"
read -r || cleanup

echo "game simulation ended"
cleanup
