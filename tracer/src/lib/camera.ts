//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2020
//

import { mat4, vec3, vec4 } from 'gl-matrix';
import { Ray } from './ray';
import { Animation } from './animation';

export class Camera {
  pos: vec3;                // Camera position in world
  lookAt: vec3;             // Camera look at point
  FOV: number;              // Camera field of view in radians
  trans: mat4;              // Transform to make camera rays
  animations: Animation[];  // Chain of animations for the camera

  constructor(pos: vec3, lookAt: vec3, FOV: number, time: number, animations: Animation[]) {
    this.pos = pos;
    this.lookAt = lookAt;
    this.FOV = FOV;
    this.trans = mat4.create();

    this.animations = animations;
    if(this.animations) {
      for(const anim of this.animations) {
        anim.updateObjectAtTime(this, time);
      }
    }

    console.log(this.pos);
    console.log(this.lookAt);

    // NOTE: The standard up vector [0,1,0]
    mat4.lookAt(this.trans, this.pos, this.lookAt, [0, 1, 0]);
    mat4.invert(this.trans, this.trans);

    console.log(JSON.stringify(this));
  }

  // ====================================================================================================
  // Create camera rays to cast into the scene for a given pixel
  // ====================================================================================================
  public makeRay(x: number, y: number, imageWidth: number, imageHeight: number, fovScale: number, aspectRatio: number): Ray {
    //console.log(x, y, imageWidth, imageHeight, fovScale, aspectRatio);

    // This converts from raster space (output image) -> normalized space -> screen space
    const px: number = (2 * (x + 0.5) / imageWidth - 1) * fovScale  * aspectRatio;
    const py: number = (1 - 2 * (y + 0.5) / imageHeight) * fovScale;

    //console.log(px, py);

    // Create camera ray, starting at origin and pointing into -z
    const origin: vec4 = vec4.fromValues(0.0, 0.0, 0.0, 1);
    const dir: vec4 = vec4.fromValues(px, py, -1.0, 0);
    const ray: Ray = new Ray(origin, dir);

    //console.log(ray);
    // Now move ray with respect to camera transform (into world space)
    ray.transform(this.trans);
    ray.depth = 1;

    //console.log(ray);
    return ray;
  }
}
