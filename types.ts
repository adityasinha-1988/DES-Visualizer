export interface DESState {
  plaintext: string; // hex
  key: string; // hex
  binaryPlaintext: string; // 64 bits
  binaryKey: string; // 64 bits
  rounds: RoundData[];
  ipOutput: string;
  fpOutput: string;
  subKeys: string[]; // 16 subkeys (48 bits each)
  keyGenSteps: KeyGenStep[]; // Detailed history for visualization
  pc1Output: string; // 56 bits
}

export interface KeyGenStep {
  round: number;
  cBefore: string;
  dBefore: string;
  cAfter: string;
  dAfter: string;
  shiftAmount: number;
  subKey: string;
}

export interface RoundData {
  roundNumber: number;
  L: string; // 32 bits
  R: string; // 32 bits
  expandedR: string; // 48 bits
  subKey: string; // 48 bits
  xorResult: string; // 48 bits
  sBoxOutput: string; // 32 bits
  pBoxOutput: string; // 32 bits
  newR: string; // 32 bits (L ^ pBoxOutput)
}

export enum AppStep {
  INPUT = 'INPUT',
  IP = 'IP',
  KEY_GEN = 'KEY_GEN',
  ROUNDS = 'ROUNDS',
  FP = 'FP',
}

export type BitValue = '0' | '1';