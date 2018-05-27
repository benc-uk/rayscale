//
// Rayscale - Base classes
// (C) Ben Coleman 2018
//

import { vec3 } from 'gl-matrix'

class Ray {
  src: vec3;
  dir: vec3;

  constructor(src: vec3, dir: vec3) {
    this.src = src;
    this.dir = dir;
  }
}