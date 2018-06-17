//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Object3D, ObjectConsts } from './object3d';
import { Ray } from './ray';
import { vec3, vec4, mat4, quat } from 'gl-matrix';
import { Hit } from './hit';
import { Material } from './material';
import { Stats } from './stats';
import { TResult } from './t-result';
import { Utils } from './utils';

export class Cylinder implements Object3D {
  pos: vec4;
  trans: mat4;
  transFwd: mat4;
  radius: number;
  length: number;
  r2: number;
  name: string;
  material: Material;
  //static SIDES = 0; static TOP = 1; static BOTTOM = 2;
  //hitflag: any;

  // ====================================================================================
  // Create a Cylinder (called by Scene parser)
  // ====================================================================================
  constructor(pos: vec4, rotation: vec3, radius: number, length: number, name: string) {
    this.radius = radius;
    this.r2 = radius * radius;
    this.name = name;
    this.pos = pos;
    this.length = length;

    this.transFwd = mat4.identity(mat4.create());
    this.trans = mat4.identity(mat4.create());
    let rot: quat = quat.identity(quat.create());
    quat.rotateX(rot, rot, Utils.degreeToRad(rotation[0]));
    quat.rotateY(rot, rot, Utils.degreeToRad(rotation[1]));
    quat.rotateZ(rot, rot, Utils.degreeToRad(rotation[2]));   
    // We cheat here, and scale by 1, and do the scaling in the calcT 
    mat4.fromRotationTranslationScale(this.transFwd, rot, [pos[0], pos[1], pos[2]], [1, 1, 1]);
    mat4.invert(this.trans, this.transFwd);
  }

  // ====================================================================================
  // Standard find intersection distance t required by all Object3D
  // ====================================================================================
  public calcT(inray: Ray): TResult {
    Stats.objectTests++;
    let ray: Ray = inray.transformNewRay(this.trans);
    let tresult = new TResult(0.0, ray);
		let t1: number, t2: number;
    let d: number = 0;
    
    tresult.flag = TResult.SIDE;

		let a: number = (ray.dir[0] * ray.dir[0] + ray.dir[2] * ray.dir[2]);
    let b: number = (ray.pos[0] * ray.dir[0] + ray.pos[2] * ray.dir[2]);
    let c: number = (ray.pos[0] * ray.pos[0] + ray.pos[2] * ray.pos[2]) - this.r2;
    d = b * b - a * c;

    if (d >= 0.0) {
      // We have hit the cylinder, but that's the easy part...

      d = Math.sqrt(d);
      t1 = (-b + d) / a;
      t2 = (-b - d) / a;

      if (Math.abs(t1) < ObjectConsts.EPSILON3 || Math.abs(t2) < ObjectConsts.EPSILON3)
        return tresult; // return 0

      // Sort smallest cylinder intersection
      let tNear: number;
      let tFar: number;
      if (t1 < t2) {
        tNear = t1;
        tFar = t2;
      } else {
        tNear = t2;
        tFar = t1;
      }

      // Clip cylinder between 0 and length
      let iNear: vec4 = ray.getPoint(tNear - ObjectConsts.EPSILON3);
      let iFar: vec4 = ray.getPoint(tFar - ObjectConsts.EPSILON3);

      // Total miss
      if((iNear[1] < 0 && iFar[1] < 0) || (iNear[1] > this.length && iFar[1] > this.length)) { 
        return tresult; 
      }

      // Get cap intersection, with a plane aligned with Y axis
      let capNorm: vec4 = vec4.fromValues(0, 1, 0, 0);
      // "Mini" ray transform, moving the plane +length in y axis, results in ray -length in y axis
      let capRayPos: vec4 = vec4.fromValues(ray.pos[0], ray.pos[1] - this.length, ray.pos[2], 1);
      // Same code as Plane calcT() method
      let capT: number = 0;
      let denom: number = vec4.dot(capNorm, ray.dir);
      if (Math.abs(denom) > ObjectConsts.EPSILON3) {
          let l0: vec4 = vec4.sub(vec4.create(), [0, 0, 0, 1], capRayPos);
          let localT: number = vec4.dot(l0, capNorm) / denom;
          if (localT >= 0)  {
            capT = localT;
          }
      }

      // Miss right down the tube means hit the cap
      if((iNear[1] < 0 || iNear[1] > this.length) && (iFar[1] < 0 || iFar[1] > this.length) ) { 
        tresult.flag = TResult.TOP;
        tresult.t = capT;
        return tresult; 
      }

      // Edge cases
      if(iFar[1] > this.length || iFar[1] < 0) { tresult.t = tNear; return tresult; }
      if(iNear[1] > this.length || iNear[1] < 0) { 
        // Far inside, check if cap closer
        if(capT < tFar) {
          tresult.flag = TResult.TOP;
          tresult.t = capT; 
          return tresult; 
        } else {
          tresult.flag = TResult.INSIDE;
          tresult.t = tFar; 
          return tresult; 
        }
      }
      // Else hit nearest
      tresult.t = tNear; 
      return tresult;
    }
    // Miss
    return tresult;
  }

  // ====================================================================================
  // Standard getHitPoint details required by all Object3D
  // - Important! Input Ray should already be in object space
  // ====================================================================================
  public getHitPoint(result: TResult): Hit {
    // Intersection point
    if(!result.ray) return;
    let i: vec4 = result.ray.getPoint(result.t - ObjectConsts.EPSILON3);

    // Normal same as sphere but with y forced to 0
    let n: vec4 = vec4.fromValues(0, 0, 0, 1);
    vec4.div(n, i, [this.radius, this.radius, this.radius, 1]);
    n[1] = 0;
    n[3] = 0;
    // Hit the size side of cylinder, flip normal
    if(result.flag == TResult.INSIDE) {
      n[0] = -n[0];
      n[2] = -n[2]
    }
    // Hit the cap, the normal will just point up
    if(result.flag == TResult.TOP) {
      n = vec4.fromValues(0, 1, 0, 0);
    }

    // Calc u,v texture coords
    let u: number = 0, v: number = 0;
    if(result.flag == TResult.TOP) {
      // Treat the cap as a plane
      u = Math.abs((i[0] % this.material.texture.scaleU) / this.material.texture.scaleU);
      if(i[0] < 0) u = 1 - u;
      v = Math.abs((i[2] % this.material.texture.scaleV) / this.material.texture.scaleV);
      if(i[2] < 0) v = 1 - v;
    } else {
      // Treat the sides as a sphere where v = i.y
      u = Math.atan2(n[0], n[2]) / (2*Math.PI) + 0.5;
      u = (u % this.material.texture.scaleU) / this.material.texture.scaleU;
      v = i[1];
      v = 1 - ((v % this.material.texture.scaleV) / this.material.texture.scaleV);
      if(i[1] < 0) v = 1 - v;  
    }

    // Move i back to world space
    vec4.transformMat4(i, i, this.transFwd);

    // Calc reflected ray about the normal, & move to world
    let r: vec4 = result.ray.reflect(n);
    vec4.transformMat4(r, r, this.transFwd);
    vec4.normalize(r, r);   

    // Move normal into world
    vec4.transformMat4(n, n, this.transFwd);
    vec4.normalize(n, n);

    let hit: Hit = new Hit(i, n, r, u, v);
    return hit;
  }
}