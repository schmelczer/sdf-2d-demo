import { vec4 } from 'gl-matrix';

export const rgba255 = (r: number, g: number, b: number, a: number): vec4 =>
  vec4.fromValues(r / 255, g / 255, b / 255, a / 255);
