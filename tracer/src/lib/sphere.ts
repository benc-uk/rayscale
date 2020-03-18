//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Object3D, ObjectConsts } from './object3d';
import { Ray } from './ray';
import { vec4, mat4, quat } from 'gl-matrix';
import { Hit } from './hit';
import { Material } from './material';
import { Stats } from './stats';
import { TResult } from './t-result';

// ====================================================================================================
// Object representing a sphere
// - Centered at `pos` in world space, with radius `r`
// ====================================================================================================
export class Sphere implements Object3D {
  // Base properties
  name: string;
  trans: mat4;
  transFwd: mat4;
  material: Material;

  // Sphere properties
  pos: vec4;
  radius: number;
  r2: number;

  // ====================================================================================
  // Create a Sphere (called by Scene parser)
  // ====================================================================================
  constructor(pos: vec4, radius: number, name: string) {
    this.radius = radius;
    this.r2 = radius * radius;
    this.name = name;
    this.pos = pos;

    this.transFwd = mat4.identity(mat4.create());
    this.trans = mat4.identity(mat4.create());
    const rot: quat = quat.identity(quat.create());
    // We cheat here, and scale by 1, and do the scaling in the calcT (using r2)
    mat4.fromRotationTranslationScale(this.transFwd, rot, [pos[0], pos[1], pos[2]], [1, 1, 1]);
    mat4.invert(this.trans, this.transFwd);
    //mat4.transpose(this.transNormal, this.transFwd);
  }

  // ====================================================================================
  // Standard find intersection distance t required by all Object3D
  // ====================================================================================
  public calcT(inray: Ray): TResult {
    Stats.objectTests++;
    const ray: Ray = inray.transformNewRay(this.trans);
    const tresult = new TResult(0.0, ray);

    // Sphere at origin (0,0,0) so L simply becomes ray.pos, but with w=0
    const b: number = 2 * vec4.dot(ray.pos, ray.dir);
    const c: number = vec4.dot([ray.px, ray.py, ray.pz, 0], [ray.px, ray.py, ray.pz, 0]) - this.r2;
    let d: number = b * b - 4 * c;

    // Miss
    if (d <= 0.0)
      return tresult;

    d = Math.sqrt(d);
    const t1: number = (-b + d) / 2.0;
    const t2: number = (-b - d) / 2.0;

    // Ray is inside if there is only 1 positive root
    // Added for refractive transparency
    if(t1 < 0 || t2 < 0) {
      tresult.inside = true;
    }

    // Work out root to return
    if (t1 < 0 && t2 > 0) {
      tresult.t = t2; return tresult;
    }
    if (t2 < 0 && t1 > 0) {
      tresult.t = t1; return tresult;
    }

    if(t1 < t2) { tresult.t = t1; } else { tresult.t = t2; }
    return tresult;
  }

  // ====================================================================================
  // Standard getHitPoint details required by all Object3D
  // - Important! Input Ray should already be in object space
  // ====================================================================================
  public getHitPoint(result: TResult): Hit {
    // Intersection point
    const i: vec4 = result.ray.getPoint(result.t - ObjectConsts.EPSILON3);

    // Normal is pointing from center of sphere (0,0,0) to intersect (i)
    const n: vec4 = vec4.fromValues(0, 0, 0, 1);  //vec4.sub(vec4.create(), i, [0, 0, 0, 1]);
    vec4.div(n, i, [this.radius, this.radius, this.radius, 1]);
    n[3] = 0;

    if(result.inside) {
      n[0] = -n[0];
      n[1] = -n[1];
      n[2] = -n[2];
    }

    // Calc texture u, v coords on sphere (polar coordinates) and scale/wrap
    let u = Math.atan2(n[0], n[2]) / (2*Math.PI) + 0.5;
    u = (u % this.material.texture.scaleU) / this.material.texture.scaleU;
    let v = n[1] * 0.5 + 0.5;
    v = 1 - ((v % this.material.texture.scaleV) / this.material.texture.scaleV);

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