//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Texture } from './texture';
import { Colour } from './colour';

export class TextureCheckUV extends Texture {
  colour1: Colour;
  colour2: Colour;

  constructor(c1: Colour, c2: Colour) {
    super();
    this.colour1 = c1;
    this.colour2 = c2;
  }

  // This texture is alternating square checks of two colours 
  getColourAt(u: number, v: number): Colour {
    if((u > 0.5 && v > 0.5) || (u < 0.5 && v < 0.5)) return this.colour2;
    return this.colour1;
  }
}