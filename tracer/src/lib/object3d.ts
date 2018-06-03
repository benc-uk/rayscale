//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { mat4 } from 'gl-matrix';
import { Ray } from './ray';
import { Hit } from './hit';
import { Colour } from './colour';
import { Material } from './material';

export interface Object3D {
  trans: mat4;          // Inverse transform matrix to move rays into object space
  transFwd: mat4;       // Forward transform matrix to move rays from object to world space
  size: number;         // Size, not used for all objects
  name: string;         // Name, not used yet
  material: Material;   // Material; color and other surface coefficients 

  calcT(ray: Ray): any;
  getHitPoint(t: number, ray: Ray): Hit;
}