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
    //console.log(this.dir);
  }

  public toString(): string  {
    return `pos: [${this.pos[0]}, ${this.pos[1]}, ${this.pos[2]}], dir: [${this.dir[0]}, ${this.dir[1]}, ${this.dir[2]}]`;
  }

  public getPoint(t: number): vec3 {
    return vec3.fromValues(this.pos[0] + t * this.dir[0], 
                           this.pos[1] + t * this.dir[1], 
                           this.pos[2] + t * this.dir[2]);
  }

  public reflect(norm: vec3): vec3 {
    let ref: vec3 = vec3.create();
    
    let k: number = - vec3.dot(this.dir, norm);
    ref[0] = this.dir[0] + 2 * norm[0] * k;
    ref[1] = this.dir[1] + 2 * norm[1] * k;
    ref[2] = this.dir[2] + 2 * norm[2] * k;
    vec3.normalize(ref, ref);
    
    return ref;
  }
}