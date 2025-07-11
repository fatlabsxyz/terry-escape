import { PlayerId, GameMsg, TurnInfo, PlayerSeat, SocketId, LeaderBoard, Position, GameEndMsg, Turn } from 'client/types';
import { GameNsp } from './sockets/game.js';
import { Actor, setup, createActor, assign, AnyEventObject, fromPromise, DoneActorEvent, emit } from 'xstate';
import { PlayerStorage } from './playerStorage.js';
import { MessageBox, MsgEvents } from 'client';

/// STATE MACHINE TYPES
enum GameState {
  setup = "GM:SETUP",
  updateTurn = "GM:UPDATE_TURN",
  checkForWinner = "GM:CHECK_WINNER",
  turn = "GM:TURN",
  cleanup = "GM:CLEANUP",
  end = "GM:END"
}

enum Actors {
  newTurn = "newTurn",
  queryWaiting = "queryWaiting",
}

enum Events {
  AddPlayer = "AddPlayer",
  EmitSeat = "EmitSeat",
  PlayerReady = "PlayerReady",
  AllPlayersReadyToStart = "AllPlayerReadyToStart",
  AllPlayersDead = "AllPlayersDied",
  GameEnded = "GameEnded"
}

enum Guards {
  allPlayersReady = "allPlayersReady",
  allPlayersWaiting = "allPlayersWaiting",
  gameEnded = "gameEnded",
  gameContinues = "GameContinues",
}

enum Actions {
  log = "log",
  addPlayer = "addPlayer",
  markPlayerReady = "markPlayerReady",
  updateContextOnDone = "updateContextOnDone",
  updatePlayers = "updatePlayers",
  cleanup = "cleanup",
  emitSeat = "emitSeat",
  emitTurn = "emitTurn",
  endGame = "endGame"
}

type PlayerData = { 
  id: PlayerId,
  sid: SocketId,
  seat: PlayerSeat
}

interface SmEvent extends AnyEventObject {
  type: `${Events}`
}

interface AddPlayerEvent extends SmEvent {
  type: Events.AddPlayer,
  data: { player: PlayerId }
}

interface PlayerReadyEvent extends SmEvent {
  type: Events.PlayerReady,
  data: { player: PlayerId }
}

interface EmitSeatEvent extends SmEvent {
  type: Events.EmitSeat,
  player: PlayerData
}

type EventsSm = DoneActorEvent
  | PlayerReadyEvent
  | AddPlayerEvent 
  | EmitSeatEvent;

function isAddPlayerEvent(event: EventsSm): event is AddPlayerEvent {
  return event.type === Events.AddPlayer
}

function isPlayerReadyEvent(event: EventsSm): event is PlayerReadyEvent {
  return event.type === Events.PlayerReady
}

interface Context {
  minPlayers: number;
  players: Map<PlayerId, PlayerStatus>;
  turn: number;
  round: Map<PlayerId, boolean>;
  activePlayer: PlayerId;
  nextPlayer: PlayerId;
  turnInfo: TurnInfo
}

interface ActionInput {
  event: EventsSm,
  context: Context
}

// export type Player = string & { readonly __brand: unique symbol };

export interface PlayerStatus {
  eliminated: boolean;
  ready: boolean;
  waiting: boolean;
  seat: number;
  id: PlayerId;
}


function serMap(map: Map<any, any>): object {
  const o: { [k: string]: any } = {};
  map.forEach((v, k) => o[k] = v);
  return o;
}

const stringify = (o: any) => JSON.stringify(o, (_, v: any) => v instanceof Map ? serMap(v) : v);

export class Game {

  msgBox: MessageBox;

  private _activePlayer: PlayerId | null = null;
  private _nextPlayer: PlayerId | null = null;
  nsp: GameNsp;
  playerStorage: PlayerStorage;

  gameMachine!: Actor<ReturnType<Game['stateMachine']>>;
  broadcastTimeout: number;
  minPlayers: number;
  playerSeat: undefined | number = undefined;
  playerEmitData: any;

  winner: undefined | PlayerId;
  leaderboard: LeaderBoard;

  constructor(readonly playerId: string, nsp: GameNsp, options?: {}) {
    this.nsp = nsp;
    this.broadcastTimeout = 120_000; //originally 2_000
    this.minPlayers = 4;
    this.playerStorage = PlayerStorage.getInstance();
    this.msgBox = MessageBox.getInstance();
    this.leaderboard = new Array();

    this.gameMachine = createActor(this.stateMachine(this._defaultContext(this.minPlayers)));
    
    this.gameMachine.start();

    this.attachEvents();
  }

