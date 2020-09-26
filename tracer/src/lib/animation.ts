//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2020
//

import { vec3 } from 'gl-matrix';

export interface Animation {
  duration: number;
  loop: boolean;

  modifyPositionForTime(pos: vec3, time: number): void;
}
