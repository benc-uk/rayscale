//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2020
//

import { vec3 } from 'gl-matrix';
import { clamp } from './utils';
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

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  updateAtTime(entity: any, time: number): void {
    // Skip if before start time
    if(time < this.start) return;

    // t is normalised time offset into anim duration (0 - 1)
    // Allow calc for time past the end, which results in t=1
    const t = clamp((time - this.start) / this.duration, 0.0, 1.0);

    // Get entity/object property we are going to modify
    let input = entity[this.propertyName];
    if(!input) {
      console.log(`### Warning! animation property '${this.propertyName}' not found`);
      return;
    }

    // A bit of a hack to treat Colours like vectors with 0-255 values
    let colour = false;
    if(input.constructor.name === 'Colour') {
      colour = true;
      input = (<Colour>input).toArray();
    }

    // Handle vec4 as well as vec3
    let vec4 = false;
    if(entity[this.propertyName].length == 4) {
      vec4 = true;
      input = [input[0], input[1], input[2]];
    }

    if(input.length != 3) {
      console.log(`### Warning! animation property '${this.propertyName}' is not an 3 element array`);
      return;
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

    // vec4 hack
    if(vec4) {
      entity[this.propertyName] = [input[0], input[1], input[2], 1];
    }
  }
}