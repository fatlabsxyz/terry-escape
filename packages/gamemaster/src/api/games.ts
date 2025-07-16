import { Request, Response } from 'express';
import GameManager from '../gameManager.js';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';

const gameManager = GameManager.getInstance();
const JWT_SECRET = process.env.JWT_SECRET || 'test-key';

// GET /games - List all active games
export function listGames(req: Request, res: Response) {
  try {
    const games = gameManager.listGames();
    res.json({ games });
  } catch (error) {
    console.error('Error listing games:', error);
    res.status(500).json({ error: 'Failed to list games' });
  }
}

// POST /games/create - Create a new game room
export function createGame(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7);
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const game = gameManager.createGame();
    console.log(`API: Created game ${game.id} with ${game.players.size} players`);
    
    // Add the creator to the game
    console.log(`API: Adding creator ${decoded.id} (${decoded.name}) to game ${game.id}`);
    const success = gameManager.addPlayerToGame(game.id, decoded.id, decoded.name);
    if (!success) {
      console.log(`API: Failed to add creator ${decoded.id} to game ${game.id}`);
      return res.status(500).json({ error: 'Failed to add creator to game' });
    }
    
    // Get fresh game state
    const updatedGame = gameManager.getGame(game.id);
    console.log(`API: After adding creator, game ${game.id} has ${updatedGame?.players.size} players`);
    
    res.json({
      gameId: game.id,
      gameName: game.name,
      status: game.status,
      playerCount: updatedGame!.players.size,
      maxPlayers: game.maxPlayers
    });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
}

// POST /games/:gameId/join - Join specific game
export function joinGame(req: Request, res: Response) {
  try {
    const { gameId } = req.params;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7);
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Always get fresh game state to avoid race conditions
    const game = gameManager.getGame(gameId!);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Game is not accepting new players' });
    }

    // Log current state for debugging
    console.log(`API: Game ${gameId} has ${game.players.size}/${game.maxPlayers} players before join attempt`);
    console.log(`API: Current players:`, Array.from(game.players.keys()));

    if (game.players.size >= game.maxPlayers) {
      console.log(`API: Game ${gameId} is full (${game.players.size}/${game.maxPlayers})`);
      return res.status(400).json({ error: 'Game is full' });
    }

    // Check if player is already in the game
    if (game.players.has(decoded.id)) {
      console.log(`API: Player ${decoded.id} is already in game ${gameId}`);
      // Return success if they're already in
      return res.json({
        gameId: game.id,
        gameName: game.name,
        status: game.status,
        playerCount: game.players.size,
        maxPlayers: game.maxPlayers
      });
    }

    // Add player to game (socket connection will be established separately)
    console.log(`API: Player ${decoded.id} (${decoded.name}) attempting to join game ${gameId}`);
    console.log(`API: Game ${gameId} currently has ${game.players.size} players`);
    
    const success = gameManager.addPlayerToGame(gameId!, decoded.id, decoded.name);
    
    if (!success) {
      console.log(`API: Failed to add player ${decoded.id} to game ${gameId}`);
      return res.status(400).json({ error: 'Failed to join game' });
    }
    
    // Re-get the game to get updated player count
    const updatedGame = gameManager.getGame(gameId!);
    console.log(`API: After join, game ${gameId} has ${updatedGame?.players.size} players`);

    res.json({
      gameId: updatedGame!.id,
      gameName: updatedGame!.name,
      status: updatedGame!.status,
      playerCount: updatedGame!.players.size,
      maxPlayers: updatedGame!.maxPlayers
    });
  } catch (error) {
    console.error('Error joining game:', error);
    res.status(500).json({ error: 'Failed to join game' });
  }
}

// GET /games/:gameId/status - Get specific game status
export function getGameStatus(req: Request, res: Response) {
  try {
    const { gameId } = req.params;
    const game = gameManager.getGame(gameId!);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    console.log(`API: Game status for ${gameId}: ${game.players.size}/${game.maxPlayers} players`);
    console.log(`API: Players in game:`, Array.from(game.players.entries()).map(([id, p]) => ({ id, username: p.username })));

    res.json({
      gameId: game.id,
      gameName: game.name,
      status: game.status,
      playerCount: game.players.size,
      maxPlayers: game.maxPlayers,
      players: Array.from(game.players.values()).map(p => p.username)
    });
  } catch (error) {
    console.error('Error getting game status:', error);
    res.status(500).json({ error: 'Failed to get game status' });
  }
}