//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Object3D } from './object3d';
import { Ray } from './ray';
import { vec3, mat4 } from 'gl-matrix';
import { Hit } from './hit';

export class Sphere implements Object3D {
  trans: mat4;
  size: number;
  r2: number;
  name: string;
  static THRES: number = 0.001;

  constructor(pos: vec3, s: number, name: string) {
    this.size = s;
    this.r2 = s * s;
    this.name = name;

    this.trans = mat4.create();
    console.log(`SPHERE POS ${pos.toString()}`);
    mat4.fromTranslation(this.trans, pos);
    console.log(`SPHERE TRANSFORM ${this.trans.toString()}`);
    mat4.invert(this.trans, this.trans);
    console.log(`SPHERE TRANSFORM INVERT ${this.trans.toString()}`);
  }

  public calcT(ray: Ray): number {
    let rPos: vec3 = vec3.clone(ray.pos);
    let rDir: vec3 = vec3.clone(ray.dir);

    vec3.transformMat4(rPos, ray.pos, this.trans);
    let b: number = 2.0 * vec3.dot(rPos, rDir);
    let c: number = vec3.dot(rPos, rPos) - this.r2;
    let d: number = b*b - 4.0 * c;

    // Miss
    if (d <= 0.0)
      return 0.0;
    
    d = Math.sqrt(d);
    let t1: number = (-b+d)/2.0;
    let t2: number = (-b-d)/2.0;

    if (Math.abs(t1) < Sphere.THRES || Math.abs(t2) < Sphere.THRES)
      return 0.0;
    
    // Ray is inside if there is only 1 positive root
    // Added for refractive transparency
    if (t1 < 0 && t2 > 0) {
      return t2;
    }
    if (t2 < 0 && t1 > 0) {
      return t1;
    }
    
    return (t1 < t2) ? t1 : t2;
  }

  public getHitPoint(t: number, ray: Ray): Hit {
    let i: vec3 = ray.getPoint(t);
    let n: vec3 = vec3.clone(i);
    let r: vec3 = vec3.clone(i);
    vec3.normalize(n, n);

    let hit: Hit = new Hit(i, n, r);
    return hit;
  }
}