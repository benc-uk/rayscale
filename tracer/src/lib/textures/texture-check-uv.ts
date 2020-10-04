//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018, Updated Oct 2020
//

import { Texture } from './texture';
import { Colour } from '../colour';

const ENABLE_AA = true;

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
    if((u > 0.5 && v > 0.5) || (u < 0.5 && v < 0.5)) {
      return this.colour2;
    }

    // Fake anti-aliasing, it's hacky but does look better than nothing
    if(ENABLE_AA){
      const thres = 1 / (this.scaleU * 10) ;
      const thresRecip = 1 / thres;

      if(u < thres) {
        return this.colour2.mixAndMultNew(this.colour1, (u * thresRecip));
      }
      let ud = 1 - u;
      if(ud < thres) {
        return this.colour2.mixAndMultNew(this.colour1, (ud * thresRecip));
      }
      ud = 0.5 - u;
      if(ud < thres && u < 0.5) {
        return this.colour2.mixAndMultNew(this.colour1, (ud * thresRecip));
      }
      ud = u - 0.5;
      if(ud < thres && u > 0.5) {
        return this.colour2.mixAndMultNew(this.colour1, (ud * thresRecip));
      }

      if(v < thres) {
        return this.colour2.mixAndMultNew(this.colour1, (v * thresRecip));
      }
      let vd = 1 - v;
      if(vd < thres) {
        return this.colour2.mixAndMultNew(this.colour1, (vd * thresRecip));
      }
      vd = 0.5 - v;
      if(vd < thres && v < 0.5) {
        return this.colour2.mixAndMultNew(this.colour1, (vd * thresRecip));
      }
      vd = v - 0.5;
      if(vd < thres && v > 0.5) {
        return this.colour2.mixAndMultNew(this.colour1, (vd * thresRecip));
      }
    }

    return this.colour1;
  }
}