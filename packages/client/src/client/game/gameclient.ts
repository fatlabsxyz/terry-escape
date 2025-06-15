import { Actor, AnyEventObject, assign, createActor, createMachine, emit, fromPromise, setup } from 'xstate';
import 'xstate/guards';
import { Player, TurnData, TurnInfo, TurnAction, UpdatesData, Locations, QueryData, AgentLocation, PlayerSeat, IJ, AnswerData, JwtPayload, ReportData} from "../../types/game.js";
import { GameAnswerPayload, GameMsg, GamePlayerSeatMsg, GameQueryPayload, GameReportPayload, GameUpdatePayload } from "../../types/gameMessages.js";
import { passTime } from "../../utils.js";
import { SocketManager } from "../sockets/socketManager.js";
import { IZkLib, ProofData } from 'zklib/types';
import { secretKeySample, publicKeySample } from 'keypairs';
import { Board } from './board.js';
import { Connection, IfEvents, Interfacer } from '../interfacer.js';


enum Actors {
  notifyReady = "notifyReady",
  advertiseWaiting = "advertiseWaiting",
  processActivePlayer = "processActivePlayer",
  processNonActivePlayer = "processNonActivePlayer",
  processEliminated = "processEliminated",
  preparePlayer = "preparePlayer"
}

enum Guards {
  isActivePlayer = "isActivePlayer",
  isNonActivePlayer = "isNonActivePlayer",
  isEliminated = "isEliminated",
  isWaiting = "isWaiting",
}

enum PlayerStates {
  Prepare = "PREPARE",
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
  type: ClientEvent.QueryWaiting;
}

interface TurnStartEvent {
  type: GameMsg.TURN_START;
  turnInfo: TurnInfo;
  output: null;  // Dummy field until we figure out how to properly type Guards
}

interface TurnEndEvent {
  type: GameMsg.TURN_END;
  output: null;  // Dummy field until we figure out how to properly type Guards
}

interface WaitingEvent {
  type: GameMsg.WAITING;
  output: null;  // Dummy field until we figure out how to properly type Guards
}

interface OutputEvent {
  type: "output";
  output: any;
}

type Events = AnyEventObject
  | TurnStartEvent
  | TurnEndEvent
  | OutputEvent
  | WaitingEvent
  | QueryWaitingEvent


function isTurnStartEvent(event: Events): event is TurnStartEvent {
  return event.type === GameMsg.TURN_START;
}

interface Context {
  turnInfo: TurnInfo;
  waiting: boolean;
}

interface ActionInput {
  event: Events;
  context: Context;
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
  readonly log: (...args: any[]) => void;
  
  sockets: SocketManager;
  turnsData: TurnData[];
  turnData: TurnData;
  token: string;
  gameMachine!: Actor<ReturnType<GameClient['stateMachine']>>;
  private initialPlayerSeatValue: undefined | PlayerSeat;
  activePlayerLocation: undefined | AgentLocation;
  private playerIdValue: undefined | string = undefined;
  private playerSocketIdValue: undefined | string = undefined;
  private playerNameValue: undefined | string = undefined;
  private interfacer: Interfacer;

  constructor(sockets: SocketManager, readonly zklib: IZkLib) {
    this.sockets = sockets;
    this.turnsData = [];
    this.turnData = GameClient._emptyTurnData();
    this.log = _createLogger(sockets.playerName, sockets.sender);
    this.token = sockets.token;
    this.initialPlayerSeatValue = undefined;
    this.activePlayerLocation = undefined;
    this.interfacer = new Interfacer();
  }

  static _emptyTurnData(): TurnData {
    return {
      activePlayer: "",
      action: { reason: 0, target: 0, trap: false },
      queries: new Map(),
      answers: new Map(),
      updates: new Map(),
      report: null,
    }
  }

  get playerId(): string {
    if (this.playerIdValue === undefined) {
      const pid = this.sockets.playerId; // sockets.playerId is the playerId from token
      this.log("PLAYER-ID: GOT FROM SOCKETS-GAME: ", pid);
      this.playerIdValue = pid;
    }
    return this.playerIdValue;
  }
  
