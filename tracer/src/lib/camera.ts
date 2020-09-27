//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2020
//

import { mat4, vec3, vec4 } from 'gl-matrix';
import { Ray } from './ray';

export class Camera {
  pos: vec3;      // Camera position in world
  lookAt: vec3;   // Camera look at point
  FOV: number;    // Camera field of view in radians
  trans: mat4;    // Transform to make camera rays

  constructor(pos: vec3, lookAt: vec3, FOV: number) {
    this.pos = pos;
    this.lookAt = lookAt;
    this.FOV = FOV;

    // NOTE: The standard up vector [0,1,0]
    this.trans = mat4.lookAt(mat4.create(), this.pos, this.lookAt, [0, 1, 0]);
    mat4.invert(this.trans, this.trans);
  }

  public makeRay(x: number, y: number, imageWidth: number, imageHeight: number, fovScale: number, aspectRatio: number): Ray {
    // This converts from raster space (output image) -> normalized space -> screen space
    const px: number = (2 * (x + 0.5) / imageWidth - 1) * fovScale  * aspectRatio;
    const py: number = (1 - 2 * (y + 0.5) / imageHeight) * fovScale;

    // Create camera ray, starting at origin and pointing into -z
    const origin: vec4 = vec4.fromValues(0.0, 0.0, 0.0, 1);
    const dir: vec4 = vec4.fromValues(px, py, -1.0, 0);
    const ray: Ray = new Ray(origin, dir);

    // Now move ray with respect to camera transform (into world space)
    ray.transform(this.trans);
    ray.depth = 1;

    return ray;
  }
}
