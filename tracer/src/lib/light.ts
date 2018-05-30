//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Colour } from './colour';
import { vec3 } from 'gl-matrix';

export class Light {
  pos: vec3;
  colour: Colour;

  brightness: number;
  falloff: number;
}