  get playerName(): string {
    if (this.playerNameValue === undefined) {
      const name = this.sockets.playerName;
      this.playerNameValue = name;
    }
    return this.playerNameValue;
  }

  async play() {
    this.gameMachine = createActor(this.stateMachine());
    this.gameMachine.start();
  }
  
  async prepareSetup() {
    this.initialPlayerSeatValue = await this.sockets.waitForPlayerSeat();
    this.log("PREPARE-SETUP: GET-PLAYER-INDEX:", this.playerSeat); //TODO remove log
    await this.setupGame(); 
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

  get activePlayerIndex() {
    return this.round.indexOf(this.activePlayer);
  }

  get playerSeat() {
    return this.initialPlayerSeatValue;
  }

  gameLog(...args: any[]) {
    this.log(this.activeStatus, ...args);
  }

  async setupGame() {
    this.log("Setting up game...")
 
    const seat = this.playerSeat as PlayerSeat;

    this.interfacer.emit(IfEvents.Connect, {seat} as Connection);
    
    const deploys = await this.interfacer.waitForDeploy();

    const sk = secretKeySample(seat);
    const pks = this.zklib.all_states.map( (_, i) => publicKeySample(i) );

    this.log(`\nSETUP: PUBLIC-KEYS [1,2,3,4]: ${!!pks[0]},${!!pks[1]},${!!pks[2]},${!!pks[3]}`);

    this.zklib.setup(seat, sk, pks, {mockProof: true}); 
    await this.setupAgents(deploys);

    // TODO find out where I can run validateDeploys()
  }

  async processActivePlayer() { 
    // STEP 2
    // wait for queries | take action
    this.gameLog("\n\nACTIVE-PLAYER - WAIT FOR QUERIES (3)\n\n");
    await Promise.all([
      this.waitForQuery(),
      this.takeAction()
      // TODO: based on the player's deployed agents, select a valid spot
    ])

    // STEP 3
    // create answer
    this.gameLog("\n\nACTIVE-PLAYER - CREATE ANSWERS (3)\n\n");
    const answers = await this.createAnswers();

    // broadcast answers
    await Promise.all(answers.map(async (answer) => {
      this.gameLog("\nACTIVE-PLAYER - Broadcasting answers\n");
      await this.sockets.broadcastAnswer(this.turn, answer.to, answer);
    }))
    this.gameLog("\nACTIVE-PLAYER - NO MORE ANSWERS TO BROADCAST\n");

    // STEP 6
    // wait for updates
    this.gameLog("\n\nACTIVE-PLAYER - WAIT FOR UPDATES (3)\n\n");
    await this.waitForUpdates();

    // STEP 7
    // broadcast reports
    const report = await this.createReport();
    this.gameLog("\n\nACTIVE-PLAYER - BROADCASTING REPORT \n\n");
    await this.sockets.broadcastReport(this.turn, report);

    this.gameLog("\n\nACTIVE-PLAYER - FINISHING TURN\n\n");
  }

  async processNonActivePlayer() {

    // STEP 1
    // if query ready, broadcast query
    this.gameLog("\n\nNON-ACTIVE-PLAYER - CREATE QUERY\n\n");
    const query = await this.getQuery();

    this.gameLog("\n\nNON-ACTIVE-PLAYER - BROADCAST QUERY (1) AND WAIT FOR QUERIES (2)\n\n");
    await Promise.all([
      this.sockets.broadcastQuery(this.turn, this.activePlayer, query),
      this.waitForQuery(),  // we have our query, but we need the other NA-players'
    ]);
    this.gameLog("\n\nNON-ACTIVE-PLAYER - NO MORE QUERIES TO BROADCAST\n\n");

    // STEP 4
    // wait for answer
    this.gameLog("\n\nNON-ACTIVE-PLAYER - WAIT FOR ANSWERS (2)\n\n");
    await this.waitForAnswers();

    // STEP 5
    // process update
    this.gameLog("\n\nNON-ACTIVE-PLAYER - CREATE UPDATE\n\n");
    const update = await this.createUpdate();
    // broadcast update
    await Promise.all([
      await this.sockets.broadcastUpdate(this.turn, this.activePlayer, update),
      await this.waitForUpdates(),
    ]);
    this.gameLog("\n\nNON-ACTIVE-PLAYER - BROADCAST UPDATE (1) AND WAIT FOR UPDATES (2)\n\n");

    // STEP 8
    // wait for report
    this.gameLog("\n\nNON-ACTIVE-PLAYER - WAIT FOR REPORT (1)\n\n");
    await this.waitForReport();
    this.gameLog("NON-ACTIVE-PLAYER - No more duties.")
  }

  /*///////////////////////////////////////////////////////////////
                          ALL PLAYER METHODS
  //////////////////////////////////////////////////////////////*/

  async setupAgents(agentsLocations: Locations) {
    // this.log(`\nSETUP-AGENTS: AGENTS-LOCATIONS: ${agentsLocations}\n`);
    const myDeploys = await this.zklib.createDeploys(agentsLocations);
    // this.log(`\nSETUP-AGENTS: MY-DEPLOYS-PROOF: ${myDeploys.proof}\n`);
    
    this.log(this.zklib.own_state.board_used);

    // Broadcast your deployment proofs
    this.sockets.broadcastDeploy({deploys: myDeploys.proof}); 
  }

  /*///////////////////////////////////////////////////////////////
                          NON-ACTIVE PLAYER METHODS
  //////////////////////////////////////////////////////////////*/
  async getQuery(): Promise<GameQueryPayload> {
    const query = await this.zklib.createQueries(Number(this.activePlayerIndex)); 
    // this.gameLog(`\n\n\n GET-QUERY: QUERY-LENGTH: ${JSON.stringify(query).length}\n`);
    // this.gameLog(`\nGET-QUERY: QUERY-PROOF: ${query}\n`);

    return {queries: query.proof}
  }

  async waitForAnswers() {
    // there is an answer for each non-active player (N_players - 1). Eliminated players still have to answer.
    const answers = await this.sockets.waitForAnswers(this.turn);

    // this.gameLog("WAIT-FOR-ANSWERS: ANSWERS:", answers);
    
    answers.forEach( (payload, sender) => {
      // this.gameLog(`WAIT-FOR-ANSWERS: PAYLOAD ${payload.to}, ${payload.proof}, SENDER: ${sender}`);
      this.turnData.answers.set(payload.to, {proof: payload.proof});
    });
  }

  async createUpdate(): Promise<GameUpdatePayload> { 
    const answer = this.turnData.answers.get(this.playerId) as AnswerData;

    // this.gameLog(`CREATE-UPDATE: ANSWER-FOR-UPDATE: ${answer} ...`);
    const data: UpdatesData = await this.zklib.createUpdates(answer.proof, this.activePlayerIndex); 
    this.turnData.updates.set(this.playerId, data); 

    return {proof: data.proof};
  }

  async waitForReport() {
    const report = await this.sockets.waitForReport(this.turn);
    this.turnData.report = report as ReportData;
  }

  /*///////////////////////////////////////////////////////////////
                          ACTIVE PLAYER METHODS
  //////////////////////////////////////////////////////////////*/
  
  async validateDeploys() {
    
    // TODO need info on other players to call waitForDeploy, but state machine 
    // needs to be running and all players
    // need to be connected for round to be defined
    const otherPlayers = this.round.filter(x => x !== this.playerId);

    const enemyDeploys = await this.sockets.waitForDeploys();

    const enemyDeploysArray = Array.from(enemyDeploys.values()).map(v => v.deploys);

    this.zklib.verifyDeploys(enemyDeploysArray);
  }

  async takeAction(
    //action: TurnAction
    ) {
    // console.log(action); 
  
    // for now:
    // each player goes from left to right infinitely
    // starting here:
    // 0 _ _ _   
    // 2 _ _ _   
    // _ 1 _ _   
    // _ 3 _ _   
    const playerStartLoc = { 
      0: 0,
      1: 9,
      2: 4,
      3: 13
    };

    let direction: number = 1;
    const index = this.playerSeat as PlayerSeat;
    const loc = this.activePlayerLocation;

    // this.log("TAKE-ACTION: ACTIVE-PLAYER-LOCATION: ", this.activePlayerLocation);

    this.activePlayerLocation = loc || (playerStartLoc[index] as AgentLocation);
    
    const reason = this.activePlayerLocation;
    let target: number = 0;

    switch (index) {
      case 0: ( {target, direction} = this.bounce(reason, 0, 3, direction) );
      case 1: ( {target, direction} = this.bounce(reason, 8, 11, direction) );
      case 2: ( {target, direction} = this.bounce(reason, 4, 7, direction) );
      case 3: ( {target, direction} = this.bounce(reason, 12, 15, direction) );    
    }

    // this.log(`TAKE-ACTION: PLAYER: ${index}, REASON:${reason}, TARGET:${target}`)

    this.turnData.action = { reason, target, trap: false };
    // this.turnData.action = action;
  }

  bounce(current: number, min: number, max: number, direction: number): {target: number, direction: number}{
    if (current === max && direction === 1) return { target: max - 1, direction: -1 };
    if (current === min && direction === -1) return { target: min + 1, direction: 1 };
    return { target: current + direction, direction };
  }

  async waitForQuery() {
    let queries: Map<Player, GameQueryPayload>;

    queries = await this.sockets.waitForQueries(this.turn);

    // this.log("QUERIES WE'VE BEEN WAITING FOR");
    queries.forEach((payload, player) => {
      // this.log(`QUERY NUMBER: ${player}, QUERY VALUE: ${payload.queries}`);
      this.turnData.queries.set(player, {queries: payload.queries});
    })
    // this.log("TURNDATA, QUERIES: ", this.turnData.queries);
  }

  async createAnswers(): Promise<GameAnswerPayload[]> {
    const payloads: GameAnswerPayload[] = [];
    const queryValues = Array.from(this.turnData.queries.values()); 
    const queryData = queryValues.map((x) => x.queries);

    // this.log(`\nCREATE-ANSWERS: QUERIES: ${queryData}`);
    
    const answers = await this.zklib.createAnswers(queryData, this.turnData.action);
    
    // this.log(`\nCREATE-DATA: ALL-ANSWERS: ${answers}\n`);
    // this.log(`\nCREATE-DATA: ANSWERS: ${answers.playerProofs}\n`);

    const nonActivePlayersRound = this.round
      .filter(x => x !== this.activePlayer);

    this.turnData.queries.forEach((_, player) => {
      let nonActivePlayerIndex = nonActivePlayersRound.indexOf(player);
      const playerProof = answers.playerProofs[nonActivePlayerIndex]!;
      payloads.push({to: player, proof: playerProof });
      this.turnData.answers.set(player, { proof: playerProof });
    });

    return payloads
  }

  
  async waitForUpdates() {
    const updates = await this.sockets.waitForUpdates(this.turn);

    // this.log("UPDATES RECEIVED: ", updates);

    const updateValues = Array.from(updates.values());
    
    updates.forEach((value, key) => {
      // this.log(`\nUPDATES: UPDATE-VALUES-SET: KEY:${key}, VALUE:${value}, `);
      this.turnData.updates.set(key, value) 
    });
  }

  async createReport(): Promise<GameReportPayload> {
     
    // TODO evaluate collisions?

    const turnUpdates = this.turnData.updates;

    // this.log(`\nWITNESS: REPORTS(TURN-UPDATES): ${turnUpdates}\n`);
    
    const updates: ProofData[] = Array.from(turnUpdates.entries())
      .filter(([id]) => id !== this.activePlayer)
      .map(([, { proof }]) => proof);

    // this.log(`\nWITNESS: REPORT: (UPDATES): ${updates}\n`);

    const report = await this.zklib.createReports(updates);
     
    // this.log(`\nPROOFDATA: REPORT: ${report}\n`);
    this.turnData.report = report as ReportData;

    return { proof: report.proof };
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
        [Actors.preparePlayer]: fromPromise<void, void>(this.prepareSetup.bind(this)),
        [Actors.notifyReady]: fromPromise<void, void>(this.notifyPlayerReady.bind(this)),
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
        initial: PlayerStates.Prepare,
        states: {
          [PlayerStates.Prepare]: {
            entry: [{ type: Actions.log, params: PlayerStates.Prepare }],
            invoke: { src: Actors.preparePlayer, onDone: { target: PlayerStates.Ready } }
          },         
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
