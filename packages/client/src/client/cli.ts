import { setupSockets } from "./setup";

const args = process.argv.splice(2)

async function initClient() {
  const { lobby } = setupSockets({
    serverUrl: args[0]!,
    name: args[1]!,
    gameId: args[2]!,
    token: ""
  });
}

initClient().catch((e) => {
  console.error(e);
  process.exit(1);
});