  log(...args: any[]) {
    const prefix = `game:${this.playerId}`
    const now = () => Number(new Date());
    const _log = (...args: any[]) => console.log(`${now()} [${prefix}]`, ...args);
    return _log(...args);
  }

  _defaultContext(minPlayers: number): Context {
    const context = {
      players: new Map(),
      round: new Map(),
      minPlayers,
      turn: 0,
      activePlayer: "",
      nextPlayer: "",
    }
    return {
      ...context,
      turnInfo: this.turnInfoFromContext(context),
    }
  }
  
  get messageBox() {
    return this.msgBox;
  }
  get activePlayer() {
    return this._activePlayer!;
  }
 
  get playerStore() {
    return this.playerStorage;
  }
  
  attachEvents() {

    this.gameMachine.on(Events.EmitSeat, async (event) => {

      const payload = {
        event: GameMsg.PLAYER_SEAT,
        sender:"gamemaster",
        to: this.playerEmitData.id,
        turn:0,
        payload: {seat: this.playerEmitData.seat as PlayerSeat}
      };
 
      this.nsp.to(this.playerEmitData.sid).emit(GameMsg.PLAYER_SEAT, payload);
    });

    this.gameMachine.on(Events.GameEnded, async (event) => {
      console.log("GAME ENDED, winner: ", this.winner);
      this.nsp.disconnectSockets(); //TODO make this better

      // this.playerStore.getAllSocketIds().forEach((sid, pid) => {
      //   const payload = {
      //     event: GameMsg.WINNER,
      //     sender:"gamemaster",
      //     to: pid,
      //     turn:0,
      //     payload: {winner: this.winner}
      //   };
      //
      //   this.nsp.to(sid).emit(GameMsg.WINNER, payload);
      // });
    });
  }

  storedPlayerId(player: PlayerId) {
    return this.playerStorage.getSocketId(player) as string;
  }

  addPlayer(player: PlayerId) {
    this.gameMachine.send({ type: Events.AddPlayer, data: { player } });
  }

  readyPlayer(player: PlayerId) {
    this.gameMachine.send({ type: Events.PlayerReady, data: { player } });
  }

  getPlayerIndex(playerId: PlayerId): number | undefined {
    const playerStatus = this.gameMachine
      .getSnapshot()
      .context
      .players
      .get(playerId);
    return playerStatus?.seat;
  }

  nextPlayers(finishingPlayer: PlayerId, round: Map<PlayerId, boolean>): [PlayerId, PlayerId] {
    const roundPlayers = Array.from(round.keys());
    const livingPlayers = Array.from(round.entries())
      .filter(([_, v]) => v === false)
      .map(([k,_]) => k);
 
    if (livingPlayers.includes(finishingPlayer)){
      // finishing player still alive
      // keep player as option
      // pick next player from living players
      const activeIndex  = livingPlayers.indexOf(finishingPlayer) as PlayerSeat;
      
      return this.findNextPlayer(activeIndex, livingPlayers)
    } else { // if active died, find next active
      // check if there is a next player with larger seat
      let activeIndex: PlayerSeat;
      const oldActiveIndex = roundPlayers.indexOf(finishingPlayer);

      const upperPlayer = roundPlayers.find((p) => {
        roundPlayers.indexOf(p) > oldActiveIndex && livingPlayers.includes(p)
      });

      if (upperPlayer) {
        activeIndex = livingPlayers.indexOf(upperPlayer) as PlayerSeat;
      } else { //if there is no player with higher seat
        // find the next player with lowest seat
        const lowerPlayer = roundPlayers.find((p) => {
          roundPlayers.indexOf(p) < oldActiveIndex && livingPlayers.includes(p)
        });

        activeIndex = livingPlayers.indexOf(lowerPlayer!) as PlayerSeat;
      }
      
      return this.findNextPlayer(activeIndex, livingPlayers);      
    }
  }

