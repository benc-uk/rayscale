//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2020
//

import { vec3 } from 'gl-matrix';
import { Utils } from './utils';
import { Animation } from './animation';

abstract class AnimationVec3 implements Animation {
  targetValue: vec3;
  start: number;
  duration: number;

  constructor(targetValue: vec3, start: number, duration: number) {
    this.targetValue = targetValue;
    this.start = start;
    this.duration = duration;
  }

  modifyVec3ForTime(input: vec3, time: number): void {
    if(time < this.start) return;

    // t is normalised time offset into duration (0 - 1)
    // We allow calc for time past the end, which results in t=1
    const t = Utils.clamp((time - this.start) / this.duration, 0.0, 1.0);

    // Calculate displacement vector
    const displace = vec3.create();
    vec3.subtract(displace, this.targetValue, input);

    // Modify pos, by t amount along displacement vector
    vec3.scaleAndAdd(input, input, displace, t);
    console.log(`###### ${this.duration} ${time} ${t} ${input}`);
  }
}

export class AnimationPosition extends AnimationVec3 {
  constructor(targetValue: vec3, start: number, duration: number) {
    super(targetValue, start, duration);
  }
}

export class AnimationRotation extends AnimationVec3 {
  constructor(targetValue: vec3, start: number, duration: number) {
    super(targetValue, start, duration);
  }
}