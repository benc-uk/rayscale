//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Texture } from './texture';

export class Material {
  texture: Texture;   // Texture
  ka: number;         // Ambient light coefficient 
  kd: number;         // Diffuse light coefficient 
  ks: number;         // Specular light coefficient 
  hardness: number;   // Hardness for specular highlights
  kr: number;         // Reflection coefficient
  noShade: boolean

  constructor (ka: number, kd: number, ks: number, hardness: number, kr: number) {
    this.ka = ka;
    this.kd = kd;
    this.ks = ks;
    this.hardness = hardness;
    this.kr = kr;
    this.noShade = false;
  }

  public copy() {
    return Object.assign({}, this); 
  }
}