//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Object3D, ObjectConsts } from './object3d';
import { Ray } from './ray';
import { vec3, vec4, mat4, quat } from 'gl-matrix';
import { Hit } from './hit';
import { Material } from './material';
import { Utils } from './utils';
import { Stats } from './stats';
import { TResult } from './t-result';

// ====================================================================================================
// Object representing a cuboid
// - Centred at `pos`, cuboid extends along each axis as per the `size` vector
// ====================================================================================================
export class Cuboid implements Object3D {
  trans: mat4; 
  transFwd: mat4;
  name: string;
  material: Material;
  b1: number[] = [];
  b2: number[] = [];

  // ====================================================================================================
  // Create a Cuboid (called by Scene parser)
  // ====================================================================================================
  constructor(pos: vec4, rotation: vec3, size: vec3, name: string) {
    this.name = name;
    this.b1 = [-size[0]/2, -size[1]/2, -size[2]/2];
    this.b2 = [size[0]/2, size[1]/2, size[2]/2];

    this.transFwd = mat4.identity(mat4.create());
    this.trans = mat4.identity(mat4.create());
    let rot: quat = quat.identity(quat.create());
    quat.rotateX(rot, rot, Utils.degreeToRad(rotation[0]));
    quat.rotateY(rot, rot, Utils.degreeToRad(rotation[1]));
    quat.rotateZ(rot, rot, Utils.degreeToRad(rotation[2])); 
    // We cheat here, and scale by 1, and do the scaling with the box coords
    mat4.fromRotationTranslationScale(this.transFwd, rot, [pos[0], pos[1], pos[2]], [1, 1, 1]);
    mat4.invert(this.trans, this.transFwd);
  }

  public calcT(inray: Ray): TResult {
    Stats.objectTests++;
    let ray: Ray = inray.transformNewRay(this.trans);

    let t1, t2, tnear = -100000.0, tfar = 100000.0, temp, tCube;
    let intersectFlag: boolean = true;

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
    if (intersectFlag == false)
      tCube = -1;
    else
      tCube = tnear;

    return new TResult(tCube, ray);
  }

  public getHitPoint(result: TResult): Hit {
    let i: vec4 = result.ray.getPoint(result.t);// - ObjectConsts.EPSILON3);

    // Normal 
    // Code stolen from 
    // http://ray-tracing-conept.blogspot.com/2015/01/ray-box-intersection-and-normal.html    
    var n: vec4 = vec4.create();;
    if(Math.abs(i[0] - this.b1[0]) < ObjectConsts.EPSILON4) 
      n = vec4.fromValues(-1, 0, 0, 0);
    else if(Math.abs(i[0] - this.b2[0]) < ObjectConsts.EPSILON4) 
      n = vec4.fromValues(1, 0, 0, 0);
    else if(Math.abs(i[1] - this.b1[1]) < ObjectConsts.EPSILON4) 
      n = vec4.fromValues(0, -1, 0, 0); 
    else if(Math.abs(i[1] - this.b2[1]) < ObjectConsts.EPSILON4) 
      n = vec4.fromValues(0, 1, 0, 0);
    else if(Math.abs(i[2] - this.b1[2]) < ObjectConsts.EPSILON4) 
      n = vec4.fromValues(0, 0, -1, 0);
    else if(Math.abs(i[2] - this.b2[2]) < ObjectConsts.EPSILON4) 
      n = vec4.fromValues(0, 0, 1, 0);

    // Best orientation of u & V on the sides I can manage
    let u, v = 0;
    if(Math.abs(n[0]) > 0) {
      let iz = i[2] - this.b2[2]; let iy = i[1] - this.b2[1];
      u = Math.abs((iz % this.material.texture.scaleU) / this.material.texture.scaleU);
      v = Math.abs((iy % this.material.texture.scaleV) / this.material.texture.scaleV);
    }   
    else if(Math.abs(n[1]) > 0) {
      let ix = i[0] - this.b2[0]; let iz = i[2] - this.b2[2];
      u = Math.abs((ix  % this.material.texture.scaleU) / this.material.texture.scaleU);
      v = Math.abs((iz  % this.material.texture.scaleV) / this.material.texture.scaleV);
    }
    else if(Math.abs(n[2]) > 0) {
      let ix = i[0] - this.b2[0]; let iy = i[1] - this.b2[1];
      u = Math.abs((ix % this.material.texture.scaleU) / this.material.texture.scaleU);
      v = Math.abs((iy % this.material.texture.scaleV) / this.material.texture.scaleV);
    }         

    // move i back to world space
    vec4.transformMat4(i, i, this.transFwd);

    // calc reflected ray about the normal, & move to world
    let r: vec4 = result.ray.reflect(n);
    vec4.transformMat4(r, r, this.transFwd);
    vec4.normalize(r, r);   

    // Move normal into world
    vec4.transformMat4(n, n, this.transFwd);
    //vec4.normalize(n, n);
    
    let hit: Hit = new Hit(i, n, r, u, v);
    return hit;
  }
}