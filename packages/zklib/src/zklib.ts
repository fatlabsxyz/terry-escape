// https://noir-lang.org/docs/tutorials/noirjs_app#some-more-js

import initNoirC from "@noir-lang/noirc_abi";
import initACVM from "@noir-lang/acvm_js";
import acvm from "@noir-lang/acvm_js/web/acvm_js_bg.wasm?url";
import noirc from "@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm?url";
await Promise.all([initACVM(fetch(acvm)), initNoirC(fetch(noirc))]);

import { Noir } from "@noir-lang/noir_js";
import { UltraHonkBackend } from "@aztec/bb.js";

import initial_deploys_json from "../../circuits/initial_deploys/target/initial_deploys.json";
import offline_queries_json from "../../circuits/offline_queries/target/offline_queries.json";
import combine_queries_json from "../../circuits/combine_queries/target/combine_queries.json";
import blinded_answers_json from "../../circuits/blinded_answers/target/blinded_answers.json";
import answers_updates_json from "../../circuits/answers_updates/target/answers_updates.json";
import reports_updates_json from "../../circuits/reports_updates/target/reports_updates.json";

function from_json(json) { return { noir: new Noir(json), backend: new UltraHonkBackend(json.bytecode, { threads }) } };
const threads = navigator.hardwareConcurrency;
const circuits = {
	"initial_deploys" : from_json(initial_deploys_json),
	"offline_queries" : from_json(offline_queries_json),
	"combine_queries" : from_json(combine_queries_json),
	"blinded_answers" : from_json(blinded_answers_json),
	"answers_updates" : from_json(answers_updates_json),
	"reports_updates" : from_json(reports_updates_json),
};

export class zklib {
	craft_initial_deploys(input: I1) : ZK_Out<P1,S1> {}
	craft_combine_queries(input: I2) : ZK_Out<P2,S2> {}
	craft_blinded_answers(input: I3) : ZK_Out<P3,S3> {}
	craft_answers_updates(input: I4) : ZK_Out<P4,S4> {}
	craft_reports_updates(input: I5) : ZK_Out<P5,S5> {}
};

type Field = string;
type BigNum = Field[];
type State = { board_used: Field[], board_salt: Field }
type I1 = { player: int, agents: int[] }
type I2 = { out_1?: ZK_Out<P1,S1>, out_4?: ZK_Out<P4,S4>, out_5?: ZK_Out<P5,S5>, key_set: BigNum[], params: any }
type I3 = { out_1?: ZK_Out<P1,S1>, out_4?: ZK_Out<P4,S4>, out_5?: ZK_Out<P5,S5>, reason: Field, target: Field, trap: bool, decryption_key: BigNum, params: any }
type I4 = { in_2: I2, out_2: ZK_Out<P2,S2>, out_3: ZK_Out<P3,S3> };
type I5 = { in_3: I3[], out_3: ZK_Out<P3,S3>[], out_4: ZK_Out<P4,S4>[] };

type ZK_Out<P,S> = { public_data: P, secret_data: S }
type P1 = any; type P2 = any; type P3 = any; type P4 = any; type P5 = any;
type S1 = any; type S2 = any; type S3 = any; type S4 = any; type S5 = any;
