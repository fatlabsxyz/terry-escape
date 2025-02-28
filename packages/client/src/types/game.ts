export type Player = string;
export type QueryData = {};
export type AnswerData = {};
export type UpdatesData = {};
export type ReportData = {};

export interface TurnInfo {
  turn: number;
  players: Player[];  // Player[]
  activePlayer: Player; // Player := socket id
  nextPlayer: Player;
};

export interface TurnData {
  activePlayer: Player;
  queries: Map<Player, QueryData>;
  answers: Map<Player, AnswerData>;
  updates: Map<Player, UpdatesData>;
  report: ReportData | null;
}
