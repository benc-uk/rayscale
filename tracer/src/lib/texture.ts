//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Colour } from './colour';

export interface Texture {
  scaleU: number;
  scaleV: number;
  swapUV: boolean;
  flipU: boolean;
  flipV: boolean;

  getColourAt(u: number, v: number): Colour;
}