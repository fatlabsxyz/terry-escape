import { ProofData } from '@aztec/bb.js';
import { Action, Field, Public_Key, Secret_Key, State } from './types.js';

export type Collision = number | null;

export interface IZkLib {
  round: number;
  own_seat: number;
  own_state: State;
  all_states: Field[];
  secret_key: Secret_Key;
  public_keys: Public_Key[];
  temp_proofs: { queries?: ProofData[], answers?: ProofData[] }
  temp_values: { veils?: boolean[], action?: Action, action_salt?: Field, tiles_salt?: Field[], veils_salt?: Field[] }
  options: { mockProof: boolean };
  _isSetup: boolean; 

  setup(id: number, sk: Secret_Key, pks: Public_Key[], options: { mockProof: boolean }): void;

  // new(id: number, sk: Secret_Key, pks: Public_Key[], options: { mockProof: boolean } = { mockProof: false });
  createDeploys(agents: number[]): Promise<{ proof: ProofData; }>;
  createQueries(mover: number): Promise<{ proof: ProofData[]; }>;
  createAnswers(queries: ProofData[][], action: Action): Promise<{ playerProofs: ProofData[]; }>;
  createUpdates(answers: ProofData, mover: number): Promise<{ proof: ProofData; collision: Collision; }>;
  createReports(reports: ProofData[]): Promise<{ proof: ProofData; impacted: boolean; }>;

  verifyDeploys(deploys: ProofData[]) : void;
  verifyForeign(queries: ProofData[][], answers: ProofData[], updates: ProofData[], reports: ProofData, mover: number, verify_isolated : boolean) : void;
};
