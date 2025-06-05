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
  GameUpdatePayload,
  GameMessagePayload,
  RetrieveMsg,
  GameProofsPayload
} from "../../types/gameMessages.js";
import { GameSocket } from "../../types/socket.interfaces.js";
import { passTime, setEqual } from "../../utils.js";
import { SetupSocketOptions } from "../setup.js";

import { PlayerStorage } from '../playerStorage.js';

import jwt from 'jsonwebtoken';

const TIMEOUT = 300_000;

type FromTo = [string, string];
 
type Turn = number;

export type MessageBox = {
  deploys: GameDeployMsg[];
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
      deploys: new Array(),
      queries: new Map(),
      updates: new Map(),
      answers: new Map(),
      reports: new Map(),
    };
    
    this.game = io(`${options.serverUrl}/game/${options.gameId}`, {
      timeout: 30000,
      auth: {
        token: options.token
      }
    });

    this.lobby = io(options.serverUrl, {
      timeout: 30000,
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

    // this.game.on(GameMsg.DEPLOY, (msg: GameDeployMsg[], ack: () => void) => {
    //   this.messageBox.deploys = msg;
    //
    //   console.log("\n\nDEPLOY MSG:", msg);
    //   ack();
    // });
    //
    // this.game.on(GameMsg.QUERY, (msg: GameQueryMsg[], ack: () => void) => {
    //   const turn = msg[0]?.turn as number;
    //   this.messageBox.queries.set(turn, msg);
    //
    //   console.log("\n\nQUERY MSG:", msg);
    //   console.log(`LEN:${msg.length}\n\n`);
    //   ack();
    // });
    //
    // this.game.on(GameMsg.ANSWER, (msg: GameAnswerMsg[], ack: () => void) => {
    //
    //   const turn = msg[0]?.turn as number;
    //   this.messageBox.answers.set(turn, msg);
    //
    //   console.log("\n\nANSWER MSG:", msg);
    //   ack();
    // });
    //
    // this.game.on(GameMsg.UPDATE, (msg: GameUpdateMsg[], ack: () => void) => {
    //   const turn = msg[0]?.turn as number;
    //   this.messageBox.updates.set(turn, msg);
    //
    //   console.log("\n\nUPDATE MSG:", msg);
    //   ack();
    // });
    //
    // this.game.on(GameMsg.REPORT, (msg: GameReportMsg[], ack: () => void) => {
    //   const turn = msg[0]?.turn as number;
    //   this.messageBox.reports.set(turn, msg);
    //
    //   console.log("\n\nREPORT MSG:", msg);
    //   ack();
    // });

    this.game.on(GameMsg.PROOFS, (msg: GameProofsPayload, ack: () => void) => {

      const turn = msg.messages[0]?.turn as number;
      
      console.log(`\n\nRECIEVED MSG: type: ${msg.type}, value: ${msg.messages}`);
      
      switch (msg.type) {
        case GameMsg.DEPLOY: { 
          this.messageBox.deploys = msg.messages.map(x => x as GameDeployMsg);
          break;
        }; 
        case GameMsg.QUERY: { 
          this.messageBox.queries.set(turn, msg.messages.map(x => x as GameQueryMsg));
          break;
        };
        case GameMsg.ANSWER: { 
          this.messageBox.answers.set(turn, msg.messages.map(x => x as GameAnswerMsg));
          break;
        };
        case GameMsg.UPDATE: { 
          this.messageBox.updates.set(turn, msg.messages.map(x => x as GameUpdateMsg));
          break;
        };
        case GameMsg.REPORT: { 
          this.messageBox.reports.set(turn, msg.messages.map(x => x as GameReportMsg));
          break;
        };
      }
      ack();
    })
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

  // async retrieveMissedValues(turn: number, event: GameMsg): Promise<Map<string, GameMessage>> {
  //     const message: RetrieveMsg = {
  //     turn,
  //     event 
  //   };
  //   await this.game.timeout(TIMEOUT).emitWithAck(GameMsg.FETCH_PROOFS, message);
  //
  //   const values: Map<Player, GameMessagePayload> = new Map();
  //   return new Promise(async (res, rej) => {
  //     setTimeout(rej, TIMEOUT);
  //     console.log("WAITING FOR MISSED MESSAGE OF TYPE: ", event);
  //     while (true) {
  //       await passTime(100);
  //
  //       const recieved = !!this.messageBox.deploys;
  //
  //       if (!recieved) { 
  //         await passTime(100); 
  //       } else {
  //         const valuesInTurn = this.messageBox.deploys!;
  //         valuesInTurn.forEach(msg => values.set(msg.sender, msg.payload));
  //         break;
  //       }
  //     }
  //     //TODO FIX THIS maybe I'll have to write different methods idk
  //     res(values)
  //   });
  //
  // }

  async waitForDeploys(): Promise<Map<string, GameDeployPayload>> {
    const deploys: Map<Player, GameDeployPayload> = new Map();
    return new Promise(async (res, rej) => {
      setTimeout(rej, TIMEOUT);
      console.log("WAITING FOR DEPLOYS");
      while (true) {
        await passTime(100);
         
        const recieved = !!this.messageBox.deploys;

        if (!recieved) { 
          await passTime(100); 
        } else {
          const valuesInTurn = this.messageBox.deploys!;
          valuesInTurn.forEach(msg => deploys.set(msg.sender, msg.payload));
          break;
        }
      }
      res(deploys)
    });
  }

  async waitForQueries(turn: number): Promise<Map<string, GameQueryPayload>> {
    const queries: Map<Player, GameQueryPayload> = new Map();
    return new Promise(async (res, rej) => {
      console.log("WAITING FOR QUERIES");
      setTimeout(rej, TIMEOUT);
      while (true) {
        await passTime(100);
        
        const recieved = this.messageBox.queries.has(turn);

        // console.log("FOUND SOME QUERIES: ", recieved);
        if (!recieved) { 
          await passTime(100); 
        } else {
          const valuesInTurn = this.messageBox.queries.get(turn)!;
          valuesInTurn.forEach(msg => queries.set(msg.sender, msg.payload));
          break;
        }      
      }
      res(queries)
    });
  }

  async waitForAnswers(turn: number): Promise<Map<string, GameAnswerPayload>> {
    const answers: Map<Player, GameAnswerPayload> = new Map();
    return new Promise(async (res, rej) => {
      setTimeout(rej, TIMEOUT);
      while (true) {
        await passTime(100);
        
        const recieved = this.messageBox.answers.has(turn);

        console.log("FOUND SOME ANSWERS: ", recieved);
        if (!recieved) { 
          await passTime(100); 
        } else {
          const valuesInTurn = this.messageBox.answers.get(turn)!;
          valuesInTurn.forEach(msg => answers.set(msg.sender, msg.payload));
          break;
        }      
      }
      res(answers)
    });
  }

  async waitForUpdates(turn: number): Promise<Map<string, GameUpdatePayload>> {
    const updates: Map<Player, GameUpdatePayload> = new Map();
    return new Promise(async (res, rej) => {
      setTimeout(rej, TIMEOUT);
      while (true) {
        await passTime(100);
        
        const recieved = this.messageBox.updates.has(turn);

        if (!recieved) { 
          await passTime(100); 
        } else {
          const valuesInTurn = this.messageBox.updates.get(turn)!;
          valuesInTurn.forEach(msg => updates.set(msg.sender, msg.payload));
          break;
        }      
      }
      res(updates)
    });
  }

  async waitForReports(turn: number): Promise<Map<string, GameReportPayload>> {
    let reports: Map<Player, GameReportPayload> = new Map();
    return new Promise(async (res, rej) => {
      setTimeout(rej, TIMEOUT);
      while (true) {
        await passTime(100);
        
        const recieved = this.messageBox.reports.has(turn);

        if (!recieved) { 
          await passTime(100); 
        } else {
          const valuesInTurn = this.messageBox.reports.get(turn)!;
          valuesInTurn.forEach(msg => reports.set(msg.sender, msg.payload));
          break;
        }
      }
      res(reports)
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
