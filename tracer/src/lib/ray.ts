//
// Rayscale - Base classes
// (C) Ben Coleman 2018
//

import { vec3 } from 'gl-matrix'

class Ray {
  pos: vec3;
  dir: vec3;

  constructor(pos: vec3, dir: vec3) {
    this.pos = pos;
    this.dir = dir;
  }
}