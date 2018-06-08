//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Object3D } from './object3d';
import { Ray } from './ray';
import { vec3, vec4, mat4, quat } from 'gl-matrix';
import { Hit } from './hit';
import { Material } from './material';
import { Utils } from './utils';
import { Stats } from './stats';
import { TResult } from './t-result';

export class Plane implements Object3D {
  trans: mat4; 
  transFwd: mat4;
  size: number;
  name: string;
  material: Material;
  norm: vec4;
  static THRES: number = 0.0001;
  static FUDGE: number = 0.0001;

  constructor(pos: vec4, rotation: vec3, name: string) {
    this.name = name;

    // pointing up
    this.norm = vec4.fromValues(0, 1, 0, 0);

    this.transFwd = mat4.identity(mat4.create());
    this.trans = mat4.identity(mat4.create());
    let rot: quat = quat.identity(quat.create());
    quat.rotateX(rot, rot, Utils.degreeToRad(rotation[0]));
    quat.rotateY(rot, rot, Utils.degreeToRad(rotation[1]));
    quat.rotateZ(rot, rot, Utils.degreeToRad(rotation[2])); 
    mat4.fromRotationTranslationScale(this.transFwd, rot, [pos[0], pos[1], pos[2]], [1, 1, 1]);
    mat4.invert(this.trans, this.transFwd);
  }

  public calcT(ray: Ray): TResult {
    Stats.objectTests++;
    let tRay: Ray = ray.transformNewRay(this.trans);

    let denom: number = vec4.dot(this.norm, tRay.dir);
    if (Math.abs(denom) > Plane.THRES) {
        let l0: vec4 = vec4.sub(vec4.create(), [0, 0, 0, 1], tRay.pos);
        let t: number = vec4.dot(l0, this.norm) / denom;
        if (t >= 0)  {
          return new TResult(t, tRay); //{t: t, tRay: tRay}; 
        }
    }
    return new TResult(0.0, tRay); //{t: 0, tRay: tRay};
  }

  public getHitPoint(t: number, ray: Ray): Hit {
    let i: vec4 = ray.getPoint(t - Plane.FUDGE);

    let u = Math.abs((i[0] % this.material.texture.scaleU)/this.material.texture.scaleU);
    if(i[0] < 0) u = 1 - u;
    let v = Math.abs((i[2] % this.material.texture.scaleV)/this.material.texture.scaleV);
    if(i[2] < 0) v = 1 - v;
    
    // move i back to world space
    vec4.transformMat4(i, i, this.transFwd);

    // calc reflected ray about the normal, & move to world
    let r: vec4 = ray.reflect(this.norm);
    vec4.transformMat4(r, r, this.transFwd);
    vec4.normalize(r, r);   

    // Move normal into world
    let n: vec4 = vec4.create();
    vec4.transformMat4(n, this.norm, this.transFwd);
    vec4.normalize(n, this.norm);
    
    let hit: Hit = new Hit(i, this.norm, r, u, v);
    return hit;
  }
}