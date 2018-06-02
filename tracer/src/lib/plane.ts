//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Object3D } from './object3d';
import { Ray } from './ray';
import { vec3, mat4 } from 'gl-matrix';
import { Hit } from './hit';
import { Colour } from './colour';
import { Material } from './material';

export class Plane implements Object3D {
  trans: mat4; transr: mat4;
  pos: vec3;
  norm: vec3;
  size: number;
  name: string;
  material: Material;
  static THRES: number = 0.0001;

  constructor(pos: vec3, norm: vec3, name: string) {
    this.size = 0;
    this.name = name;

    // this.trans = mat4.create();
    // mat4.fromTranslation(this.trans, pos);
    // mat4.invert(this.trans, this.trans);
    
    //this.transr = mat4.create();
    //mat4.rotateX(this.transr, this.transr, 1.5);
    //mat4.invert(this.transr, this.transr);

    this.pos = pos;

    this.norm = vec3.create();
    vec3.normalize(this.norm, norm);
    //vec3.transformMat4(this.norm, this.norm, this.transr);
    // console.log(this.norm);
    // console.log(this.pos);
  }

  public calcT(ray: Ray): number {
    // let rPos: vec3 = vec3.clone(ray.pos);
    // let rDir: vec3 = vec3.clone(ray.dir);
    // vec3.transformMat4(rPos, ray.pos, this.trans);
    // vec3.transformMat4(rDir, ray.dir, this.transr);
    // vec3.normalize(rDir, rDir);

    let denom: number = vec3.dot(this.norm, ray.dir);
    if (Math.abs(denom) > Plane.THRES) {
        let l0: vec3 = vec3.sub(vec3.create(), this.pos, ray.pos);
        let t: number = vec3.dot(l0, this.norm) / denom;
        if (t >= 0)  {
          return t; 
        }
    }
    return 0;
  }

  public getHitPoint(t: number, ray: Ray): Hit {
    let i: vec3 = ray.getPoint(t - 0.0001);

    let r: vec3 = ray.reflect(this.norm);
    
    let hit: Hit = new Hit(i, this.norm, r);
    return hit;
  }
}