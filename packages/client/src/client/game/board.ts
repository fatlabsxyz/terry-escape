import { Agent, AllowedPlacements, Placements, Locations, IJ} from "../../types/game.js";


export class Board {

  playerIndex: number;
  allowedPlacements: AllowedPlacements;
  allowedPlacementIndices: number[];
  // board: [number, number];

  constructor (playerIndex: number) {
    this.playerIndex = playerIndex;
    this.allowedPlacements = this.computeAllowedPlacements();
    this.allowedPlacementIndices = this.allowedPlacements.map(this.coordToIndex);
    // this.board: 
  }

  // Convert agent placements (4x4 matrix) into a list of agent coordinates (2x2 matrix).
  //
  // Example:
  // player of index 0
  // receive agent in 0,1 > [1,0,0,0]
  // receive agent in 0,3 > [1,1,0,0]
  // receive agent in 2,3 > [1,1,0,1]
  // receive agent in 0,3 > [1,2,0,1]
  addAgents(placements: Placements): Locations {

    let coordinates: Locations = [ 0, 0, 0, 0 ];
    
    placements.agents.forEach( (agent) => {
      const agentIndex = this.coordToIndex(agent);
      const location = this.allowedPlacementIndices.indexOf( agentIndex );
      coordinates[location]! += 1;
    });

    // return in which of the allowed coordinates the agent is placed
    return [ coordinates[0], coordinates[1], coordinates[2], coordinates[3] ];
  }

  // Placement to index takes an agent's absolute coordinates on the board,
  // and converts them into an index on their array of allowed positions.
  //
  // Example:
  // agentLocations = [0, 1];
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

  // Returns the allowed initial deploy placements for a player's agents
  // This depends on the player index, and it's constrained as such:
  //   (i = player index)
  //
  //   [i] |  0  1  2  3 <- columns
  //  -----|-------------   
  //    0  | [0][1][0][1]   
  //    1  | [2][3][2][3]
  //    2  | [0][1][0][1]  
  //    3  | [2][3][2][3]
  //    ^
  //    | rows 
  //
  //   i=0 | a = {0,1} 
  computeAllowedPlacements(): AllowedPlacements  {
    const index = this.playerIndex as 0 | 1 | 2 | 3; 
    
    const playerSeed = { 
      0: 0,
      1: 1,
      2: 4,
      3: 5
    };
    const seed = playerSeed[index];
    
    const playerLocIndices = [seed, seed + 2, seed + 8, seed + 10]; 
    
    const playerLocCoords = playerLocIndices.map( i => this.indexToCoord(i) );

    return playerLocCoords as AllowedPlacements;
  } 

  indexToCoord(index: number): IJ {
    return [Math.floor(index / 4), index % 4];
  }

  coordToIndex(coord: IJ): number {
    const [i,j] = coord;
    return 4 * i + j; 
  }
}
