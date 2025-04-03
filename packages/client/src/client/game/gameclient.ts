import { Actor, AnyEventObject, assign, createActor, createMachine, emit, fromPromise, setup } from 'xstate';
import 'xstate/guards';
import { Player, TurnData, TurnInfo } from "../../types/game.js";
import { GameAnswerPayload, GameMsg, GameQueryPayload, GameReportPayload, GameUpdatePayload } from "../../types/gameMessages.js";
import { passTime } from "../../utils.js";
import { SocketManager } from "../sockets/socketManager.js";

enum Actors {
  notifyReady = "notifyReady",
  advertiseWaiting = "advertiseWaiting",
  processActivePlayer = "processActivePlayer",
  processNonActivePlayer = "processNonActivePlayer",
  processEliminated = "processEliminated"
}

enum Guards {
  isActivePlayer = "isActivePlayer",
  isNonActivePlayer = "isNonActivePlayer",
  isEliminated = "isEliminated",
  isWaiting = "isWaiting",
}

enum PlayerStates {
  Ready = "READY",
  UpdateTurnInfo = "UPDATE_TURN_INFO",
  SelectActive = "SELECT_ACTIVE",
  Active = "ACTIVE",
  NonActive = "NON_ACTIVE",
}

enum Actions {
  log = "log",
  updateTurnInfo = "updateTurnInfo",
  advertiseWait = "advertiseWait",
  markUsWaiting = "markUsWaiting",
  unMarkUsWaiting = "unMarkUsWaiting",
}

enum ClientEvent {
  QueryWaiting = "QUERY_WAITING"
}

interface QueryWaitingEvent extends AnyEventObject {
  type: ClientEvent.QueryWaiting
}

interface TurnStartEvent {
  type: GameMsg.TURN_START
  turnInfo: TurnInfo
  output: null  // Dummy field until we figure out how to properly type Guards
}

interface TurnEndEvent {
  type: GameMsg.TURN_END
  output: null  // Dummy field until we figure out how to properly type Guards
}

interface WaitingEvent {
  type: GameMsg.WAITING
  output: null  // Dummy field until we figure out how to properly type Guards
}

interface OutputEvent {
  type: "ouptut"
  output: any
}

type Events = AnyEventObject
  | TurnStartEvent
  | TurnEndEvent
  | OutputEvent
  | WaitingEvent
  | QueryWaitingEvent

function isTurnStartEvent(event: Events): event is TurnStartEvent {
  return event.type === GameMsg.TURN_START
}

interface Context {
  turnInfo: TurnInfo
  waiting: boolean
}

interface ActionInput {
  event: Events,
  context: Context
}

function _createLogger(name: string, sender: string) {
  const prefix = name.split('-')[0];
  const now = () => Number(new Date());
  const log = (...args: any[]) => console.log(`${now()} [${prefix}] [${sender}]`, ...args);
  return log;
}

function serMap(map: Map<any, any>): object {
  const o: { [k: string]: any } = {};
  map.forEach((v, k) => o[k] = v);
  return o;
}

const stringify = (o: any) => JSON.stringify(o, (_, v: any) => v instanceof Map ? serMap(v) : v);

export class GameClient {
  readonly name: string;
  readonly log: (...args: any[]) => void;

  sockets: SocketManager;
  turnsData: TurnData[];
  turnData: TurnData;
  gameMachine!: Actor<ReturnType<GameClient['stateMachine']>>;

  constructor(name: string, sockets: SocketManager) {
    this.sockets = sockets;
    this.turnsData = [];
    this.turnData = GameClient._emptyTurnData();
    this.name = name;
    this.log = _createLogger(name, sockets.sender)
  }

  static _emptyTurnData(): TurnData {
    return {
      activePlayer: "",
      queries: new Map(),
      answers: new Map(),
      updates: new Map(),
      report: null,
    }
  }

  get playerId(): string {
    return this.sockets.game!.id!
  }

  async play() {
    await this.setupGame();

    this.gameMachine = createActor(this.stateMachine());
    this.gameMachine.start();
  }

  async notifyPlayerReady() {
    await this.sockets.advertisePlayerAsReady();
    this.log("We are ready!");
  }

  /*///////////////////////////////////////////////////////////////
                          STATE MACHINE STATE GETTERS
  //////////////////////////////////////////////////////////////*/
  get contextWaiting() {
    return this.gameMachine.getSnapshot().context.waiting
  }

  get contextTurnInfo() {
    return this.gameMachine.getSnapshot().context.turnInfo
  }

  get turn() {
    return this.contextTurnInfo.turn
  }

  get round() {
    return this.contextTurnInfo.round
  }

  get activePlayer() {
    return this.contextTurnInfo.activePlayer
  }

  get nextPlayer() {
    return this.contextTurnInfo.nextPlayer
  }

  get activeStatus() {
    if (!this.activePlayer) {
      return ""
    } else {
      return this.activePlayer === this.playerId ? "ACTIVE" : "NON-ACTIVE"
    }
  }

  gameLog(...args: any[]) {
    this.log(this.activeStatus, ...args);
  }

