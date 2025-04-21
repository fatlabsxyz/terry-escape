import { GameClient } from "./game/gameclient.js";
import { SocketManager } from "./sockets/socketManager.js";
import { getAuthToken, AuthRequestData } from "./../utils.js";

export async function initClient(name: string, url: string, gameId: string) {

  const data: AuthRequestData = { name: name, url: url };
  const newToken = await getAuthToken(data);

  if (newToken) {
    const sockets = new SocketManager({
      serverUrl: url,
      token: newToken,
      gameId: gameId, 
    });

    await sockets.socketsReady();

    const client = new GameClient(sockets.token, sockets);

    await client.play();
  } else {
    console.log("Could not get user token from gamemaster in /auth")
  } 
}
