import {
  IP_TABLE, FP_TABLE, E_TABLE, P_TABLE,
  PC1_TABLE, PC2_TABLE, SHIFT_SCHEDULE, S_BOXES
} from '../constants';
import { DESState, RoundData, KeyGenStep } from '../types';

// Helper: Hex string to Binary string (64 bits usually)
export const hexToBin = (hex: string): string => {
  let bin = "";
  for (let i = 0; i < hex.length; i++) {
    const val = parseInt(hex[i], 16);
    bin += val.toString(2).padStart(4, "0");
  }
  return bin;
};

// Helper: Binary string to Hex string
export const binToHex = (bin: string): string => {
  let hex = "";
  for (let i = 0; i < bin.length; i += 4) {
    const chunk = bin.substring(i, i + 4);
    hex += parseInt(chunk, 2).toString(16).toUpperCase();
  }
  return hex;
};

// Helper: Permute bits based on a table
export const permute = (input: string, table: number[]): string => {
  let output = "";
  for (let i = 0; i < table.length; i++) {
    // Tables are 1-based index
    output += input[table[i] - 1];
  }
  return output;
};

// Helper: XOR two binary strings
export const xor = (a: string, b: string): string => {
  let res = "";
  for (let i = 0; i < a.length; i++) {
    res += a[i] === b[i] ? "0" : "1";
  }
  return res;
};

// S-Box Substitution
export const substitute = (input48: string): string => {
  let output = "";
  for (let i = 0; i < 8; i++) {
    const chunk = input48.substring(i * 6, (i + 1) * 6);
    const rowBin = chunk[0] + chunk[5];
    const colBin = chunk.substring(1, 5);
    
    const row = parseInt(rowBin, 2);
    const col = parseInt(colBin, 2);
    
    const val = S_BOXES[i][row][col];
    output += val.toString(2).padStart(4, "0");
  }
  return output;
};

// Full DES Execution returning complete state for visualization
export const runDES = (plainHex: string, keyHex: string): DESState => {
  const paddedPlain = plainHex.padEnd(16, '0').substring(0, 16);
  const paddedKey = keyHex.padEnd(16, '0').substring(0, 16);

  const plainBin = hexToBin(paddedPlain);
  const keyBin = hexToBin(paddedKey);

  // 1. Initial Permutation
  const ip = permute(plainBin, IP_TABLE);
  
  // 2. Key Generation
  const keyGenSteps: KeyGenStep[] = [];
  const pc1Output = permute(keyBin, PC1_TABLE);
  let c = pc1Output.substring(0, 28);
  let d = pc1Output.substring(28, 56);
  const subKeys: string[] = [];

  for (let i = 0; i < 16; i++) {
    const cBefore = c;
    const dBefore = d;
    const shift = SHIFT_SCHEDULE[i];
    
    // Circular Left Shift
    c = c.substring(shift) + c.substring(0, shift);
    d = d.substring(shift) + d.substring(0, shift);

    const cd = c + d;
    const subKey = permute(cd, PC2_TABLE);
    subKeys.push(subKey);

    keyGenSteps.push({
      round: i + 1,
      cBefore,
      dBefore,
      cAfter: c,
      dAfter: d,
      shiftAmount: shift,
      subKey
    });
  }

  // 3. Rounds
  let L = ip.substring(0, 32);
  let R = ip.substring(32, 64);
  const rounds: RoundData[] = [];

  for (let i = 0; i < 16; i++) {
    const prevL = L;
    const prevR = R;

    const expandedR = permute(R, E_TABLE);
    const xored = xor(expandedR, subKeys[i]);
    const sBoxOut = substitute(xored);
    const pBoxOut = permute(sBoxOut, P_TABLE);
    const newR = xor(L, pBoxOut);
    
    rounds.push({
      roundNumber: i + 1,
      L: prevL,
      R: prevR,
      expandedR,
      subKey: subKeys[i],
      xorResult: xored,
      sBoxOutput: sBoxOut,
      pBoxOutput: pBoxOut,
      newR
    });

    L = R;
    R = newR;
  }

  const preOutput = rounds[15].newR + rounds[15].R; 
  const fp = permute(preOutput, FP_TABLE);

  return {
    plaintext: paddedPlain,
    key: paddedKey,
    binaryPlaintext: plainBin,
    binaryKey: keyBin,
    ipOutput: ip,
    rounds,
    subKeys,
    keyGenSteps,
    pc1Output,
    fpOutput: fp
  };
};