import { EventEmitter } from "eventemitter3";
import { io, Socket } from "socket.io-client";
import { jwtDecode } from 'jwt-decode';
import { JwtPayload, PlayerId, PlayerSeat, TurnInfo, TurnInfoPayload } from "../../types/game.js";
import {
  GameAnswerMsg,
  GameAnswerPayload,
  GameMsg,
  GameDeployMsg,
  GameDeployPayload,
  GameQueryMsg,
  GameQueryPayload,
  GameReportMsg,
  GameReportPayload,
  GameUpdateMsg,
  GameUpdatePayload,
  GameProofsPayload,
  GamePlayerSeatMsg,
  RetrieveMsg,
  GameMessage
} from "../../types/gameMessages.js";
import { GameSocket } from "../../types/socket.interfaces.js";
import { passTime, setEqual } from "../../utils.js";
import { MessageBox } from "../../messageBox.js";

const TIMEOUT = 300_000;
 
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
  playerSeat: undefined | PlayerSeat;

  private _ready: boolean;
  msgBox: MessageBox;

  constructor(options: SocketManagerOptions) {
    super();

    this.msgBox = new MessageBox;

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

    const decoded = jwtDecode(this.token);
    const data = decoded as JwtPayload; 
    this.playerId = data.id;
    this.playerName = data.name;
    
    const self = this;

    this.game.on(GameMsg.TURN_END, (ack) => {
      self.emit(GameMsg.TURN_END)
      ack();
    })

    this.game.on(GameMsg.TURN_START, (p, ack) => {
      // SocketIo apparently has trouble serializing and deserializing 
      // an object when it has a map<string:bool> inside of it, and sends it as an empty obj.
      // this is why TurnInfoPayload converts round to an object 
      // before sending it, and then re-converts it.
      const roundEntries: [string, boolean][] = Object.entries(p.round);
      // const round = roundEntries.reduce((round, [key, value]) => round.set(key, value), new Map<string, boolean>());
      // const round = new Map<string, boolean>(roundEntries)); //this used to work idk why it doesn't now
      const turnInfo = {
        turn:         p.turn,
        round:        new Map<string, boolean>(roundEntries),
        activePlayer: p.activePlayer,
        nextPlayer:   p.nextPlayer,
        gameOver:     p.gameOver! 
      }
      self.emit(GameMsg.TURN_START, turnInfo)
      ack();
    })

    this.game.on(GameMsg.PLAYER_SEAT, async (msg: GamePlayerSeatMsg) => {
      const seat = msg.payload.seat;

      if (this.playerSeat != seat) {
        this.playerSeat = seat 
      }
    });

    this.game.on(GameMsg.PROOFS, (msg: GameProofsPayload, ack: () => void) => {

      const turn = msg.messages[0]?.turn as number;

      switch (msg.type) {
        case GameMsg.DEPLOY: {
          if (this.msgBox.deploys.length === 0) {
            this.msgBox.deploys = msg.messages.map(x => x as GameDeployMsg);
            // this.printMessagesRecieved(msg.messages);
          }
          break;
        }; 
        case GameMsg.QUERY: {
          if (this.msgBox.queries.get(turn) === undefined) {
            this.msgBox.queries.set(turn, msg.messages.map(x => x as GameQueryMsg));
            // this.printMessagesRecieved(msg.messages);
          }
          break
        };
        case GameMsg.ANSWER: {
          if (this.msgBox.answers.get(turn) === undefined) {
          this.msgBox.answers.set(turn, msg.messages.map(x => x as GameAnswerMsg));
            // this.printMessagesRecieved(msg.messages);
          }
          break;
        };
        case GameMsg.UPDATE: { 
          if (this.msgBox.updates.get(turn) === undefined) {
          this.msgBox.updates.set(turn, msg.messages.map(x => x as GameUpdateMsg));
            // this.printMessagesRecieved(msg.messages);
          }
          break;
        };
        case GameMsg.REPORT: { 
          if (this.msgBox.reports.get(turn) === undefined) {
          this.msgBox.reports.set(turn, msg.messages.map(x => x as GameReportMsg)[0]!);
            // this.printMessagesRecieved(msg.messages);
          }
          break;
        };
      }
      ack();
    })    
  }


  // printMessagesRecieved(messages: GameMessage[]){
  //   //TODO remove this function later
  //   console.log("\n\n\n MESSAGES RECIEVED: ")
  //   messages.forEach((message) => {
  //     console.log("event: ", message.event, " -from- ", message.sender, " -to- ", message.to, "\n")
  //   });
  // }


  get sender(): PlayerId {;
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

  async requestMissedValues(turn: number, event: GameMsg) {
      const message: RetrieveMsg = {
      turn,
      event
    };
    await this.game.timeout(TIMEOUT).emitWithAck(GameMsg.FETCH_PROOFS, message);
  }

  async waitForPlayerSeat(): Promise<PlayerSeat> {
    return new Promise(async (res, rej) => {
      setTimeout(rej, TIMEOUT);
      while (true) {
       
        const recieved = (this.playerSeat !== undefined);
        if (recieved) { break; } else { await passTime(100); }
      }
      res(this.playerSeat as PlayerSeat)
    });
  }

  async waitForDeploys(): Promise<Map<string, GameDeployPayload>> {
    const deploys: Map<PlayerId, GameDeployPayload> = new Map();
    return new Promise(async (res, rej) => {
      setTimeout(rej, TIMEOUT);
      while (true) {
        await passTime(100);
         
        const recieved = !!this.msgBox.deploys;

        if (!recieved) { 
          await passTime(100); 
        } else {
          const valuesInTurn = this.msgBox.deploys!;
          valuesInTurn.forEach(msg => deploys.set(msg.sender, msg.payload));
          break;
        }
      }
      res(deploys)
    });
  }

  async waitForQueries(turn: number): Promise<Map<string, GameQueryPayload>> {
    const queries: Map<PlayerId, GameQueryPayload> = new Map();
    return new Promise(async (res, rej) => {
      setTimeout(rej, TIMEOUT);
      while (true) {
        await passTime(100);
        
        const recieved = this.msgBox.queries.has(turn);

        if (!recieved) { 
          await passTime(100); 
        } else {
          const valuesInTurn = this.msgBox.queries.get(turn)!;
          valuesInTurn.forEach(msg => queries.set(msg.sender, msg.payload));
          break;
        }      
      }
      res(queries)
    });
  }

  async waitForAnswers(turn: number): Promise<Map<string, GameAnswerPayload>> {
    const answers: Map<PlayerId, GameAnswerPayload> = new Map();
    return new Promise(async (res, rej) => {
      setTimeout(rej, TIMEOUT);
      while (true) {
        await passTime(100);
        
        const recieved = this.msgBox.answers.has(turn);

        if (!recieved) { 
          await passTime(100); 
        } else {
          const valuesInTurn = this.msgBox.answers.get(turn)!;
          valuesInTurn.forEach(msg => answers.set(msg.to!, msg.payload));
          break;
        }      
      }
      res(answers)
    });
  }

  async waitForUpdates(turn: number): Promise<Map<string, GameUpdatePayload>> {
    const updates: Map<PlayerId, GameUpdatePayload> = new Map();
    return new Promise(async (res, rej) => {
      setTimeout(rej, TIMEOUT);
      while (true) {
        await passTime(100);
        
        const recieved = this.msgBox.updates.has(turn);

        if (!recieved) { 
          await passTime(100); 
        } else {
          const valuesInTurn = this.msgBox.updates.get(turn)!;
          valuesInTurn.forEach(msg => updates.set(msg.sender, msg.payload));
          break;
        }      
      }
      res(updates)
    });
  }

  async waitForReport(turn: number): Promise<GameReportPayload> {
    let report: GameReportPayload ;
    return new Promise(async (res, rej) => {
      setTimeout(rej, TIMEOUT);
      while (true) {
        await passTime(100);
        
        const recieved = this.msgBox.reports.has(turn);

        if (!recieved) { 
          await passTime(100); 
        } else {
          const valueInTurn = this.msgBox.reports.get(turn)!;
          report = valueInTurn.payload;
          break;
        }
      }
      res(report!)
    });
  }

  async waitForGameStartEvent(): Promise<void> {
    // TODO: add setTimeout to run rej branch
    return new Promise((res, rej) => {
      setTimeout(rej, TIMEOUT);
      this.game.once(GameMsg.STARTED, (ack) => { ack(); res() })
    });
  }

  async waitForTurnStartEvent(): Promise<TurnInfoPayload> {
    // TODO: add setTimeout to run rej branch
    return new Promise((res, rej) => {
      setTimeout(rej, TIMEOUT);
      this.game.once(GameMsg.TURN_START, (data: TurnInfoPayload, ack) => { 
        ack(); 
        
        this.msgBox.clearOldMessages()

        res(data)
      })
    });
  }

}
