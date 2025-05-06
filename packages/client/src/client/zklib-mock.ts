import { Action, BigNum, Field, IZklib, ProofData, Public_Key, State } from 'zklib/types';
export class ZklibMock implements IZklib {
    round: number;
    own_seat: number;
    own_state!: State;
    all_states!: string[];
    secret_key: BigNum;
    public_keys: Public_Key[];
    temp_proofs: { queries?: ProofData[]; answers?: ProofData[]; };
    temp_values: { veils?: boolean[]; action?: Action; action_salt?: Field; tiles_salt?: Field[]; veils_salt?: Field[]; };
    options: { mockProof: boolean; };

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


    createDeploys(agents: number[]): Promise<{ proof: ProofData; }> {
	return new Promise(r => r({ proof: emptyProofData() }));
    }
    createQueries(mover: number): Promise<{ proof: ProofData[]; }> {
	return new Promise(r => r({ proof: Array.from(Array(17), emptyProofData) }));
    }
    createAnswers(queries: ProofData[][], action: Action): Promise<{ proof: ProofData[]; }> {
	return new Promise(r => r({ proof: Array.from(Array(3), emptyProofData) }));
    }
    createUpdates(answers: ProofData, mover: number): Promise<{ proof: ProofData; detected?: number; }> {
	return new Promise(r => r({ proof: emptyProofData(), detected: 0 }));
    }
    createReports(reports: ProofData[]): Promise<{ proof: ProofData; impacted: Boolean; }> {
	return new Promise(r => r({ proof: emptyProofData(), impacted: false }));
    }

    verifyDeploys(deploys: ProofData[]): boolean {}
    verifyForeign(queries: ProofData[][], answers: ProofData[], updates: ProofData[], reports: ProofData): boolean {}
}

function emptyProofData() : ProofData { return { proof: new Uint8Array(), publicInputs: [] } }
