import { Actor, AnyEventObject, assign, createActor, createMachine, emit, fromPromise, setup } from 'xstate';
import 'xstate/guards';
import { Player, TurnData, TurnInfo, TurnAction, UpdatesData, Locations} from "../../types/game.js";
import { GameAnswerPayload, GameMsg, GameQueryPayload, GameReportPayload, GameUpdatePayload } from "../../types/gameMessages.js";
import { passTime } from "../../utils.js";
import { SocketManager } from "../sockets/socketManager.js";
import { IZkLib } from 'zklib/types';
import { secretKeySample, publicKeySample } from 'keypairs';

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
  readonly token: string;

  sockets: SocketManager;
  turnsData: TurnData[];
  turnData: TurnData;
  gameMachine!: Actor<ReturnType<GameClient['stateMachine']>>;
  private initialPlayerIndexNow: number;

  constructor(token: string, sockets: SocketManager, readonly zklib: IZkLib) {
    this.sockets = sockets;
    this.turnsData = [];
    this.turnData = GameClient._emptyTurnData();
    this.log = _createLogger(token, sockets.sender);
    this.token = token;
    this.initialPlayerIndexNow = 0;
  }

  static _emptyTurnData(): TurnData {
    return {
      activePlayer: "",
      action: {reason: 0, target: 0,trap: false },
      queries: new Map(),
      answers: new Map(),
      updates: new Map(),
      report: null,
    }
  }

  get playerId(): string {
    return this.sockets.game!.id!
  }


  async play(agents: Locations) {

    await this.setupGame(agents);

    this.gameMachine = createActor(this.stateMachine());
    this.gameMachine.start();
  }

  async notifyPlayerReady() {
    const playerIndex = await this.sockets.advertisePlayerAsReady();

    console.log("player index:, " + playerIndex);
    this.initialPlayerIndexNow = playerIndex;
    
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

  get playerIndex() {
    return this.round.indexOf(this.playerId);
  }

  get initialPlayerIndex() {
    return this.initialPlayerIndexNow;
  }

  gameLog(...args: any[]) {
    this.log(this.activeStatus, ...args);
  }

  async setupGame(agents: Locations) {
    this.log("Setting up game...")

    const sk = secretKeySample(this.initialPlayerIndex);
    const pks = this.zklib.all_states.map( (_, i) => publicKeySample(i) );


    // this.log(`\nSETUP: SECRET-KEY: ${JSON.stringify(sk)}\n`);
    // this.log(`\nSETUP: PUBLIC-KEYS: ${JSON.stringify(pks)}\n`);
    this.log(`\nSETUP: PUBLIy-KEYS (1,2,3,4): ${pks[0]},\n${pks[1]},\n${pks[2]},\n${pks[3]}`);

    this.zklib.setup(this.initialPlayerIndex, sk, pks, {mockProof: true}); 
    await this.setupAgents(agents);
    // TODO find out where I can run validateDeploys()
  }

  async processActivePlayer() {

    const otherPlayers = this.round.filter(x => x !== this.playerId);
    

    // STEP 2
    // wait for queries | take action
    await Promise.all([
      this.waitForQuery(otherPlayers),
      this.takeAction()
      // based on the player's deployed agents, select a valid spot
    ])

    // STEP 3
    // create answer
    const answers = await this.createAnswers();
    // broadcast answers
    await Promise.all(answers.map(async (answer) => {
      this.gameLog("Broadcasting answers")
      await this.sockets.broadcastAnswer(this.turn, answer.to, answer);
    }))
    this.gameLog("NO MORE ANSWERS TO BROADCAST");

    // STEP 6
    // wait for updates

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
    this.gameLog("NO MORE QUERIES TO BROADCAST");

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

    this.gameLog(`\nWITNESS: QUERY(PLAYER-INDEX): ${this.activePlayerIndex}\n`);

    const query = await this.zklib.createQueries(Number(this.activePlayerIndex)); 
    this.gameLog(`\n\n\n QUERY_LEN: ${JSON.stringify(query).length}\n`);
    this.gameLog(`\nPROOFDATA: QUERY: ${query}\n`);

    return {queries: query.proof}
  }

  async waitForAnswer(players: Player[]) {
    this.gameLog("STARTING WAIT FOR ANSWER");
    // there is an answer for each non-active player (N_players - 1). Eliminated players still answer.
    const answers = await this.sockets.waitForAnswer(this.turn, this.activePlayer, players);

    this.gameLog("ANSWER RECIEVED")
    
    answers.forEach( (payload, id) => {
      this.turnData.answers.set(id, {proof: payload.proof})
    });
  }

  async createUpdate(): Promise<GameUpdatePayload> {
    const answer = this.turnData.answers.get(this.playerId)!;
    const data: UpdatesData = await this.zklib.createUpdates(answer.proof, this.activePlayerIndex);
    
    this.turnData.updates.set(this.playerId, data);
    

    return {proof: data.proof};
  }

  async waitForReport() {
    const report = await this.sockets.waitForReport(this.turn, this.activePlayer);
    this.gameLog("REPORT RECIEVED");
    this.turnData.report = report;
  }

  /*///////////////////////////////////////////////////////////////
                          ACTIVE PLAYER METHODS
  //////////////////////////////////////////////////////////////*/
  
  async setupAgents(agentsLocations: Locations) {
    // Deploy your agents
    this.log(`\nWITNESS: AGENTS-LOCATIONS: ${agentsLocations}\n`);
    const myDeploys = await this.zklib.createDeploys(agentsLocations);
    this.log(`\nPROOFDATA: MY-DEPLOYS: ${myDeploys.proof}\n`);

    // Broadcast your deployment proofs
    this.sockets.broadcastDeploy({deploys: myDeploys.proof}); 
  }

  // Wait for other deploys and validate them
  async validateDeploys() {
    
    // TODO need info on other players to call waitForDeploy, but state machine 
    // needs to be running and all players
    // need to be connected for round to be defined
    const otherPlayers = this.round.filter(x => x !== this.playerId);

    const enemyDeploys = await this.sockets.waitForDeploy(
      this.activePlayer, otherPlayers
    );

    const enemyDeploysArray = Array.from(enemyDeploys.values()).map(v => v.deploys);

    this.zklib.verifyDeploys(enemyDeploysArray);
  }

  async takeAction(
    //action: TurnAction
    ) {
    // console.log(action); 

    const playerSeed = { 
      0: 0,
      1: 1,
      2: 4,
      3: 5
    };

    const reason = playerSeed[this.initialPlayerIndex as 0|1|2|3];
    
    let target: number = 0;
    if (reason === 0) {
      target = 1;
    } else if (reason === 1) {
      target = 5;
    } else if (reason === 2) {
      target = 4;
    } else if (reason === 3) { 
      target = 5;
    }

    this.turnData.action = { reason, target, trap:true };
    // this.turnData.action = action;
  }

  async waitForQuery(players: Player[]) {
    const queries = await this.sockets.waitForQuery(this.turn, this.activePlayer, players);
    this.log("QUERIES THAT WE WAITED ALL THIS TIME FOR: ", JSON.stringify(queries));
    queries.forEach((payload, player) => {
      this.turnData.queries.set(player, payload);
    })
  }

  async createAnswers(): Promise<GameAnswerPayload[]> {
    const payloads: GameAnswerPayload[] = [];

    this.log(`\nWITNESS: QUERIES: ${Object.values(this.turnData.queries)}\n`);
    
    const answers = await this.zklib.createAnswers(Object.values(this.turnData.queries), this.turnData.action);
    
    this.log(`\nPROOFDATA: ANSWERS: ${answers}\n`);

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

  
  async waitForUpdates(players: Player[]) {
    this.log("WAITING FOR UPDATES");
    const updates = await this.sockets.waitForUpdates(this.turn, this.activePlayer, players);
    this.log("UPDATES RECEIVED");
    updates.forEach((value, key) => {
      this.turnData.updates.set(key, value) 
    });
  }

  async createReport(): Promise<GameReportPayload> {

    const nonActivePlayerUpdates = Object.entries(this.turnData.updates)
      .filter(([x,_]) => x !== this.activePlayer).map(([_,y]) => y );
    
    this.log(`\nWITNESS: REPORTS(NON-ACTIVE-PLAYER-UPDATES): ${nonActivePlayerUpdates}\n`);
    const report = await this.zklib.createReports(nonActivePlayerUpdates);
     
    this.log(`\nPROOFDATA: REPORT: ${report}\n`);
    this.turnData.report = {proof: report.proof, impacted: report.impacted};

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
