import { io, Socket } from "socket.io-client";
import { Player, TurnInfo } from "../../types/game.js";
import { GameAnswerPayload, GameMsg, GameQueryPayload, GameReportPayload, GameUpdatePayload } from "../../types/gameMessages.js";
import { GameAnswerMsg, GameQueryMsg, GameReportMsg, GameSocket, GameUpdateMsg } from "../../types/socket.interfaces.js";
import { SetupSocketOptions, setupSockets } from "../setup.js";
import { passTime } from "../../utils.js";
import { EventEmitter } from "eventemitter3";
import { nanoid } from "nanoid";

export class SocketManager extends EventEmitter {
  game: GameSocket;
  lobby: Socket;
  name: string;
  gameId: string;

  private _ready: boolean;

  constructor(options: SetupSocketOptions) {
    super();
    let token: string = "babab"

    this.game = io(`${options.serverUrl}/game/${options.gameId}`, {
      auth: {
        token: token
      }
    });

    this.lobby = io(options.serverUrl, {
      auth: {
        token: token
      }

    });

    this.name = options.name;
    this.gameId = options.gameId;
    this._ready = false;

    const self = this;

    this.game.on(GameMsg.TURN_END, (ack) => {
      self.emit(GameMsg.TURN_END)
      ack();
    })

    this.game.on(GameMsg.TURN_START, (turnInfo, ack) => {
      self.emit(GameMsg.TURN_START, turnInfo)
      ack();
    })

    // this.game.on(GameMsg.WAITING, async (ack) => {
    //   await self.emitWithAck(GameMsg.WAITING);
    //   ack();
    // })

  }

  // emitWithAck(event: string, ...args: any[]) {
  //   return new Promise<void>((res, rej) => {
  //     const receptionChannel = nanoid();
  //     this.once(receptionChannel, () => res())
  //     this.emit(event, { receptionChannel }, ...args)
  //   })
  // }

  // addListenerForAck(event: string, cb: (...args: any[]) => void) {
  //   this.addListener(event, ({ receptionChannel }, ...args) => {
  //     cb(args);
  //     this.emit(receptionChannel);
  //   })
  // }

  get sender(): Player {
    // return this.name;
    // XXX: we are returning the socket.id until we can identify users based on their auths
    return this.game.id!
  }
  _lobbyReady(): boolean {
    return this.lobby.connected
  }

  _gameReady(): boolean {
    return this.game.connected
  }

  async socketsReady() {
    while (!this._ready) {
      await passTime(100);
      if (this._lobbyReady() && this._gameReady()) {
        this._ready = true;
      }
    }
  }

  async waitForGameStartEvent(): Promise<void> {
    // TODO: add setTimeout to run rej branch
    return new Promise((res, rej) => {
      this.game.once(GameMsg.STARTED, (ack) => { ack(); res() })
    });
  }

  async waitForTurnStartEvent(): Promise<TurnInfo> {
    // TODO: add setTimeout to run rej branch
    return new Promise((res, rej) => {
      this.game.once(GameMsg.TURN_START, (data: TurnInfo, ack) => { ack(); res(data) })
    });
  }

  async advertisePlayerAsReady() {
    await this.game.timeout(3000).emitWithAck(GameMsg.READY);
  }

  async broadcastAnswer(payload: GameAnswerPayload) {
    const answerMsg = {
      event: GameMsg.ANSWER,
      sender: this.sender,
      payload
    };
    await this.game.timeout(3000).emitWithAck(GameMsg.ANSWER, answerMsg);
  }

  async broadcastQuery(payload: GameQueryPayload) {
    const queryMsg = {
      event: GameMsg.QUERY,
      sender: this.sender,
      payload
    };
    await this.game.timeout(3000).emitWithAck(GameMsg.QUERY, queryMsg);
  }

  async broadcastUpdate(payload: GameUpdatePayload) {
    const updateMsg = {
      event: GameMsg.UPDATE,
      sender: this.sender,
      payload
    };
    await this.game.timeout(3000).emitWithAck(GameMsg.UPDATE, updateMsg);
  }

  async broadcastReport(payload: GameReportPayload) {
    const reportMsg = {
      event: GameMsg.REPORT,
      sender: this.sender,
      payload
    };
    await this.game.timeout(3000).emitWithAck(GameMsg.REPORT, reportMsg);
  }

  async waitForQuery(amount: number): Promise<Map<string, GameQueryPayload>> {

    const queries: Map<Player, GameQueryPayload> = new Map();

    const listener = (msg: GameQueryMsg, ack: () => void) => {
      queries.set(msg.sender, msg.payload)
      ack();
    };
    this.game.on(GameMsg.QUERY, listener);

    return new Promise(async (res, rej) => {
      setTimeout(rej, 2000);
      while (queries.size !== amount) {
        await passTime(100);
      }
      this.game.off(GameMsg.QUERY, listener)
      res(queries)
    });
  }

  async waitForAnswer(amount: number): Promise<Map<string, GameAnswerPayload>> {
    const answers: Map<Player, GameAnswerPayload> = new Map();
    const listener = (msg: GameAnswerMsg, ack: () => void) => {
      answers.set(msg.payload.to, msg.payload)
      ack();
    };
    this.game.on(GameMsg.ANSWER, listener);
    return new Promise(async (res, rej) => {
      while (answers.size !== amount) {
        await passTime(100);
      }
      this.game.off(GameMsg.ANSWER, listener)
      res(answers)
    });
  }

  async waitForUpdates(amount: number): Promise<Map<string, GameUpdatePayload>> {

    const updates: Map<Player, GameUpdatePayload> = new Map();

    const listener = (msg: GameUpdateMsg, ack: () => void) => {
      // console.log("Received QUERY", msg);
      updates.set(msg.sender, msg.payload)
      ack();
    };
    this.game.on(GameMsg.UPDATE, listener);

    return new Promise(async (res, rej) => {
      setTimeout(rej, 2000);
      while (updates.size !== amount) {
        await passTime(100);
      }
      this.game.off(GameMsg.UPDATE, listener)
      res(updates)
    });
  }


  async waitForReport(from: Player): Promise<GameReportPayload> {
    let report: GameReportPayload | undefined = undefined;
    const listener = (msg: GameReportMsg, ack: () => void) => {
      console.log("SOME REPORT MSG", JSON.stringify(msg));
      if (msg.sender == from) {
        report = msg.payload;
      }
      ack();
    }
    this.game.on(GameMsg.REPORT, listener);
    return new Promise(async (res, rej) => {
      while (report === undefined) {
        await passTime(100);
      }
      this.game.off(GameMsg.REPORT, listener)
      res(report)
    });
  }


}
