declare module "*.json" {
  interface Artifact {
    noir_version: string;
    hash: number;
    abi: object;
    bytecode: string;
    debug_symbols: string;
    file_map: object;
    names: string[];
    brilling_names: string[];
  }

  const value: Artifact;
  export default value;
}
