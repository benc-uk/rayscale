//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Texture } from './texture';
import { Colour } from './colour';

export class TextureBasic implements Texture {
  scaleU: number = 1;
  scaleV: number = 1;
  colour: Colour

  constructor(c: Colour) {
    this.colour = c;
  }

  static fromRGB(r: number, g: number, b: number) {
    return new TextureBasic(Colour.fromRGB(r, g, b));
  }

  // This texture is just a flat colour, same all over
  getColourAt(u: number, v: number): Colour {
    return this.colour;
  }
}