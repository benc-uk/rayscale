//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import * as pngjs from 'pngjs';
import { Texture } from './texture';
import { Colour } from '../colour';
import { PngManager } from '../png-manager';

export class TextureImage extends Texture {
  swapUV: boolean;
  flipU: boolean;
  flipV: boolean;
  scaleU = 1;
  scaleV = 1;
  textureUrl: string;
  png: pngjs.PNG;

  // ====================================================================================================
  // Important, texture is loaded into TextureManager first
  // We can't do that here, or we'd be in async/await/Promise hell
  // ====================================================================================================
  constructor(url: string) {
    super();
    this.textureUrl = url;
    this.png = PngManager.getInstance().getTexturePNG(this.textureUrl);
  }

  // ====================================================================================================
  // This fetches pixel colour from texture at given uv point
  // Will carry out simple bilinear filter
  // ====================================================================================================
  getColourAt(u: number, v: number): Colour {
    if(this.flipU) u = (1 - u);
    if(this.flipV) v = (1 - v);

    // NOTE: Tiny fudge factor here is not ideal, but it prevents seams
    let ui, vi: number;
    //(1 - 1/this.scaleV));
    if(this.swapUV) {
      ui = (v * this.png.width * 0.999);
      vi = (u * this.png.height * 0.999);
    } else {
      ui = (u * this.png.width * 0.999);
      vi = (v * this.png.height * 0.999);
    }

    // Bilinear filtering from four points
    // Code taken from: https://en.wikipedia.org/wiki/Bilinear_filtering
    const x = Math.floor(ui);
    const y = Math.floor(vi);
    const uRatio = ui - x;
    const vRatio = vi - y;
    const uOpposite = 1 - uRatio;
    const vOpposite = 1 - vRatio;

    const c0 = Colour.fromPNGBuffer(this.png.data, this.png.width, x, y);
    const c1 = Colour.fromPNGBuffer(this.png.data, this.png.width, x+1, y);
    const c2 = Colour.fromPNGBuffer(this.png.data, this.png.width, x, y+1);
    const c3 = Colour.fromPNGBuffer(this.png.data, this.png.width, x+1, y+1);

    const r = (c0.r   * uOpposite  + c1.r   * uRatio) * vOpposite + (c2.r * uOpposite  + c3.r * uRatio) * vRatio;
    const g = (c0.g   * uOpposite  + c1.g   * uRatio) * vOpposite + (c2.g * uOpposite  + c3.g * uRatio) * vRatio;
    const b = (c0.b   * uOpposite  + c1.b   * uRatio) * vOpposite + (c2.b * uOpposite  + c3.b * uRatio) * vRatio;

    return new Colour(r, g, b);
  }

}