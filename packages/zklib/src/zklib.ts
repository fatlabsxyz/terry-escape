import { ProofData } from '@aztec/bb.js';
import { Action, Field, Public_Key, Secret_Key, State } from './types.js';
import { Collision, IZkLib } from './zklib.interface.js';
import { init_circuits, generate_proof, verify_proof, random_Field, random_bool, verification_failed_halt } from './utils.js';
const circuits = await init_circuits();

export class ZkLib implements IZkLib {
  round: number;
  own_seat: number;
  own_state!: State;
  all_states!: Field[];
  secret_key: Secret_Key;
  public_keys: Public_Key[];
  temp_proofs: { queries?: ProofData[], answers?: ProofData[] }
  temp_values: { veils?: boolean[], action?: Action, action_salt?: Field, tiles_salt?: Field[], veils_salt?: Field[] }
  options: { mockProof: boolean };
  _isSetup: boolean;
  
  constructor() {
    this._isSetup = false;
    this.round = 0;
    this.own_seat = 0;
    this.secret_key = [];
    this.public_keys = [];
    this.temp_proofs = {};
    this.temp_values = {};
    this.all_states = Array(4).fill(undefined);
    this.options = { mockProof: false };
  }

  setup(id: number, sk: Secret_Key, pks: Public_Key[], options: { mockProof: boolean } = { mockProof: false }) {
    if (this._isSetup === true){
      return;
    }
    this.own_seat = id;
    this.secret_key = sk;
    this.public_keys = pks;
    this.options = options;
    this._isSetup = true;
  }

  async createDeploys(agents: number[]): Promise<{ proof: ProofData; }> {
    const board_salt = random_Field();
    const inputs = { player: this.own_seat, agents, board_salt };
    const result = await generate_proof(circuits['initial_deploys'], inputs, this.options);
    this.own_state = { board_used: result.private_outputs.computed_board, board_salt }
    this.all_states[this.own_seat] = result.payload.publicInputs[1]!; // XXX
    return { proof: result.payload };
  };

  async createQueries(mover: number): Promise<{ proof: ProofData[]; }> {
    let proofs = [];
    if (this.own_state.board_used === undefined) {
      throw Error("Board state undefined");
    }
    const tiles = this.own_state.board_used.map(tile => (Number(tile) !== 1));
    this.temp_values.tiles_salt = Array.from(Array(16), random_Field);
    this.temp_values.veils = Array.from(Array(16), random_bool);
    this.temp_values.veils_salt = Array.from(Array(16), random_Field);

    if (this.public_keys[mover] === undefined) {
      throw Error("Public keys undefined");
    }
    const { params, key_set } = this.public_keys[mover];

    for (let tile_index = 0; tile_index < 16; tile_index++) {
      const inputs = {
        tile_used: tiles[tile_index],
        tile_salt: this.temp_values.tiles_salt[tile_index],
        veil_used: this.temp_values.veils[tile_index],
        veil_salt: this.temp_values.veils_salt[tile_index],
        selectors: compute_selectors(this.round, this.own_seat, tile_index),
        params,
        key_set,
        entropy: Array.from(Array(1290), random_bool)
      };
      const result = await generate_proof(circuits['offline_queries'], inputs, this.options);
      proofs.push(result.payload);
      console.log("Individual query computed", Number(new Date()));
    }
    const inputs = {
      board_used: this.own_state.board_used,
      board_salt: this.own_state.board_salt,
      tiles_salt: this.temp_values.tiles_salt,
      veil_digests: proofs.map(({ publicInputs }) => publicInputs.slice(-10, -9)[0])
    }
    const result = await generate_proof(circuits['combine_queries'], inputs, this.options);
    proofs.push(result.payload);
    return { proof: proofs };
  };

  async createAnswers(queries: ProofData[][], action: Action): Promise<{ playerProofs: ProofData[]; }> {
    let proofs = [];
    for (let player_index = 0; player_index < 2; player_index++) {

      if (player_index == this.own_seat) {
        queries.splice(player_index, 0, []);
        continue;
      }

      const ourKeys = this.public_keys[this.own_seat];
      if (ourKeys === undefined) {
        throw Error("Public keys not set for own_seat");
      }

      const playerQuery = queries[player_index];
      if (playerQuery === undefined) {
        throw Error("Player queries dont exist");
      }

      const inputs = {
        board_used: this.own_state.board_used,
        board_salt: this.own_state.board_salt,
        reason: action.reason,
        target: action.target,
        trap: action.trap,
        action_salt: random_Field(),
        params: ourKeys.params,
        decryption_key: this.secret_key,
        selectors: Array.from(Array(16), (_, i) => compute_selectors(this.round, player_index, i)),
        queries: playerQuery.slice(0, -1).map(({ publicInputs }) => publicInputs.slice(-9))
      };
      this.temp_values.action = action;
      this.temp_values.action_salt = inputs.action_salt;
      const result = await generate_proof(circuits['blinded_answers'], inputs, this.options);
      proofs.push(result.payload);
    }
    // (note: verify queries before publishing)
    return { playerProofs: proofs };
  };

  async createUpdates(answers: ProofData, mover: number): Promise<{ proof: ProofData; collision: Collision; }> {
    const responses = answers.publicInputs.slice(-32);
    const moverKeys = this.public_keys[mover]
    if (moverKeys === undefined) {
      throw Error("Mover keys undefined")
    }
    const { params, key_set } = moverKeys;
    const inputs = {
      board_used: this.own_state.board_used,
      old_board_salt: this.own_state.board_salt,
      new_board_salt: random_Field(),
      params,
      key_set,
      entropy: Array.from(Array(1290), random_bool),
      veils_used: this.temp_values.veils,
      veils_salt: this.temp_values.veils_salt,
      responses,
    };
    const result = await generate_proof(circuits['answers_updates'], inputs, this.options);
    this.own_state = { board_used: result.private_outputs.computed_board, board_salt: inputs.new_board_salt };
    // (note: verify answers before publishing)
    const collision = result.private_outputs.informed_detect === undefined ? null : result.private_outputs.informed_detect;
    return { proof: result.payload, collision}
  };

  async createReports(reports: ProofData[]): Promise<{ proof: ProofData; impacted: boolean; }> {
    const action = this.temp_values.action
    if (action === undefined) {
      throw Error("Action is undefiend")
    }
    const { reason, target, trap } = action;
    const keys = this.public_keys[this.own_seat];
    if (keys === undefined) {
      throw Error("Public keys undefined");
    }
    const { params } = keys;
    const inputs = {
      board_used: this.own_state.board_used,
      old_board_salt: this.own_state.board_salt,
      new_board_salt: random_Field(),
      reason, target, trap,
      action_salt: this.temp_values.action_salt,
      params,
      decryption_key: this.secret_key,
      hit_reports: reports.map(({ publicInputs }) => publicInputs.slice(-9))
    };
    const result = await generate_proof(circuits['reports_updates'], inputs, this.options);
    this.own_state = { board_used: result.private_outputs.computed_board, board_salt: inputs.new_board_salt };
    const informed_detect = result.private_outputs.informed_detect;
    const impacted = informed_detect !== undefined;
    // (note: verify reports before publishing)
    return { proof: result.payload, impacted }
  };

  verifyDeploys(deploys: ProofData[]) { return true };
  verifyForeign(queries: ProofData[][], answers: ProofData[], updates: ProofData[], reports: ProofData) { return true };
};

function compute_selectors(round: number, player: number, tile: number) {
  return [[0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0]];
}
