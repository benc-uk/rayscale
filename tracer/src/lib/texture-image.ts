//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import * as pngjs from 'pngjs';
import { Texture } from './texture';
import { Colour } from './colour';
import { TextureManager } from './texture-manager';

export class TextureImage implements Texture {
  scaleU: number = 1;
  scaleV: number = 1;
  textureUrl: string;
  png: pngjs.PNG;

  constructor(url: string) {
    this.textureUrl = url;
    this.png = TextureManager.getInstance().getTexturePNG(this.textureUrl);
  }

  // This texture is just a flat colour, same all over
  getColourAt(u: number, v: number): Colour {

    // Tiny fudge factor here is not ideal, but it prevents seems
    let ui = (u * this.png.width * 0.99);
    let vi = (v * this.png.height * 0.99);
    let x = Math.floor(ui);
    let y = Math.floor(vi);
    let u_ratio = ui - x;
    let v_ratio = vi - y;
    let u_opposite = 1 - u_ratio;
    let v_opposite = 1 - v_ratio;

    let c0 = Colour.fromPNGBuffer(this.png.data, this.png.width, x, y);
    let c1 = Colour.fromPNGBuffer(this.png.data, this.png.width, x+1, y);
    let c2 = Colour.fromPNGBuffer(this.png.data, this.png.width, x, y+1);
    let c3 = Colour.fromPNGBuffer(this.png.data, this.png.width, x+1, y+1);
    
    let r = (c0.r   * u_opposite  + c1.r   * u_ratio) * v_opposite + (c2.r * u_opposite  + c3.r * u_ratio) * v_ratio;
    let g = (c0.g   * u_opposite  + c1.g   * u_ratio) * v_opposite + (c2.g * u_opposite  + c3.g * u_ratio) * v_ratio;
    let b = (c0.b   * u_opposite  + c1.b   * u_ratio) * v_opposite + (c2.b * u_opposite  + c3.b * u_ratio) * v_ratio;
    
    return new Colour(r, g, b);
  }

}
/*
double getBilinearFilteredPixelColor(Texture tex, double u, double v) {
   u = u * tex.size - 0.5;
   v = v * tex.size - 0.5;
   int x = floor(u);
   int y = floor(v);
   double u_ratio = u - x;
   double v_ratio = v - y;
   double u_opposite = 1 - u_ratio;
   double v_opposite = 1 - v_ratio;
   double result = (tex[x][y]   * u_opposite  + tex[x+1][y]   * u_ratio) * v_opposite + 
                   (tex[x][y+1] * u_opposite  + tex[x+1][y+1] * u_ratio) * v_ratio;
   return result;
 }
 */