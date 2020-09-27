//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Texture } from './textures/texture';

export class Material {
  textures: Texture[];   // Texture object
  ka: number;            // Ambient light coefficient
  kd: number;            // Diffuse light coefficient
  ks: number;            // Specular light coefficient
  hardness: number;      // Hardness for specular highlights
  kr: number;            // Reflection coefficient
  kt: number;            // Transparency
  ior: number;           // Index of refraction
  noShade: boolean;      // If true, no lighting calcs will be done

  constructor (ka: number, kd: number, ks: number, hardness: number, kr: number, kt: number) {
    this.ka = ka;
    this.kd = kd;
    this.ks = ks;
    this.hardness = hardness;
    this.kr = kr;
    this.noShade = false;
    this.kt = kt;
    this.ior = 1.0;
    this.textures = new Array<Texture>();

    // Needed for JavaScript reasons
    this.getTexture = this.getTexture.bind(this);
  }

  public copy(): Material {
    return Object.assign({}, this);
  }

  public getTexture(texIndex = 0): Texture {
    // Fallback to first texture if texture list bound exceeded
    if(texIndex > this.textures.length - 1) {
      return this.textures[0];
    }

    return this.textures[texIndex];
  }
}