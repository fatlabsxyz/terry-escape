import { PlayerId, GameMsg, TurnInfo, PlayerSeat, SocketId } from 'client/types';
import { GameNsp } from './sockets/game.js';
import { Actor, setup, createActor, assign, AnyEventObject, fromPromise, DoneActorEvent, emit } from 'xstate';
import { PlayerStorage } from './playerStorage.js';
import { MessageBox, MsgEvents } from 'client';

/// STATE MACHINE TYPES
enum GameState {
  setup = "GM:SETUP",
  newTurn = "GM:NEW_TURN",
  turn = "GM:TURN",
  cleanup = "GM:CLEANUP"
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
  AllPlayersDead = "AllPlayersDied"
}

enum Guards {
  allPlayersReady = "allPlayersReady",
  allPlayersWaiting = "allPlayersWaiting",
}

enum Actions {
  log = "log",
  addPlayer = "addPlayer",
  markPlayerReady = "markPlayerReady",
  updateContextOnDone = "updateContextOnDone",
  updatePlayers = "updatePlayers",
  cleanup = "cleanup",
  emitSeat = "emitSeat",
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
  gameOver: boolean;
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

  private msgBox: MessageBox;

  private _activePlayer: PlayerId | null = null;
  private _nextPlayer: PlayerId | null = null;
  nsp: GameNsp;
  playerStorage: PlayerStorage;

  gameMachine!: Actor<ReturnType<Game['stateMachine']>>;
  broadcastTimeout: number;
  minPlayers: number;
  playerSeat: undefined | number = undefined;
  playerEmitData: any;

  constructor(readonly playerId: string, nsp: GameNsp, options?: {}) {
    this.nsp = nsp;
    this.broadcastTimeout = 30_000; //originally 2_000
    this.minPlayers = 4;
    this.playerStorage = PlayerStorage.getInstance();
    this.msgBox = MessageBox.getInstance();

    this.gameMachine = createActor(this.stateMachine(Game._defaultContext(this.minPlayers)));
    
    this.gameMachine.start();

    this.attachEvents();
  }

  log(...args: any[]) {
    const prefix = `game:${this.playerId}`
    const now = () => Number(new Date());
    const _log = (...args: any[]) => console.log(`${now()} [${prefix}]`, ...args);
    return _log(...args);
  }

