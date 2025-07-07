import { Action, BigNum, Collision, Field, IZkLib, ProofData, Public_Key, Secret_Key, State } from 'zklib/types';
export class ZkLibMock implements IZkLib {
  round: number;
  own_seat: number;
  own_state!: State;
  all_states!: string[];
  secret_key: BigNum;
  public_keys: Public_Key[];
  temp_proofs: { queries?: ProofData[]; answers?: ProofData[]; };
  temp_values: { veils?: boolean[]; action?: Action; action_salt?: Field; tiles_salt?: Field[]; veils_salt?: Field[]; };
  options: { mockProof: boolean; };
  _isSetup: boolean;
  
  constructor() {
    this._isSetup = false;
    this.round = 0;
    this.own_seat = 0;
    this.secret_key = [];
    this.public_keys = [];
    this.temp_proofs = {};
    this.temp_values = {};
    this.all_states = Array(4);
    this.options = { mockProof: false };
  }

  setup(id: number, sk: Secret_Key, pks: Public_Key[], options: { mockProof: boolean } = { mockProof: false }) {
    if (this._isSetup === false){
      return;
    }
    this._isSetup = true;
    this.own_seat = id;
    this.secret_key = sk;
    this.public_keys = pks;
    this.options = options;
  }

  async createDeploys(agents: number[]): Promise<{ proof: ProofData; }> {
	  return { proof: emptyProofData() };
  }
  async createQueries(mover: number): Promise<{ proof: ProofData[]; }> {
	  return { proof: Array.from(Array(17), emptyProofData) };
  }
  async createAnswers(queries: ProofData[][], action: Action): Promise<{ playerProofs: ProofData[]; }> {
	  return { playerProofs: Array.from(Array(3), emptyProofData) };
  }
  async createUpdates(answers: ProofData, mover: number): Promise<{ proof: ProofData; collision: Collision; died: boolean; }> {
	  return { proof: emptyProofData(), collision: null, died: false };
  }
  async createReports(reports: ProofData[]): Promise<{ proof: ProofData; impacted: boolean; died: boolean; }> {
	  return { proof: emptyProofData(), impacted: false, died: false };
  }

  verifyDeploys(deploys: ProofData[]): boolean { return true; }
  verifyForeign(queries: ProofData[][], answers: ProofData[], updates: ProofData[], reports: ProofData): boolean { return true; }
}

function emptyProofData() : ProofData { return { proof: new Uint8Array(), publicInputs: [] } }
