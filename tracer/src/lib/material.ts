//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Colour } from './colour';

export class Material {
  colour: Colour;  // Base colour
  ka: number;     // Ambient light coefficient 
  kd: number;     // Diffuse light coefficient 
  ks: number;     // Specular light coefficient 
  hardness: number;   // Hardness for specular highlights
  kr: number;     // Reflection coefficient
}