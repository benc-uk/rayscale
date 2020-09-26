//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2020
//

import { vec3 } from 'gl-matrix';
import { Utils } from './utils';
import { Animation } from './animation';

export class AnimationTranslate implements Animation {
  duration: number;
  loop: boolean;
  destPoint: vec3;

  constructor(destPoint: vec3, duration: number) {
    this.destPoint = destPoint;
    this.duration = duration;
  }

  modifyPositionForTime(pos: vec3, time: number): void {
    // t is normalised time offset into duration (0 - 1)
    const t = Utils.clamp(time / this.duration, 0.0, 1.0);

    // Calculate displacement vector
    const displace = vec3.create();
    //const newPos = vec3.create();
    vec3.subtract(displace, this.destPoint, pos);

    // Move pos, by t amount along displacement vector
    vec3.scaleAndAdd(pos, pos, displace, t);
    console.log(`###### ${this.duration} ${time} ${t} ${pos}`);

    //return newPos;
  }
}