/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2020
//

import { vec3 } from 'gl-matrix';
import { Utils } from './utils';
import { Animation } from './animation';
import { Colour } from './colour';

export class AnimationVector implements Animation {
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

  updateAtTime(entity: any, time: number): void {
    // Skip if before start time
    if(time < this.start) return;

    // t is normalised time offset into anim duration (0 - 1)
    // Allow calc for time past the end, which results in t=1
    const t = Utils.clamp((time - this.start) / this.duration, 0.0, 1.0);

    // Get entity/object property we are going to modify
    let input = entity[this.propertyName];
    if(!input) console.log(`### Invalid property name '${this.propertyName}' given for animation`);

    // A bit of a hack to treat Colours like vectors with 0-255 values
    let colour = false;
    if(input.constructor.name === 'Colour') {
      colour = true;
      input = (<Colour>input).toArray();
    }

    // Calculate displacement vector
    const displace = vec3.create();
    vec3.subtract(displace, this.targetValue, input);

    // Modify input, by t scaled amount along displacement vector
    vec3.scaleAndAdd(input, input, displace, t);

    // More hacks to mutate colour back into entity
    if(colour) {
      entity[this.propertyName] = Colour.fromRGB(input[0], input[1], input[2]);
    }
  }
}