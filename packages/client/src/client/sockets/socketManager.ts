import { EventEmitter } from "eventemitter3";
import { io, Socket } from "socket.io-client";
import { JwtPayload, Player, TurnInfo, UpdatesData } from "../../types/game.js";
import {
  GameAnswerMsg,
  GameAnswerPayload,
  GameMessage,
  GameMsg,
  GameDeployMsg,
  GameDeployPayload,
  GameQueryMsg,
  GameQueryPayload,
  GameReportMsg,
  GameReportPayload,
  GameUpdateMsg,
  GameUpdatePayload
} from "../../types/gameMessages.js";
import { GameSocket } from "../../types/socket.interfaces.js";
import { passTime, setEqual } from "../../utils.js";
import { SetupSocketOptions } from "../setup.js";

import { PlayerStorage } from '../playerStorage.js';

import jwt from 'jsonwebtoken';

const TIMEOUT = 300_000;

type FromTo = [string, string];
 
type Message = GameMessage;
type Turn = string;

export type MessageBox = {
  deploys: Map<Turn, GameDeployMsg[]>;
  queries: Map<Turn, GameQueryMsg[]>;   
  updates: Map<Turn, GameUpdateMsg[]>;
  answers: Map<Turn, GameAnswerMsg[]>;
  reports: Map<Turn, GameReportMsg[]>;
}

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
  playerId: string;
  playerName: string;

  private _ready: boolean;
  playerStorage: PlayerStorage;
  messageBox: MessageBox;

  constructor(options: SocketManagerOptions) {
    super();

    this.playerStorage = PlayerStorage.getInstance();

    this.messageBox = { 
      deploys: new Map(),
      queries: new Map(),
      updates: new Map(),
      answers: new Map(),
      reports: new Map(),
    };
    
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

    const decoded = jwt.verify(this.token, "test-key");
    const data = decoded as JwtPayload; 
    this.playerId = data.id;
    this.playerName = data.name;
    
    this.playerStorage.addPlayer({
      name: data.name,
      id: data.id,
      sid: this.game.id!,
      seat: undefined,
    });

    const self = this;

    this.game.on(GameMsg.TURN_END, (ack) => {
      self.emit(GameMsg.TURN_END)
      ack();
    })

    this.game.on(GameMsg.TURN_START, (turnInfo, ack) => {
      self.emit(GameMsg.TURN_START, turnInfo)
      ack();
    })

    this.game.on(GameMsg.DEPLOY, (msg: GameDeployMsg[], ack: () => void) => {
      const turn = msg[0]?.turn as number;
      this.messageBox.deploys.set(turn.toString(), msg);

      console.log("\n\nDEPLOY MSG:", msg);
      ack();
    });

    this.game.on(GameMsg.QUERY, (msg: GameQueryMsg[], ack: () => void) => {
      const turn = msg[0]?.turn as number;
      this.messageBox.queries.set(turn.toString(), msg);

      console.log("\n\nQUERY MSG:", msg);
      ack();
    });

    this.game.on(GameMsg.ANSWER, (msg: GameAnswerMsg[], ack: () => void) => {

      const turn = msg[0]?.turn as number;
      this.messageBox.answers.set(turn.toString(), msg);

      console.log("\n\nANSWER MSG:", msg);
      ack();
    });

    this.game.on(GameMsg.UPDATE, (msg: GameUpdateMsg[], ack: () => void) => {
      const turn = msg[0]?.turn as number;
      this.messageBox.updates.set(turn.toString(), msg);

      console.log("\n\nUPDATE MSG:", msg);
      ack();
    });

    this.game.on(GameMsg.REPORT, (msg: GameReportMsg[], ack: () => void) => {
      const turn = msg[0]?.turn as number;
      this.messageBox.reports.set(turn.toString(), msg);

      console.log("\n\nREPORT MSG:", msg);
      ack();
    });

  }

  get sender(): Player {;
    return this.playerId; // Player id (NOT socket id)
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
    
  async advertisePlayerAsReady() {
    const playerIndex = await this.game.timeout(TIMEOUT).emitWithAck(GameMsg.READY);

    console.log("READY: PLAYER-INDEX", playerIndex);
    return playerIndex;
  }

  async broadcastDeploy(payload: GameDeployPayload) {
    const deployMsg = {
      turn: 0,
      event: GameMsg.DEPLOY,
      sender: this.sender,
      payload
    };
    await this.game.timeout(TIMEOUT).emitWithAck(GameMsg.DEPLOY, deployMsg);
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

  async waitForDeploy(activePlayer: string, players: Player[], turn: number): Promise<Map<string, GameDeployPayload>> {
    // const playerSet = new Set(players);
    const deploys: Map<Player, GameDeployPayload> = new Map();
    return new Promise(async (res, rej) => {
      setTimeout(rej, TIMEOUT);
      while (true) {
        await passTime(100);
        
        // TODO: CHECK STORAGE OR SOMETHING
           
        const recieved = this.messageBox.deploys.has(turn.toString());

        if (!recieved) { 
          await passTime(100); 
        } else {
          const valuesInTurn = this.messageBox.deploys.get(turn.toString())!;
          valuesInTurn.forEach(msg => deploys.set(msg.sender, msg.payload));
          break;
        }
      }
      res(deploys)
    });
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
