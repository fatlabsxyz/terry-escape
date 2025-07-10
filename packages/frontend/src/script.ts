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
document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("grid") as HTMLDivElement;
    const log = document.getElementById("log") as HTMLDivElement;
    const moveBtn = document.getElementById("move-btn") as HTMLButtonElement;
    const trapBtn = document.getElementById("trap-btn") as HTMLButtonElement;
    const joinBtn = document.getElementById("join-btn") as HTMLButtonElement;
    const joinPaywall = document.getElementById("join-paywall") as HTMLDivElement;
    const errorMessage = document.getElementById("error-message") as HTMLDivElement;
    
    // New UI elements
    const playerCountDisplay = document.getElementById("player-count") as HTMLSpanElement;
    const turnNumberDisplay = document.getElementById("turn-number") as HTMLSpanElement;
    const gamePhaseDisplay = document.getElementById("game-phase") as HTMLSpanElement;
    const playerIdentityDisplay = document.getElementById("player-identity") as HTMLSpanElement;
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
    logMessage("GAME STARTED");
    
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

    joinBtn.addEventListener("click", async () => {
       interfacer = Interfacer.getInstance();
       joinPaywall.style.display = "none";
       
       // Try to start music on join
       if (!musicPlaying) {
           bgMusic.play().then(() => {
               musicPlaying = true;
               musicToggle.classList.remove("muted");
           }).catch(err => {
               console.log("Auto-play failed:", err);
           });
       }

       interfacer.on(IfEvents.Connect, event => {
           board = new Board(event.seat);
           mySeat = event.seat;
           board.allowedPlacementIndices.forEach(index => {
               (grid.children[index] as HTMLElement).classList.add("possible");
	   });
           // Update player identity display
           playerIdentityDisplay.textContent = `PLAYER ${event.seat + 1}`;
           playerIdentityDisplay.className = `status-value player-${playerColors[event.seat]}`;
           
           // Mark myself as connected
           players.set(mySeat, {
               name: `Player ${mySeat + 1}`,
               agents: 4,
               status: 'connected'
           });
           updatePlayerBoard();
       });

       interfacer.on(IfEvents.Turn, event => {
           turn = event.round;
	   mustAct = event.active;
           logMessage(`TURN ${turn}`, "turn");
           updateTurnDisplay();
           updateActivePlayer();
	   updateTutorial();
           updateButtonStates();
           
           // Clear marked cells from previous turn
           clearMarkedCells();
           
           // Update player statuses from round data
           if (event.round && typeof event.round === 'object') {
               Object.entries(event.round).forEach(([playerId, isEliminated]) => {
                   const seat = parseInt(playerId);
                   if (!players.has(seat)) {
                       players.set(seat, {
                           name: `Player ${seat + 1}`,
                           agents: 4,
                           status: 'connected'
                       });
                   }
                   // Update status based on turn > 0
                   if (turn > 0 && !isEliminated) {
                       players.get(seat)!.status = 'playing';
                   }
                   if (isEliminated) {
                       players.get(seat)!.status = 'eliminated';
                       players.get(seat)!.agents = 0;
                       // Check if it's me who was eliminated
                       if (seat === mySeat) {
                           agents = []; // Clear my agents
                           checkIfPlayerDead();
                       }
                   }
               });
               updatePlayerCount(Object.keys(event.round).length);
               updatePlayerBoard();
           }
       });

       interfacer.on(IfEvents.Collision, event => {
           if (event) {
               let where = Number(event);
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
	   logMessage(`ACTION COMPLETED`, "action");
	   if (event) {
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
       
       // Add Winner event handler
       interfacer.on(IfEvents.Winner, event => {
           if (event && event.winner !== undefined && event.leaderboard) {
               console.log("Game Over Event:", event);
               showGameOver(event.winner, event.leaderboard);
           }
       });

       document.getElementById("join-paywall")!.remove();

try {
    const token = getCookie("auth");
    const url = "http://0.0.0.0:2448";

    if (token != null) {
        connect(token, url, "0");
    } else {
        const newToken = await getNewToken("gordo-web", url);
        if (newToken) {
            setCookie("auth", newToken);
            await connect(newToken, url, "0");
        } else {
            console.error("Could not get new auth token")
        }
    }

} catch (e) {
    console.error("Client failed to initialize");
}
    });

    moveBtn.addEventListener("click", () => {
        if (turn > 0 && mustAct && !actionMode) {
            selectMoveMode();
        }
    });

    trapBtn.addEventListener("click", () => {
        if (turn > 0 && mustAct && !actionMode) {
            selectTrapMode();
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
        moveBtn.disabled = !mustAct || actionMode !== null;
        trapBtn.disabled = !mustAct || actionMode !== null;
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
                    
                    // Update my status to playing
                    if (players.has(mySeat)) {
                        players.get(mySeat)!.status = 'playing';
                        updatePlayerBoard();
                    }
                    
		    if (board && interfacer) {
		        let deployment_data = board.allowedPlacementIndices.map((i: number) =>
                            (grid.children[i] as HTMLElement).children.length );
		        showProofProgress();
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
                if (actionMode === "move") {
                    moveAgent(row, col);
		    board.moveAgent([row,col], undefined, [col,row]);
                } else if (actionMode === "trap") {
                    deployTrap(row, col);
		    board.setTrap([row,col]);
                }
		targeted = index;
	        showProofProgress();
	        interfacer.emit(IfEvents.Action, { reason, target: targeted, trap: actionMode === "trap" });
	        mustAct = false;
                resetActionMode();
        	updateTutorial();
                updateActivePlayer();
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

    function moveAgent(newRow: number, newCol: number): void {
        const { row: oldRow, col: oldCol } = selectedAgentCell!;
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
            }
        }
    }

    function deployTrap(newRow: number, newCol: number): void {
        const { row: oldRow, col: oldCol } = selectedAgentCell!;
        const rowDiff = Math.abs(newRow - oldRow);
        const colDiff = Math.abs(newCol - oldCol);
        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
            const newCell = grid.children[newRow * 4 + newCol] as HTMLElement;
            const trap = document.createElement("div");
            trap.className = "trap";
            trap.textContent = "💣";
            newCell.appendChild(trap);
            logMessage(`TRAP DEPLOYED TO (${newRow + 1},${newCol + 1})`, "trap");
            addVisualFeedback(newRow * 4 + newCol, "highlight-move");
        }
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
    
    function updatePlayerCount(count: number): void {
        playerCount = count;
        playerCountDisplay.textContent = `${count}/4`;
    }
    
    function updatePlayerBoard(): void {
        playerList.innerHTML = '';
        
        for (let i = 0; i < 4; i++) {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';
            
            if (i === mySeat) {
                playerCard.classList.add('you');
            }
            
            if (players.has(i)) {
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
            playerName.textContent = `PLAYER ${i + 1}`;
            
            const playerStatus = document.createElement('div');
            playerStatus.className = 'player-status';
            let statusText = 'NOT CONNECTED';
            if (players.has(i)) {
                const status = players.get(i)!.status;
                if (status === 'connected') statusText = 'CONNECTED';
                else if (status === 'playing') statusText = 'PLAYING';
                else if (status === 'eliminated') statusText = 'ELIMINATED';
            }
            playerStatus.textContent = statusText;
            
            playerInfo.appendChild(playerName);
            playerInfo.appendChild(playerStatus);
            
            const agentCount = document.createElement('div');
            agentCount.className = 'agent-count';
            
            if (players.has(i)) {
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
        proofProgress.style.display = 'block';
        proofStatus.textContent = 'Initializing...';
        progressFill.style.width = '0%';
        
        // Simulate proof generation progress
        let progress = 0;
        proofTimer = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
                progress = 100;
                clearInterval(proofTimer);
                proofStatus.textContent = 'Proof generated!';
                setTimeout(hideProofProgress, 1000);
            } else {
                progressFill.style.width = `${progress}%`;
                if (progress < 30) {
                    proofStatus.textContent = 'Generating witnesses...';
                } else if (progress < 60) {
                    proofStatus.textContent = 'Computing constraints...';
                } else {
                    proofStatus.textContent = 'Finalizing proof...';
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
    
    function showGameOver(winnerId: string, leaderboard: any[]): void {
        gameOverOverlay.style.display = 'flex';
        
        // Find my player ID by looking in the leaderboard
        let myPlayerId: string | null = null;
        let myRank = -1;
        let amWinner = false;
        
        // Search for my entry in the leaderboard
        leaderboard.forEach((player, index) => {
            // Check if this player's name matches my seat
            if (player.name && player.name.includes(`Player ${mySeat + 1}`) || 
                (players.has(mySeat) && player.name === players.get(mySeat)!.name)) {
                myPlayerId = player.pid;
                myRank = index + 1;
                // Check if I'm the winner (first in leaderboard)
                if (index === 0) {
                    amWinner = true;
                }
            }
        });
        
        // Also check if winnerId matches myPlayerId
        const isWinner = amWinner || (myPlayerId && winnerId === myPlayerId);
        
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
            const isMe = player.pid === myPlayerId;
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
