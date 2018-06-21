//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Texture } from './texture';

export class Material {
  texture: Texture;   // Texture object
  ka: number;         // Ambient light coefficient 
  kd: number;         // Diffuse light coefficient 
  ks: number;         // Specular light coefficient 
  hardness: number;   // Hardness for specular highlights
  kr: number;         // Reflection coefficient
  kt: number;         // Transparency
  ior: number;        // Index of refraction 
  noShade: boolean    // If true, no lighting calcs will be done

  constructor (ka: number, kd: number, ks: number, hardness: number, kr: number, kt: number) {
    this.ka = ka;
    this.kd = kd;
    this.ks = ks;
    this.hardness = hardness;
    this.kr = kr;
    this.noShade = false;
    this.kt = kt;
    this.ior = 1.0
  }

  public copy() {
    return Object.assign({}, this); 
  }
}