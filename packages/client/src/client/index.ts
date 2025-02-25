import { setupSockets } from "./setup";

async function initClient() {
  const { lobby } = setupSockets({
    serverUrl: 'http://127.0.0.1:3000',
    name: "Ricardo",
    gameId: "V1StGXR8_Z5jdHi6B2myT",
    token: ""
  });
}

initClient().catch((e) => {
  console.error(e);
  process.exit(1);
});
