//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018, 2020
//

import { Object3D, ObjectConsts } from './object3d';
import { Ray } from '../ray';
import { vec3, vec4 } from 'gl-matrix';
import { Hit } from '../hit';
import { Stats } from '../stats';
import { TResult } from '../t-result';
import { Animation } from '../animation';

// ====================================================================================================
// Object representing a sphere
// - Centered at `pos` in world space, with radius `r`
// ====================================================================================================
export class Sphere extends Object3D {
  // Sphere properties
  radius: number;
  r2: number;

  // ====================================================================================
  // Create a Sphere (called by Scene parser)
  // ====================================================================================
  constructor(pos: vec3, radius: number, name: string, time: number, anims: Animation[]) {
    // Rotation is ignored
    // TODO: Investgate rotation with textures
    super(name, pos, vec3.create(), time, anims);
    this.radius = radius;
    this.r2 = radius * radius;
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

    const texture = this.material.getTexture();

    // Calc texture u, v coords on sphere (polar coordinates) and scale/wrap
    let u = Math.atan2(n[0], n[2]) / (2*Math.PI) + 0.5;
    u = (u % texture.scaleU) / texture.scaleU;
    let v = n[1] * 0.5 + 0.5;
    v = 1 - ((v % texture.scaleV) / texture.scaleV);

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