//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Object3D } from './object3d';
import { Ray } from './ray';
import { vec3, vec4, mat4 } from 'gl-matrix';
import { Hit } from './hit';
import { Colour } from './colour';
import { Material } from './material';

export class Sphere implements Object3D {
  trans: mat4;
  pos: vec4;
  size: number;
  r2: number;
  name: string;
  material: Material;
  static THRES: number = 0.001;

  constructor(pos: vec4, r: number, name: string) {
    //this.size = r;
    this.r2 = r * r;
    this.name = name;

    this.trans = mat4.create();
    mat4.fromTranslation(this.trans, [pos[0], pos[1], pos[2]]);
    mat4.invert(this.trans, this.trans);
    this.pos = pos;
  }

  public calcT(ray: Ray): number {
    let rPos: vec4 = vec4.clone(ray.pos);
    let rDir: vec4 = vec4.clone(ray.dir);

    vec4.transformMat4(rPos, ray.pos, this.trans);
    let b: number = 2.0 * vec4.dot(rPos, rDir);
    //let c: number = vec4.dot(rPos, rPos) - this.r2;
    let c: number = vec3.dot([rPos[0], rPos[1], rPos[2]], [rPos[0], rPos[1], rPos[2]]) - this.r2;
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
    let i: vec4 = ray.getPoint(t - 0.001);

    // Normal is pointing from center of sphere (pos) to intersect (i)
    let n: vec4 = vec4.sub(vec4.create(), i, this.pos);
    vec4.normalize(n, n);

    let r: vec4 = ray.reflect(n);
    
    let hit: Hit = new Hit(i, n, r);
    return hit;
  }
}