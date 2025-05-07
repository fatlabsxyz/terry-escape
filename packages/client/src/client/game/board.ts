import { Agent, AllowedPlacements, Coordinates, Placements } from "../../types/game.js";

// Ts hates arrays and he's right
type TwoNumberArray = {
    f: number; //first number
    s: number; //second number
};

// CoordinatesMap is just a type to get around ts's asenine limitation 
// to access predefined arrays via known existing indexes for some reason
type Square = number;
type AgentCount = number;
type CoordinatesMap = Map<Square, AgentCount>;

export class Board {

  playerIndex: number;

  constructor (playerIndex: number) {
    this.playerIndex = playerIndex;
  }


  // Convert agent placements (4x4 matrix) into agent coordinates (2x2 matrix).
  //
  // Example:
  // player of index 0
  // receive agent in 0,1 > [1,0,0,0]
  // receive agent in 0,3 > [1,1,0,0]
  // receive agent in 2,3 > [1,1,0,1]
  // receive agent in 0,3 > [1,2,0,1]
  addAgents(placements: Placements): Coordinates {

    let coordinates: CoordinatesMap = new Map<number, number>([
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0]
    ]);

    placements.agents.forEach( (agent) => {
      const index = this.placementToIndex(agent);
      coordinates.set(index, (coordinates.get(index) || 0) + 1);
    });

    // return in which of the allowed coordinates the agent is placed
    return [coordinates.get(0)!, coordinates.get(1)!, coordinates.get(2)!, coordinates.get(3)!];

  }

  // I'm so sorry for this
  private placementToIndex(agent: Agent): 0 | 1 | 2 | 3 {
  
    const p = this.allowedPlacements(); // p stands for placements
    
    switch (`${agent.row},${agent.column}`) {
        case `${p.a.row},${p.a.col}`: return 0;
        case `${p.b.row},${p.b.col}`: return 1;
        case `${p.c.row},${p.c.col}`: return 2;
        case `${p.d.row},${p.d.col}`: return 3;
        default: throw new Error("Invalid coordinates");
    }
  }

  // Returns the allowed initial deploy placements for a player's agents 
  allowedPlacements(): AllowedPlacements  {
    const index = this.playerIndex; 

    const allowedCols: TwoNumberArray = ( index % 2 === 0 ) ? {f: 0, s:2} : {f:1, s:3}; 
    const allowedRows: TwoNumberArray = ( index < 2 ) ? {f:0, s:2} : {f:1, s:3};
    
    return {
      a: {row: allowedRows.f, col: allowedCols.f},
      b: {row: allowedRows.f, col: allowedCols.s},
      c: {row: allowedRows.s, col: allowedCols.f},
      d: {row: allowedRows.s, col: allowedCols.s},
    };
  }

  
}
