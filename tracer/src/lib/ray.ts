//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { vec4, mat4 } from 'gl-matrix';
import { Stats } from './stats';
import { Object3D } from './objects/object3d';

export class Ray {
  pos: vec4;
  dir: vec4;
  depth: number;
  inside: Object3D;

  constructor(pos: vec4, dir: vec4) {
    this.pos = pos;
    this.dir = vec4.create();
    this.dir[3] = 0;
    vec4.normalize(this.dir, dir);
    this.inside = null;             // Null means ray is in the air/open space

    Stats.raysCreated++;
  }

  // ====================================================================================================
  // Convenience getters for ray dir and pos values
  // ====================================================================================================
  get px(): number { return this.pos[0]; }
  get py(): number { return this.pos[1]; }
  get pz(): number { return this.pos[2]; }
  get dx(): number { return this.dir[0]; }
  get dy(): number { return this.dir[1]; }
  get dz(): number { return this.dir[2]; }


  public toString(): string  {
    return `pos: [${this.pos[0]}, ${this.pos[1]}, ${this.pos[2]}], dir: [${this.dir[0]}, ${this.dir[1]}, ${this.dir[2]}]`;
  }

  public transformNewRay(trans: mat4): Ray {
    //let newRay: Ray = new Ray(vec4.create(), vec4.create());
    const p = vec4.transformMat4(vec4.create(), this.pos, trans);
    const d = vec4.transformMat4(vec4.create(), this.dir, trans);
    //vec4.normalize(d, d);
    const newRay: Ray = new Ray(p, d);
    return newRay;
  }

  public transform(trans: mat4): void {
    vec4.transformMat4(this.pos, this.pos, trans);
    vec4.transformMat4(this.dir, this.dir, trans);
    vec4.normalize(this.dir, this.dir);
  }

  public getPoint(t: number): vec4 {
    return vec4.fromValues(this.pos[0] + (t * this.dir[0]),
      this.pos[1] + (t * this.dir[1]),
      this.pos[2] + (t * this.dir[2]), 1);
  }

  public reflect(norm: vec4): vec4 {
    const ref: vec4 = vec4.create();

    const k: number = - vec4.dot(this.dir, norm);
    ref[0] = this.dir[0] + 2 * norm[0] * k;
    ref[1] = this.dir[1] + 2 * norm[1] * k;
    ref[2] = this.dir[2] + 2 * norm[2] * k;
    vec4.normalize(ref, ref);

    return ref;
  }
}