//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Object3D } from './object3d';
import { Ray } from './ray';
import { vec3, vec4, mat4, quat } from 'gl-matrix';
import { Hit } from './hit';
import { Colour } from './colour';
import { Material } from './material';
import { Utils } from './utils';
import { Stats } from './stats';

export class Sphere implements Object3D {
  pos: vec4;
  trans: mat4;
  transFwd: mat4;
  //transNormal: mat4;
  size: number;
  r2: number;
  name: string;
  material: Material;
  static THRES: number = 0.001;
  static FUDGE: number  = 0.000001;

  constructor(pos: vec4, radius: number, name: string) {
    this.size = radius;
    this.r2 = radius * radius;
    this.name = name;
    this.pos = pos;

    this.transFwd = mat4.identity(mat4.create());
    this.trans = mat4.identity(mat4.create());
    let rot: quat = quat.identity(quat.create());    
    // We cheat here, and scale by 1, and do the scaling in the calcT (using r2) 
    mat4.fromRotationTranslationScale(this.transFwd, rot, [pos[0], pos[1], pos[2]], [1, 1, 1]);
    mat4.invert(this.trans, this.transFwd);
    //mat4.transpose(this.transNormal, this.transFwd);
  }

  public calcT(ray: Ray): any {
    Stats.objectTests++;
    let tRay: Ray = ray.transformNewRay(this.trans);

    // Sphere at origin (0,0,0) so L simply becomes tRay.pos, but with w=0
    //let L: vec4 = vec4.sub(vec4.create(), tRay.pos, vec4.fromValues(0, 0, 0, 1));
    let L: vec4 = vec4.fromValues(tRay.pos[0], tRay.pos[1], tRay.pos[2], 0);
    let b: number = 2.0 * vec4.dot(tRay.pos, tRay.dir);
    let c: number = vec4.dot(L, L) - this.r2;
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
  
    return (t1 < t2) ? {t: t1, tRay: tRay} : {t: t2, tRay: tRay};
  }

  //
  // Note. Ray must be in OBJECT SPACE
  //
  public getHitPoint(t: number, ray: Ray): Hit {
    // Ray is already in object space
    let i: vec4 = ray.getPoint(t - Sphere.FUDGE);

    // Normal is pointing from center of sphere (0,0,0) to intersect (i)
    let n: vec4 = vec4.sub(vec4.create(), i, [0, 0, 0, 1]);
    vec4.div(n, n, [this.size, this.size, this.size, 1]);

    // move i back to world space
    vec4.transformMat4(i, i, this.transFwd);

    // calc reflected ray about the normal, & move to world
    let r: vec4 = ray.reflect(n);
    vec4.transformMat4(r, r, this.transFwd);
    vec4.normalize(r, r);   

    // Move normal into world
    vec4.transformMat4(n, n, this.transFwd);
    vec4.normalize(n, n);

    let hit: Hit = new Hit(i, n, r);
    return hit;
  }
}