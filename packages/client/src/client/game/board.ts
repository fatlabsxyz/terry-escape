import { Agent, AllowedPlacements, Coordinates, Placements } from "../../types/game.js";

//TODO change to tuple type = [number, number]
type CoordinatePoint = [number, number];

export class Board {

  playerIndex: number;

  constructor (playerIndex: number) {
    this.playerIndex = playerIndex;
  }

  // Convert agent placements (4x4 matrix) into a list of agent coordinates (2x2 matrix).
  //
  // Example:
  // player of index 0
  // receive agent in 0,1 > [1,0,0,0]
  // receive agent in 0,3 > [1,1,0,0]
  // receive agent in 2,3 > [1,1,0,1]
  // receive agent in 0,3 > [1,2,0,1]
  addAgents(placements: Placements): Coordinates {

    let coordinates: Coordinates = [ 0, 0, 0, 0 ];

    placements.agents.forEach( (agent) => {
      const index = this.placementToIndex(agent);
      coordinates[index] += 1;
    });

    // return in which of the allowed coordinates the agent is placed
    return [ coordinates[0], coordinates[1], coordinates[2], coordinates[3] ];
  }

  // Placement to index takes an agent's absolute coordinates on the board,
  // and converts them into an index on their array of allowed positions.
  //
  // Example:
  // agentCoordinates = [0, 1];
  //
  // Agent allowed positions:
  // [ ][0][ ][1]
  // [ ][ ][ ][ ]
  // [ ][2][ ][3]
  // [ ][ ][ ][ ]
  //
  // [ (0,1), (0,3), (2,1), (2,3) ]
  //     0      1      2      3    
  //
  // Therefore the returned index is:
  // index = 0;
  //
  // This is then added in the array of coordinates:
  // coordinates[index] + 1;
  // coordinates: [1, 0, 0, 0];
  private placementToIndex(agent: Agent): 0 | 1 | 2 | 3 {
  
    const p = this.allowedPlacements(); // p stands for placements
    
    // I'm so sorry for making this switch
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

    const allowedCols: CoordinatePoint = ( index % 2 === 0 ) ? [0, 2] : [1,3]; 
    const allowedRows: CoordinatePoint = ( index < 2 ) ? [0,2] : [1,3];
    
    return {
      a: {row: allowedRows[0], col: allowedCols[0]},
      b: {row: allowedRows[0], col: allowedCols[1]},
      c: {row: allowedRows[1], col: allowedCols[0]},
      d: {row: allowedRows[1], col: allowedCols[1]},
    };
  }

  
}
