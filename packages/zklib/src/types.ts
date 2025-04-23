export type Field = string;
export type BigNum = Field[];
export type Secret_Key = BigNum;
export type Public_Key = { key_set: BigNum[], params: any };
export type State = { board_used?: Field[], board_salt: Field }
export type Action = { reason: number, target: number, trap: boolean }
