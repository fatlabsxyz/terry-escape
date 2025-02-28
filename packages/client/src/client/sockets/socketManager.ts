import { Socket } from "socket.io-client";
import { ClientSockets, SetupSocketOptions, setupSockets } from "../setup.js";
import { GameAnswerPayload, GameMsg, GameQueryPayload } from "../../types/gameMessages.js";
import { Player, TurnInfo } from "../../types/game.js";
import { LobbyMsg } from "../../types/lobbyMessages.js";
import { GameAnswerMsg, GameQueryMsg, GameSocket } from "../../types/socket.interfaces.js";

function passTime(): Promise<void> {
  return new Promise((res, rej) => {
    setTimeout(res, 100)
  })
}

export class SocketManager {

  game: GameSocket;
  lobby: Socket;
  name: string;

  private _ready: boolean;

  constructor(options: SetupSocketOptions) {
    const { game, lobby } = setupSockets(options)
    this.name = options.name;
    this.game = game!;
    this.lobby = lobby;
    this._ready = false;
  }

  _lobbyReady(): boolean {
    return this.lobby.connected
  }

  _gameReady(): boolean {
    return this.game.connected
  }

  async socketsReady() {
    while (!this._ready) {
      await passTime();
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
    console.log("When will the turn start?")
    return new Promise((res, rej) => {
      this.game.once(GameMsg.TURN_START, (data: TurnInfo, ack) => { ack(); res(data) })
    });
  }

  async waitForTurnEndEvent(): Promise<void> {
    return new Promise((res, rej) => {
      console.log("WE WAITIN here...")
      this.game.once(GameMsg.TURN_END, (ack) => {
        ack();
        console.log("OK, turn is over");
        res();
      })
    });
  }

  async advertisePlayerAsReady() {
    const a = await this.game.timeout(3000).emitWithAck(GameMsg.READY);
  }

  async broadcastAnswer(_toDo: GameAnswerPayload) {
    console.log("BROADCASTING ANSWER")
    const mockAnswer = {
      event: GameMsg.ANSWER,
      sender: this.name,
      payload: _toDo
    };
    const a = await this.game.timeout(3000).emitWithAck(GameMsg.ANSWER, mockAnswer);
    console.log("RESPONSE", a)
  }

  async broadcastQuery(_toDo: GameQueryPayload) {
    console.log("BROADCASTING QUERY")
    const mockAnswer = {
      event: GameMsg.QUERY,
      sender: this.name,
      payload: _toDo
    };
    const a = await this.game.timeout(3000).emitWithAck(GameMsg.QUERY, mockAnswer);
    console.log("RESPONSE", a)
  }

  async broadcastTurnEnd() {
    console.log("BROADCASTING TURN_END")
    let a = await this.game.timeout(3000).emitWithAck(GameMsg.TURN_END);
    console.log("TURN_END", a)
  }

  async waitForQuery(amount: number): Promise<Map<string, GameQueryPayload>> {
    const queries: Map<Player, GameQueryPayload> = new Map();
    this.game.on(GameMsg.QUERY, (msg: GameQueryMsg, ack: () => void) => {
      queries.set(msg.sender, msg.payload)
      ack();
    });
    return new Promise(async (res, rej) => {
      while (queries.size !== amount) {
        await passTime();
      }
      this.game.off(GameMsg.QUERY)
      res(queries)
    });
  }

  async waitForAnswer(amount: number): Promise<Map<string, GameAnswerPayload>> {
    const answers: Map<Player, GameAnswerPayload> = new Map();
    this.game.on(GameMsg.ANSWER, (msg: GameAnswerMsg, ack: () => void) => {
      answers.set(msg.payload.to, msg.payload)
      ack();
    });
    return new Promise(async (res, rej) => {
      while (answers.size !== amount) {
        await passTime();
      }
      this.game.off(GameMsg.ANSWER)
      res(answers)
    });
  }

  // async waitForAnswer() {
  //   this.game.on(GameMsg.ANSWER, (msg: AnswerMsg, ack: () => {}) => {
  //   });
  // }

}
