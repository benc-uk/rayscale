//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Ray } from './ray';

export class TResult {
  t: number;
  ray: Ray;

  constructor(t: number, r: Ray) {
    this.t = t;
    this.ray = r;
  }

}