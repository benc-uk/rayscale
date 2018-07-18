//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Texture } from './texture';
import { Colour } from './colour';

export class TextureCheckSolid extends Texture {
  solid: boolean = true;
  colour1: Colour;
  colour2: Colour;
  scale: number[];

  constructor(scale: number[], c1: Colour, c2: Colour) {
    super();
    this.colour1 = c1;
    this.colour2 = c2;
  }

  // ====================================================================================================
  // Solid 3D version of check pattern 
  // ====================================================================================================
  getColourAtSolid(x: number, y: number, z: number): Colour {
    //if((u > 0.5 && v > 0.5) || (u < 0.5 && v < 0.5)) return this.colour2;
    return this.colour1;
  }
}