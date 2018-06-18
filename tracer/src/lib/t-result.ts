//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Ray } from './ray';

export class TResult {
  t: number;     // t value
  ray: Ray;      // Transformed ray
  flag: any;     // Arbitrary info, used by some objects

  static SIDE: number     = 500;
  static INSIDE: number   = 501;
  static TOP: number      = 502;
  static BOTTOM: number   = 503;
  static CAPS: number     = 504;

  constructor(t: number, r: Ray) {
    this.t = t;
    this.ray = r;
  }
}