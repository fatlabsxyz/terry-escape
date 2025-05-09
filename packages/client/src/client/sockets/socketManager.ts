import { EventEmitter } from "eventemitter3";
import { io, Socket } from "socket.io-client";
import { Player, TurnInfo, UpdatesData } from "../../types/game.js";
import {
  GameAnswerMsg,
  GameAnswerPayload,
  GameMessage,
  GameMsg,
  GameQueryMsg,
  GameQueryPayload,
  GameReportMsg,
  GameReportPayload,
  GameUpdateMsg,
  GameUpdatePayload
} from "../../types/gameMessages.js";
import { GameSocket } from "../../types/socket.interfaces.js";
import { passTime, setEqual } from "../../utils.js";
import { MessageLog } from "../messageLog.js";
import { SetupSocketOptions } from "../setup.js";

const TIMEOUT = 3_000;

type FromTo = [string, string];

export interface SocketManagerOptions {
  serverUrl: string;
  token: string,
  gameId: string,
  forceNew?: boolean
}

export class SocketManager extends EventEmitter {
  game: GameSocket;
  lobby: Socket;
  gameId: string;
  token: string;

  private _ready: boolean;
  msgLog: MessageLog<GameMessage>;

  constructor(options: SocketManagerOptions) {
    super();
    
    // get token and assign to 

    this.game = io(`${options.serverUrl}/game/${options.gameId}`, {
      auth: {
        token: options.token
      }
    });

    this.lobby = io(options.serverUrl, {
      auth: {
        token: options.token
      }

    });
    this.token = options.token;
    this.gameId = options.gameId;
    this._ready = false;
    this.msgLog = new MessageLog();

    const self = this;

    this.game.on(GameMsg.TURN_END, (ack) => {
      self.emit(GameMsg.TURN_END)
      ack();
    })

    this.game.on(GameMsg.TURN_START, (turnInfo, ack) => {
      self.emit(GameMsg.TURN_START, turnInfo)
      ack();
    })

    this.game.on(GameMsg.QUERY, (msg: GameQueryMsg, ack: () => void) => {
      this.msgLog.register(msg);
      ack();
    });

    this.game.on(GameMsg.ANSWER, (msg: GameAnswerMsg, ack: () => void) => {
      this.msgLog.register(msg);
      ack();
    });

    this.game.on(GameMsg.UPDATE, (msg: GameUpdateMsg, ack: () => void) => {
      this.msgLog.register(msg);
      ack();
    });

    this.game.on(GameMsg.REPORT, (msg: GameReportMsg, ack: () => void) => {
      this.msgLog.register(msg);
      ack();
    });

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

  lookLogForEvent(turn: number, event: GameMsg, fromTo: Set<FromTo>): GameMessage[] {
    return Array.from(fromTo.values().map(s => {
      return this.msgLog.find(turn, event, s[0], s[1])
    }).filter(x => x !== undefined))
  }

  lookLogForQueries(turn: number, fromTo: Set<FromTo>): GameQueryMsg[] {
    return this.lookLogForEvent(turn, GameMsg.QUERY, fromTo) as GameQueryMsg[]
  }

  lookLogForAnswer(turn: number, fromTo: Set<FromTo>): GameAnswerMsg[] {
    return this.lookLogForEvent(turn, GameMsg.ANSWER, fromTo) as GameAnswerMsg[]
  }

  lookLogForUpdates(turn: number, fromTo: Set<FromTo>): GameUpdateMsg[] {
    return this.lookLogForEvent(turn, GameMsg.UPDATE, fromTo) as GameUpdateMsg[]
  }

  lookLogForReport(turn: number, from: string): GameReportMsg | undefined {
    return this.msgLog.find(turn, GameMsg.REPORT, from) as GameReportMsg | undefined
  }

  async advertisePlayerAsReady() {
    const playerIndex = await this.game.timeout(TIMEOUT).emitWithAck(GameMsg.READY);

    console.log(playerIndex);
    return playerIndex;
  }

  async broadcastAnswer(turn: number, to: string, payload: GameAnswerPayload) {
    const answerMsg = {
      turn,
      event: GameMsg.ANSWER,
      sender: this.sender,
      to,
      payload
    };
    await this.game.timeout(TIMEOUT).emitWithAck(GameMsg.ANSWER, answerMsg);
  }

  async broadcastQuery(turn: number, to: string, payload: GameQueryPayload) {
    const queryMsg = {
      turn,
      event: GameMsg.QUERY,
      sender: this.sender,
      to,
      payload
    };
    await this.game.timeout(TIMEOUT).emitWithAck(GameMsg.QUERY, queryMsg);
  }

  async broadcastUpdate(turn: number, to: string, payload: GameUpdatePayload) {
    const updateMsg = {
      turn,
      event: GameMsg.UPDATE,
      sender: this.sender,
      to,
      payload
    };
    await this.game.timeout(TIMEOUT).emitWithAck(GameMsg.UPDATE, updateMsg);
  }

  async broadcastReport(turn: number, payload: GameReportPayload) {
    const reportMsg = {
      turn,
      event: GameMsg.REPORT,
      sender: this.sender,
      payload,
    };
    await this.game.timeout(TIMEOUT).emitWithAck(GameMsg.REPORT, reportMsg);
  }

  async waitForQuery(turn: number, activePlayer: string, players: Player[]): Promise<Map<string, GameQueryPayload>> {
    const playerSet = new Set(players);
    const queries: Map<Player, GameQueryPayload> = new Map();
    return new Promise(async (res, rej) => {
      setTimeout(rej, TIMEOUT);
      while (true) {
        await passTime(100);
        const missingPlayers = new Set(playerSet.difference(new Set(queries.keys()))
          .values()
          .map(from => [from, activePlayer] as FromTo))
        const loggedMsgs = this.lookLogForQueries(turn, missingPlayers);
        loggedMsgs.forEach(msg => queries.set(msg.sender, msg.payload));
        const enough = setEqual(playerSet, new Set(queries.keys()));
        if (!enough) { await passTime(100); } else { break; }
      }
      res(queries)
    });
  }

  async waitForAnswer(turn: number, activePlayer: Player, players: Player[]): Promise<Map<string, GameAnswerPayload>> {
    const playerSet = new Set(players);
    const answers: Map<Player, GameAnswerPayload> = new Map();
    return new Promise(async (res, rej) => {
      setTimeout(rej, TIMEOUT);
      while (true) {
        const missingPlayers = new Set(playerSet.difference(new Set(answers.keys()))
          .values()
          .map(to => [activePlayer, to] as FromTo))
        const loggedMsgs = this.lookLogForAnswer(turn, missingPlayers);
        loggedMsgs.forEach(msg => answers.set(msg.to, msg.payload));
        const enough = setEqual(playerSet, new Set(answers.keys()));
        if (!enough) { await passTime(100); } else { break; }
      }
      res(answers)
    });
  }

  async waitForUpdates(turn: number, activePlayer: string, players: Player[]): Promise<Map<string, GameUpdatePayload>> {
    const playerSet = new Set(players);
    const updates: Map<Player, GameUpdatePayload> = new Map();
    return new Promise(async (res, rej) => {
      setTimeout(rej, TIMEOUT);
      while (true) {
        await passTime(100);
        const missingPlayers = new Set(playerSet.difference(new Set(updates.keys()))
          .values()
          .map(from => [from, activePlayer] as FromTo))
        const loggedMsgs = this.lookLogForUpdates(turn, missingPlayers);
        loggedMsgs.forEach(msg => updates.set(
          msg.sender, { proof: msg.payload.proof }
        ));
        let enough = setEqual(playerSet, new Set(updates.keys()));
        if (!enough) { await passTime(100); } else { break; }
      }
      res(updates)
    });
  }

  async waitForReport(turn: number, from: Player): Promise<GameReportPayload> {
    let report: GameReportPayload | undefined = undefined;
    return new Promise(async (res, rej) => {
      setTimeout(rej, TIMEOUT);
      while (report === undefined) {
        await passTime(100);
        const reportMsg = this.lookLogForReport(turn, from);
        report = reportMsg?.payload;
      }
      res(report)
    });
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


}
