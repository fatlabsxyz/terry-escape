import { Action, BigNum, Collision, Field, IZkLib, ProofData, Public_Key, Secret_Key, State } from 'zklib/types';
export class ZklibMock implements IZkLib {
    round: number;
    own_seat: number;
    own_state!: State;
    all_states!: string[];
    secret_key: BigNum;
    public_keys: Public_Key[];
    temp_proofs: { queries?: ProofData[]; answers?: ProofData[]; };
    temp_values: { veils?: boolean[]; action?: Action; action_salt?: Field; tiles_salt?: Field[]; veils_salt?: Field[]; };
    options: { mockProof: boolean; };

  static newMock() : IZkLib {
    return new ZklibMock(0, [], []);
  }

  constructor(id: number, sk: Secret_Key, pks: Public_Key[], options: { mockProof: boolean } = { mockProof: false }) {
    this.round = 0;
    this.own_seat = id;
    this.secret_key = sk;
    this.public_keys = pks;
    this.temp_proofs = {};
    this.temp_values = {};
    this.all_states = Array(4);
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
    async createUpdates(answers: ProofData, mover: number): Promise<{ proof: ProofData; collision: Collision; }> {
	return { proof: emptyProofData(), collision: null };
    }
    async createReports(reports: ProofData[]): Promise<{ proof: ProofData; impacted: boolean; }> {
	return { proof: emptyProofData(), impacted: false };
    }

    verifyDeploys(deploys: ProofData[]): boolean { return true; }
    verifyForeign(queries: ProofData[][], answers: ProofData[], updates: ProofData[], reports: ProofData): boolean { return true; }
}

function emptyProofData() : ProofData { return { proof: new Uint8Array(), publicInputs: [] } }
