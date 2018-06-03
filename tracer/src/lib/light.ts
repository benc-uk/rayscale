//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Colour } from './colour';
import { vec4 } from 'gl-matrix';

export class Light {
  pos: vec4;
  colour: Colour;

  brightness: number;
  falloff: number;

  constructor(pos: vec4) {
    this.pos = pos;
  }
}