import { generateGameName, generateGameId } from './bip39Words.js';
import { ActorRef } from 'xstate';

export interface GameRoom {
  id: string;
  name: string;
  players: Map<string, { playerId: string; username: string; socketId?: string }>;
  maxPlayers: number;
  status: 'waiting' | 'in_progress' | 'ended';
  createdAt: Date;
  gameActor?: ActorRef<any, any>;
}

export interface GameListItem {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  status: 'waiting' | 'in_progress' | 'ended';
  players: string[]; // usernames
}

class GameManager {
  private games: Map<string, GameRoom> = new Map();
  private static instance: GameManager;

  private constructor() {
    // Start cleanup interval - remove empty games after 5 minutes
    setInterval(() => this.cleanupEmptyGames(), 60 * 1000); // Check every minute
  }

  static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  createGame(): GameRoom {
    const id = generateGameId();
    const name = generateGameName();
    
    const game: GameRoom = {
      id,
      name,
      players: new Map(),
      maxPlayers: 4,
      status: 'waiting',
      createdAt: new Date()
    };

    this.games.set(id, game);
    console.log(`GAME-MANAGER: Created new game ${id} - "${name}"`);
    
    return game;
  }

  getGame(gameId: string): GameRoom | undefined {
    return this.games.get(gameId);
  }

  listGames(): GameListItem[] {
    const gameList: GameListItem[] = [];
    
    for (const [id, game] of this.games) {
      // Only show games that are waiting or in progress
      if (game.status !== 'ended') {
        gameList.push({
          id: game.id,
          name: game.name,
          playerCount: game.players.size,
          maxPlayers: game.maxPlayers,
          status: game.status,
          players: Array.from(game.players.values()).map(p => p.username)
        });
      }
    }

    return gameList.sort((a, b) => {
      // Sort by status (waiting first) then by player count
      if (a.status === 'waiting' && b.status !== 'waiting') return -1;
      if (a.status !== 'waiting' && b.status === 'waiting') return 1;
      return b.playerCount - a.playerCount;
    });
  }

  addPlayerToGame(gameId: string, playerId: string, username: string, socketId?: string): boolean {
    const game = this.games.get(gameId);
    
    if (!game) {
      console.log(`GAME-MANAGER: Game ${gameId} not found`);
      return false;
    }

    if (game.status !== 'waiting') {
      console.log(`GAME-MANAGER: Game ${gameId} is not accepting new players (status: ${game.status})`);
      return false;
    }

    // Check if player is already in the game FIRST
    if (game.players.has(playerId)) {
      // Update socket ID if reconnecting
      const player = game.players.get(playerId)!;
      const oldSocketId = player.socketId;
      if (socketId) {
        player.socketId = socketId;
        console.log(`GAME-MANAGER: Player ${playerId} reconnected to game ${gameId} - updated socket from ${oldSocketId} to ${socketId}`);
      } else {
        console.log(`GAME-MANAGER: Player ${playerId} in game ${gameId} but no socket ID provided`);
      }
      return true;
    }

    // Only check if game is full for NEW players
    if (game.players.size >= game.maxPlayers) {
      console.log(`GAME-MANAGER: Game ${gameId} is full - cannot add new player ${playerId}`);
      return false;
    }

    // Double-check we're not at capacity
    if (game.players.size >= game.maxPlayers) {
      console.log(`GAME-MANAGER: Cannot add player ${playerId} - game ${gameId} is at capacity (${game.players.size}/${game.maxPlayers})`);
      return false;
    }

    game.players.set(playerId, { playerId, username, socketId });
    console.log(`GAME-MANAGER: Added player ${playerId} (${username}) to game ${gameId} - ${game.players.size}/${game.maxPlayers} players`);
    console.log(`GAME-MANAGER: Current players in game ${gameId}:`, Array.from(game.players.keys()));

    // Don't start the game yet - wait for socket connections
    // The socket handler will start the game when all 4 are connected

    return true;
  }

  removePlayerFromGame(gameId: string, playerId: string): boolean {
    const game = this.games.get(gameId);
    
    if (!game) {
      return false;
    }

    if (game.players.delete(playerId)) {
      console.log(`GAME-MANAGER: Removed player ${playerId} from game ${gameId} - ${game.players.size}/${game.maxPlayers} players`);
      
      // If game is empty and waiting, it will be cleaned up later
      // If game is in progress and all players left, end it
      if (game.players.size === 0 && game.status === 'in_progress') {
        this.endGame(gameId);
      }
      
      return true;
    }

    return false;
  }

  private startGame(gameId: string) {
    const game = this.games.get(gameId);
    
    if (!game || game.players.size !== 4) {
      return;
    }

    game.status = 'in_progress';
    // Note: The actual game actor will be created by the socket handler
    // This is just to track the status
    console.log(`GAME-MANAGER: Started game ${gameId} - "${game.name}"`);
  }

  updateGameStatus(gameId: string, status: 'waiting' | 'in_progress' | 'ended') {
    const game = this.games.get(gameId);
    if (game) {
      game.status = status;
      console.log(`GAME-MANAGER: Updated game ${gameId} status to ${status}`);
    }
  }

  endGame(gameId: string) {
    const game = this.games.get(gameId);
    if (game) {
      game.status = 'ended';
      console.log(`GAME-MANAGER: Ended game ${gameId} - "${game.name}"`);
      
      // Remove the game after a delay to allow final messages
      setTimeout(() => {
        this.games.delete(gameId);
        console.log(`GAME-MANAGER: Removed ended game ${gameId}`);
      }, 30000); // 30 seconds
    }
  }

  private cleanupEmptyGames() {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    for (const [id, game] of this.games) {
      // Remove empty games that are older than 5 minutes
      if (game.players.size === 0 && 
          game.status === 'waiting' && 
          game.createdAt < fiveMinutesAgo) {
        this.games.delete(id);
        console.log(`GAME-MANAGER: Cleaned up empty game ${id} - "${game.name}"`);
      }
    }
  }

  // For debugging
  getGameCount(): number {
    return this.games.size;
  }
}

export default GameManager;