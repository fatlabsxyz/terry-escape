import { ProofData } from '@aztec/bb.js';
import { Action, Field, Public_Key, Secret_Key, State } from './types.js';
import { Collision, IZkLib } from './zklib.interface.js';
import { init_circuits, generate_proof, verify_proof, random_Field, random_bool, bits, selector } from './utils.js';
const circuits = init_circuits();


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
    this.all_states[this.own_seat] = result.payload.publicInputs[1]!;
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
        selectors: await this.compute_selectors(this.round, this.own_seat, tile_index, mover),
	params,
        key_set,
        entropy: Array.from(Array(1289), random_bool)
      };
      const result = await generate_proof(circuits['offline_queries'], inputs, this.options);
      proofs.push(result.payload);
      console.log(new Date(), "Individual query computed", this.own_seat, tile_index);
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
    this.temp_values.action_salt = random_Field();
    for (let player_index = 0; player_index < this.NUMBER_OF_PLAYERS; player_index++) {
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

      let selectors = Array.from(Array(16), async (_, i) => await this.compute_selectors(this.round, player_index, i, this.own_seat));
      const inputs = {
        board_used: this.own_state.board_used,
        board_salt: this.own_state.board_salt,
        reason: action.reason,
        target: action.target,
        trap: action.trap,
        action_salt: this.temp_values.action_salt,
        params: ourKeys.params,
        decryption_key: this.secret_key,
        selectors: await Promise.all(selectors),
        queries: playerQuery.slice(0, -1).map(({ publicInputs }) => publicInputs.slice(-9))
      };
    
      // writeFileSync('buggy-create-answers-inputs.json', JSON.stringify(inputs));
      this.temp_values.action = action;
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

    const result = await generate_proof(circuits['reports_updates'], inputs, this.options);
    this.own_state = { board_used: result.private_outputs.computed_board, board_salt: inputs.new_board_salt };
    const informed_detect = result.private_outputs.informed_detect;
    const impacted = informed_detect !== undefined;
    const died = Boolean(Number(result.payload.publicInputs.slice(-2)[0]));
    // (note: verify reports before publishing)
    return { proof: result.payload, impacted, died }
  };

  async verifyDeploys(deploys: ProofData[]) {
    for (let deploy of deploys) {
      await verify_proof(circuits['initial_deploys'], deploy);
      this.all_states[Number(deploy.publicInputs[0])] = deploy.publicInputs[1]!; 
    }
  };
  

  async verifyForeign(queries: ProofData[][], answers: ProofData[], updates: ProofData[], reports: ProofData, mover: number, verify_isolated = true) {
    console.log("Verifying all turn proofs");
    
    function check_match(fields_A: string[], fields_B: string[]) {
      if (JSON.stringify(fields_A.map(BigInt).map(String)) != JSON.stringify(fields_B.map(BigInt).map(String))) {
        throw Error("Proof verification failed!");
      }
    }

    console.log("+ Answered to queried queries ...");
    for (let offset of [0,1,2]) {
      let answer_queries = answers[offset]!.publicInputs.slice(-467,-323);
      let queries_queries = queries[offset]!.slice(0,-1).map(q => q.publicInputs.slice(-9)).flat();
      check_match(answer_queries, queries_queries);
    }
    
    if (verify_isolated) {
      console.log("+ Each proof is valid in isolation...");
      for (const query_pack of queries) {
        for (const offline_query of query_pack.slice(0,-1)) {
          await verify_proof(circuits['offline_queries'], offline_query);
        }
        await verify_proof(circuits['combine_queries'], query_pack[16]!);
      }
      for (const answer of answers) {
        await verify_proof(circuits['blinded_answers'], answer);
      }
      for (const update of updates) {
        await verify_proof(circuits['answers_updates'], update);
      }
      await verify_proof(circuits['reports_updates'], reports);
    }

    console.log("+ Corresponding selectors used for queries and answers ...");
    for (let offset of [0,1,2]) {
      let from = offset + Number(mover <= offset);
      for (let query = 0; query < 16; query++) {
	let query_selectors = queries[offset]![query]!.publicInputs.slice(0,18);
	let answer_selectors = answers[offset]!.publicInputs.slice(-323+18*query,-323+18*(query+1)); 
	let expected_selectors = (await this.compute_selectors(this.round, from, query, mover)).flat();
	check_match(query_selectors, expected_selectors);
	check_match(answer_selectors, expected_selectors);
      }
    }
    
    console.log("+ Updated based on responded responses and reported reports ...");
    let update_reports = updates.map(u => u.publicInputs.slice(-9)).flat();
    let reported_reports = reports.publicInputs.slice(-32,-5);
    check_match(update_reports, reported_reports);
    for (let offset of [0,1,2]) {
      let update_responses = updates[offset]!.publicInputs.slice(-60,-28);
      let answered_responses = answers[offset]!.publicInputs.slice(-32);
      check_match(update_responses, answered_responses);
    }

    console.log("+ Mover keys used to encrypt and decrypt queries and reports ...");
    const params_length = 82; const keyset_length = 1290*9;
    let reports_params = reports.publicInputs.slice(0, params_length);
    for (let offset of [0,1,2]) {
      let updates_params = updates[offset]!.publicInputs.slice(0, params_length);
      let updates_keyset = updates[offset]!.publicInputs.slice(params_length, params_length + keyset_length);
      let answers_params = answers[offset]!.publicInputs.slice(0, params_length);
      check_match(updates_params, reports_params);
      check_match(answers_params, reports_params);
      for (let i = 0; i < 16; i++) {
        let queries_params = queries[offset]![i]!.publicInputs.slice(18, 18 + params_length);
        let queries_keyset = queries[offset]![i]!.publicInputs.slice(18 + params_length, 18 + params_length + keyset_length);
        check_match(queries_params, updates_params);
        check_match(queries_keyset, updates_keyset);
      }
    }

    console.log("+ Combined queries and updated with same tile and veil digests ...");
    for (let offset of [0,1,2]) {
      let offline_tile_digests = queries[offset]!.slice(0,-1).map(q => q.publicInputs.slice(-11,-10)).flat();
      let combine_tile_digests = queries[offset]![16]!.publicInputs.slice(-18,-2);
      let offline_veils_digests = queries[offset]!.slice(0,-1).map(q => q.publicInputs.slice(-10,-9)).flat();
      let updates_veils_digests = updates[offset]!.publicInputs.slice(-26,-10);
      let combine_veils_digests = queries[offset]![16]!.publicInputs.slice(0,16);
      // check_match(offline_tile_digests, combine_tile_digests);
      check_match(offline_veils_digests, combine_veils_digests);
      check_match(offline_veils_digests, updates_veils_digests);
    }
    
    console.log("+ Same action used for answering and updating ...");
    let update_action_digest = reports.publicInputs.slice(-3,-2);
    for (let offset of [0,1,2]) {
      let answer_action_digest = answers[offset]!.publicInputs.slice(-34,-33);
      check_match(update_action_digest, answer_action_digest);
    }

    console.log("+ Previous states used for queries, answers, updates and reports ...");
    check_match([this.all_states[mover]!], reports.publicInputs.slice(-5,-4));
    for (let offset of [0,1,2]) {
      let from = offset + Number(mover <= offset);
      check_match([this.all_states[from]!], updates[offset]!.publicInputs.slice(-28,-27));
      // And store new ones
      this.all_states[from]! = updates[offset]!.publicInputs.slice(-27,-26)[0]!;
    }
    this.all_states[mover]! = reports.publicInputs.slice(-4,-3)[0]!; 
  };

  async compute_selectors(round: number, player: number, tile: number, mover: number) {
    let selectors = [];
    for (let i of [true,false]) {
      let entropy_pool : boolean[][] = [];
      for (let chunk = 0; chunk < Math.ceil(1289/256); chunk++) {
        let seed = {r:round, p:player, t:tile, c:chunk, i};
        // let sha = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(seed)));
        // (new Uint8Array(sha)).map(v => entropy_pool.push(bits(v)));
	// Vite shenanigans not worth it
	
	let shack = (new TextEncoder().encode(JSON.stringify(seed).repeat(256)));
        (new Uint8Array(shack)).map(v => entropy_pool.push(bits(v)));
      }
      const entropy = entropy_pool.flat().slice(0,1289);
      let ciphertext = selector(this.public_keys[mover]!.key_set, entropy, i);
      // let ciphertext = ["0","0","0","0","0","0","0","0","0"];
      selectors.push(ciphertext);
    }
    return selectors;
  }
};
