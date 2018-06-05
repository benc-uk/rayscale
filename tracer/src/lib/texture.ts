//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Colour } from './colour';

export interface Texture {
  scaleU: number;
  scaleV: number;

  getColourAt(u: number, v: number): Colour;
}