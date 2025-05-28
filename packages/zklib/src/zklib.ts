import crypto from 'crypto';
import { ProofData } from '@aztec/bb.js';
import { Action, Field, Public_Key, Secret_Key, State } from './types.js';
import { Collision, IZkLib } from './zklib.interface.js';
import { init_circuits, generate_proof, verify_proof, random_Field, random_bool, verification_failed_halt, bits, encrypt } from './utils.js';
const circuits = await init_circuits();
import { writeFileSync } from 'fs';


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
  readonly NUMBER_OF_PLAYERS: number = 4;
  
  constructor() {
    this._isSetup = false;
    this.round = 0;
    this.own_seat = 0;
    this.secret_key = [];
    this.public_keys = [];
    this.temp_proofs = {};
    this.temp_values = {};
    this.all_states = Array(this.NUMBER_OF_PLAYERS).fill(undefined);
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
        selectors: await this.compute_selectors(this.round, this.own_seat, tile_index),
	params,
        key_set,
        entropy: Array.from(Array(1289), random_bool)
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
    for (let player_index = 0; player_index < this.NUMBER_OF_PLAYERS - 1; player_index++) {

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

      let selectors = Array.from(Array(16), async (_, i) => await this.compute_selectors(this.round, player_index, i));
      const inputs = {
        board_used: this.own_state.board_used,
        board_salt: this.own_state.board_salt,
        reason: action.reason,
        target: action.target,
        trap: action.trap,
        action_salt: random_Field(),
        params: ourKeys.params,
        decryption_key: this.secret_key,
        selectors: await Promise.all(selectors),
        queries: playerQuery.slice(0, -1).map(({ publicInputs }) => publicInputs.slice(-9))
      };
    
      writeFileSync(`buggy-inputs-answers`, JSON.stringify(inputs))

      this.temp_values.action = action;
      this.temp_values.action_salt = inputs.action_salt;
      const result = await generate_proof(circuits['blinded_answers'], inputs, this.options);
      proofs.push(result.payload);
    }
    // (note: verify queries before publishing)
    return { playerProofs: proofs };
  };

  async createUpdates(answers: ProofData, mover: number): Promise<{ proof: ProofData; collision: Collision; died: boolean}> {
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
      entropy: Array.from(Array(1289), random_bool),
      veils_used: this.temp_values.veils,
      veils_salt: this.temp_values.veils_salt,
      responses,
    };
    const result = await generate_proof(circuits['answers_updates'], inputs, this.options);
    this.own_state = { board_used: result.private_outputs.computed_board, board_salt: inputs.new_board_salt };
    const died = Boolean(Number(result.payload.publicInputs.slice(-10)[0]));
    // (note: verify answers before publishing)
    const collision = result.private_outputs.informed_detect === undefined ? null : result.private_outputs.informed_detect;
    return { proof: result.payload, collision, died }
  };

  async createReports(reports: ProofData[]): Promise<{ proof: ProofData, impacted: boolean, died: boolean }> {
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

    writeFileSync(`buggy-inputs-reports`, JSON.stringify(inputs))

    const result = await generate_proof(circuits['reports_updates'], inputs, this.options);
    this.own_state = { board_used: result.private_outputs.computed_board, board_salt: inputs.new_board_salt };
    const informed_detect = result.private_outputs.informed_detect;
    const impacted = informed_detect !== undefined;
    const died = Boolean(Number(result.payload.publicInputs.slice(-2)[0]));
    // (note: verify reports before publishing)
    return { proof: result.payload, impacted, died }
  };

  verifyDeploys(deploys: ProofData[]) { return true };
  verifyForeign(queries: ProofData[][], answers: ProofData[], updates: ProofData[], reports: ProofData) { return true };

  async compute_selectors(round: number, player: number, tile: number) {
    let selectors = [];
    for (let i of [true,false]) {
      let entropy_pool : boolean[][] = [];
      for (let chunk = 0; chunk < Math.ceil(1289/256); chunk++) {
        let seed = {r:round, p:player, t:tile, c:chunk, i};
        let sha = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(seed)));
        (new Uint8Array(sha)).map(v => entropy_pool.push(bits(v)));
      }
      const entropy = entropy_pool.flat().slice(0,1289);
      let ciphertext = encrypt(this.public_keys[player]!.key_set, entropy, i);
      selectors.push(ciphertext);
    }
    return selectors;
  }
};
