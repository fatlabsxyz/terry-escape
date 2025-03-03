import { TurnData, TurnInfo } from "../../types/game.js";
import { GameAnswerPayload, GameMsg, GameQueryPayload } from "../../types/gameMessages.js";
import { passTime } from "../../utils.js";
import { SocketManager } from "../sockets/socketManager.js";

function _createLogger(name: string) {
  const prefix = name.split('-')[0];
  const now = () => Number(new Date());
  const log = (...args: any[]) => console.log(`${now()} [${prefix}]`, ...args);
  console.log("BUILT LOGGER")
  return log;
}

export class GameClient {
  readonly name: string;
  readonly log: (...args: any[]) => void;

  sockets: SocketManager;
  gameActive: boolean = false;
  turns: TurnInfo[];
  turn: TurnData | null;
  _turnFinished: boolean = false;
  private _turnInfo: any;

  constructor(name: string, sockets: SocketManager) {
    this.gameActive = false;
    this.sockets = sockets;
    this.turns = [];
    this.turn = null;
    this.name = name;
    this.log = _createLogger(name)

    const self = this;
    this.sockets.addListener("TURN_END", () => {
      console.log("RECEIING TURN_END")
      self._turnFinished = true;
    });

    this.sockets.addListener("TURN_START", (turnInfo) => {
      console.log("RECEIING TURN_START")
      self._turnInfo = turnInfo;
    });

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
    this.log("Returned queries", JSON.stringify(queries))
    this.turn!.queries = queries;
  }

  async _waitForTurnStart() {
    const turnInfo = await this.sockets.waitForTurnStartEvent();
    this.log("New turn info", JSON.stringify(turnInfo));
    this._newTurn(turnInfo);
    // while (!this._turnFinished) {
    //   await passTime(100);
    // }
    // this.log("Turn finished");
  }

  async _waitForTurnEnd() {
    while (!this._turnFinished) {
      await passTime(100);
    }
    this._turnFinished = false;
    this.log("Turn finished");
  }

  async gameLoop() {
    this.log("Game loop started")
    // if (eliminated) -> skip or break
    while (this.gameActive) {

      // await for turn order message
      await this._waitForTurnStart();

      if (this.turn!.activePlayer === this.playerId) {
        this.log("We're active player");
        await this.processActivePlayer()
      } else {
        this.log("We're not active player");
        await this.processNonActivePlayer()
      }

      // await for finish turn
      this.log("Waiting for turn end...");
      await this._waitForTurnEnd();
      // await this.sockets.waitForTurnEndEvent();
    }
  }

  private _newTurn(info: TurnInfo) {
    // archive turn
    this.turns.push({ ...info });

    // reset turn flag
    this._turnFinished = false;
    this.turn = {
      activePlayer: info.activePlayer,
      answers: new Map(),
      queries: new Map(),
      updates: new Map(),
      report: null
    };
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
      await this.sockets.broadcastAnswer(answer);
    }

    // wait for udpates
    // broadcast reports

    this.log("Finishing turn.")
    await this.sockets.broadcastTurnEnd();
    this.log("No more duties.")
  }

  async processNonActivePlayer() {
    // if query ready, broadcast query
    const query = await this.getQuery();
    await this.sockets.broadcastQuery(query);
    // wait for answer
    // await this.waitForAnswer();
    // process update
    // broadcast update
    // wait for report
    this.log("No more duties.")
  }

  async waitForAnswer() {
    // there is an answer for each non-active player (N_players - 1)
    const answers = await this.sockets.waitForAnswer(2);
    this.turn!.answers = answers
  }

  async getQuery(): Promise<GameQueryPayload> {
    return {
      mockQueryData: {
        name: this.name,
        turn: this.turns[this.turns.length - 1]!.turn,
      }
    }
  }

  async processEliminated() {
    // TODO
  }

}
