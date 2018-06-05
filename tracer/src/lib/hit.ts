//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { vec4 } from 'gl-matrix'

export class Hit {
  intersection: vec4;
  normal: vec4;
  reflected: vec4;
  u: number = 1;
  v: number = 1;

  constructor(i: vec4, n: vec4, r: vec4, u: number, v: number) {
    this.intersection = i;
    this.normal = n;
    this.reflected = r;
    this.u = u;
    this.v = v;
  }
}