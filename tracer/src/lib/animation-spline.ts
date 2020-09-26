//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2020
//
/*
import { vec3 } from 'gl-matrix';
import { CatmullRomSpline } from './catmull-rom-spline';
import { Utils } from './utils';

export class AnimationSpline extends Animation {
  duration: number;
  loop: boolean;
  spline: CatmullRomSpline;

  constructor(points: vec3[], closed: boolean, curveType: string, tension: number) {
    super();
    this.spline = new CatmullRomSpline(points, closed, curveType, tension);
  }

  getPositionAtTime(pos: vec3, time: number): void {
    const t = Utils.clamp(time/this.duration, 0.0, 1.0);
    console.log(t);

    //return this.spline.getPoint(t, null);
  }
}
*/