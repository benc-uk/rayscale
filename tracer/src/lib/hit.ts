//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { vec4 } from 'gl-matrix'

export class Hit {
  public intersection: vec4;  // Intersection point in world space (point with w=1)
  public normal: vec4;        // Normal at intersection point (normalized vector)
  public reflected: vec4;     // Reflected ray direction (normalized vector)
  public u: number = 1;       // Texture coords; u
  public v: number = 1;       // Texture coords; v

  constructor(int: vec4, norm: vec4, refl: vec4, texu: number, texv: number) {
    this.intersection = int;
    this.normal = norm;
    this.reflected = refl;
    this.u = texu;
    this.v = texv;
  }
}