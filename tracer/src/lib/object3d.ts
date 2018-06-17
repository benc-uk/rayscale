//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { mat4 } from 'gl-matrix';
import { Ray } from './ray';
import { Hit } from './hit';
import { Material } from './material';
import { TResult } from './t-result';

// ====================================================================================
// Base interface all objects inherit from 
// ====================================================================================
export interface Object3D {
  trans: mat4;          // Inverse transform matrix to move rays into object space
  transFwd: mat4;       // Forward transform matrix to move rays from object to world space
  name: string;         // Name, not used yet
  material: Material;   // Material; color and other surface coefficients 
  
  calcT(ray: Ray): TResult;
  getHitPoint(result: TResult): Hit;
}

// ====================================================================================
// Global static consts, and magic numbers
// ====================================================================================
export class ObjectConsts {
  // We use epsilon tolerance values to stop artefacts and other floating point weirdness
  static EPSILON2: number = 0.01;
  static EPSILON3: number = 0.001;
  static EPSILON4: number = 0.0001;
  static EPSILON5: number = 0.00001;
}