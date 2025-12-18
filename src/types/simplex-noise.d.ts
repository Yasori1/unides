declare module 'simplex-noise' {
  export type RandomFn = () => number;
  export type NoiseFunction2D = (x: number, y: number) => number;
  export type NoiseFunction3D = (x: number, y: number, z: number) => number;
  export type NoiseFunction4D = (x: number, y: number, z: number, w: number) => number;
  
  export function createNoise2D(random?: RandomFn): NoiseFunction2D;
  export function createNoise3D(random?: RandomFn): NoiseFunction3D;
  export function createNoise4D(random?: RandomFn): NoiseFunction4D;
  export function buildPermutationTable(random: RandomFn): Uint8Array;
}



