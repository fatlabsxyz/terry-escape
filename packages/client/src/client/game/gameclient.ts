import { Actor, AnyEventObject, assign, createActor, emit, fromPromise, setup } from 'xstate';
import 'xstate/guards';
import { TurnData, TurnInfo, TurnAction, UpdatesData, Locations, AgentLocation, PlayerSeat, AnswerData, ReportData, PlayerId, Name, LeaderBoard} from "../../types/game.js";
import { GameAnswerPayload, GameEndMsg, GameEndPayload, GameMsg, GameQueryPayload, GameReportPayload, GameUpdatePayload } from "../../types/gameMessages.js";
import { SocketManager } from "../sockets/socketManager.js";
import { Collision, IZkLib, ProofData } from 'zklib/types';
import { secretKeySample, publicKeySample } from 'keypairs';
import { Connection, IfEvents, Impact, Interfacer, Turn } from '../interfacer.js';


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
  isGameFinished = "isGameFinished",
}

enum PlayerStates {
  Prepare = "PREPARE",
  Ready = "READY",
  UpdateTurnInfo = "UPDATE_TURN_INFO",
  CheckForWinner = "CHECK_FOR_WINNER",
  SelectActive = "SELECT_ACTIVE",
  Active = "ACTIVE",
  NonActive = "NON_ACTIVE",
  FinishGame = "FINISH_GAME"
}

