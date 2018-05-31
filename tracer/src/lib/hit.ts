//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { vec3 } from 'gl-matrix'

export class Hit {
  intersection: vec3;
  normal: vec3;
  reflected: vec3;

  constructor(i: vec3, n: vec3, r: vec3) {
    this.intersection = i;
    this.normal = n;
    this.reflected = r;
  }
}