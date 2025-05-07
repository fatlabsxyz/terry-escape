import {ProofData, Collision} from 'zklib/types';

/// -- --- --- Board --- --- -- ///

// [0,1,2,3] Represents a list of amounts of agents assigned to each player's four available squares.
// 
// For example, player 1 has this 4 squares available:
// [ ][0][ ][1]
// [ ][ ][ ][ ]
// [ ][2][ ][3]
// [ ][ ][ ][ ]
//
// Each number shown in the matrix, is an index of the Coordinates array. 
// Each value in every index is the quantity of agents deployed in that square.
export type Coordinates = number[];

// Represents the agent placements allowed game's board in the UI.
// This depends on the player index, and it's constrained as such:
//   (i = player index)
//
//   i |  0  1  2  3 <- columns
//   --|-------------   
//   0 | [0][1][0][1]   
//   1 | [2][3][2][3]
//   2 | [0][1][0][1]  
//   3 | [2][3][2][3]
//   ^
//   | rows 
//
//   i=0 | a = {0,1} 
//   ...
export type AllowedPlacements = {
  a: Placement;
  b: Placement;
  c: Placement;
  d: Placement;
}

// A placement is a set of absolute board coordinates
export type Placement = {
  row: number;
  col: number;
}

// The absolute coordinate of an agent on the board
export type Agent = {
  row: number, 
  column: number
};

// List of agent placements on the board
export type Placements = {
  agents: Agent[];
};

/// -- --- --- Game --- --- -- ///

// Represents a socket-id
export type Player = string;

export type QueryData = {
  queries: ProofData[]; 
};
export type AnswerData = {
  proof: ProofData;
};
export type UpdatesData = {
  proof: ProofData;
  collision?: Collision;
};
export type ReportData = {
  proof: ProofData;
  impacted?: boolean;
};

export interface TurnInfo {
  turn: number;
  round: Player[];
  activePlayer: Player;
  nextPlayer: Player;
};

export interface TurnData {
  activePlayer: Player;
  action: TurnAction;
  queries: Map<Player, QueryData>;
  answers: Map<Player, AnswerData>;
  updates: Map<Player, UpdatesData>;
  report: ReportData | null;
}

export type TurnAction = {
  reason: number; // Origin coordinates 
  target: number; // Target coordinates
  trap: boolean; // To trap or not to trap
}
