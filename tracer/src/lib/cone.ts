//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Object3D, ObjectConsts } from './object3d';
import { Ray } from './ray';
import { vec3, vec4, mat4, quat } from 'gl-matrix';
import { Hit } from './hit';
import { Material } from './material';
import { Animation } from './animation';
import { Stats } from './stats';
import { TResult } from './t-result';
import { Utils } from './utils';

// ====================================================================================================
// Object representing a cone with either open or capped ends
// - Base is at `pos`, cone rises up `length` units, and is aligned along the Y axis
// ====================================================================================================
export class Cone implements Object3D {
  // Base properties
  name: string;
  trans: mat4;
  transFwd: mat4;
  material: Material;
  animations: Animation[];

  // Cylinder properties
  pos: vec3;
  radius: number;
  length: number;
  ratio: number;
  r2: number;
  capped: boolean;

  // ====================================================================================
  // Create a Cone (called by Scene parser)
  // ====================================================================================
  constructor(pos: vec3, rotation: vec3, radius: number, length: number, capped = false, name: string) {
    this.name = name;
    this.pos = pos;
    this.radius = radius;
    this.r2 = radius * radius;
    this.length = length;
    this.ratio = (this.radius/2) / this.length;
    this.capped = capped;

    this.transFwd = mat4.identity(mat4.create());
    this.trans = mat4.identity(mat4.create());
    const rot: quat = quat.identity(quat.create());
    quat.rotateX(rot, rot, Utils.degreeToRad(rotation[0]));
    quat.rotateY(rot, rot, Utils.degreeToRad(rotation[1]));
    quat.rotateZ(rot, rot, Utils.degreeToRad(180 + rotation[2]));  // Hack to get cones the way up I want
    // We cheat here, and scale by 1, and do the scaling in the calcT
    mat4.fromRotationTranslationScale(this.transFwd, rot, [pos[0], pos[1] + this.length, pos[2]], [1, 1, 1]);
    mat4.invert(this.trans, this.transFwd);
  }

  // ====================================================================================
  // Standard find intersection distance t required by all Object3D
  // ====================================================================================
  public calcT(inray: Ray): TResult {
    Stats.objectTests++;
    const ray: Ray = inray.transformNewRay(this.trans);
    const tresult = new TResult(0.0, ray);
    let t1: number, t2: number;
    let d = 0;

    const a: number = (ray.dx * ray.dx + ray.dz * ray.dz - ray.dy * ray.dy * this.ratio);
    const b: number = (ray.px * ray.dx + ray.pz * ray.dz - ray.py * ray.dy * this.ratio);
    const c: number = (ray.px * ray.px + ray.pz * ray.pz - ray.py * ray.py * this.ratio);
    d = (b * b) - (a * c);

    if (d >= 0.0) {
      // We have hit the cone, but that's the easy part...
      d = Math.sqrt(d);
      t1 = (-b + d) / a;
      t2 = (-b - d) / a;

      // Sort smallest intersection
      let tNear: number;
      let tFar: number;
      if (t1 < t2) {
        tNear = t1; tFar = t2;
      } else {
        tNear = t2; tFar = t1;
      }

      // For transparency, not sure if it works
      if((t1 < ObjectConsts.EPSILON3 || t2 < ObjectConsts.EPSILON3) && ray.pos[1] < this.length && ray.pos[1] > 0) {
        tresult.inside = true;
      }

      // Clip cone between 0 and length
      const iNear: vec4 = ray.getPoint(tNear);
      const iFar: vec4 = ray.getPoint(tFar);

      // Total miss
      if((iNear[1] < 0 && iFar[1] < 0) || (iNear[1] > this.length && iFar[1] > this.length)) {
        return tresult;
      }

      // Some hit cases
      if(iFar[1] < this.length && iNear[1] < 0) { tresult.t = tFar; return tresult; }
      if(iNear[1] < this.length && iFar[1] < 0) { tresult.data = TResult.INSIDE; tresult.t = tNear; return tresult; }
      if(iNear[1] < 0 || iFar[1] < 0) return tresult;

      // Cap the end of the cone, it keeps us sane
      if(iNear[1] > this.length || iNear[1] < 0) {
        const capRayPos = vec4.fromValues(ray.pos[0], ray.pos[1] - this.length, ray.pos[2], 1);
        const capNorm = vec4.fromValues(0, 1, 0, 0);
        const denom: number = vec4.dot(capNorm, ray.dir);
        if (Math.abs(denom) > ObjectConsts.EPSILON3) {
          const l0: vec4 = vec4.sub(vec4.create(), [0, 0, 0, 1], capRayPos);
          const localT: number = vec4.dot(l0, capNorm) / denom;
          if (localT >= 0)  {
            tresult.data = TResult.TOP;
            tresult.t = localT;
            return tresult;
          }
        }
      }

      // Else hit nearest
      tresult.data = TResult.SIDE;
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
    if(!result.ray) return;

    // Intersection point
    const i: vec4 = result.ray.getPoint(result.t - ObjectConsts.EPSILON3);

    // Normal of a cone
    let n: vec4 = vec4.fromValues(0, 0, 0, 0);
    const m = Math.sqrt(i[0]*i[0] + i[2]*i[2]);
    n[0] = (i[0] / m) * (this.length * this.radius);
    n[1] = -(this.radius / this.length);
    n[2] = (i[2] / m) * (this.length * this.radius);

    let texIndex = 0;
    // Hit the bottom cap, the normal will just point down
    if(result.data == TResult.TOP) {
      n = vec4.fromValues(0, 1, 0, 0);
      texIndex = 1;
    }

    // Hit the inside of cone, flip normal
    if(result.data == TResult.INSIDE || result.inside) {
      n[0] = -n[0];
      n[1] = -n[1];
      n[2] = -n[2];
    }

    const texture = this.material.getTexture(texIndex);

    // Calc u,v texture coords
    let u = 0, v = 0;
    if(result.data == TResult.TOP) {
      // Treat the cap as a plane
      const ix = i[0] - this.radius; const iz = i[2] - this.radius;
      u = Math.abs((ix  % texture.scaleU) / texture.scaleU);
      v = Math.abs((iz  % texture.scaleV) / texture.scaleV);
    } else {
      // Treat the sides as a sphere where v = i.y
      u = Math.atan2(n[0], n[2]) / (2*Math.PI) + 0.5;
      u = (u % texture.scaleU) / texture.scaleU;
      v = i[1];
      v = 1 - ((v % texture.scaleV) / texture.scaleV);
      if(i[1] < 0) v = 1 - v;
    }

    // Move i back to world space
    vec4.transformMat4(i, i, this.transFwd);

    // Calc reflected ray about the normal, & move to world
    const r: vec4 = result.ray.reflect(n);
    vec4.transformMat4(r, r, this.transFwd);
    vec4.normalize(r, r);

    // Move normal into world
    vec4.transformMat4(n, n, this.transFwd);
    vec4.normalize(n, n);

    const hit: Hit = new Hit(i, n, r, u, v);
    return hit;
  }
}