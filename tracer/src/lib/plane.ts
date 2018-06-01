//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Object3D } from './object3d';
import { Ray } from './ray';
import { vec3, mat4 } from 'gl-matrix';
import { Hit } from './hit';
import { Colour } from './colour';
import { Material } from './material';

export class Plane implements Object3D {
  trans: mat4;
  pos: vec3;
  size: number;
  name: string;
  material: Material;
  static THRES: number = 0.001;

  constructor(pos: vec3, r: number, name: string) {
    this.size = r;
    this.name = name;

    this.trans = mat4.create();
    mat4.fromTranslation(this.trans, pos);
    mat4.invert(this.trans, this.trans);
    this.pos = pos;
  }

  public calcT(ray: Ray): number {
    return 0.0;
  }

  public getHitPoint(t: number, ray: Ray): Hit {
    let i: vec3 = ray.getPoint(t - 0.001);

    // Normal WORK ON THIS
    let n: vec3 = vec3.create();

    let r: vec3 = ray.reflect(n);
    
    let hit: Hit = new Hit(i, n, r);
    return hit;
  }
}