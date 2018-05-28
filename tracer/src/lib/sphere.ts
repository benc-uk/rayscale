//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Object3D } from './object3d';
import { vec3 } from 'gl-matrix';

class Sphere implements Object3D {
  pos: vec3;
  size: number;
}