//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import * as pngjs from 'pngjs';
import { Texture } from './texture';
import { Colour } from './colour';
import { TextureManager } from './texture-manager';
import { vec2, mat2 } from 'gl-matrix';
import { Utils } from './utils';

export class TextureImage implements Texture {
  swapUV: boolean;
  flipU: boolean;
  flipV: boolean;
  scaleU: number = 1;
  scaleV: number = 1;
  textureUrl: string;
  png: pngjs.PNG;

  // NOTE! Important texture is loaded into TextureManager first
  // We can't do that here, or we'd be in async/await/Promise hell
  constructor(url: string) {
    this.textureUrl = url;
    this.png = TextureManager.getInstance().getTexturePNG(this.textureUrl);
  }

  // This fetches pixel colour from texture at given uv point
  // Will carry out simple bilinear filter 
  getColourAt(u: number, v: number): Colour {

    if(this.flipU) u = (1 - u)
    if(this.flipV) v = (1 - v)
    
    // Tiny fudge factor here is not ideal, but it prevents seams
    let ui, vi: number;
    if(this.swapUV) {
      ui = (v * this.png.width * 0.99);
      vi = (u * this.png.height * 0.99);
    } else {
      ui = (u * this.png.width * 0.99);
      vi = (v * this.png.height * 0.99);
    }

    // Bilinear filtering from four points
    // Code taken from: https://en.wikipedia.org/wiki/Bilinear_filtering
    let x = Math.floor(ui);
    let y = Math.floor(vi);
    let uRatio = ui - x;
    let vRatio = vi - y;
    let uOpposite = 1 - uRatio;
    let vOpposite = 1 - vRatio;

    let c0 = Colour.fromPNGBuffer(this.png.data, this.png.width, x, y);
    let c1 = Colour.fromPNGBuffer(this.png.data, this.png.width, x+1, y);
    let c2 = Colour.fromPNGBuffer(this.png.data, this.png.width, x, y+1);
    let c3 = Colour.fromPNGBuffer(this.png.data, this.png.width, x+1, y+1);
    
    let r = (c0.r   * uOpposite  + c1.r   * uRatio) * vOpposite + (c2.r * uOpposite  + c3.r * uRatio) * vRatio;
    let g = (c0.g   * uOpposite  + c1.g   * uRatio) * vOpposite + (c2.g * uOpposite  + c3.g * uRatio) * vRatio;
    let b = (c0.b   * uOpposite  + c1.b   * uRatio) * vOpposite + (c2.b * uOpposite  + c3.b * uRatio) * vRatio;
    
    return new Colour(r, g, b);
  }

}