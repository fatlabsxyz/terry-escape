import { app } from "./app.js"
import { createServer } from 'node:http';
import { addIoSockets } from "./socket.js";

const port = 2448;


async function main() {

  const server = createServer(app);

  const io = addIoSockets(server);

  // await db.init();
  // Start the server
  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });

}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
