//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { vec3 } from 'gl-matrix'

export class Ray {
  pos: vec3;
  dir: vec3;

  constructor(pos: vec3, dir: vec3) {
    this.pos = pos;
    this.dir = vec3.create();
    vec3.normalize(this.dir, dir);
  }

  public toString(): string  {
    return `pos: [${this.pos[0]}, ${this.pos[1]}, ${this.pos[2]}], dir: [${this.dir[0]}, ${this.dir[1]}, ${this.dir[2]}]`;
  }
}