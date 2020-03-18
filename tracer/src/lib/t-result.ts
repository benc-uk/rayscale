//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Ray } from './ray';

export class TResult {
  t: number;        // t value
  ray: Ray;         // Transformed ray
  inside: boolean;  // Was calculated from inside object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;        // Arbitrary info, used by some objects

  static SIDE     = 500;
  static INSIDE   = 501;
  static TOP      = 502;
  static BOTTOM   = 503;
  static CAPS     = 504;

  constructor(t: number, r: Ray) {
    this.t = t;
    this.ray = r;
    this.inside = false;
  }
}