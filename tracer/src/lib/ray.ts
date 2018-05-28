//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { vec3 } from 'gl-matrix'

class Ray {
  pos: vec3;
  dir: vec3;

  constructor(pos: vec3, dir: vec3) {
    this.pos = pos;
    vec3.normalize(this.dir, dir);
  }

  toString(): string  {
    return `(pos: [${this.pos}], dir: [${this.dir}])`;
  }
}