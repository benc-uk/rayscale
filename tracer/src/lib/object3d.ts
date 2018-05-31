//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { vec3 } from 'gl-matrix';
import { mat4 } from 'gl-matrix';
import { Ray } from './ray';
import { Hit } from './hit';

export interface Object3D {
  trans: mat4;
  size: number;
  name: string;

  calcT(ray: Ray): number;
  getHitPoint(t: number, ray: Ray): Hit;
}