  static _defaultContext(minPlayers: number): Context {
    const context = {
      players: new Map(),
      round: new Map(),
      minPlayers,
      turn: 0,
      activePlayer: "",
      nextPlayer: "",
      gameOver: false,
    }
    return {
      ...context,
      turnInfo: this.turnInfoFromContext(context),
    }
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

  static nextPlayers(finishingPlayer: PlayerId, round: Map<PlayerId, boolean>): [PlayerId, PlayerId] {
    let activePlayer: PlayerId, nextPlayer: PlayerId;
    const roundPlayers = Array.from(round.keys());
    const activeIndex = roundPlayers.indexOf(finishingPlayer);
    if (activeIndex < 0) {
      console.log(`Active player ${finishingPlayer} has been eliminated`)
      activePlayer = roundPlayers[0]!;
      nextPlayer = roundPlayers[1]!;
    } else {
      activePlayer = roundPlayers[(activeIndex + 1) % roundPlayers.length]!
      nextPlayer = roundPlayers[(activeIndex + 2) % roundPlayers.length]!
    }
    return [activePlayer, nextPlayer]
  }

  static turnInfoFromContext(context: Omit<Context, 'turnInfo'>): TurnInfo {
    const { turn, round, activePlayer, nextPlayer, gameOver } = context;
    return {
      turn,
      round,
      activePlayer,
      nextPlayer,
      gameOver,
    }
  }

  static nextContext(context: Context): Context {

    const { turn, players, activePlayer: finishingPlayer } = context;

    // we mark eliminated players
    const round: Map<PlayerId, boolean> = new Map();
    const playersSorted: PlayerStatus[] = Array.from(players.values()).sort((a, b) => b.seat - a.seat);
    console.log("\n\n\n\n pLAYERS SORTED: ", playersSorted)
    
    playersSorted.forEach((p) => {
      round.set(p.id, p.eliminated);
      // TODO maybe should set players as eliminated through event from client
    });

    console.log("\n\nROUND: ", round);

    let activePlayer: string, nextPlayer: string;
    if (!finishingPlayer) {
      // We just started the game
      const [p1, p2] = [playersSorted[0]!, playersSorted[1]!]
      activePlayer = p1.id;
      nextPlayer = p2.id;
      
      console.log("\n\n\n\n NEW ACTIVE PLAYER: ", activePlayer)
      console.log("\n NEW NEXT PLAYER: ", nextPlayer)
    } else {
      [activePlayer, nextPlayer] = this.nextPlayers(finishingPlayer, round);
    }

    let gameOver = false; //TODO update this later based on dead players

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

  async broadcastGameStarted() {
    await this.nsp.timeout(this.broadcastTimeout).emitWithAck(GameMsg.STARTED);
  }

  async broadcastEndGame() {
    await this.nsp.timeout(this.broadcastTimeout).emitWithAck(GameMsg.FINISHED);
  }

  private async broadcastTurn(turnInfo: TurnInfo) {
    const newTurnInfo = {
        turn:         turnInfo.turn,
        round:        Object.fromEntries(turnInfo.round),
        activePlayer: turnInfo.activePlayer,
        nextPlayer:   turnInfo.nextPlayer,
        gameOver:     turnInfo.gameOver   
    }
    console.log("\n\n BROADCASTING TURN new-turn-info: ", stringify(newTurnInfo))
    await this.nsp.timeout(this.broadcastTimeout).emitWithAck(GameMsg.TURN_START, newTurnInfo);
    this.msgBox.emitClean();
  }

  async broadcastQueryWaiting(): Promise<{ player: string, waiting: boolean }[]> {
    return await this.nsp.timeout(this.broadcastTimeout).emitWithAck(GameMsg.WAITING);
  } 

  async newTurn(context: Context): Promise<Context> {
    const newContext = Game.nextContext(context);
    this.log("\noldContext", stringify(context), "\nnewContext", stringify(newContext))
    await this.broadcastTurn(newContext.turnInfo);
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

        // this.log(`New player seat: ${player.seat}, ID: ${player.id}`);
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
      } else return {}
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
      // self.log("Checking all players ready", stringify(context));
      
      if (context.players.size >= context.minPlayers) {
        const msgBox = MessageBox.getInstance();
        const playerStatuses = Array.from(context.players.values());
        msgBox.emit(MsgEvents.PLAYERS, playerStatuses)
      }
      return context.players.size >= context.minPlayers &&
        Array.from(context.players.values()).every(x => x.ready)
    }

    function allPlayersWaitingGuard(context: Context): boolean {
      // self.log("Checking all players waiting", stringify(context));

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
        [Actions.addPlayer]: assign(addPlayerAction),
        [Actions.emitSeat]: emit({type: Events.EmitSeat, player: this.playerEmitData }), // race condition?
        [Actions.markPlayerReady]: assign(markPlayerReadyAction),
        [Actions.updateContextOnDone]: assign(updateContextOnDoneAction),
        [Actions.updatePlayers]: assign(updatePlayersAction),
        [Actions.cleanup]: assign(cleanupAction),
      },
      guards: {
        [Guards.allPlayersReady]: ({ context }) => allPlayersReadyGuard(context),
        [Guards.allPlayersWaiting]: ({ context }) => allPlayersWaitingGuard(context),
      },
      actors: {
        [Actors.newTurn]: fromPromise<Context, Context>(({ input }) => this.newTurn.bind(this)(input)),
        [Actors.queryWaiting]: fromPromise<Context, Context>(({ input }) => this.queryWaiting.bind(this)(input)),
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
                  target: GameState.newTurn,
                },
                {
                  target: GameState.setup,
                  reenter: true,
                }
              ]
            }
          },
          [GameState.newTurn]: {
            entry: [{ type: Actions.log, params: GameState.newTurn }],
            invoke: {
              src: Actors.newTurn,
              input: ({ context }) => context,
              onDone: {
                actions: [Actions.updateContextOnDone],
                target: GameState.turn
              }
            },
          },
          [GameState.turn]: {
            entry: [{ type: Actions.log, params: GameState.turn }],
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
              { actions: [{ type: Actions.cleanup }], target: GameState.newTurn }
            ]
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
