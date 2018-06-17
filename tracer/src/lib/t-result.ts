//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Ray } from './ray';

export class TResult {
  t: number;     // t value
  ray: Ray;      // Transformed ray
  flag: any;     // Arbitrary info, used by some objects

  static SIDE: number = 0;
  static INSIDE: number = 1;
  static TOP: number = 2;

  constructor(t: number, r: Ray) {
    this.t = t;
    this.ray = r;
  }
}