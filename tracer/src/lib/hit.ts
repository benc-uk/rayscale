//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { vec4 } from 'gl-matrix';

export class Hit {
  public intersection: vec4;  // Intersection point in world space (point with w=1)
  public normal: vec4;        // Normal at intersection point (normalized vector)
  public reflected: vec4;     // Reflected ray direction (normalized vector)
  public u = 1;               // Texture coords; u
  public v = 1;               // Texture coords; v
  public textureIndex = 0;    // Used for multi-texture objects (like skybox/cubes)

  constructor(int: vec4, norm: vec4, refl: vec4, texu: number, texv: number, texIndex = 0) {
    this.intersection = int;
    this.normal = norm;
    this.reflected = refl;
    this.u = texu;
    this.v = texv;
    this.textureIndex = texIndex;
  }
}