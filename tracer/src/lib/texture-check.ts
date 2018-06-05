//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Texture } from './texture';
import { Colour } from './colour';

export class TextureCheck implements Texture {
  scaleU: number;
  scaleV: number;

  getColourAt(u: number, v: number): Colour {
    return Colour.GREEN;
  }
}