//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Object3D } from './object3d';
import { Ray } from './ray';
import { vec4, mat4, quat } from 'gl-matrix';
import { Hit } from './hit';
import { Colour } from './colour';
import { Material } from './material';

export class Plane implements Object3D {
  trans: mat4; 
  transFwd: mat4;
  size: number;
  name: string;
  material: Material;
  static THRES: number = 0.0001;

  constructor(pos: vec4, norm: vec4, name: string) {
    this.size = 0;
    this.name = name;

    this.transFwd = mat4.identity(mat4.create());
    this.trans = mat4.identity(mat4.create());
    let rot: quat = quat.identity(quat.create());
    //quat.rotateY(rot, rot, Utils.degreeToRad(90));
    mat4.fromRotationTranslationScale(this.transFwd, rot, [pos[0], pos[1], pos[2]], [radius, radius, radius]);
    //mat4.rotate(this.transFwd, this.transFwd, 2.7, [0, 1, 0])
    mat4.invert(this.trans, this.transFwd);
  }

  public calcT(ray: Ray): number {
    // let rPos: vec4 = vec4.clone(ray.pos);
    // let rDir: vec4 = vec4.clone(ray.dir);
    // vec4.transformMat4(rPos, ray.pos, this.trans);
    // vec4.transformMat4(rDir, ray.dir, this.transr);
    // vec4.normalize(rDir, rDir);

    let denom: number = vec4.dot(this.norm, ray.dir);
    if (Math.abs(denom) > Plane.THRES) {
        let l0: vec4 = vec4.sub(vec4.create(), this.pos, ray.pos);
        let t: number = vec4.dot(l0, this.norm) / denom;
        if (t >= 0)  {
          return t; 
        }
    }
    return 0;
  }

  public getHitPoint(t: number, ray: Ray): Hit {
    let i: vec4 = ray.getPoint(t - 0.0001);

    let r: vec4 = ray.reflect(this.norm);
    
    let hit: Hit = new Hit(i, this.norm, r);
    return hit;
  }
}