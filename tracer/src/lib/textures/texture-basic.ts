//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Texture } from './texture';
import { Colour } from '../colour';

export class TextureBasic extends Texture {
  colour: Colour;

  constructor(c: Colour) {
    super();
    this.colour = c;
    this.scaleU = 1;
    this.scaleV = 1;
  }

  static fromRGB(r: number, g: number, b: number): TextureBasic {
    return new TextureBasic(Colour.fromRGB(r, g, b));
  }

  // This texture is just a flat colour, same all over
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getColourAt(u: number, v: number): Colour {
    return this.colour;
  }
}