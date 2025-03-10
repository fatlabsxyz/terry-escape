import { beforeEach, describe, expect, it, MockInstance, vi } from "vitest";
import { SocketManager } from "../../../src/client/sockets/socketManager.js";
import { createServer } from 'node:http';
import { Namespace, Server, Socket } from "socket.io"
import { GameNspClientToServerEvents, GameNspServerToClientEvents } from "../../../src/types/socket.interfaces.js";
import { GameMsg } from "../../../src/types/gameMessages.js";
import { passTime } from "../../../src/utils.js";

type Ack = () => void
interface InterServerEvents { }
interface SocketData { }
type GameNsp = Namespace<
  GameNspClientToServerEvents,
  GameNspServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type GameSocket = Socket<
  GameNspClientToServerEvents,
  GameNspServerToClientEvents,
  InterServerEvents,
  SocketData
>

type EventMap = { [key in GameMsg]?: MockInstance };

function newSocketManager(port: number) {
  return new SocketManager({
    name: "name",
    serverUrl: `http://127.0.0.1:${port}`,
    gameId: "0",
    token: ""
  });
}

async function newTestPair(addHandlers: (s: GameSocket) => EventMap) {
  const server = new Server(createServer())
  const gameNsp: GameNsp = server.of(/^\/game\/[a-zA-Z0-9_\-]+$/);
  server.listen(0);
  const port = (server.httpServer.address() as { port: number }).port
  let eventMap: EventMap = {};
  gameNsp.on("connection", (socket: GameSocket) => {
    eventMap = addHandlers(socket);
  })
  const mgr = await new Promise<SocketManager>(async (res) => {
    let _mgr = newSocketManager(port);
    await _mgr.socketsReady();
    res(_mgr)
  });
  return { server, mgr, eventMap }
}

function turnEndHandler(gameNsp: GameNsp, socket: GameSocket) {
  return vi.fn().mockImplementation(function _(cb: Ack) {
    console.log("END TURNING")
    cb();
  })
}

function addTurnEndHandlers(s: GameSocket): EventMap {
  const nsp = s.nsp;
  const eventMap: { [key in GameMsg]?: any } = {};
  eventMap[GameMsg.TURN_END] = turnEndHandler(nsp, s);
  s.on(GameMsg.TURN_END, eventMap[GameMsg.TURN_END])
  return eventMap
}

function addTurnEndHandlersWithAckBack(s: GameSocket): EventMap {
  const nsp = s.nsp;
  const eventMap: { [key in GameMsg]?: any } = {};
  eventMap[GameMsg.TURN_END] = vi.fn().mockImplementation((cb: (a: string) => void) => {
    cb("ack back");
  });
  s.on(GameMsg.TURN_END, eventMap[GameMsg.TURN_END])
  return eventMap
}

function addTurnEndHandlersWithBroadcastAckBack(s: GameSocket): EventMap {
  const nsp = s.nsp;
  const eventMap: { [key in GameMsg]?: any } = {};
  eventMap[GameMsg.TURN_END] = vi.fn().mockImplementation((cb: (a: string) => void) => {
    nsp.emit(GameMsg.TURN_END, () => {
      console.log("EMMITING TURN_END")
      cb("ack back");
    });
  });
  s.on(GameMsg.TURN_END, eventMap[GameMsg.TURN_END])
  return eventMap
}

// XXX: BEWARE THIS DOESNT WORK, .timeout MODIFIER IS BUGGY
function addTurnEndHandlersWithBroadcastWithTimeoutAckBack(s: GameSocket): EventMap {
  const nsp = s.nsp;
  const eventMap: { [key in GameMsg]?: any } = {};
  eventMap[GameMsg.TURN_END] = vi.fn().mockImplementation((cb: (a: string) => void) => {
    console.log("EMMITING TURN_END");
    (nsp.timeout(2_000) as any).emit(GameMsg.TURN_END, (error: any, responses: any) => {
      console.log(error, responses)
      cb("ack back");
    });
  });
  s.on(GameMsg.TURN_END, eventMap[GameMsg.TURN_END])
  return eventMap
}

// XXX: BEWARE THIS DOESNT WORK, .timeout MODIFIER IS BUGGY
function addTurnEndHandlersWithBroadcastWithTimeoutAckBack2(s: GameSocket): EventMap {
  const nsp = s.nsp;
  const eventMap: { [key in GameMsg]?: any } = {};
  eventMap[GameMsg.TURN_END] = vi.fn().mockImplementation(async (cb: (a: string) => void) => {
    await new Promise<void>((res, rej) => {
      console.log("EMMITING TURN_END")
      nsp.timeout(2000).emit(GameMsg.TURN_END, () => {
        res();
      });
    });
    cb("ack back");
  });
  s.on(GameMsg.TURN_END, eventMap[GameMsg.TURN_END])
  return eventMap
}

describe("Something", () => {

  it.skip("Server pings back", async () => {
    const { server, eventMap, mgr } = await newTestPair(addTurnEndHandlers);
    expect(1).toStrictEqual(1)
    await mgr.game.emitWithAck(GameMsg.TURN_END)
    expect(eventMap[GameMsg.TURN_END]).toHaveBeenCalledOnce();
    server.close();
  })

  it.skip("Server acks back", async () => {
    const { server, eventMap, mgr } = await newTestPair(addTurnEndHandlersWithAckBack);
    let res = await mgr.game.emitWithAck(GameMsg.TURN_END)
    expect(eventMap[GameMsg.TURN_END]).toHaveBeenCalledOnce();
    expect(res).toStrictEqual("ack back")
    server.close();
  })

  it("Server broadcasts before ack back", async () => {
    const { server, eventMap, mgr } = await newTestPair(addTurnEndHandlersWithBroadcastAckBack);
    const fn = vi.fn();
    mgr.game.on(GameMsg.TURN_END, (cb) => {
      fn(); cb();
    });
    let res = await mgr.game.emitWithAck(GameMsg.TURN_END)
    expect(eventMap[GameMsg.TURN_END]).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledOnce();
    expect(res).toStrictEqual("ack back")
    server.close();
  })

  // XXX: THIS STRUCTURE DOES NOT WORK, REPORT BUG TO SOCKET.IO
  it("Server broadcasts (timeout) before ack back", async () => {
    const { server, eventMap, mgr } = await newTestPair(addTurnEndHandlersWithBroadcastWithTimeoutAckBack);
    const fn = vi.fn();
    mgr.game.on(GameMsg.TURN_END, (cb: (a: string) => void) => {
      fn(); cb("HI");
    });
    let res = await mgr.game.emitWithAck(GameMsg.TURN_END)
    expect(eventMap[GameMsg.TURN_END]).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledOnce();
    expect(res).toStrictEqual("ack back")
    server.close();
  })

  // XXX: THIS STRUCTURE DOES NOT WORK, REPORT BUG TO SOCKET.IO
  it("Server broadcasts (timeout) before ack back", async () => {
    const { server, eventMap, mgr } = await newTestPair(addTurnEndHandlersWithBroadcastWithTimeoutAckBack2);
    const fn = vi.fn();
    mgr.game.on(GameMsg.TURN_END, (cb: (a: string) => void) => {
      fn(); cb("HI");
    });
    let res = await mgr.game.emitWithAck(GameMsg.TURN_END)
    expect(eventMap[GameMsg.TURN_END]).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledOnce();
    expect(res).toStrictEqual("ack back")
    server.close();
  })

})