  async setupGame() {
    this.log("Setting up game...")
    // query players/turn order
    // setup pieces
    // zk setup
    // emit ready (or wrap setup within emitAck from master)
  }

  async processActivePlayer() {

    const otherPlayers = this.round.filter(x => x !== this.playerId);

    // STEP 2
    // wait for queries | take action
    await Promise.all([
      this.waitForQuery(otherPlayers),
      this.takeAction()
    ])

    // STEP 3
    // create answer
    const answers = await this.createAnswers();
    // broadcast answers
    await Promise.all(answers.map(async (answer) => {
      this.gameLog("Broadcasting answers")
      await this.sockets.broadcastAnswer(this.turn, answer.to, answer);
    }))
    this.gameLog("NO MORE ANSWERS TO BROADCAST", stringify(this.turnData.answers));

    // STEP 6
    // wait for udpates
    await this.waitForUpdates(otherPlayers);

    // STEP 7
    // broadcast reports
    const report = await this.createReport();
    this.gameLog("Broadcasting report")
    await this.sockets.broadcastReport(this.turn, report);

    this.gameLog("Finishing turn.");
    this.gameLog("No more duties.");
  }

  async processNonActivePlayer() {

    const nonActivePlayers = this.round
      .filter(x => x !== this.activePlayer);

    const otherNonActivePlayers = nonActivePlayers
      .filter(x => x !== this.playerId);

    // STEP 1
    // if query ready, broadcast query
    const query = await this.getQuery();
    await Promise.all([
      this.sockets.broadcastQuery(this.turn, this.activePlayer, query),
      this.waitForQuery(otherNonActivePlayers),  // we have our query, but we need the other NA-players'
    ]);
    this.gameLog("NO MORE QUERIES TO BROADCAST", stringify(this.turnData.queries));

    // STEP 4
    // wait for answer
    await this.waitForAnswer(nonActivePlayers);

    // STEP 5
    // process update
    const update = await this.createUpdate();
    // broadcast update
    await Promise.all([
      await this.sockets.broadcastUpdate(this.turn, this.activePlayer, update),
      await this.waitForUpdates(otherNonActivePlayers),
    ]);

    // STEP 8
    // wait for report
    await this.waitForReport();
    this.gameLog("No more duties.")
  }

  /*///////////////////////////////////////////////////////////////
                          NON-ACTIVE PLAYER METHODS
  //////////////////////////////////////////////////////////////*/
  async getQuery(): Promise<GameQueryPayload> {
    const payload = {
      mockQueryData: {
        name: this.name,
        turn: `Mock-Q${this.contextTurnInfo.turn}`,
      }
    };
    this.turnData.queries.set(this.playerId, payload)
    return payload
  }

  async waitForAnswer(players: Player[]) {
    this.gameLog("STARTING WAIT FOR ANSWER");
    // there is an answer for each non-active player (N_players - 1). Eliminated players still answer.
    const answers = await this.sockets.waitForAnswer(this.turn, this.activePlayer, players);
    this.gameLog("Returned answer", stringify(answers))
    this.turnData.answers = answers
  }

  async createUpdate(): Promise<GameUpdatePayload> {
    this.gameLog("Creating update for active player");
    const payload = {
      mockUpdateData: {
        name: this.name,
        turn: `Mock-U${this.turn}`,
      }
    }
    this.turnData.updates.set(this.playerId, payload)
    return payload;
  }

  async waitForReport() {
    const report = await this.sockets.waitForReport(this.turn, this.activePlayer);
    this.gameLog("Returned report", stringify(report))
    this.turnData.report = report
  }

  /*///////////////////////////////////////////////////////////////
                          ACTIVE PLAYER METHODS
  //////////////////////////////////////////////////////////////*/
  async takeAction() {
  }

  async waitForQuery(players: Player[]) {
    const queries = await this.sockets.waitForQuery(this.turn, this.activePlayer, players)
    this.gameLog("Returned queries", stringify(queries))
    queries.forEach((payload, player) => {
      this.turnData.queries.set(player, payload)
    })
  }

  async createAnswers(): Promise<GameAnswerPayload[]> {
    const otherPlayers = this.round.filter(x => x !== this.playerId);
    const payloads: GameAnswerPayload[] = [];
    for (const player of otherPlayers) {
      const payload = {
        from: this.name,
        to: player,
        data: `Mock-A${this.contextTurnInfo.turn}`,
      }
      payloads.push(payload);
      this.turnData.answers.set(player, payload.data)
    }
    return payloads;
  }

  async waitForUpdates(players: Player[]) {
    this.gameLog("Waiting for updates");
    const updates = await this.sockets.waitForUpdates(this.turn, this.activePlayer, players)
    this.gameLog("Returned updates", stringify(updates))
    this.turnData.updates = updates;
  }

  async createReport(): Promise<GameReportPayload> {
    return {
      mockReportData: {
        name: this.name,
        turn: `Mock-R${this.contextTurnInfo.turn}`,
      }
    }
  }

