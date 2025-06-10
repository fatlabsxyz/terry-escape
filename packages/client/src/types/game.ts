import {ProofData, Collision} from 'zklib/types';
import { GameMsg } from './gameMessages.js';

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
export type Locations = [number, number, number, number];

export type IJ = [number, number];

// Represents the agent placements allowed game's board in the UI.
export type AllowedPlacements = [IJ, IJ, IJ, IJ];

// The absolute coordinate of an agent on the board
export type Agent = IJ;

// List of agent placements on the board
export type Placements = {
  agents: Agent[];
};

export type PlayerSeat = 0|1|2|3; 

// location of an agent in the board
export type AgentLocation = 0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15;

export type BoardLocation = Map<PlayerSeat, AgentLocation>

export type RetrieveMessage = {
  turn: number
  event: `${GameMsg}`
}

/// -- --- --- Storage --- --- -- ///

export type PlayerId = string;
export type SocketId = string;
export type Name = string;

export enum Err {
  NOTFOUND = "not_found",
  EXISTING = "already_exists",
  DISREGARDED = "update_diregarded",
}

export type PlayerProps = {
  id: PlayerId;                   // unique id
  sid: SocketId;                  // changes each session
  name: Name;                     // just the player name
  seat: undefined | PlayerSeat;  // changes each game
};

export type StoredPlayers = Map<PlayerId, PlayerProps>;


/// -- --- --- Game --- --- -- ///

export interface JwtPayload {
  id: string;
  name: string;
}

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
}

export type SetupData = Map<Player, ProofData>; 

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
};

export type TurnAction = {
  reason: number; // Origin coordinates 
  target: number; // Target coordinates
  trap: boolean; // To trap or not to trap
};
