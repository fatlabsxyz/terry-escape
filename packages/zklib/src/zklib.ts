type Field = string;
type BigNum = Field[];
type Secret_Key = BigNum[];
type Public_Key = { key_set: BigNum[], params: any };
type State = { board_used: Field[], board_salt: Field }
type Proof = { proof: Uint8Array, public_inputs: string[] }
type Action = { reason: number, target: number, trap: boolean }

export class zklib {
	round: number;
	own_seat: number;
	own_state!: State;
	all_states!: Field[];
	secret_key: Secret_Key;
	public_keys: Public_Key[];
	temp_proofs: { queries?: Proof[], answers?: Proof[] }
	temp_values: { veils?: boolean[], action?: Action, action_salt?: Field, tiles_salt?: Field[], veils_salt?: Field[]}

	constructor(id: number, sk: Secret_Key, pks: Public_Key[]) {
		this.round = 0;
		this.own_seat = id;
		this.secret_key = sk;
		this.public_keys = pks;
		this.temp_proofs = {};
		this.temp_values = {};
	}

	createDeploys(agents: number[]) : { proof: Proof } {};
	createQueries(mover: number) : { proof: Proof[] } {};
	createAnswers(action: Action, queries: Proof[][]) : { proof: Proof[] } {};
	createUpdates(answers: Proof[]) : { proof: Proof, detected: number } {};
	createReports(reports: Proof[]) : { proof: Proof, impacted: boolean } {};
	
	verifyDeploys(deploys: Proof[]) : boolean {};
	verifyForeign(queries: Proof[][], answers: Proof[], updates: Proof[], reports: Proof) : boolean {};
};
