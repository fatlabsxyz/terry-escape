import { GameMsg, TurnInfo } from 'client/types';
import { GameNsp, GameSocket } from './sockets/game.js';
import { Actor, setup, createActor, assign, AnyEventObject, fromPromise, DoneActorEvent } from 'xstate';

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
  PlayerReady = "PlayerReady",
  AllPlayersReadyToStart = "AllPlayerReadyToStart"
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
}

interface SmEvent extends AnyEventObject {
  type: `${Events}`
}

interface AddPlayerEvent extends SmEvent {
  type: Events.AddPlayer,
  data: { player: Player }
}

interface PlayerReadyEvent extends SmEvent {
  type: Events.PlayerReady,
  data: { player: Player }
}

type EventsSm = DoneActorEvent
  | PlayerReadyEvent
  | AddPlayerEvent;

function isAddPlayerEvent(event: EventsSm): event is AddPlayerEvent {
  return event.type === Events.AddPlayer
}

function isPlayerReadyEvent(event: EventsSm): event is PlayerReadyEvent {
  return event.type === Events.PlayerReady
}

interface Context {
  minPlayers: number;
  players: Map<Player, PlayerStatus>;
  turn: number;
  round: Player[];
  activePlayer: Player | null;
  nextPlayer: Player | null;
  turnInfo: TurnInfo
}

interface ActionInput {
  event: EventsSm,
  context: Context
}
///


export type Player = string & { readonly __brand: unique symbol };

interface PlayerStatus {
  eliminated: boolean;
  ready: boolean;
  waiting: boolean;
  place: number;
  id: Player;
}

function serMap(map: Map<any, any>): object {
  const o: { [k: string]: any } = {};
  map.forEach((v, k) => o[k] = v);
  return o;
}

const stringify = (o: any) => JSON.stringify(o, (_, v: any) => v instanceof Map ? serMap(v) : v);

export class Game {

  private _activePlayer: Player | null = null;
  private _nextPlayer: Player | null = null;
  nsp: GameNsp;

  gameMachine!: Actor<ReturnType<Game['stateMachine']>>;
  broadcastTimeout: number;
  minPlayers: number;

  constructor(readonly id: string, nsp: GameNsp, options?: {}) {
    this.id = id
    this.nsp = nsp;
    this.broadcastTimeout = 2_000;
    this.minPlayers = 4;

    this.gameMachine = createActor(this.stateMachine(Game._defaultContext(this.minPlayers)));
    this.gameMachine.start();
  }

  log(...args: any[]) {
    const prefix = `game:${this.id}`
    const now = () => Number(new Date());
    const _log = (...args: any[]) => console.log(`${now()} [${prefix}]`, ...args);
    return _log(...args);
  }

  static _defaultContext(minPlayers: number): Context {
    const context = {
      players: new Map(),
      round: [],
      minPlayers,
      turn: 0,
      activePlayer: null,
      nextPlayer: null,
    }
    return {
      ...context,
      turnInfo: this.turnInfoFromContext(context),
    }
  }

  get activePlayer() {
    return this._activePlayer!;
  }

  addPlayer(player: Player) {
    this.gameMachine.send({ type: Events.AddPlayer, data: { player } });
  }

  readyPlayer(player: Player) {
    const playerIndex: number = this.gameMachine.getSnapshot().context.players.get(player)!.place;
    this.gameMachine.send({ type: Events.PlayerReady, data: { player } });
    return playerIndex;
  }

  static nextPlayers(finishingPlayer: Player, round: Player[]): [Player, Player] {
    let activePlayer: Player, nextPlayer: Player;
    const activeIndex = round.indexOf(finishingPlayer);
    if (activeIndex < 0) {
      console.log(`Active player ${finishingPlayer} has been eliminated`)
      activePlayer = round[0]!;
      nextPlayer = round[1]!;
    } else {
      activePlayer = round[(activeIndex + 1) % round.length]!
      nextPlayer = round[(activeIndex + 2) % round.length]!
    }
    return [activePlayer, nextPlayer]
  }

  static turnInfoFromContext(context: Omit<Context, 'turnInfo'>): TurnInfo {
    const { turn, round, activePlayer, nextPlayer } = context;
    return {
      turn,
      round,
      activePlayer: activePlayer!,
      nextPlayer: nextPlayer!,
    }
  }

  static nextContext(context: Context): Context {

    const { turn, players, activePlayer: finishingPlayer } = context;

    // we remove eliminated players
    const round = Array.from(players.values())
      .sort((a, b) => b.place - a.place)
      .filter(x => !x.eliminated)
      .map(x => x.id);

    let activePlayer, nextPlayer;
    if (!finishingPlayer) {
      // We just started the game
      [activePlayer, nextPlayer] = [round[0]!, round[1]!]
    } else {
      [activePlayer, nextPlayer] = this.nextPlayers(finishingPlayer, round);
    }

    const justContext = {
      players: context.players,
      minPlayers: context.minPlayers,
      turn: turn + 1,
      round,
      activePlayer,
      nextPlayer,
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
    await this.nsp.timeout(this.broadcastTimeout).emitWithAck(GameMsg.TURN_START, turnInfo);
  }

  async broadcastQueryWaiting(): Promise<{ player: string, waiting: boolean }[]> {
    return await this.nsp.timeout(this.broadcastTimeout).emitWithAck(GameMsg.WAITING);
  }

  async newTurn(context: Context): Promise<Context> {
    const newContext = Game.nextContext(context);
    this.log("oldContext", stringify(context), "newContext", stringify(newContext))
    await this.broadcastTurn(newContext.turnInfo);
    return newContext;
  }

  async queryWaiting(context: Context): Promise<Context> {
    const waitingRes = await this.broadcastQueryWaiting()
    waitingRes.forEach(({ player: id, waiting }) => {
      const player = context.players.get(id as Player)
      if (player) {
        player.waiting = waiting;
        context.players.set(id as Player, player)
      }
    })
    return { ...context, players: context.players }
  }

  machineSetup() {

    const addPlayerAction = ({ event, context }: ActionInput) => {
      if (isAddPlayerEvent(event)) {
        this.log("Adding player!", event.data.player, stringify(context));
        const players = context.players;
        const playerId = event.data.player;
        const playerStatus: PlayerStatus = {
          eliminated: false,
          ready: false,
          place: players.size,
          id: playerId,
          waiting: false
        }
        players.set(playerId, playerStatus);
        return { players }
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
      self.log("Checking all players ready", stringify(context));
      return context.players.size >= context.minPlayers &&
        Array.from(context.players.values()).every(x => x.ready)
    }

    function allPlayersWaitingGuard(context: Context): boolean {
      self.log("Checking all players waiting", stringify(context));
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
              [Events.PlayerReady]: {
                actions: [{ type: Actions.markPlayerReady }],
                target: GameState.setup,
                reenter: true,
              },
              [Events.AddPlayer]: {
                actions: [{ type: Actions.addPlayer }],
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