enum Actions {
  log = "log",
  updateTurnInfo = "updateTurnInfo",
  advertiseWait = "advertiseWait",
  markUsWaiting = "markUsWaiting",
  unMarkUsWaiting = "unMarkUsWaiting",
  gameEnd = "gameEnd"
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

function isTurnEndEvent(event: Events): event is TurnStartEvent {
  return event.type === GameMsg.TURN_END;
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
 
  allPlayersOrdered:        PlayerId[];
  token:                    string;
  sockets:                  SocketManager;
  verify:                   boolean = false;
  turnData:                 TurnData;
  gameMachine!:             Actor<ReturnType<GameClient['stateMachine']>>;
  private interfacer:       Interfacer;
  private winner:           undefined | PlayerId;
  activePlayerLocation:     undefined | AgentLocation;
  private playerIdValue:    undefined | PlayerId;
  private playerNameValue:  undefined | Name;
  private playerSeatValue:  undefined | PlayerSeat;
  leaderboard: LeaderBoard;

  constructor(sockets: SocketManager, readonly zklib: IZkLib) {
    this.sockets = sockets;
    this.token = sockets.token;
    this.playerSeatValue = undefined;
    this.activePlayerLocation = undefined;
    this.interfacer = Interfacer.getInstance();
    this.turnData = GameClient._emptyTurnData();
    this.allPlayersOrdered = new Array();
    this.log = _createLogger(sockets.playerName, sockets.sender);
    this.leaderboard = new Array();
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
      const pid = this.sockets.playerId; 
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

    this.verify = false;

    this.interfacer.on(IfEvents.Deploy, async (agents: Locations) => {
      this.interfacer.deploys = agents; 
    });
    this.interfacer.on(IfEvents.Action, async (action: TurnAction) => {
      this.interfacer.action = action; 
    });
  }
  
  async prepareSetup() {
    this.playerSeatValue = await this.sockets.waitForPlayerSeat();

    await this.setupGame();
    // Start validating deploys asynchronously - don't block the ready notification
    this.validateDeploysAsync();
  }

  async notifyPlayerReady() {
    this.log("notifyPlayerReady: advertising player as ready...")
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
    const activePlayer = this.contextTurnInfo.activePlayer;
    return activePlayer;
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
    const playerIndex = this.allPlayersOrdered.indexOf(this.activePlayer);
    return playerIndex;
  }

  get playerSeat() {
    return this.playerSeatValue;
  }

  gameLog(...args: any[]) {
    this.log(this.activeStatus, ...args);
  }

  async setupGame() {
    this.log("Setting up game...")

    const seat = this.playerSeat as PlayerSeat;
    
    // Send seat, await agent deployment (based on allowed deployment tiles)
    this.interfacer.emit(IfEvents.Connect, {seat} as Connection);
    
    this.log("Waiting for deploy from frontend...")
    const deploys = await this.interfacer.waitForDeploy();
    this.log("Got deploys:", deploys)

    const sk = secretKeySample(seat);
    const pks = [0,1,2,3].map(publicKeySample);

    this.zklib.setup(seat, sk, pks, {mockProof: true}); 
    await this.setupAgents(deploys);
    
    // Don't wait for validateDeploys here - it will be done asynchronously
    this.log("setupGame completed, validateDeploys will run asynchronously")
  }

  async processActivePlayer() {
    
    const playerNames = this.gameMachine.getSnapshot().context.turnInfo.playerNames;
    this.interfacer.emit(IfEvents.Turn, {round: this.turn, active: true, playerNames} as Turn);
    
    // STEP 2
    // wait for queries | take action
    this.gameLog("\n\nACTIVE-PLAYER - WAIT FOR QUERIES\n\n");
    await Promise.all([
      this.waitForQuery(),
      this.takeAction()
    ])

    // STEP 3
    // create answer
    this.gameLog("\n\nACTIVE-PLAYER - CREATE ANSWERS\n\n");
    const answers = await this.createAnswers();

    await Promise.all(answers.map(async (answer) => {
      this.gameLog("\nACTIVE-PLAYER - BROADCASTING ANSWER\n");
      await this.sockets.broadcastAnswer(this.turn, answer.to, answer);
    }))
    this.gameLog("\nACTIVE-PLAYER - NO MORE ANSWERS TO BROADCAST\n");

    // STEP 6
    // wait for updates
    this.gameLog("\n\nACTIVE-PLAYER - WAIT FOR UPDATES\n\n");
    await this.waitForUpdates();

    // STEP 7
    // broadcast reports
    const report = await this.createReport();
    this.gameLog("\n\nACTIVE-PLAYER - BROADCASTING REPORT\n\n");
    await this.sockets.broadcastReport(this.turn, report);

    this.gameLog("\n\nACTIVE-PLAYER - VALIDATING FOREIGN PROOFS\n\n");
    this.validateForeign()

    this.gameLog("\n\nACTIVE-PLAYER - FINISHING TURN\n\n");
  }

  async processNonActivePlayer() {

    const playerNames = this.gameMachine.getSnapshot().context.turnInfo.playerNames;
    this.interfacer.emit(IfEvents.Turn, {round: this.turn, active: false, playerNames} as Turn);
    
    // STEP 1
    // if query ready, broadcast query
    this.gameLog("\n\nNON-ACTIVE-PLAYER - CREATE QUERY\n\n");
    const query = await this.getQuery();

    this.gameLog("\n\nNON-ACTIVE-PLAYER - BROADCAST QUERY AND WAIT FOR QUERIES\n\n");
    await Promise.all([
      this.sockets.broadcastQuery(this.turn, this.activePlayer, query),
      this.waitForQuery(),  // we have our query, but we need the other NA-players'
    ]);
    this.gameLog("\n\nNON-ACTIVE-PLAYER - NO MORE QUERIES TO BROADCAST\n\n");

    // STEP 4
    // wait for answer
    this.gameLog("\n\nNON-ACTIVE-PLAYER - WAIT FOR ANSWERS\n\n");
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
    this.gameLog("\n\nNON-ACTIVE-PLAYER - BROADCAST UPDATE AND WAIT FOR UPDATES\n\n");

    // STEP 8
    // wait for report
    this.gameLog("\n\nNON-ACTIVE-PLAYER - WAIT FOR REPORT\n\n");
    await this.waitForReport();
    
    
    this.gameLog("\n\nACTIVE-PLAYER - VALIDATING FOREIGN PROOFS\n\n");
    this.validateForeign()
    
    this.gameLog("NON-ACTIVE-PLAYER - No more duties.")
  }

  /*///////////////////////////////////////////////////////////////
                          ALL PLAYER METHODS
  //////////////////////////////////////////////////////////////*/

  async setupAgents(agentsLocations: Locations) {
    this.log("setupAgents: creating deploy proofs for locations:", agentsLocations)
    const myDeploys = await this.zklib.createDeploys(agentsLocations);
    
    // Broadcast your deployment proofs
    this.log("setupAgents: broadcasting deploy proof")
    this.sockets.broadcastDeploy({deploys: myDeploys.proof}); 
  }

  /*///////////////////////////////////////////////////////////////
                          NON-ACTIVE PLAYER METHODS
  //////////////////////////////////////////////////////////////*/
  async getQuery(): Promise<GameQueryPayload> {
    const query = await this.zklib.createQueries(Number(this.activePlayerIndex)); 
    return {queries: query.proof}
  }

  async waitForAnswers() {
    // there is an answer for each non-active player (N_players - 1). Eliminated players still have to answer.
    const answers = await this.sockets.waitForAnswers(this.turn);
 
    answers.forEach( (payload) => {
      this.turnData.answers.set(payload.to, {proof: payload.proof});
    });
  }

  async createUpdate(): Promise<GameUpdatePayload> { 
    const answer = this.turnData.answers.get(this.playerId) as AnswerData;

    const data: UpdatesData = await this.zklib.createUpdates(answer.proof, this.activePlayerIndex); 
    this.turnData.updates.set(this.playerId, data);  
    this.interfacer.emit(IfEvents.Collision, data.collision as Collision);

    return {proof: data.proof, died: data.died!};
  }

  async waitForReport() {
    const report = await this.sockets.waitForReport(this.turn);
    this.turnData.report = report as ReportData; 
    if (this.turnData.report.died) {
      // Check if active player was already marked as dead
      const wasAlreadyDead = this.gameMachine.getSnapshot().context.turnInfo.round.get(this.activePlayer);
      if (!wasAlreadyDead) {
        // Emit PlayerDied event for active player
        this.interfacer.emit(IfEvents.PlayerDied, { playerId: this.activePlayer });
      }
      this.gameMachine.getSnapshot().context.turnInfo.round.set(this.activePlayer, true)
    }
  }


  /*///////////////////////////////////////////////////////////////
                          ACTIVE PLAYER METHODS
  //////////////////////////////////////////////////////////////*/
  
  async validateDeploys() {
    this.log("validateDeploys: waiting for all players' deploys...")
    const deploys = await this.sockets.waitForDeploys();
    this.log("validateDeploys: got all deploys, count:", deploys.size)

    const deployList = Array.from(
      deploys.values().map( v => v.deploys )
    );
    if (this.verify) {
      this.zklib.verifyDeploys(deployList);
    }
  }

  async validateDeploysAsync() {
    // Run validateDeploys in the background without blocking
    this.validateDeploys().catch(err => {
      this.log("Error validating deploys:", err);
    });
  }

  async validateForeign() {

    const queries = Array.from(this.turnData.queries.values()).map((x) => x.queries);
    const answers = Array.from(this.turnData.answers.values()).map(answer => answer.proof);
    const updates = Array.from(this.turnData.updates.values()).map(answer => answer.proof);
    const report  = this.turnData.report!.proof;
    
    if (this.verify) {
      // TODO: last argument should be true in prod
      this.zklib.verifyForeign(queries, answers, updates, report, this.activePlayerIndex, false);
    }
  }

  async takeAction() {

    const action = await this.interfacer.waitForAction();
    console.log(action);

    this.turnData.action = action;
  }

  async waitForQuery() {
    let queries: Map<PlayerId, GameQueryPayload>;

    queries = await this.sockets.waitForQueries(this.turn);

    queries.forEach((payload, player) => {
      this.turnData.queries.set(player, {queries: payload.queries});
    })
  }

  async createAnswers(): Promise<GameAnswerPayload[]> {
    const payloads: GameAnswerPayload[] = new Array();

    const queryValues = Array.from(this.turnData.queries.values());
    const queryData = queryValues.map((x) => x.queries);

    const answers = await this.zklib.createAnswers(queryData, this.turnData.action);
    
    let i = 0;
    this.turnData.queries.forEach((_, pid) => {
      const proof = answers.playerProofs[i]!;
      i++
      this.turnData.answers.set(pid, { proof });
      payloads.push({to: pid, proof})
    });

    return payloads 
  }

  
  async waitForUpdates() {
    const updates = await this.sockets.waitForUpdates(this.turn);

    updates.forEach((value, key) => {
      this.turnData.updates.set(key, value)
      if (value.died) {
        // Check if this player was already marked as dead
        const wasAlreadyDead = this.gameMachine.getSnapshot().context.turnInfo.round.get(key);
        if (!wasAlreadyDead) {
          // Emit PlayerDied event for newly dead players
          this.interfacer.emit(IfEvents.PlayerDied, { playerId: key });
        }
        this.gameMachine.getSnapshot().context.turnInfo.round.set(key, true)
      }
    });
  }

  async createReport(): Promise<GameReportPayload> {
    const turnUpdates = this.turnData.updates;

    const updates: ProofData[] = Array.from(turnUpdates.entries())
      // .filter(([pid]) => pid !== this.activePlayer)
      .map(([_, { proof }]) => proof);

    const report = await this.zklib.createReports(updates);
     
    console.log("\n\nIMPACTED: ", report.impacted);
    this.interfacer.emit(IfEvents.Impact, report.impacted as Impact)   
     
    this.turnData.report = report as ReportData;

    return { proof: report.proof, died: report.died };
  }

  /*///////////////////////////////////////////////////////////////
                          STATE MACHINE
  //////////////////////////////////////////////////////////////*/
  rotateTurnData(turnInfo: TurnInfo) {
    if (this.allPlayersOrdered.length === 0) {
      const players: PlayerId[] = Array.from(turnInfo.round.keys()).reverse();
      console.log("PLAYER ORDER SET: ", players);
      this.allPlayersOrdered = players;
    }
    // console.log("\n\nOLD TURN DATA: ", JSON.stringify(this.turnData), "\n\nNEW TURN DATA: ", JSON.stringify(turnInfo));
    this.turnData = GameClient._emptyTurnData();
    this.turnData.activePlayer = turnInfo.activePlayer
  }

  isActivePlayer(turnInfo: TurnInfo): boolean {
    return this.playerId === turnInfo.activePlayer
  }

  isNonActivePlayer(turnInfo: TurnInfo): boolean {
    const pidRound = Object.keys(turnInfo.round);
    if (pidRound.length > 0) {
      const playerIndex = pidRound.indexOf(this.playerId);
      return ( playerIndex > -1) && (this.playerId !== turnInfo.activePlayer)
    }
    return true;
  }

  isGameOver(): boolean {
    console.log("\n\n\n EVAL IS GAME OVER: ")

    if (this.winner !== undefined) {
      console.log("\n\n\nWINNER: ", this.winner);
      console.log("LEADERBOARD: ");
      return true
    } else {return false}
  }

  machineSetup() {

    const self = this;

    /*///////////////////////////////////////////////////////////////
                            MACHINE EVENT HANDLERS
    //////////////////////////////////////////////////////////////*/
    this.sockets.addListener(GameMsg.TURN_START, (turnInfo) => {
      console.log("\n\n\n TURN-INFO: ", JSON.stringify(turnInfo))
      if (self.gameMachine) {
        self.gameMachine.send({ type: GameMsg.TURN_START, turnInfo })
      }
    });

    this.sockets.game.on(GameMsg.WAITING, (ack) => {
      if (self.gameMachine) {
        ack({ player: self.playerId, waiting: self.contextWaiting })
      }
    });

    this.sockets.game.on(GameMsg.FINISHED, (p: GameEndMsg) => {
      this.winner = p.payload.winner;
      this.leaderboard = p.payload.leaderboard;
      console.log(`END MESSAGE: winner: ${this.winner}, leaderboard: \n${JSON.stringify(this.leaderboard)}`);
      this.interfacer.emit(IfEvents.Winner, {
        winner: this.winner,
        leaderboard: this.leaderboard
      });
    });
    
    this.sockets.on(GameMsg.PLAYERS_UPDATE, (payload: any) => {
      console.log("PLAYERS_UPDATE received:", payload);
      this.interfacer.emit(IfEvents.PlayersUpdate, payload);
    });

    /*///////////////////////////////////////////////////////////////
                            MACHINE ACTIONS
    //////////////////////////////////////////////////////////////*/
    const updateTurnInfoAction = ({ event, context }: ActionInput) => {
      if (isTurnStartEvent(event)) {
        self.rotateTurnData(event.turnInfo);
        return { turnInfo: event.turnInfo }
      } else { 
        return context
      }
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
        [Actions.updateTurnInfo]:   assign(updateTurnInfoAction),
        [Actions.markUsWaiting]:    assign(markUsWaitingAction),
        [Actions.unMarkUsWaiting]:  assign(unMarkUsWaitingAction),
      },
      guards: {
        [Guards.isGameFinished]:    () => this.isGameOver(),
        [Guards.isActivePlayer]:    ({ context }) => this.isActivePlayer(context.turnInfo),
        [Guards.isNonActivePlayer]: ({ context }) => this.isNonActivePlayer(context.turnInfo),
      },
      actors: {
        [Actors.preparePlayer]:          fromPromise<void, void>(this.prepareSetup.bind(this)),
        [Actors.notifyReady]:            fromPromise<void, void>(this.notifyPlayerReady.bind(this)),
        [Actors.processActivePlayer]:    fromPromise<void, void>(this.processActivePlayer.bind(this)),
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
            invoke: { src: Actors.notifyReady, onDone: { target: PlayerStates.UpdateTurnInfo } },
          },
          [PlayerStates.UpdateTurnInfo]: {
            entry: [
              { type: Actions.log, params: PlayerStates.UpdateTurnInfo },
              { type: Actions.markUsWaiting }
            ],
            on: {
              [GameMsg.TURN_START]: [
                { actions: { type: Actions.updateTurnInfo }, target: PlayerStates.CheckForWinner},
              ]
            },
            exit: [{ type: Actions.unMarkUsWaiting }]
          },
          [PlayerStates.CheckForWinner]: {
            always: [
              { guard: Guards.isGameFinished, target: PlayerStates.FinishGame },
              { target: PlayerStates.SelectActive}
            ],
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
          [PlayerStates.FinishGame]: {
            type: 'final',
            entry: [{ type: Actions.log, params: PlayerStates.FinishGame}],
            output: () => {
              console.log("GAME ENDED, WINNER: ", this.winner);
              console.log("EMITTING WINNER TO FRONTEND: ", this.winner);
              this.sockets.game.disconnect()
              console.log("DISCONNECTED FROM SOCKETS")
              this.interfacer.emit(IfEvents.Winner, this.winner);
            },
          },
        },
      });
    return actor;
  }

}
