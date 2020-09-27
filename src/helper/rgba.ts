import { vec4 } from 'gl-matrix';

export const rgba = (r: number, g: number, b: number, a: number): vec4 =>
  vec4.fromValues(r, g, b, a);
