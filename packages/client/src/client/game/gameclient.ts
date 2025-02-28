import { TurnData, TurnInfo } from "../../types/game.js";
import { GameAnswerPayload, GameMsg, GameQueryPayload } from "../../types/gameMessages.js";
import { SocketManager } from "../sockets/socketManager.js";

function _createLogger(name: string) {
  const prefix = name.split('-')[0];
  const log = (...args: any[]) => console.log(`[${prefix}]`, ...args);
  return log;
}

export class GameClient {
  readonly name: string;
  readonly log: (...args: any[]) => void;

  sockets: SocketManager;
  gameActive: boolean = false;
  turns: TurnData[];
  turn: TurnData | null;

  constructor(name: string, sockets: SocketManager) {
    this.gameActive = false;
    this.sockets = sockets;
    this.turns = [];
    this.turn = null;
    this.name = name;
    this.log = _createLogger(name)
  }

  get playerId(): string {
    return this.sockets.game!.id!
  }

  async play() {
    await this.playerReady();
    await this.waitForGameStart();
    await this.setupGame();
    await this.gameLoop();
  }

  async playerReady() {
    await this.sockets.advertisePlayerAsReady();
    this.log("We are ready!");
  }

  async waitForGameStart() {
    await this.sockets.waitForGameStartEvent();
    this.gameActive = true;
    this.log("All players are set, queue is closed.");
  }

  async setupGame() {
    this.log("Setting up game...")
    // query players/turn order
    // setup pieces
    // zk setup
    // emit ready (or wrap setup within emitAck from master)
  }

  async _waitForQuery() {
    const queries = await this.sockets.waitForQuery(2)
    this.turn!.queries = queries;
  }

  async gameLoop() {
    this.log("Game loop started")
    // if (eliminated) -> skip or break
    while (this.gameActive) {
      // await for turn order message
      const turnInfo = await this.sockets.waitForTurnStartEvent();
      this.log("New turn info", turnInfo);
      this._newTurn(turnInfo);

      if (turnInfo.activePlayer === this.playerId) {
        this.log("We're active player");
        await this.processActivePlayer()
      } else {
        this.log("We're not active player");
        await this.processNonActivePlayer()
      }

      // await for finish turn
      await this.sockets.waitForTurnEndEvent();
    }
  }

  private _newTurn(info: TurnInfo) {
    if (this.turn !== null) {
      // archive old turn
      this.turns.push({ ...this.turn });
      this.turn = {
        activePlayer: info.activePlayer,
        answers: new Map(),
        queries: new Map(),
        updates: new Map(),
        report: null
      };
    }
  }

  private _isActivePlayer(): boolean {
    throw new Error("Method not implemented.");
  }

  async createAnswers(): Promise<GameAnswerPayload[]> {
    return []
  }

  async _takeAction() {
  }

  async processActivePlayer() {

    // wait for queries | take action
    await Promise.all([
      this._waitForQuery(),
      this._takeAction()
    ])

    // create answer
    const answers = await this.createAnswers();

    // broadcast answers
    for (let answer of answers) {
      this.sockets.broadcastAnswer(answer);
    }

    // wait for udpates
    // broadcast reports

    this.sockets.broadcastTurnEnd();
  }

  async processNonActivePlayer() {
    // if query ready, broadcast query
    const query = await this.getQuery();
    await this.sockets.broadcastQuery(query);
    // wait for answer
    await this.waitForAnswer();
    // process update
    // broadcast update
    // wait for report
  }

  async waitForAnswer() {
    // there is an answer for each non-active player (N_players - 1)
    const answers = await this.sockets.waitForAnswer(2);
    this.turn!.answers = answers
  }

  async getQuery(): Promise<GameQueryPayload> {
    return {
    }
  }

  async processEliminated() {
    // TODO
  }

}
