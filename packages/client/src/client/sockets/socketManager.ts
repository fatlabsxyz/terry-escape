import { EventEmitter } from "eventemitter3";
import { io, Socket } from "socket.io-client";
import { jwtDecode } from 'jwt-decode';
import { JwtPayload, PlayerId, PlayerSeat, TurnInfoPayload } from "../../types/game.js";
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
  GameDeploymentTimerPayload,
  GameDeploymentStatusPayload,
} from "../../types/gameMessages.js";
import { GameSocket } from "../../types/socket.interfaces.js";
import { passTime } from "../../utils.js";
import { MessageBox } from "../../messageBox.js";

const TIMEOUT = 3_000_000; // 10x: was 300_000
 
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

    console.log(`[SocketManager] Creating game socket for ${options.serverUrl}/game/${options.gameId}`);
    this.game = io(`${options.serverUrl}/game/${options.gameId}`, {
      timeout: 300000, // 10x: was 30000
      auth: {
        token: options.token
      }
    });

    console.log(`[SocketManager] Creating lobby socket for ${options.serverUrl}`);
    this.lobby = io(options.serverUrl, {
      timeout: 300000, // 10x: was 30000
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
    
    // Add connection event listeners
    this.game.on('connect', () => {
      console.log(`[SocketManager] Game socket connected! ID: ${this.game.id}`);
    });
    
    this.game.on('connect_error', (error) => {
      console.error(`[SocketManager] Game socket connection error:`, error.message);
    });
    
    this.lobby.on('connect', () => {
      console.log(`[SocketManager] Lobby socket connected! ID: ${this.lobby.id}`);
    });
    
    this.lobby.on('connect_error', (error) => {
      console.error(`[SocketManager] Lobby socket connection error:`, error.message);
    });
    
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
        gameOver:     p.gameOver!,
        playerNames:  p.playerNames 
      }
      self.emit(GameMsg.TURN_START, turnInfo)
      ack();
    });


    this.game.on(GameMsg.PLAYER_SEAT, async (msg: GamePlayerSeatMsg) => {
      const seat = msg.payload.seat;

      if (this.playerSeat != seat) {
        this.playerSeat = seat 
      }
    });
    
    this.game.on(GameMsg.PLAYERS_UPDATE, (payload: any) => {
      self.emit(GameMsg.PLAYERS_UPDATE, payload);
    });
    
    this.game.on(GameMsg.DEPLOYMENT_TIMER, (payload: GameDeploymentTimerPayload) => {
      console.log('[SocketManager] Received deployment timer:', payload);
      self.emit(GameMsg.DEPLOYMENT_TIMER, payload);
    });
    
    this.game.on(GameMsg.DEPLOYMENT_STATUS, (payload: GameDeploymentStatusPayload) => {
      console.log('[SocketManager] Received deployment status:', payload);
      self.emit(GameMsg.DEPLOYMENT_STATUS, payload);
    });

    this.game.on(GameMsg.PROOFS, (msg: GameProofsPayload, ack: () => void) => {

      const turn = msg.messages[0]?.turn as number;

      switch (msg.type) {
        case GameMsg.DEPLOY: {
          if (this.msgBox.deploys.length === 0) {
            this.msgBox.deploys = msg.messages.map(x => x as GameDeployMsg);
          }
          break;
        }; 
        case GameMsg.QUERY: {
          if (this.msgBox.queries.get(turn) === undefined) {
            this.msgBox.queries.set(turn, msg.messages.map(x => x as GameQueryMsg));
          }
          break
        };
        case GameMsg.ANSWER: {
          if (this.msgBox.answers.get(turn) === undefined) {
          this.msgBox.answers.set(turn, msg.messages.map(x => x as GameAnswerMsg));
          }
          break;
        };
        case GameMsg.UPDATE: { 
          if (this.msgBox.updates.get(turn) === undefined) {
          this.msgBox.updates.set(turn, msg.messages.map(x => x as GameUpdateMsg));
          }
          break;
        };
        case GameMsg.REPORT: { 
          if (this.msgBox.reports.get(turn) === undefined) {
          this.msgBox.reports.set(turn, msg.messages.map(x => x as GameReportMsg)[0]!);
          }
          break;
        };
      }
      ack();
    })    
  }

  get sender(): PlayerId {;
    return this.playerId;
  }

  _lobbyReady(): boolean {
    return this.lobby.connected
  }

  _gameReady(): boolean {
    return this.game.connected
  }

  async socketsReady() {
    console.log(`[SocketManager] Waiting for sockets to be ready...`);
    let waitTime = 0;
    const maxWaitTime = 10000; // 10 seconds max wait
    
    while (!this._ready && waitTime < maxWaitTime) {
      await passTime(100);
      waitTime += 100;
      const lobbyReady = this._lobbyReady();
      const gameReady = this._gameReady();
      
      if (waitTime % 1000 === 0) { // Log every second
        console.log(`[SocketManager] Waiting ${waitTime}ms - Lobby: ${lobbyReady ? 'READY' : 'NOT READY'}, Game: ${gameReady ? 'READY' : 'NOT READY'}`);
      }
      
      if (lobbyReady && gameReady) {
        console.log(`[SocketManager] Both sockets are ready!`);
        this._ready = true;
      }
    }
    
    if (!this._ready) {
      const lobbyReady = this._lobbyReady();
      const gameReady = this._gameReady();
      throw new Error(`Socket connection timeout after ${maxWaitTime}ms. Lobby: ${lobbyReady ? 'READY' : 'NOT READY'}, Game: ${gameReady ? 'READY' : 'NOT READY'}`);
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
      setTimeout(() => rej(new Error('Timeout waiting for player seat from server')), TIMEOUT);
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
      setTimeout(() => rej(new Error('Timeout waiting for all player deployments')), TIMEOUT);
      console.log("waitForDeploys: starting to wait for deploys...")
      while (true) {
        await passTime(100);
         
        const recieved = !!this.msgBox.deploys;

        if (!recieved) { 
          await passTime(100); 
        } else {
          const valuesInTurn = this.msgBox.deploys!;
          console.log("waitForDeploys: got deploys, count:", valuesInTurn.length)
          valuesInTurn.forEach(msg => deploys.set(msg.sender, msg.payload));
          break;
        }
      }
      console.log("waitForDeploys: returning deploys map with size:", deploys.size)
      res(deploys)
    });
  }

  async waitForQueries(turn: number): Promise<Map<string, GameQueryPayload>> {
    const queries: Map<PlayerId, GameQueryPayload> = new Map();
    return new Promise(async (res, rej) => {
      setTimeout(() => rej(new Error('Timeout in socket operation')), TIMEOUT);
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
      setTimeout(() => rej(new Error('Timeout in socket operation')), TIMEOUT);
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
      setTimeout(() => rej(new Error('Timeout in socket operation')), TIMEOUT);
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
      setTimeout(() => rej(new Error('Timeout in socket operation')), TIMEOUT);
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
    return new Promise((res, rej) => {
      setTimeout(() => rej(new Error('Timeout in socket operation')), TIMEOUT);
      this.game.once(GameMsg.STARTED, (ack) => { ack(); res() })
    });
  }

  async waitForTurnStartEvent(): Promise<TurnInfoPayload> {
    return new Promise((res, rej) => {
      setTimeout(() => rej(new Error('Timeout in socket operation')), TIMEOUT);
      this.game.once(GameMsg.TURN_START, (data: TurnInfoPayload, ack) => { 
        ack(); 
        
        this.msgBox.clearOldMessages()

        res(data)
      })
    });
  }

}
