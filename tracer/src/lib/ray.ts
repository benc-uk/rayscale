//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { vec4 } from 'gl-matrix'

export class Ray {
  pos: vec4;
  dir: vec4;

  constructor(pos: vec4, dir: vec4) {
    this.pos = pos;
    this.dir = vec4.create();
    this.dir[3] = 0;
    vec4.normalize(this.dir, dir);
    //console.log(this.dir);
  }

  public toString(): string  {
    return `pos: [${this.pos[0]}, ${this.pos[1]}, ${this.pos[2]}], dir: [${this.dir[0]}, ${this.dir[1]}, ${this.dir[2]}]`;
  }

  public getPoint(t: number): vec4 {
    return vec4.fromValues(this.pos[0] + t * this.dir[0], 
                           this.pos[1] + t * this.dir[1], 
                           this.pos[2] + t * this.dir[2], 1);
  }

  public reflect(norm: vec4): vec4 {
    let ref: vec4 = vec4.create();
    
    let k: number = - vec4.dot(this.dir, norm);
    ref[0] = this.dir[0] + 2 * norm[0] * k;
    ref[1] = this.dir[1] + 2 * norm[1] * k;
    ref[2] = this.dir[2] + 2 * norm[2] * k;
    vec4.normalize(ref, ref);
    
    return ref;
  }
}