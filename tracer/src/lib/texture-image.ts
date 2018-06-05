//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Texture } from './texture';
import { Colour } from './colour';

export class TextureImage implements Texture {
  scaleU: number = 1;
  scaleV: number = 1;
  textureName: string;
  buffer: Buffer;

  constructor(texture: string) {
    this.textureName = texture;
  }

  // This texture is just a flat colour, same all over
  getColourAt(u: number, v: number): Colour {
    let tx = Math.floor(u * 512);
    let ty = Math.floor(v * 512);
    var idx = (512 * ty + tx) << 2;

    return Colour.fromRGB(this.buffer[idx], this.buffer[idx+1], this.buffer[idx+2]);
  }
}