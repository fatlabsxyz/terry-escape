import {ProofData, Collision} from 'zklib/types';

export type Player = string;
export type QueryData = {
  queries: ProofData[]; 
};
export type AnswerData = {
  proofs: ProofData[];
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