  findNextPlayer(activeIndex: PlayerSeat, livingPlayers: PlayerId[]): [PlayerId,PlayerId] {
    
    let activePlayer: PlayerId, nextPlayer: PlayerId;
    if (livingPlayers.length > activeIndex + 1) {       // if there's at least 1 more player, set active
      activePlayer = livingPlayers[activeIndex + 1]!;
      if (livingPlayers.length > activeIndex + 2) {     // if there's one more, set as next
        nextPlayer = livingPlayers[activeIndex + 2]!;
      } else {                                          // otherwise, set the first one as next
        nextPlayer = livingPlayers[0]!;
      }
    } else {                                            // if there's not more players, start at the beginning
      activePlayer = livingPlayers[0]!;
      nextPlayer = livingPlayers[1]!; 
    }
    return [activePlayer, nextPlayer];
  }

  turnInfoFromContext(context: Omit<Context, 'turnInfo'>): TurnInfo {
    const { turn, round, activePlayer, nextPlayer,  } = context;
    return {
      turn,
      round,
      activePlayer,
      nextPlayer,
      gameOver: undefined
    }
  }

  nextContext(context: Context): Context {
    const { turn, players, activePlayer: finishingPlayer } = context; 

    let gameOver = undefined; 
     
    const round: Map<PlayerId, boolean> = new Map();
    const playersSorted: PlayerStatus[] = Array.from(players.values()).sort((a, b) => b.seat - a.seat);

    playersSorted.forEach((p) => {
      round.set(p.id, p.eliminated);
    });

    console.log("\n\nROUND: ", round);

    let activePlayer: string, nextPlayer: string;

    if (!finishingPlayer) {
      // We just started the game

      console.log("\n\nGAME START  - NOT running nextPlayers()");
      const [p1, p2] = [playersSorted[0]!, playersSorted[1]!]
      activePlayer = p1.id;
      nextPlayer = p2.id; 
    } else {
      console.log("\n\nNOT GAME START  -  running nextPlayers()");
     
      // CHECK for dead players and update round && players
      const msgBox: MessageBox = MessageBox.getInstance();
      const updates = msgBox.updates.get(turn)!;
      const report =  msgBox.reports.get(turn)!;
      
      // check for dead passive players
      updates.forEach((u) => { 
        if (u.payload.died) {
        round.set(u.sender, true);                        // set as dead in round 
        const pdata = players.get(u.sender)!;
        pdata.eliminated = true;
        players.set(u.sender, pdata);                     // set as dead in players
        const p: Position = {
          name: this.playerStore.getPlayerName(u.sender),
          pid: u.sender,
          turn
        };
        this.leaderboard.push(p)                          // add to leaderboard
      }});

      // check if active player died
      if (report.payload.died) {
        const pid = report.sender;
        round.set(pid, true);                             // set as dead in round 
        const pdata = players.get(pid)!;
        pdata.eliminated = true;
        players.set(pid, pdata);                          // set as dead in players
        const p: Position = {
          name: this.playerStore.getPlayerName(pid),
          pid,
          turn
        };
        this.leaderboard.push(p)                          // add to leaderboard
      }

      const allPlayers = Array.from(round.keys());
      gameOver = this.isGameFinished(allPlayers, turn)!;  // check if there's a winner

      [activePlayer, nextPlayer] = this.nextPlayers(finishingPlayer, round);
    }

    const justContext = {
      players: context.players,
      minPlayers: context.minPlayers,
      turn: turn + 1,
      round,
      activePlayer,
      nextPlayer,
      gameOver,
    };

    const newContext = {
      ...justContext,
      turnInfo: this.turnInfoFromContext(justContext)
    };

    return newContext;
  }

  isGameFinished(allPlayers: PlayerId[], turn: Turn): PlayerId | undefined {
    console.log("\n\nCHECKING if game finished")
    if (this.leaderboard.length > 3) {
      const winner = this.leaderboard[3]!.pid;
      this.winner = winner;
    } else if (this.leaderboard.length === 3) {
      const deadPlayers = this.leaderboard.map((p) => p.pid); 

      const winnerPid = allPlayers.find((pid) => !deadPlayers.includes(pid)) as PlayerId;
      
      const winnerPosition: Position = {
        name: this.playerStore.getPlayerName(winnerPid),
        pid: winnerPid,
        turn,
      }; 

      this.leaderboard.push(winnerPosition);
      
      this.winner = winnerPid;
    }
    console.log("\n\n\nTHERE IS A WINNER: ", this.winner !== undefined);
    return this.winner;
  }

  async broadcastGameStarted() {
    await this.nsp.timeout(this.broadcastTimeout).emitWithAck(GameMsg.STARTED);
  }

