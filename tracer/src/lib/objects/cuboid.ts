//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Object3D, ObjectConsts } from './object3d';
import { Ray } from '../ray';
import { vec3, vec4 } from 'gl-matrix';
import { Hit } from '../hit';
import { Stats } from '../stats';
import { TResult } from '../t-result';
import { Animation } from '../animation';

// ====================================================================================================
// Object representing a cuboid (3d rectangle)
// - Centred at `pos`, cuboid extends along each axis as per the `size` vector
// ====================================================================================================
export class Cuboid extends Object3D {
  private b1: number[] = [];
  private b2: number[] = [];

  // ====================================================================================================
  // Create a Cuboid (called by Scene parser)
  // ====================================================================================================
  constructor(pos: vec3, rot: vec3, size: vec3, name: string, time: number, anims: Animation[]) {
    super(name, pos, rot, time, anims);
    this.b1 = [-size[0]/2, -size[1]/2, -size[2]/2];
    this.b2 = [size[0]/2, size[1]/2, size[2]/2];
  }

  public calcT(inray: Ray): TResult {
    Stats.objectTests++;
    const ray: Ray = inray.transformNewRay(this.trans);

    let t1, t2, tnear = -Number.MAX_VALUE, tfar = Number.MAX_VALUE, temp;
    let intersectFlag = true;
    const result: TResult = new TResult(0.0, ray);
    // Code stolen from
    // http://ray-tracing-conept.blogspot.com/2015/01/ray-box-intersection-and-normal.html
    for (let i = 0; i < 3; i++) {
      if (ray.dir[i] == 0) {
        if (ray.pos[i] < this.b1[i] || ray.pos[i] > this.b2[i])
          intersectFlag = false;
      } else {
        t1 = (this.b1[i] - ray.pos[i]) / ray.dir[i];
        t2 = (this.b2[i] - ray.pos[i]) / ray.dir[i];
        if (t1 > t2) {
          temp = t1;
          t1 = t2;
          t2 = temp;
        }
        if (t1 > tnear)
          tnear = t1;
        if (t2 < tfar)
          tfar = t2;
        if (tnear > tfar)
          intersectFlag = false;
        if (tfar < 0)
          intersectFlag = false;
      }
    }
    if (intersectFlag) {
      // Now we handle if we're inside the cuboid
      if(tnear < 0) {
        result.t = tfar;
        result.inside = true;
      } else
        result.t = tnear;
    }

    return result;
  }

  public getHitPoint(result: TResult): Hit {
    const i: vec4 = result.ray.getPoint(result.t - ObjectConsts.EPSILON5);

    // Normal
    // Code stolen from
    // http://ray-tracing-conept.blogspot.com/2015/01/ray-box-intersection-and-normal.html
    let n: vec4 = vec4.create();
    let texIndex = 0;
    if(Math.abs(i[0] - this.b1[0]) < ObjectConsts.EPSILON4) {
      n = vec4.fromValues(-1, 0, 0, 0);
      texIndex = 0;
    }
    else if(Math.abs(i[0] - this.b2[0]) < ObjectConsts.EPSILON4) {
      n = vec4.fromValues(1, 0, 0, 0);
      texIndex = 1;
    }
    else if(Math.abs(i[1] - this.b1[1]) < ObjectConsts.EPSILON4) {
      n = vec4.fromValues(0, -1, 0, 0);
      texIndex = 2;
    }
    else if(Math.abs(i[1] - this.b2[1]) < ObjectConsts.EPSILON4) {
      n = vec4.fromValues(0, 1, 0, 0);
      texIndex = 3;
    }
    else if(Math.abs(i[2] - this.b1[2]) < ObjectConsts.EPSILON4) {
      n = vec4.fromValues(0, 0, -1, 0);
      texIndex = 4;
    }
    else if(Math.abs(i[2] - this.b2[2]) < ObjectConsts.EPSILON4) {
      n = vec4.fromValues(0, 0, 1, 0);
      texIndex = 5;
    }

    // Flip normals if inside
    if(result.inside) {
      n[0] = -n[0];
      n[1] = -n[1];
      n[2] = -n[2];
    }

    const texture = this.material.getTexture(texIndex);

    // Best orientation of u & v on the sides I can manage
    let u, v = 0;
    if(Math.abs(n[0]) > 0) {
      const iz = i[2] - this.b2[2]; const iy = i[1] - this.b2[1];
      u = Math.abs((iz % texture.scaleU) / texture.scaleU);
      v = Math.abs((iy % texture.scaleV) / texture.scaleV);
    }
    else if(Math.abs(n[1]) > 0) {
      const ix = i[0] - this.b2[0]; const iz = i[2] - this.b2[2];
      u = Math.abs((ix  % texture.scaleU) / texture.scaleU);
      v = Math.abs((iz  % texture.scaleV) / texture.scaleV);
    }
    else if(Math.abs(n[2]) > 0) {
      const ix = i[0] - this.b2[0]; const iy = i[1] - this.b2[1];
      u = Math.abs((ix % texture.scaleU) / texture.scaleU);
      v = Math.abs((iy % texture.scaleV) / texture.scaleV);
    }

    // move i back to world space
    vec4.transformMat4(i, i, this.transFwd);

    // calc reflected ray about the normal, & move to world
    const r: vec4 = result.ray.reflect(n);
    vec4.transformMat4(r, r, this.transFwd);
    vec4.normalize(r, r);

    // Move normal into world
    vec4.transformMat4(n, n, this.transFwd);
    //vec4.normalize(n, n);

    const hit: Hit = new Hit(i, n, r, u, v, texIndex);
    return hit;
  }
}