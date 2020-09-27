/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2020
//

import { vec3 } from 'gl-matrix';
import { Utils } from './utils';
import { Animation } from './animation';

export class AnimationVector3 implements Animation {
  targetValue: vec3;
  start: number;
  duration: number;
  propertyName: string;

  constructor(propertyName: string, targetValue: vec3, start: number, duration: number) {
    this.propertyName = propertyName;
    this.targetValue = targetValue;
    this.start = start;
    this.duration = duration;
  }

  updateObjectAtTime(entity: any, time: number): void {
    if(time < this.start) return;

    // t is normalised time offset into duration (0 - 1)
    // We allow calc for time past the end, which results in t=1
    const t = Utils.clamp((time - this.start) / this.duration, 0.0, 1.0);

    const input = entity[this.propertyName];

    // FIXME: Runtime type checking here
    //if(input.constructor.name !== 'vec3') {}

    // Calculate displacement vector
    const displace = vec3.create();
    vec3.subtract(displace, this.targetValue, input);

    // Modify pos, by t amount along displacement vector
    vec3.scaleAndAdd(input, input, displace, t);
    console.log(`###### modifyVec3ForTime ${this.duration} ${time} ${t} ${input}`);
  }
}