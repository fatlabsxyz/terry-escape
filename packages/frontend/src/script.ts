import { connect, getNewToken } from 'client';
import { IfEvents } from 'client/types';
import { Board } from 'client'
import { Interfacer } from 'client';

interface Agent {
    id: number;
    row: number;
    col: number;
    seat: number;
}

type ActionMode = "move" | "trap" | null;

interface CellPosition {
    row: number;
    col: number;
}

// Connection logic

// Simple username storage only
function getStoredUsername(): string | null {
    return localStorage.getItem('terryUsername');
}

function storeUsername(username: string): void {
    localStorage.setItem('terryUsername', username);
}

// Legacy cookie functions for backwards compatibility
function getCookie(name: string): string | null {
  console.log(`getting ${name} cookie`)

  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(nameEQ)) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }
  return null;
}

function setCookie(name: string, value: string): void {
  console.log(`setting ${name} cookie`);

  const date = new Date();
  date.setTime(date.getTime() + 60 * 60 * 1000); // 1 Hour expiration
  let expires = `; expires=${date.toUTCString()}`;

  document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Strict`;
}

// Main game logic
document.addEventListener("DOMContentLoaded", async () => {
    console.log("=== TERRY ESCAPE: Page loaded, checking authentication ===");
    const grid = document.getElementById("grid") as HTMLDivElement;
    const log = document.getElementById("log") as HTMLDivElement;
    const moveBtn = document.getElementById("move-btn") as HTMLButtonElement;
    const trapBtn = document.getElementById("trap-btn") as HTMLButtonElement;
    const joinBtn = document.getElementById("join-btn") as HTMLButtonElement;
    const joinPaywall = document.getElementById("join-paywall") as HTMLDivElement;
    const errorMessage = document.getElementById("error-message") as HTMLDivElement;
    const usernameInput = document.getElementById("username-input") as HTMLInputElement;
    
    // Lobby elements
    const enterLobbyBtn = document.getElementById("enter-lobby-btn") as HTMLButtonElement;
    const lobbySection = document.getElementById("lobby-section") as HTMLDivElement;
    const createRoomBtn = document.getElementById("create-room-btn") as HTMLButtonElement;
    const refreshBtn = document.getElementById("refresh-btn") as HTMLButtonElement;
    const gameList = document.getElementById("game-list") as HTMLDivElement;
    const noGamesDiv = document.getElementById("no-games") as HTMLDivElement;
    
    // New UI elements
    const playerCountDisplay = document.getElementById("player-count") as HTMLSpanElement;
    const turnNumberDisplay = document.getElementById("turn-number") as HTMLSpanElement;
    const gamePhaseDisplay = document.getElementById("game-phase") as HTMLSpanElement;
    const tutorialBtn = document.getElementById("tutorial-btn") as HTMLButtonElement;
    const tutorialModal = document.getElementById("tutorial-modal") as HTMLDivElement;
    const tutorialClose = document.querySelector(".modal-close") as HTMLSpanElement;
    const proofProgress = document.getElementById("proof-progress") as HTMLDivElement;
    const progressFill = document.getElementById("progress-fill") as HTMLDivElement;
    const proofStatus = document.getElementById("proof-status") as HTMLDivElement;
    const playerList = document.getElementById("player-list") as HTMLDivElement;
    const gameOverOverlay = document.getElementById("game-over-overlay") as HTMLDivElement;
    const gameOverContent = document.getElementById("game-over-content") as HTMLDivElement;
    const bgMusic = document.getElementById("bg-music") as HTMLAudioElement;
    const musicToggle = document.getElementById("music-toggle") as HTMLButtonElement;
    const playerDeadOverlay = document.getElementById("player-dead-overlay") as HTMLDivElement;
    const turnTimer = document.getElementById("turn-timer") as HTMLDivElement;
    const timerDisplay = document.getElementById("timer-display") as HTMLDivElement;
    const gameNameDisplay = document.getElementById("game-name-display") as HTMLDivElement;
    const gameNameValue = document.getElementById("game-name-value") as HTMLSpanElement;

    let agents: Agent[] = [];
    let turn: number = 0;
    const maxAgents: number = 4;
    let selectedAgentCell: CellPosition | null = null;
    let actionMode: ActionMode = null;
    let mustAct: boolean = false;
    let reason: number; let targeted: number
    let board: Board | null = null;
    let interfacer: Interfacer | null = null;
    let mySeat: number = -1;
    let playerCount: number = 0;
    let players: Map<number, {name: string, agents: number, status: string}> = new Map();
    let proofTimer: any = null;
    let markedCells: Set<number> = new Set(); // Track cells with visual effects
    let myUsername: string = "Player";
    let turnTimerInterval: any = null;
    let turnTimeRemaining: number = 30;
    let currentGameId: string | null = null;
    let currentGameName: string | null = null;
    let authToken: string | null = null;
    let deploymentTimerInterval: any = null;
    let deploymentTimeRemaining: number = 60;
    
    const playerColors = ["red", "blue", "green", "yellow"];
    const playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

    function initializeGrid(): void {
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.dataset.index = i.toString();
            grid.appendChild(cell);
        }
    }

    initializeGrid();
    updateGamePhase("WAITING FOR PLAYERS");
    updatePlayerBoard();
    updatePlayerCount(); // Initialize player count
    logMessage("TERRY ESCAPE INITIALIZED", "turn");
    logMessage("Zero-Knowledge Battle Royale", "action");
    logMessage("Waiting for players to join...", "action");
    
    // Music Control
    let musicPlaying = false;
    bgMusic.volume = 0.3; // Set volume to 30%
    
    musicToggle.addEventListener("click", () => {
        if (musicPlaying) {
            bgMusic.pause();
            musicToggle.classList.add("muted");
            musicPlaying = false;
        } else {
            bgMusic.play().catch(err => {
                console.log("Audio play failed:", err);
            });
            musicToggle.classList.remove("muted");
            musicPlaying = true;
        }
    });
    
    // Tutorial modal functionality
    tutorialBtn.addEventListener("click", () => {
        tutorialModal.style.display = "flex";
    });
    
    tutorialClose.addEventListener("click", () => {
        tutorialModal.style.display = "none";
    });
    
    window.addEventListener("click", (e) => {
        if (e.target === tutorialModal) {
            tutorialModal.style.display = "none";
        }
    });
    
    // Check for stored username
    const storedUsername = getStoredUsername();
    if (storedUsername) {
        usernameInput.value = storedUsername;
        myUsername = storedUsername;
    }
    

    // Setup interfacer and all event listeners
    function setupInterfacer() {
       interfacer = Interfacer.getInstance();
       
       interfacer.on(IfEvents.Connect, event => {
           console.log("=== CONNECT EVENT RECEIVED ===", event);
           board = new Board(event.seat);
           mySeat = event.seat;
           logMessage(`CONNECTED: You are player ${event.seat + 1}`, "action");
           
           // Display game name
           if (currentGameName) {
               logMessage(`GAME: ${currentGameName.toUpperCase()} (ID: ${currentGameId})`, "action");
               gameNameDisplay.style.display = "block";
               gameNameValue.textContent = currentGameName.toUpperCase();
           }
           
           logMessage(`MPC SETUP: Initializing cryptographic parameters...`, "action");
           
           // Show deployment cells
           console.log("Deployment indices:", board.allowedPlacementIndices);
           board.allowedPlacementIndices.forEach(index => {
               if (grid.children[index]) {
                   (grid.children[index] as HTMLElement).classList.add("possible");
               }
	   });
           
           // Mark myself as connected
           players.set(mySeat, {
               name: myUsername,
               agents: 4,
               status: 'connected'
           });
           updatePlayerCount();
           updatePlayerBoard();
           updateTutorial(); // Update tutorial to show deployment phase
       });

       interfacer.on(IfEvents.Turn, event => {
           turn = event.round;
	   mustAct = event.active;
           logMessage(`TURN ${turn}`, "turn");
           
           // Stop deployment timer when game starts (turn 1)
           if (turn === 1) {
               stopDeploymentTimer();
           }
           
           updateTurnDisplay();
           updateActivePlayer();
	   updateTutorial();
           updateButtonStates();
           
           // Update player names if provided
           if (event.playerNames) {
               Object.entries(event.playerNames).forEach(([playerId, name]) => {
                   const seat = parseInt(playerId);
                   if (players.has(seat) && seat !== mySeat) {
                       players.get(seat)!.name = name;
                   }
               });
               updatePlayerBoard();
           }
           
           // Start or stop timer based on whether it's my turn
           if (mustAct && turn > 0) {
               startTurnTimer();
               // Add visual feedback for active turn
               document.body.classList.add('active-turn');
           } else {
               stopTurnTimer();
               // Remove visual feedback when not active
               document.body.classList.remove('active-turn');
               // If it's not our turn and game has started, show MPC progress
               if (turn > 0 && !mustAct) {
                   showMPCProgress();
               }
           }
           
           // Clear marked cells from previous turn
           clearMarkedCells();
           
           // Update player statuses from round data
           if (event.round && typeof event.round === 'object') {
               // First, ensure all players in the game are tracked
               Object.keys(event.round).forEach(playerId => {
                   const seat = parseInt(playerId);
                   if (!players.has(seat)) {
                       // Note: We can only show our own username. Other players' usernames aren't 
                       // broadcast by the server, so we show generic "Player X" labels
                       const playerName = seat === mySeat ? myUsername : `Player ${seat + 1}`;
                       players.set(seat, {
                           name: playerName,
                           agents: 4,
                           status: 'connected'
                       });
                   }
               });
               
               // Then update statuses based on elimination
               Object.entries(event.round).forEach(([playerId, isEliminated]) => {
                   const seat = parseInt(playerId);
                   const player = players.get(seat)!;
                   
                   // Update status based on turn and elimination
                   if (turn > 0 && !isEliminated) {
                       player.status = 'playing';
                   }
                   if (isEliminated) {
                       player.status = 'eliminated';
                       player.agents = 0;
                       // Check if it's me who was eliminated
                       if (seat === mySeat) {
                           agents = []; // Clear my agents
                           checkIfPlayerDead();
                       }
                   }
               });
               updatePlayerCount(); // Let it calculate alive players
               updatePlayerBoard();
           }
       });

       interfacer.on(IfEvents.Collision, event => {
           if (event) {
               let where = Number(event);
               logMessage(`MPC CONSENSUS: Collision detected at room #${where}`, "action");
               logMessage(`HEARD LOUD BANG FROM ROOM #${where}!!!`, "elimination");
               addVisualFeedback(where, "explosion");
               
               // Mark the cell with collision color
               markCell(where, "collision-mark");
               
               // When collision happens, ALL agents in that cell die
               const cell = grid.children[where] as HTMLElement;
               const agentsInCell = cell.querySelectorAll('.agent');
               
               // Add elimination animation to all agents
               agentsInCell.forEach(agent => {
                   agent.classList.add('eliminating');
               });
               
               // Clear the cell after animation
               setTimeout(() => {
                   cell.innerHTML = '';
               }, 500);
               
               // Update our agents array - remove any of our agents that were in this cell
               const row = Math.floor(where / 4);
               const col = where % 4;
               agents = agents.filter(a => !(a.row === row && a.col === col));
               checkIfPlayerDead();
	   }
       });
       interfacer.on(IfEvents.Impact, event => {
	   logMessage(`MPC VERIFICATION: Action proof verified by all players`, "action");
	   logMessage(`ACTION COMPLETED`, "action");
	   if (event) {
	       logMessage(`TRAP TRIGGERED: Impact at room #${targeted}!`, "action");
	       logMessage(`HIT REPORTED ON ROOM #${targeted}!!!!`, "elimination");
               addVisualFeedback(targeted, "explosion");
               
               // Mark the cell with impact color
               markCell(targeted, "impact-mark");
               
               const cell = grid.children[targeted] as HTMLElement;
               const agentsInCell = cell.querySelectorAll('.agent');
               agentsInCell.forEach(agent => {
                   agent.classList.add('eliminating');
               });
               setTimeout(() => {
                   cell.innerHTML = '';
               }, 500);
               
               // Update our agents array if it was one of ours
               const row = Math.floor(targeted / 4);
               const col = targeted % 4;
               agents = agents.filter(a => !(a.row === row && a.col === col));
               checkIfPlayerDead();
	   }
       });
       
       // Add PlayerDied event handler
       interfacer.on(IfEvents.PlayerDied, event => {
           if (event && event.playerId !== undefined) {
               console.log("Player Died:", event);
               
               // Update player status
               const deadPlayerSeat = parseInt(event.playerId);
               if (players.has(deadPlayerSeat)) {
                   const deadPlayer = players.get(deadPlayerSeat)!;
                   deadPlayer.status = 'eliminated';
                   deadPlayer.agents = 0;
                   logMessage(`${deadPlayer.name.toUpperCase()} HAS BEEN ELIMINATED!`, "elimination");
               } else {
                   logMessage(`PLAYER ${deadPlayerSeat + 1} HAS BEEN ELIMINATED!`, "elimination");
               }
               
               updatePlayerCount(); // This will recalculate alive count
               updatePlayerBoard();
           }
       });
       
       // Add PLAYERS_UPDATE event handler
       interfacer.on(IfEvents.PlayersUpdate, event => {
           if (event && event.players) {
               console.log("Players Update:", event.players);
               
               // Update our player map with the server data
               event.players.forEach((playerData: any) => {
                   const seat = playerData.seat;
                   
                   if (playerData.connected) {
                       // Player is connected
                       if (!players.has(seat)) {
                           players.set(seat, {
                               name: playerData.name,
                               agents: 4,
                               status: 'connected'
                           });
                       } else {
                           // Update existing player name
                           const existingPlayer = players.get(seat)!;
                           existingPlayer.name = playerData.name;
                       }
                   }
                   // Note: We don't remove unconnected players, we'll show loading for them
               });
               
               updatePlayerCount();
               updatePlayerBoard();
           }
       });
       
       // Add Deployment Timer event handler
       interfacer.on(IfEvents.DeploymentTimer, event => {
           if (event && event.timeLimit) {
               console.log("Deployment Timer Started:", event);
               logMessage(`DEPLOYMENT PHASE: ${event.timeLimit} seconds to deploy your agents!`, "turn");
               startDeploymentTimer(event.timeLimit);
           }
       });
       
       // Add Deployment Status event handler
       interfacer.on(IfEvents.DeploymentStatus, event => {
           if (event) {
               console.log("Deployment Status:", event);
               logMessage(`PLAYER DEPLOYED: ${event.readyCount}/${event.totalPlayers} players ready`, "action");
               
               // Update the phase display
               if (event.readyCount === event.totalPlayers) {
                   updateGamePhase("STARTING...");
                   logMessage("ALL PLAYERS READY - GAME STARTING!", "turn");
               }
           }
       });
       
       // Add Winner event handler
       interfacer.on(IfEvents.Winner, event => {
           if (event && event.winner !== undefined && event.leaderboard) {
               console.log("Game Over Event:", event);
               
               // Update player names from leaderboard
               event.leaderboard.forEach((player: any, index: number) => {
                   // Try to match players by their position in the leaderboard
                   // This isn't perfect but can help show real names at game end
                   if (player.name && player.name !== "gordo-web") {
                       // Look for a player slot that might match
                       players.forEach((playerData, seat) => {
                           if (playerData.status === 'eliminated' || (index === 0 && playerData.agents > 0)) {
                               playerData.name = player.name;
                           }
                       });
                   }
               });
               
               updatePlayerBoard(); // Update display with real names
               showGameOver(event.winner, event.leaderboard);
           }
       });
       
       // Add MPCLog event handler
       interfacer.on(IfEvents.MPCLog, (message: string) => {
           if (message) {
               console.log("MPC Log:", message);
               logMessage(`ZK/MPC: ${message}`, "action");
           }
       });
    }
    
    // Lobby functions
    async function refreshGameList() {
        try {
            const response = await fetch('http://localhost:2448/games');
            const data = await response.json();
            
            gameList.innerHTML = '';
            
            if (data.games && data.games.length > 0) {
                noGamesDiv.style.display = 'none';
                
                data.games.forEach((game: any) => {
                    const gameRoom = createGameRoomElement(game);
                    gameList.appendChild(gameRoom);
                });
            } else {
                noGamesDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Failed to fetch games:', error);
            gameList.innerHTML = '<p style="color: #ff0000;">Failed to load games</p>';
        }
    }
    
    function createGameRoomElement(game: any): HTMLDivElement {
        const gameRoom = document.createElement('div');
        gameRoom.className = 'game-room';
        
        // Check if this was our previous game
        if (game.id === currentGameId) {
            gameRoom.classList.add('previous-game');
        }
        
        // Create player icons
        const playerIcons = '👥'.repeat(game.playerCount) + '⬜'.repeat(game.maxPlayers - game.playerCount);
        
        const canJoin = game.status === 'waiting' && game.playerCount < game.maxPlayers;
        
        gameRoom.innerHTML = `
            <div class="game-info">
                <div class="game-name">${game.name}</div>
                <div class="game-details">
                    <div class="player-count">
                        <span>Players: ${game.playerCount}/${game.maxPlayers}</span>
                        <span class="player-icons">${playerIcons}</span>
                    </div>
                    <div class="game-id">ID: ${game.id}</div>
                    <div class="game-status">Status: ${game.status}</div>
                </div>
            </div>
            <button class="action-btn join-game-btn" ${!canJoin ? 'disabled' : ''} data-game-id="${game.id}">
                ${game.status === 'in_progress' ? 'IN PROGRESS' : game.playerCount >= game.maxPlayers ? 'FULL' : 'JOIN'}
            </button>
        `;
        
        // Add join handler
        const joinGameBtn = gameRoom.querySelector('.join-game-btn') as HTMLButtonElement;
        if (canJoin) {
            joinGameBtn.addEventListener('click', async () => {
                // Disable button while joining
                joinGameBtn.disabled = true;
                joinGameBtn.textContent = 'JOINING...';
                
                try {
                    await joinGame(game.id);
                } catch (error) {
                    // Re-enable button if join fails
                    joinGameBtn.disabled = false;
                    joinGameBtn.textContent = 'JOIN';
                    console.error('Failed to join game:', error);
                    alert(error.message || 'Failed to join game');
                }
            });
        }
        
        return gameRoom;
    }
    
    async function createRoom() {
        try {
            if (!authToken) {
                console.error('No auth token available');
                return;
            }
            
            const response = await fetch('http://localhost:2448/games/create', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to create game');
            }
            
            const data = await response.json();
            console.log('Created game:', data);
            
            // Store the game name when creating
            currentGameName = data.gameName;
            
            // Join the newly created game
            await joinGame(data.gameId);
        } catch (error) {
            console.error('Failed to create room:', error);
            alert('Failed to create game room');
        }
    }
    
    async function joinGame(gameId: string) {
        try {
            if (!authToken) {
                console.error('No auth token available');
                return;
            }
            
            // First, check the current game status to ensure it's not full
            const statusResponse = await fetch(`http://localhost:2448/games/${gameId}/status`);
            if (statusResponse.ok) {
                const gameStatus = await statusResponse.json();
                console.log(`Current game status before join:`, gameStatus);
                if (gameStatus.playerCount >= gameStatus.maxPlayers) {
                    throw new Error('Game is already full');
                }
            }
            
            const response = await fetch(`http://localhost:2448/games/${gameId}/join`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                // If game is full, refresh the game list
                if (error.error === 'Game is full') {
                    await refreshGameList();
                }
                throw new Error(error.error || 'Failed to join game');
            }
            
            const data = await response.json();
            console.log('Joined game:', data);
            
            // Store current game ID and name
            currentGameId = gameId;
            currentGameName = data.gameName;
            
            // Setup the game interface first
            setupInterfacer();
            
            // Connect to the game via socket
            console.log(`Attempting to connect to game ${gameId} via socket...`);
            try {
                await connectWithAuth(authToken, myUsername, gameId);
                console.log(`Successfully connected to game ${gameId}`);
                
                // Only hide the lobby after successful connection
                joinPaywall.style.display = "none";
                joinPaywall.style.setProperty("display", "none", "important");
            } catch (error) {
                console.error(`Failed to establish socket connection to game ${gameId}:`, error);
                throw error;
            }
            
            // Start music
            if (!musicPlaying) {
                bgMusic.play().then(() => {
                    musicPlaying = true;
                    musicToggle.classList.remove("muted");
                }).catch(err => {
                    console.log("Auto-play failed:", err);
                });
            }
        } catch (error) {
            console.error('Failed to join game:', error);
            alert(error.message || 'Failed to join game');
        }
    }
    
    // Enter lobby button handler
    enterLobbyBtn.addEventListener("click", async () => {
        const username = usernameInput.value.trim() || "Player";
        myUsername = username;
        
        try {
            // Get auth token
            const newToken = await getNewToken(username, "http://localhost:2448");
            if (newToken) {
                authToken = newToken;
                
                // Store username for next time
                storeUsername(username);
                
                // Show lobby
                enterLobbyBtn.style.display = "none";
                lobbySection.style.display = "block";
                
                // Load games
                await refreshGameList();
            } else {
                throw new Error("Could not get auth token");
            }
        } catch (error) {
            console.error("Failed to enter lobby:", error);
            alert("Failed to connect to server");
        }
    });
    
    // Create room button handler
    createRoomBtn.addEventListener("click", createRoom);
    
    // Refresh button handler
    refreshBtn.addEventListener("click", refreshGameList);
    
    // Auto-refresh games every 2 seconds when in lobby
    let refreshInterval = setInterval(() => {
        if (lobbySection.style.display !== 'none' && joinPaywall.style.display !== 'none') {
            refreshGameList();
        }
    }, 2000);
    
    // Old join button is no longer used - we use the lobby system now
    
    // Helper function to handle connection logic
    async function connectWithAuth(existingToken: string | null, username: string, gameId?: string) {
        const url = "http://localhost:2448";
        const gameIdToUse = gameId || currentGameId || "0";
        
        try {
            if (existingToken) {
                // Try to use existing token
                console.log('Connecting with existing token to:', url);
                console.log('Game ID:', gameIdToUse);
                console.log('Token preview:', existingToken.substring(0, 20) + '...');
                await connect(existingToken, url, gameIdToUse);
                console.log('Successfully connected with existing token');
            } else {
                // Get new token
                console.log('Getting new auth token for:', username);
                const newToken = await getNewToken(username, url);
                if (newToken) {
                    // Parse the JWT to get player ID
                    const tokenParts = newToken.split('.');
                    const payload = JSON.parse(atob(tokenParts[1]));
                    storeAuth(newToken, payload.id, username);
                    setCookie("auth", newToken); // Keep cookie for backwards compatibility
                    await connect(newToken, url, gameIdToUse);
                    console.log('Successfully connected with new token');
                } else {
                    throw new Error("Could not get auth token");
                }
            }
        } catch (error) {
            console.error("Connection failed:", error);
            throw error;
        }
    }

    moveBtn.addEventListener("click", () => {
        if (turn > 0 && mustAct) {
            if (actionMode === "move") {
                // If already in move mode, deselect
                resetActionMode();
            } else {
                // Switch to move mode
                selectMoveMode();
            }
        }
    });

    trapBtn.addEventListener("click", () => {
        if (turn > 0 && mustAct) {
            if (actionMode === "trap") {
                // If already in trap mode, deselect
                resetActionMode();
            } else {
                // Switch to trap mode
                selectTrapMode();
            }
        }
    });

    function selectMoveMode(): void {
        actionMode = "move";
        moveBtn.classList.add("active");
        trapBtn.classList.remove("active");
        logMessage("MOVE MODE SELECTED", "action");
        updateTutorial();
        updateButtonStates();
    }

    function selectTrapMode(): void {
        actionMode = "trap";
        trapBtn.classList.add("active");
        moveBtn.classList.remove("active");
        logMessage("TRAP MODE SELECTED", "action");
        updateTutorial();
        updateButtonStates();
    }

    // Update button states based on game state
    function updateButtonStates(): void {
        moveBtn.disabled = !mustAct;
        trapBtn.disabled = !mustAct;
    }

    grid.addEventListener("click", (e: Event) => {
        const target = e.target as HTMLElement;
        const cell = target.className === "cell" ? target : target.closest(".cell") as HTMLElement;
        if (!cell) return;

        const index = parseInt(cell.dataset.index!);
        const row = Math.floor(index / 4);
        const col = index % 4;

        if (turn === 0 && cell.classList.contains('possible')) {
            if (agents.length < maxAgents) {
                const agent = document.createElement("div");
                agent.className = "agent";
                const agentId = agents.length + 1;
                agent.textContent = `A${agentId}`;
                agent.dataset.seat = mySeat.toString();
                agent.dataset.agentId = agentId.toString();
                cell.appendChild(agent);
                agents.push({ id: agentId, row, col, seat: mySeat });
                logMessage(`AGENT A${agentId} DEPLOYED TO (${row + 1},${col + 1})`, "action");
                updateTutorial();

                if (agents.length === maxAgents) {
                    turn = 1;
                    logMessage("DEPLOYMENT COMPLETE - TURN 1", "turn");
                    clearPossibleHighlights();
                    updateTurnDisplay();
                    updateTutorial();
                    
                    // Stop deployment timer for this player
                    stopDeploymentTimer();
                    logMessage("YOUR DEPLOYMENT COMPLETE - WAITING FOR OTHERS", "action");
                    
                    // Update my status to playing
                    if (players.has(mySeat)) {
                        players.get(mySeat)!.status = 'playing';
                        updatePlayerCount();
                        updatePlayerBoard();
                    }
                    
		    if (board && interfacer) {
		        let deployment_data = board.allowedPlacementIndices.map((i: number) =>
                            (grid.children[i] as HTMLElement).children.length );
		        showDeploymentProgress();
		        interfacer.emit(IfEvents.Deploy, deployment_data);
		        board.addAgents({ agents: agents.map(e => [e.row, e.col]) });
		    }
                }
            }
        } else if (turn > 0 && actionMode) {
            const agentsInCell = agents.filter(a => a.row === row && a.col === col);
            if (agentsInCell.length > 0 && !selectedAgentCell) {
                selectedAgentCell = { row, col };
                cell.classList.add("selected");
                logMessage(`CELL (${row + 1},${col + 1}) SELECTED`);
                highlightPossibleCells(row, col);
                updateTutorial();
		reason = index;
            } else if (selectedAgentCell) {
                let actionSuccessful = false;
                if (actionMode === "move") {
                    actionSuccessful = moveAgent(row, col);
                    if (actionSuccessful) {
                        board.moveAgent([row,col], undefined, [col,row]);
                    }
                } else if (actionMode === "trap") {
                    actionSuccessful = deployTrap(row, col);
                    if (actionSuccessful) {
                        board.setTrap([row,col]);
                    }
                }
                
                if (actionSuccessful) {
                    targeted = index;
                    showActionProgress(actionMode!);
                    interfacer.emit(IfEvents.Action, { reason, target: targeted, trap: actionMode === "trap" });
                    mustAct = false;
                    stopTurnTimer(); // Stop the timer when action is taken
                    document.body.classList.remove('active-turn'); // Remove active turn visual
                    updateActivePlayer();
                    
                    // Log the MPC operations that will happen
                    const aliveCount = Array.from(players.values()).filter(p => p.status !== 'eliminated').length;
                    logMessage(`BROADCASTING action to ${aliveCount - 1} players`, "action");
                }
                resetActionMode();
                updateTutorial();
                updateButtonStates();
            }
        } else if (turn > 0 && !actionMode) {
            showError("SELECT MOVE OR TRAP FIRST");
        }
    });

    function highlightPossibleCells(row: number, col: number): void {
        clearPossibleHighlights();
        const directions = [
            { r: -1, c: 0 }, // up
            { r: 1, c: 0 },  // down
            { r: 0, c: -1 }, // left
            { r: 0, c: 1 }   // right
        ];

        directions.forEach(dir => {
            const newRow = row + dir.r;
            const newCol = col + dir.c;

            if (newRow >= 0 && newRow < 4 && newCol >= 0 && newCol < 4) {
                const index = newRow * 4 + newCol;
                const cell = grid.children[index] as HTMLElement;
                cell.classList.add("possible");
            }
        });
    }

    function clearPossibleHighlights(): void {
        const cells = document.querySelectorAll(".cell.possible");
        cells.forEach(cell => cell.classList.remove("possible"));
    }

    function resetActionMode(): void {
        actionMode = null;
        selectedAgentCell = null;
        moveBtn.classList.remove("active");
        trapBtn.classList.remove("active");
        clearPossibleHighlights();
        document.querySelectorAll(".cell.selected").forEach(cell => {
            cell.classList.remove("selected");
        });
    }

    function moveAgent(newRow: number, newCol: number): boolean {
        const { row: oldRow, col: oldCol } = selectedAgentCell!;
        
        // Check if trying to move to the same cell
        if (newRow === oldRow && newCol === oldCol) {
            showError("CANNOT MOVE TO SAME CELL");
            return false;
        }
        
        const rowDiff = Math.abs(newRow - oldRow);
        const colDiff = Math.abs(newCol - oldCol);
        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
            const agentToMove = agents.find(a => a.row === oldRow && a.col === oldCol);
            if (agentToMove) {
                const oldCell = grid.children[oldRow * 4 + oldCol] as HTMLElement;
                const newCell = grid.children[newRow * 4 + newCol] as HTMLElement;
                const agentElement = oldCell.querySelector(".agent") as HTMLElement;
                newCell.appendChild(agentElement);
                agentToMove.row = newRow;
                agentToMove.col = newCol;
                logMessage(`AGENT A${agentToMove.id} MOVED TO (${newRow + 1},${newCol + 1})`, "action");
                addVisualFeedback(newRow * 4 + newCol, "highlight-move");
                return true;
            }
        }
        return false;
    }

    function deployTrap(newRow: number, newCol: number): boolean {
        const { row: oldRow, col: oldCol } = selectedAgentCell!;
        
        // Check if trying to deploy trap on the same cell
        if (newRow === oldRow && newCol === oldCol) {
            showError("CANNOT DEPLOY TRAP ON YOUR POSITION");
            return false;
        }
        
        const rowDiff = Math.abs(newRow - oldRow);
        const colDiff = Math.abs(newCol - oldCol);
        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
            const newCell = grid.children[newRow * 4 + newCol] as HTMLElement;
            const trap = document.createElement("div");
            trap.className = "trap";
            trap.textContent = "💣";
            newCell.appendChild(trap);
            logMessage(`TRAP DEPLOYED TO (${newRow + 1},${newCol + 1})`, "action");
            addVisualFeedback(newRow * 4 + newCol, "highlight-move");
            return true;
        }
        return false;
    }

    function endTurn(): void {
        if (selectedAgentCell) {
            const { row, col } = selectedAgentCell;
            const oldCell = grid.children[row * 4 + col] as HTMLElement;
            oldCell.classList.remove("selected");
            selectedAgentCell = null;
        }
        clearPossibleHighlights();
        actionMode = null;
        moveBtn.classList.remove("active");
        trapBtn.classList.remove("active");
        updateTutorial();
    }

    function logMessage(message: string, type: string = ""): void {
        const p = document.createElement("p");
        p.textContent = `> ${message}`;
        if (type) {
            p.className = type;
        }
        log.appendChild(p);
        log.scrollTop = log.scrollHeight;
    }

    function showError(message: string): void {
        errorMessage.textContent = message;
        errorMessage.style.display = "block";
        errorMessage.classList.add("active");
        setTimeout(() => {
            errorMessage.style.display = "none";
            errorMessage.classList.remove("active");
        }, 2000);
    }

    function updateTurnDisplay(): void {
        turnNumberDisplay.textContent = turn.toString();
    }

    function updateActivePlayer(): void {
        // Update game phase display
        if (turn === 0) {
            updateGamePhase("DEPLOYMENT");
        } else if (!mustAct) {
            updateGamePhase("WAITING");
        } else {
            updateGamePhase("YOUR TURN");
        }
    }
    
    function updateGamePhase(phase: string): void {
        gamePhaseDisplay.textContent = phase;
    }
    
    function updatePlayerCount(): void {
        // Count alive players
        let aliveCount = 0;
        
        // If no players tracked yet but game is starting, assume 4 players
        if (players.size === 0 && turn === 0) {
            aliveCount = 0; // Show 0 until players actually join
        } else {
            players.forEach(player => {
                if (player.status !== 'eliminated') {
                    aliveCount++;
                }
            });
        }
        
        playerCount = aliveCount;
        playerCountDisplay.textContent = aliveCount.toString();
    }
    
    function updatePlayerBoard(): void {
        playerList.innerHTML = '';
        
        for (let i = 0; i < 4; i++) {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';
            
            if (i === mySeat) {
                playerCard.classList.add('you');
            }
            
            const isConnected = players.has(i);
            
            if (isConnected) {
                const playerData = players.get(i)!;
                if (playerData.status === 'eliminated') {
                    playerCard.classList.add('eliminated');
                }
                if (mustAct && i === mySeat) {
                    playerCard.classList.add('active');
                }
            }
            
            const playerInfo = document.createElement('div');
            playerInfo.className = 'player-info';
            
            const playerName = document.createElement('div');
            playerName.className = `player-name player-${playerColors[i]}`;
            
            if (isConnected) {
                const playerData = players.get(i)!;
                playerName.textContent = playerData.name.toUpperCase();
            } else {
                // Show loading for unconnected players
                playerName.innerHTML = `PLAYER ${i + 1} <span class="player-loading"></span>`;
            }
            
            const playerStatus = document.createElement('div');
            playerStatus.className = 'player-status';
            let statusText = 'WAITING...';
            
            if (isConnected) {
                const status = players.get(i)!.status;
                if (status === 'connected') statusText = 'READY';
                else if (status === 'playing') statusText = 'PLAYING';
                else if (status === 'eliminated') statusText = 'ELIMINATED';
            } else {
                statusText = 'CONNECTING...';
            }
            playerStatus.textContent = statusText;
            
            playerInfo.appendChild(playerName);
            playerInfo.appendChild(playerStatus);
            
            const agentCount = document.createElement('div');
            agentCount.className = 'agent-count';
            
            if (isConnected) {
                const agentData = players.get(i)!.agents;
                for (let j = 0; j < 4; j++) {
                    const agentIcon = document.createElement('div');
                    agentIcon.className = 'agent-icon';
                    if (j >= agentData) {
                        agentIcon.classList.add('dead');
                    }
                    agentIcon.textContent = 'A';
                    agentCount.appendChild(agentIcon);
                }
            } else {
                // Show empty agent slots for unconnected players
                for (let j = 0; j < 4; j++) {
                    const agentIcon = document.createElement('div');
                    agentIcon.className = 'agent-icon dead';
                    agentIcon.textContent = '?';
                    agentCount.appendChild(agentIcon);
                }
            }
            
            playerCard.appendChild(playerInfo);
            playerCard.appendChild(agentCount);
            playerList.appendChild(playerCard);
        }
    }

    function addVisualFeedback(cellIndex: number, type: string): void {
        const cell = grid.children[cellIndex] as HTMLElement;
        cell.classList.add(type);
        setTimeout(() => {
            cell.classList.remove(type);
        }, 500);
    }
    
    function markCell(cellIndex: number, markType: string): void {
        const cell = grid.children[cellIndex] as HTMLElement;
        cell.classList.add(markType);
        markedCells.add(cellIndex);
    }
    
    function clearMarkedCells(): void {
        markedCells.forEach(cellIndex => {
            const cell = grid.children[cellIndex] as HTMLElement;
            cell.classList.remove("collision-mark", "impact-mark");
        });
        markedCells.clear();
    }
    
    function checkIfPlayerDead(): void {
        // Check if player has no agents left
        if (agents.length === 0 && turn > 0) {
            // Show the player dead overlay
            playerDeadOverlay.style.display = 'flex';
        }
    }

    function updateTutorial(): void {
        // Tutorial is now handled by the modal system
        // This function is kept for compatibility but does nothing
    }
    
    function showProofProgress(): void {
        showProgress('Generating proof...', [
            { threshold: 0, message: 'Generating witnesses...' },
            { threshold: 30, message: 'Computing constraints...' },
            { threshold: 60, message: 'Finalizing proof...' }
        ]);
        logMessage("ZK/MPC: Generating zero-knowledge proof...", "action");
    }
    
    function showProgress(initialMessage: string, stages: Array<{threshold: number, message: string}>, duration: number = 3000): void {
        proofProgress.style.display = 'block';
        proofStatus.textContent = initialMessage;
        progressFill.style.width = '0%';
        
        let progress = 0;
        const increment = 100 / (duration / 300); // Progress per interval
        
        proofTimer = setInterval(() => {
            progress += increment + (Math.random() * 10);
            if (progress >= 100) {
                progress = 100;
                clearInterval(proofTimer);
                progressFill.style.width = '100%';
                proofStatus.textContent = stages[stages.length - 1].message.replace('...', '!');
                setTimeout(hideProofProgress, 1000);
            } else {
                progressFill.style.width = `${progress}%`;
                // Update status based on progress threshold
                for (let i = stages.length - 1; i >= 0; i--) {
                    if (progress >= stages[i].threshold) {
                        proofStatus.textContent = stages[i].message;
                        break;
                    }
                }
            }
        }, 300);
    }
    
    function hideProofProgress(): void {
        proofProgress.style.display = 'none';
        if (proofTimer) {
            clearInterval(proofTimer);
            proofTimer = null;
        }
    }
    
    function showMPCProgress(): void {
        // Get alive player count for progress tracking
        let aliveCount = 0;
        players.forEach(player => {
            if (player.status !== 'eliminated') {
                aliveCount++;
            }
        });
        
        showProgress('Waiting for other players...', [
            { threshold: 0, message: `Receiving queries from ${aliveCount - 1} players...` },
            { threshold: 25, message: 'Computing answers to queries...' },
            { threshold: 50, message: 'Generating cryptographic proofs...' },
            { threshold: 70, message: 'Broadcasting updates...' },
            { threshold: 90, message: 'Verifying all proofs...' },
            { threshold: 100, message: 'Turn complete!' }
        ], 8000); // Longer duration for MPC operations
        
        // Also log what's happening
        logMessage(`MPC ROUND: Processing ${aliveCount - 1} player queries`, "action");
    }
    
    function showDeploymentProgress(): void {
        showProgress('Deploying agents...', [
            { threshold: 0, message: 'Placing agents on board...' },
            { threshold: 30, message: 'Generating deployment proof...' },
            { threshold: 60, message: 'Computing initial state...' },
            { threshold: 90, message: 'Broadcasting to network...' },
            { threshold: 100, message: 'Deployment complete!' }
        ], 4000);
        logMessage("ZK/MPC: Generating deployment proof...", "action");
    }
    
    function showActionProgress(actionType: string): void {
        const actionName = actionType === 'trap' ? 'trap deployment' : 'movement';
        showProgress(`Processing ${actionName}...`, [
            { threshold: 0, message: `Validating ${actionName}...` },
            { threshold: 20, message: 'Computing state transition...' },
            { threshold: 40, message: 'Generating zero-knowledge proof...' },
            { threshold: 70, message: 'Encrypting action data...' },
            { threshold: 90, message: 'Broadcasting to players...' },
            { threshold: 100, message: 'Action confirmed!' }
        ], 5000);
        logMessage(`ZK/MPC: Generating ${actionName} proof...`, "action");
    }
    
    function startTurnTimer(): void {
        turnTimeRemaining = 30; // Reset timer to 30 seconds
        turnTimer.style.display = 'block';
        timerDisplay.textContent = turnTimeRemaining.toString();
        timerDisplay.classList.remove('warning');
        
        if (turnTimerInterval) {
            clearInterval(turnTimerInterval);
        }
        
        turnTimerInterval = setInterval(() => {
            turnTimeRemaining--;
            timerDisplay.textContent = turnTimeRemaining.toString();
            
            if (turnTimeRemaining <= 10) {
                timerDisplay.classList.add('warning');
            }
            
            if (turnTimeRemaining <= 0) {
                clearInterval(turnTimerInterval);
                turnTimerInterval = null;
                logMessage("TIME'S UP! EVERYONE DIES!", "elimination");
            }
        }, 1000);
    }
    
    function stopTurnTimer(): void {
        turnTimer.style.display = 'none';
        if (turnTimerInterval) {
            clearInterval(turnTimerInterval);
            turnTimerInterval = null;
        }
    }
    
    function startDeploymentTimer(timeLimit: number): void {
        deploymentTimeRemaining = timeLimit;
        turnTimer.style.display = 'block';
        timerDisplay.textContent = deploymentTimeRemaining.toString();
        timerDisplay.classList.remove('warning');
        
        // Update the timer label for deployment phase
        const timerLabel = document.querySelector('.timer-label') as HTMLDivElement;
        if (timerLabel) {
            timerLabel.textContent = 'DEPLOYMENT TIME';
        }
        
        if (deploymentTimerInterval) {
            clearInterval(deploymentTimerInterval);
        }
        
        deploymentTimerInterval = setInterval(() => {
            deploymentTimeRemaining--;
            timerDisplay.textContent = deploymentTimeRemaining.toString();
            
            if (deploymentTimeRemaining <= 10) {
                timerDisplay.classList.add('warning');
            }
            
            if (deploymentTimeRemaining <= 0) {
                clearInterval(deploymentTimerInterval);
                deploymentTimerInterval = null;
                stopDeploymentTimer();
                logMessage("DEPLOYMENT TIME UP!", "elimination");
            }
        }, 1000);
    }
    
    function stopDeploymentTimer(): void {
        turnTimer.style.display = 'none';
        if (deploymentTimerInterval) {
            clearInterval(deploymentTimerInterval);
            deploymentTimerInterval = null;
        }
        // Reset the timer label
        const timerLabel = document.querySelector('.timer-label') as HTMLDivElement;
        if (timerLabel) {
            timerLabel.textContent = 'TIME REMAINING';
        }
    }
    
    function showGameOver(winnerId: string, leaderboard: any[]): void {
        gameOverOverlay.style.display = 'flex';
        currentGameId = null;
        
        // Debug logging
        console.log("Game Over - Winner ID:", winnerId);
        console.log("Game Over - My Seat:", mySeat);
        console.log("Game Over - Leaderboard:", leaderboard);
        
        // The winner is the first player in the leaderboard
        const winnerEntry = leaderboard[0];
        let isWinner = false;
        let myRank = -1;
        
        // Find my position in the leaderboard
        leaderboard.forEach((player, index) => {
            // Since all players have the same name "gordo-web", we need a different way to identify ourselves
            // We'll check if this is the winner and if the winnerId matches
            if (index === 0 && winnerId === player.pid) {
                // This is the winner entry
                // Now check if I'm the winner by comparing with my connection
                // We need to match based on the game context
                if (mySeat !== -1) {
                    // Try to determine if this winner is me
                    // Since we can't reliably match by name, we'll check the winner event
                    isWinner = true; // We'll rely on the server to tell us who won
                }
            }
            // For now, we'll assume the first alive player in our local tracking is us
            // This is a temporary fix until we have proper player ID tracking
        });
        
        // More reliable approach: check if I have any agents left
        // If I have agents and the game ended, I'm likely the winner
        if (agents.length > 0 && turn > 0) {
            isWinner = true;
            myRank = 1;
        } else {
            // Find my rank based on when I was eliminated
            isWinner = false;
            // If I'm dead, find my position in the leaderboard
            leaderboard.forEach((player, index) => {
                if (player.name === myUsername) {
                    // Found my entry in the leaderboard
                    if (agents.length === 0) {
                        myRank = index + 1;
                    }
                }
            });
        }
        
        let content = '<div class="game-over-text ' + (isWinner ? 'victory' : 'defeat') + '">';
        content += isWinner ? 'VICTORY!' : 'DEFEAT';
        content += '</div>';
        
        if (myRank > 0) {
            content += '<div class="ranking">You finished #' + myRank + '</div>';
        }
        
        content += '<div class="leaderboard">';
        content += '<h3>FINAL RANKINGS</h3>';
        
        leaderboard.forEach((player, index) => {
            const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
            // Check if this is me based on username match
            const isMe = player.name === myUsername;
            content += '<div class="leaderboard-entry ' + rankClass + (isMe ? ' you' : '') + '">';
            content += '<div class="leaderboard-rank">#' + (index + 1) + '</div>';
            content += '<div class="leaderboard-player">' + (player.name || 'Unknown Player') + '</div>';
            content += '<div class="leaderboard-status">' + (index === 0 ? 'WINNER' : 'ELIMINATED') + '</div>';
            content += '</div>';
        });
        
        content += '</div>';
        content += '<button class="play-again-btn" onclick="location.reload()">PLAY AGAIN</button>';
        
        gameOverContent.innerHTML = content;
    }


});
