import { initClient } from "./init.js";

const args = process.argv.splice(2)

function passTime(ms: number): Promise<void> {
  return new Promise((res, rej) => {
    setTimeout(res, ms)
  })
}

async function initCli() {

  const url = args[0]!;
  const name = args[1]!;
  const gameId = args[2]!;

  initClient(name, url, gameId);  
}



initCli().catch((e) => {
  console.error(e);
  process.exit(1);
});
