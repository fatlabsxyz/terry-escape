#!/bin/bash

CIRCUITS=(
    "answers_updates"
    "blinded_answers"
    "combine_queries"
    "initial_deploys"
    "keypair"
    "offline_queries"
    "reports_updates"
)

BUILD_DIR="circuits"
DEST_DIR="src/circuits"


mkdir -p "$DEST_DIR"
for circuit in "${CIRCUITS[@]}"
do
  cp "$BUILD_DIR/$circuit/target/${circuit}.json" "$DEST_DIR/"
done