  async broadcastEndGame(p: GameEndMsg) {
    this.nsp.timeout(this.broadcastTimeout).emit(GameMsg.FINISHED, p);
  }

  private broadcastTurn(turnInfo: TurnInfo) {
    const newTurnInfo = {
        turn:         turnInfo.turn,
        round:        Object.fromEntries(turnInfo.round),
        activePlayer: turnInfo.activePlayer,
        nextPlayer:   turnInfo.nextPlayer,
        gameOver:     turnInfo.gameOver   
    }
    this.msgBox.emitNewTurn(newTurnInfo);
    this.msgBox.emitClean();
  }

  async broadcastQueryWaiting(): Promise<{ player: string, waiting: boolean }[]> {
    return await this.nsp.timeout(this.broadcastTimeout).emitWithAck(GameMsg.WAITING);
  } 

  async newTurn(context: Context): Promise<Context> {
    const newContext = this.nextContext(context);
    this.log("\n oldContext", stringify(context), "\n newContext", stringify(newContext), "\n")
    return newContext;
  }

  async queryWaiting(context: Context): Promise<Context> {
    const waitingResponse = await this.broadcastQueryWaiting()
    waitingResponse.forEach(({ player: id, waiting }) => {
      const player = context.players.get(id as PlayerId)
      if (player) {
        player.waiting = waiting;
        context.players.set(id as PlayerId, player)
      }
    })
    return { ...context, players: context.players }
  }

  machineSetup() {

    const emitTurnAction = ({ event, context } : ActionInput) => {
      console.log("\n\n emit context turnInfo: ", context.turnInfo);
      this.broadcastTurn(context.turnInfo);
      return context
    };

    const addPlayerAction = ({ event, context }: ActionInput) => {
      
      if (isAddPlayerEvent(event)) {
        this.log("Adding player!", event.data.player, stringify(context));
        
        const player: PlayerStatus = {
          eliminated: false,
          ready: false,
          seat: context.players.size,
          id: event.data.player,
          waiting: false
        }
        context.players.set(player.id, player);
          
        this.playerEmitData = {
          id: player.id, 
          sid: this.playerStorage.getSocketId(player.id), 
          seat: player.seat
        } as PlayerData;
 
        return { players: context.players }
      } else return context
      
    }

    const markPlayerReadyAction = ({ event, context }: ActionInput) => {
      // TODO: handle players not defined
      if (isPlayerReadyEvent(event)) {
        this.log("Marking player ready", event.data.player, stringify(context));
        const players = context.players;
        const playerId = event.data.player;
        let playerStatus = players.get(playerId);
        playerStatus!.ready = true;
        players.set(playerId, playerStatus!);
        return { players }
      } else return {}
    }

    const updateContextOnDoneAction = ({ event }: ActionInput) => {
      self.log("Updating turnInfo", stringify(event));
      if (event.output) {
        return event.output
      } else return { }
    }

    const updatePlayersAction = ({ event }: ActionInput) => {
      self.log("Updating players", stringify(event));
      if (event.output) {
        return { players: event.output.players }
      } else return {}
    }

    const cleanupAction = ({ context }: ActionInput) => {
      const players = context.players;
      players.forEach((status, id) => {
        status.waiting = false;
        players.set(id, status)
      })
      return { players }
    }

    const self = this;
    function allPlayersReadyGuard(context: Context): boolean {
      if (context.players.size >= context.minPlayers) {
        const msgBox = MessageBox.getInstance();
        const playerStatuses = Array.from(context.players.values());
        msgBox.emit(MsgEvents.PLAYERS, playerStatuses)
      }
      return context.players.size >= context.minPlayers &&
        Array.from(context.players.values()).every(x => x.ready)
    }

    function allPlayersWaitingGuard(context: Context): boolean {
      const nonEliminated = Array.from(context.players.values()).filter(x => !x.eliminated);
      return nonEliminated.every(x => x.waiting)
    }

    const template = setup({
      types: {
        context: {} as Context,
        events: {} as EventsSm
      },
      actions: {
        [Actions.log]: ({ event, context }, step: GameState) => this.log(step ? `[${step}]` : '', event.type, stringify(context)),
        [Actions.addPlayer]:            assign(addPlayerAction),
        [Actions.emitSeat]:             emit({type: Events.EmitSeat, player: this.playerEmitData }), // race condition?
        [Actions.markPlayerReady]:      assign(markPlayerReadyAction),
        [Actions.updateContextOnDone]:  assign(updateContextOnDoneAction),
        [Actions.emitTurn]:             assign(emitTurnAction),
        [Actions.updatePlayers]:        assign(updatePlayersAction),
        [Actions.cleanup]:              assign(cleanupAction),
      },
      guards: {
        [Guards.gameEnded]: ({context}) => {
           const aWinner = this.winner !== undefined;
          if (aWinner) {console.log("\n\n\nWE HAVE A WINNER:===: ", aWinner)}
          return aWinner; 
        },
        [Guards.gameContinues]: ({context}) => {
          const notWinner = this.winner === undefined;
          if (notWinner) {console.log("\n\n\nNO WINNER FOUND")}
          return notWinner; 
        },
        [Guards.allPlayersReady]:    ({ context }) => allPlayersReadyGuard(context),
        [Guards.allPlayersWaiting]:  ({ context }) => allPlayersWaitingGuard(context),
      },
      actors: {
        [Actors.newTurn]:       fromPromise<Context, Context>(({ input }) => this.newTurn.bind(this)(input)),
        [Actors.queryWaiting]:  fromPromise<Context, Context>(({ input }) => this.queryWaiting.bind(this)(input)),
      }
    })
    return template;
  }

