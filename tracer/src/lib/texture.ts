//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Colour } from './colour';

export abstract class Texture {
  solid: boolean = false;
  scaleU: number = 1;     // Scaling factor of u in texture space
  scaleV: number = 1;     // Scaling factor of v in texture space

  getColourAt(u: number, v: number): Colour {
    throw new Error('Not implemented')
  };

  getColourAtSolid(x: number, y: number, z: number): Colour {
    throw new Error('Not implemented');
  }
}