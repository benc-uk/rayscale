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

export class Cube implements Object3D {
  trans: mat4; 
  transFwd: mat4;
  size: number;
  name: string;
  norm: vec4;
  material: Material;
  static THRES: number = 0.0001;
  static FUDGE: number = 0.0001;
  b1 = [-0.5, -0.5, -0.5];
  b2 = [0.5, 0.5, 0.5];

  constructor(pos: vec4, rotation: vec3, name: string) {
    this.size = 8;
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

    let t = this.bastard(tRay)
    return new TResult(t, tRay);
  }

  public getHitPoint(t: number, ray: Ray): Hit {
    let i: vec4 = ray.getPoint(t - Cube.FUDGE);
    let EPS = 0.01;

    var n: vec4 = vec4.create();;
    if(Math.abs(i[0] - this.b1[0]) < EPS) 
      n = vec4.fromValues(-1, 0, 0, 0);
    else if(Math.abs(i[0] - this.b2[0]) < EPS) 
      n = vec4.fromValues(1, 0, 0, 0);
    else if(Math.abs(i[1] - this.b1[1]) < EPS) 
      n = vec4.fromValues(0, -1, 0, 0);
    else if(Math.abs(i[1] - this.b2[1]) < EPS) 
      n = vec4.fromValues(0, 1, 0, 0);
    else if(Math.abs(i[2] - this.b1[2]) < EPS) 
      n = vec4.fromValues(0, 0, -1, 0);
    else if(Math.abs(i[2] - this.b2[2]) < EPS) 
      n = vec4.fromValues(0, 0, 1, 0);

    let u = 0; let v = 0;

    // move i back to world space
    vec4.transformMat4(i, i, this.transFwd);

    // calc reflected ray about the normal, & move to world
    let r: vec4 = ray.reflect(this.norm);
    vec4.transformMat4(r, r, this.transFwd);
    vec4.normalize(r, r);   

    // Move normal into world
    vec4.transformMat4(n, n, this.transFwd);
    vec4.normalize(n, n);
    
    let hit: Hit = new Hit(i, this.norm, r, u, v);
    //console.log(n);
    return hit;
  }

  private bastard(ray: Ray) {
    let t1, t2, tnear = -100000.0, tfar = 100000.0, temp, tCube;
    let intersectFlag: boolean = true;

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
    if (intersectFlag == false)
      tCube = -1;
    else
      tCube = tnear;

    return tCube;
  }


  /*
  private intersect(ray: Ray): number { 
      float tmin, tmax, tymin, tymax, tzmin, tzmax; 

      let tmin  = (bounds[r.sign[0]].x   - r.orig.x) * r.invdir.x; 
      let tmax  = (bounds[1-r.sign[0]].x - r.orig.x) * r.invdir.x; 
      let tymin = (bounds[r.sign[1]].y   - r.orig.y) * r.invdir.y; 
      let tymax = (bounds[1-r.sign[1]].y - r.orig.y) * r.invdir.y; 

      if ((tmin > tymax) || (tymin > tmax)) 
          return false; 

      if (tymin > tmin) 
      tmin = tymin; 
      if (tymax < tmax) 
      tmax = tymax; 

      tzmin = (bounds[r.sign[2]].z - r.orig.z) * r.invdir.z; 
      tzmax = (bounds[1-r.sign[2]].z - r.orig.z) * r.invdir.z; 

      if ((tmin > tzmax) || (tzmin > tmax)) 
          return false; 

      if (tzmin > tmin) 
      tmin = tzmin; 
      if (tzmax < tmax) 
      tmax = tzmax; 

      t = tmin; 

      if (t < 0) { 
          t = tmax; 
          if (t < 0) return 0; 
      } 

      return t; 
  } 
  */

    /*private checkCubeSide(side: number, tRay: Ray): TResult {
    let norm = this.sides[side].norm;
    let sidePos = vec4.create();
    vec4.add(sidePos, tRay.pos, this.sides[side].offset);

    let denom: number = vec4.dot(norm, tRay.dir);
    if (Math.Math.abs(denom) > Cube.THRES) {
        let l0: vec4 = vec4.sub(vec4.create(), [0, 0, 0, 1], sidePos);
        let t: number = vec4.dot(l0, norm) / denom;
        if (t >= 0)  {
          let i: vec4 = tRay.getPoint(t - Cube.FUDGE);
          if(i[0] < -0.5 || i[0] > 0.5) return new TResult(0.0, tRay);
          if(i[1] < -0.5 || i[1] > 0.5) return new TResult(0.0, tRay);
          if(i[2] < -0.5 || i[2] > 0.5) return new TResult(0.0, tRay);
          return new TResult(t, tRay); 
        }
    }
    return new TResult(0.0, tRay); 
  }*/
}