  /*///////////////////////////////////////////////////////////////
                          STATE MACHINE
  //////////////////////////////////////////////////////////////*/
  rotateTurnData(turnInfo: TurnInfo) {
    this.turnsData.push(this.turnData);
    this.turnData = GameClient._emptyTurnData();
    this.turnData.activePlayer = turnInfo.activePlayer
  }

  isActivePlayer(turnInfo: TurnInfo): boolean {
    return this.playerId === turnInfo.activePlayer
  }

  isNonActivePlayer(turnInfo: TurnInfo): boolean {
    return (turnInfo.round.indexOf(this.playerId) > -1)
      && (this.playerId !== turnInfo.activePlayer)
  }

  machineSetup() {

    const self = this;

    /*///////////////////////////////////////////////////////////////
                            MACHINE EVENT HANDLERS
    //////////////////////////////////////////////////////////////*/
    this.sockets.addListener(GameMsg.TURN_START, (turnInfo) => {
      if (self.gameMachine) {
        self.gameMachine.send({ type: GameMsg.TURN_START, turnInfo })
      }
    });

    this.sockets.game.on(GameMsg.WAITING, (ack) => {
      if (self.gameMachine) {
        ack({ player: self.playerId, waiting: self.contextWaiting })
      }
    });

    /*///////////////////////////////////////////////////////////////
                            MACHINE ACTIONS
    //////////////////////////////////////////////////////////////*/
    const updateTurnInfoAction = ({ event, context }: ActionInput) => {
      if (isTurnStartEvent(event)) {
        self.rotateTurnData(event.turnInfo);
        return { turnInfo: event.turnInfo }
      }
      else return context
    }

    const markUsWaitingAction = ({ event, context }: ActionInput) => {
      this.log('markUsWaiting', stringify(context));
      return { ...context, waiting: true }
    }

    const unMarkUsWaitingAction = ({ event, context }: ActionInput) => {
      return { ...context, waiting: false }
    }

    const template = setup({
      types: {
        context: {} as Context,
        events: {} as Events,
      },
      actions: {
        log: (o, step: PlayerStates) => this.log(step ? `[${step}]` : '', o.event.type, JSON.stringify(o.context)),
        [Actions.updateTurnInfo]: assign(updateTurnInfoAction),
        [Actions.markUsWaiting]: assign(markUsWaitingAction),
        [Actions.unMarkUsWaiting]: assign(unMarkUsWaitingAction),
      },
      guards: {
        [Guards.isActivePlayer]: ({ context }) => this.isActivePlayer(context.turnInfo),
        [Guards.isNonActivePlayer]: ({ context }) => this.isNonActivePlayer(context.turnInfo),
      },
      actors: {
        [Actors.notifyReady]: fromPromise<void, void>(this.notifyPlayerReady.bind(this)),
        // [Actors.processActivePlayer]: fromPromise<void, void>(async () => { await passTime(3_000); this.log("Finished Active") } ),
        // [Actors.processNonActivePlayer]: fromPromise<void, void>(async () => { await passTime(3_000); this.log("Finished NonActive") }),
        [Actors.processActivePlayer]: fromPromise<void, void>(this.processActivePlayer.bind(this)),
        [Actors.processNonActivePlayer]: fromPromise<void, void>(this.processNonActivePlayer.bind(this)),
      },
    });

    return template;
  }

  stateMachine() {
    const actor = this.machineSetup()
      .createMachine({
        id: 'game_loop',
        context: { turnInfo: null as any as TurnInfo, waiting: false },
        initial: PlayerStates.Ready,
        states: {
          [PlayerStates.Ready]: {
            entry: [{ type: Actions.log, params: PlayerStates.Ready }],
            invoke: { src: Actors.notifyReady, onDone: { target: PlayerStates.UpdateTurnInfo } }
          },
          [PlayerStates.UpdateTurnInfo]: {
            entry: [
              { type: Actions.log, params: PlayerStates.UpdateTurnInfo },
              { type: Actions.markUsWaiting }
            ],
            on: {
              [GameMsg.TURN_START]: [
                { actions: { type: Actions.updateTurnInfo }, target: PlayerStates.SelectActive },
              ]
            },
            exit: [{ type: Actions.unMarkUsWaiting }]
          },
          [PlayerStates.SelectActive]: {
            entry: [
              { type: Actions.log, params: PlayerStates.SelectActive },
            ],
            always: [
              { guard: Guards.isActivePlayer, target: PlayerStates.Active },
              { guard: Guards.isNonActivePlayer, target: PlayerStates.NonActive },
            ]
          },
          [PlayerStates.Active]: {
            entry: [{ type: Actions.log, params: PlayerStates.Active }],
            invoke: { src: Actors.processActivePlayer, onDone: { target: PlayerStates.UpdateTurnInfo } },
          },
          [PlayerStates.NonActive]: {
            entry: [{ type: Actions.log, params: PlayerStates.NonActive }],
            invoke: { src: Actors.processNonActivePlayer, onDone: { target: PlayerStates.UpdateTurnInfo } },
          },
        },
      });
    return actor;
  }

}
