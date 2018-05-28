//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { vec3 } from 'gl-matrix'

export interface Object3D {
  pos: vec3;
  size: number;
}