  stateMachine(context: Context) {
    const machine = this.machineSetup()
      .createMachine({
        id: 'game',
        context,
        initial: GameState.setup,
        states: {
          [GameState.setup]: {
            entry: [{ type: Actions.log, params: GameState.setup }],
            on: {
              [Events.AddPlayer]: {
                actions: [{ type: Actions.addPlayer }, { type: Actions.emitSeat }],
                target: GameState.setup,
                reenter: true,
              },
              [Events.PlayerReady]: {
                actions: [{ type: Actions.markPlayerReady }],
                target: GameState.setup,
                reenter: true,
              },
            },
            after: {
              1_000: [
                {
                  guard: Guards.allPlayersReady,
                  target: GameState.updateTurn,
                },
                {
                  target: GameState.setup,
                  reenter: true,
                }
              ]
            }
          },
          [GameState.updateTurn]: {
            entry: [{ type: Actions.log, params: GameState.updateTurn }],
            invoke: {
              src: Actors.newTurn,
              input: ({ context }) => context,
              onDone: {
                actions: [Actions.updateContextOnDone],
                target: GameState.checkForWinner, 
              }
            },
          },
          [GameState.checkForWinner]: {
            always: [
              { guard: Guards.gameEnded, target: GameState.end }, 
              { guard: Guards.gameContinues, 
                actions: [{
                  type: Actions.emitTurn
                }],  
                target: GameState.turn, 
              },
            ],
          },
          [GameState.turn]: {
            entry: [
              { type: Actions.log, params: GameState.turn },
            ],
            invoke: {
              src: Actors.queryWaiting,
              input: ({ context }) => context,
              onDone: [
                {
                  actions: [Actions.updatePlayers],
                }
              ]
            },
            always: [
              { guard: Guards.allPlayersWaiting, target: GameState.cleanup },
            ],
            after: {
              [4_000]: [
                { target: GameState.turn, reenter: true }
              ]
            }
          },
          [GameState.cleanup]: {
            entry: [{ type: Actions.log, params: GameState.cleanup }], 
            always: [
              { actions: [{ type: Actions.cleanup }], target: GameState.updateTurn }
            ]
          },
          [GameState.end]: {
            type: 'final',
            entry: [{ type: Actions.log, params: GameState.end}],
            output: (context) => {
              console.log("GAME ENDED, WINNER: ", this.winner);
              const turn = this.leaderboard[3]!.turn;
              const leaderboard = this.leaderboard.reverse();
              const gameEndMsg: GameEndMsg = {
                event: GameMsg.FINISHED,
                sender: "gamemaster",
                turn, 
                payload : {
                  winner: this.winner!,
                  leaderboard
                }
              }
              this.broadcastEndGame(gameEndMsg);
            },
          },
        }
      });
    return machine;
  }

}

export const Games: Map<string, Game> = new Map();

export function getGameOrNewOne(nsp: GameNsp): Game {
  const gameId = nsp.name;
  let game = Games.get(gameId);
  if (game === undefined) {
    game = new Game(gameId, nsp);
    Games.set(gameId, game);
  }
  return game;
}
