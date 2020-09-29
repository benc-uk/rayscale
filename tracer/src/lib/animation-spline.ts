//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2020
//

import { vec3 } from 'gl-matrix';
import { CatmullRomSpline } from './spline';
import { Utils } from './utils';
import { Animation } from './animation';

export class AnimationSpline implements Animation {
  points: vec3[];
  start: number;
  duration: number;
  propertyName: string;
  spline: CatmullRomSpline;

  constructor(propertyName: string, points: vec3[], start: number, duration: number) {
    this.propertyName = propertyName;
    this.points = points;
    this.start = start;
    this.duration = duration;

    this.spline = new CatmullRomSpline(points, false, 'chordal', 0.8);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  updateAtTime(entity: any, time: number): void {
    // Skip if before start time
    if(time < this.start) return;

    // t is normalised time offset into anim duration (0 - 1)
    // Allow calc for time past the end, which results in t=1
    const t = Utils.clamp((time - this.start) / this.duration, 0.0, 1.0);

    // Get entity/object property we are going to modify
    const input = entity[this.propertyName];
    if(!input) {
      console.log(`### Warning! animation property '${this.propertyName}' not found`);
      return;
    }

    // support for vec4
    if(entity[this.propertyName].length == 4) {
      const p = this.spline.getPoint(t, null);
      entity[this.propertyName] = [p[0], p[1], p[2], 1];
      return;
    }

    // Don't extrapolate based on input point just overwrite with spline value
    entity[this.propertyName] = this.spline.getPoint(t, null);
  }
}
