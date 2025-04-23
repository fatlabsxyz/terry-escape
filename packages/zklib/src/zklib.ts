import { init_circuits, generate_proof, verify_proof, random_Field, random_bool, verification_failed_halt } from './utils.js';
const circuits = await init_circuits();

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
	all_states: Field[];
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
		this.all_states = Array(4);
	}

	async createDeploys(agents: number[]) : { proof: Proof } {
	        const board_salt = random_Field();
	        const inputs = { player: this.own_seat, agents, board_salt };
		const result = await generate_proof(circuits['initial_deploys'], inputs);
		this.own_state = { board_used: result.private_outputs.computed_board, board_salt }
		this.all_states[this.own_seat] = result.payload.publicInputs[1];
		return { proof: result.payload };
	};
	
	async createQueries(mover: number) : { proof: Proof[] } {
		let proofs = [];
		const tiles = this.own_state.board_used.map(tile => (tile != 1));
		this.temp_values.tiles_salt = Array.from(Array(16), random_Field);
		this.temp_values.veils = Array.from(Array(16), random_bool);
		this.temp_values.veils_salt = Array.from(Array(16), random_Field);
		for (let tile_index = 0; tile_index < 16; tile_index++) {
			let inputs = {
				tile_used: tiles[tile_index],
				tile_salt: this.temp_values.tiles_salt[tile_index],
				veil_used: this.temp_values.veils[tile_index],
				veil_salt: this.temp_values.veils_salt[tile_index],
				selectors: compute_selectors(this.round, this.own_seat, tile_index),
				params: this.public_keys[mover].params,
				key_set: this.public_keys[mover].key_set,
				entropy: Array.from(Array(1289), random_bool)
			};
			const result = await generate_proof(circuits['offline_queries'], inputs);
			proofs.push(result.payload);
			postMessage("Individual query computed");
		}
		const inputs = {
			board_used: this.own_state.board_used,
			board_salt: this.own_state.board_salt,
			tiles_salt: this.temp_values.tiles_salt,
			veil_digests: proofs.map(({publicInputs}) => publicInputs.slice(-10,-9)[0])
		}
		const result = await generate_proof(circuits['combine_queries'], inputs);
		proofs.push(result.payload);
		return { proof: proofs };
	};

	async createAnswers(queries: Proof[][], action: Action) : { proof: Proof[] } {
		let proofs = [];
		for (let player_index = 0; player_index < 2; player_index++) {
			if (player_index == this.own_seat) { queries.splice(player_index, 0, {}); continue; }
			const inputs = {
				board_used: this.own_state.board_used,
				board_salt: this.own_state.board_salt,
				reason: action.reason,
				target: action.target,
				trap: action.trap,
				action_salt: random_Field(),
				params: this.public_keys[this.own_seat].params,
				decryption_key: this.secret_key,
				selectors: Array.from(Array(16), (_,i) => compute_selectors(this.round, player_index, i)),
				queries: queries[player_index].proof.slice(0,-1).map(proof => proof.publicInputs.slice(-9))
			};
			this.temp_values.action = action;
			this.temp_values.action_salt = inputs.action_salt;
			const result = await generate_proof(circuits['blinded_answers'], inputs);
			proofs.push(result.payload);
		}
		// (note: verify queries before publishing)
		return { proof: proofs };
	};

	async createUpdates(answers: Proof, mover: number) : { proof: Proof, detected: number } {
		const responses = answers.publicInputs.slice(-32);
		const inputs = {
			board_used: this.own_state.board_used,
			old_board_salt: this.own_state.board_salt,
			new_board_salt: random_Field(),
			params: this.public_keys[mover].params,
			key_set: this.public_keys[mover].key_set,
			entropy: Array.from(Array(1290), random_bool),
			veils_used: this.temp_values.veils,
			veils_salt: this.temp_values.veils_salt,
			responses,
		};
		const result = await generate_proof(circuits['answers_updates'], inputs);
		this.own_state = { board_used: result.private_outputs.computed_board, board_salt: inputs.new_board_salt };
		// (note: verify answers before publishing)
		return { proof: result.payload, detected: result.private_outputs.informed_detected }
	};

	async createReports(reports: Proof[]) : { proof: Proof, impacted: boolean } {
		const inputs = {
			board_used: this.own_state.board_used,
			old_board_salt: this.own_state.board_salt,
			new_board_salt: random_Field(),
			reason: this.temp_values.action.reason,
			target: this.temp_values.action.target,
			trap: this.temp_values.action.trap,
			action_salt: this.temp_values.action_salt,
			params: this.public_keys[this.own_seat].params,
			decryption_key: this.secret_key,
			hit_reports: reports.map(({publicInputs}) => publicInputs.slice(-9))
		};
		const result = await generate_proof(circuits['reports_updates'], inputs);
		this.own_state = { board_used: result.private_outputs.computed_board, board_salt: inputs.new_board_salt };
		// (note: verify reports before publishing)
		return { proof: result.payload, impacted: result.private_outputs.informed_detect }
	};
	
	verifyDeploys(deploys: Proof[]) {};
	verifyForeign(queries: Proof[][], answers: Proof[], updates: Proof[], reports: Proof) : boolean {};
};

function compute_selectors(round, player, tile) {
	return [[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0]];
}
