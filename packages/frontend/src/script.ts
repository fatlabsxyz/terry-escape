interface Agent {
    id: number;
    row: number;
    col: number;
}

type ActionMode = "move" | "trap" | null;

interface CellPosition {
    row: number;
    col: number;
}

// Main game logic
document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("grid") as HTMLDivElement;
    const log = document.getElementById("log") as HTMLDivElement;
    const moveBtn = document.getElementById("move-btn") as HTMLButtonElement;
    const trapBtn = document.getElementById("trap-btn") as HTMLButtonElement;
    const errorMessage = document.getElementById("error-message") as HTMLDivElement;
    const tutorial = document.getElementById("tutorial") as HTMLDivElement;

    let agents: Agent[] = [];
    let turn: number = 0;
    const maxAgents: number = 4;
    let selectedAgentCell: CellPosition | null = null;
    let actionMode: ActionMode = null;

    function initializeGrid(): void {
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.dataset.index = i.toString();
            grid.appendChild(cell);
        }
    }

    initializeGrid();
    updateTutorial();
    logMessage("GAME STARTED");

    moveBtn.addEventListener("click", () => {
        if (turn > 0) {
            actionMode = "move";
            moveBtn.classList.add("active");
            trapBtn.classList.remove("active");
            logMessage("MOVE SELECTED");
            updateTutorial();
        }
    });

    trapBtn.addEventListener("click", () => {
        if (turn > 0) {
            actionMode = "trap";
            trapBtn.classList.add("active");
            moveBtn.classList.remove("active");
            logMessage("TRAP SELECTED");
            updateTutorial();
        }
    });

    grid.addEventListener("click", (e: Event) => {
        const target = e.target as HTMLElement;
        const cell = target.className === "cell" ? target : target.closest(".cell") as HTMLElement;
        if (!cell) return;

        const index = parseInt(cell.dataset.index!);
        const row = Math.floor(index / 4);
        const col = index % 4;

        if (turn === 0) {
            if (agents.length < maxAgents) {
                const agent = document.createElement("div");
                agent.className = "agent";
                const agentId = agents.length + 1;
                agent.textContent = `A${agentId}`;
                cell.appendChild(agent);
                agents.push({ id: agentId, row, col });
                logMessage(`AGENT A${agentId} DEPLOYED TO (${row + 1},${col + 1})`);
                updateTutorial();

                if (agents.length === maxAgents) {
                    turn = 1;
                    logMessage("DEPLOYMENT COMPLETE - TURN 1");
                    updateTutorial();
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
            } else if (selectedAgentCell) {
                if (actionMode === "move") {
                    moveAgent(row, col);
                } else if (actionMode === "trap") {
                    deployTrap(row, col);
                }
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
                logMessage(`AGENT A${agentToMove.id} MOVED TO (${newRow + 1},${newCol + 1})`);
                endTurn();
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
            logMessage(`TRAP DEPLOYED TO (${newRow + 1},${newCol + 1})`);
            endTurn();
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
        turn++;
        logMessage(`TURN ${turn}`);
        updateTutorial();
    }

    function logMessage(message: string): void {
        const p = document.createElement("p");
        p.textContent = `> ${message}`;
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

    function updateTutorial(): void {
        if (turn === 0) {
            const remaining = maxAgents - agents.length;
            tutorial.textContent = `DEPLOY ${remaining} AGENTS BY CLICKING ANY CELL`;
        } else if (turn > 0) {
            if (!actionMode && !selectedAgentCell) {
                tutorial.textContent = "SELECT MOVE OR TRAP";
            } else if (actionMode === "move" && !selectedAgentCell) {
                tutorial.textContent = "CLICK AN AGENT CELL TO MOVE";
            } else if (actionMode === "move" && selectedAgentCell) {
                tutorial.textContent = "CLICK AN ADJACENT CELL TO MOVE";
            } else if (actionMode === "trap" && !selectedAgentCell) {
                tutorial.textContent = "CLICK AN AGENT CELL TO DEPLOY TRAP";
            } else if (actionMode === "trap" && selectedAgentCell) {
                tutorial.textContent = "CLICK AN ADJACENT CELL TO DEPLOY TRAP";
            }
        }
    }
});
