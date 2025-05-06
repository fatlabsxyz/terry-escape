import {ProofData} from '@aztec/bb.js';

export type Player = string;
export type QueryData = {
  queries: ProofData[]; 
};
export type AnswerData = {
  proofs: ProofData[];
};
export type UpdatesData = {
  proofs: ProofData[];
};
export type ReportData = {};

export interface TurnInfo {
  turn: number;
  round: Player[];  // Player[]
  activePlayer: Player; // Player := socket id
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
