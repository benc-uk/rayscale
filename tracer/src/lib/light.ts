//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Colour } from './colour';
import { vec4 } from 'gl-matrix';
import { Animation } from './animation';

export class Light {
  pos: vec4;                // Light position in world space
  brightness: number;       // Overall brightness
  kl: number;               // 2/r coefficient
  kq: number;               // 1/r^2 coefficient
  colour: Colour;           // Light colour
  animations: Animation[];  // Chain of animations for the light

  constructor(pos: vec4, brightness: number, radius: number, colour: Colour, time: number, animations: Animation[]) {
    this.pos = pos;
    this.brightness = brightness;
    this.colour = colour;

    this.animations = animations;
    if(this.animations) {
      for(const anim of this.animations) {
        anim.updateAtTime(this, time);
      }
    }

    this.kl = 2 / radius;
    this.kq = 1 / (radius * radius);
  }
}