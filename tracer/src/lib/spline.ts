//
// Rayscale - Catmull-Rom Spline
// (C) Ben Coleman 2020
//
// Code entirely based on https://github.com/mrdoob/three.js/blob/dev/src/math/Vector3.js
// Copyright © 2010-2020 three.js authors
// Used under MIT License
//

import { vec3 } from 'gl-matrix';

export class CatmullRomSpline {
  tmp: vec3;
  px: CubicPoly; py: CubicPoly; pz: CubicPoly;
  points: vec3[];
  closed: boolean;
  curveType: string;
  tension: number;

  /**
   * Construct a new Catmull-Rom Spline.
   *
   * @param {vec3[]}  points is an array of control points for the curve
   * @param {boolean} closed is the curve a closed loop
   * @param {string}  curveType is one of 'centripetal', 'chordal' or 'catmullrom'
   * @param {number}  tension of the curve when type is catmullrom
  */
  constructor(points: vec3[], closed: boolean, curveType: string, tension: number) {
    this.tmp = vec3.create();
    this.px = new CubicPoly(); this.py = new CubicPoly(); this.pz = new CubicPoly();

    this.points = points;
    this.closed = closed;
    this.curveType = curveType || 'centripetal';
    this.tension = (tension !== undefined) ? tension : 0.5;
  }

  /**
   * Evaluate this spline to get a point on the curve with value between 0 and 1.
   *
   * @param  {number} t is distance on curve between 0 and 1, to get point for
   * @param  {vec3}   optionalTarget is optional target point
   * @return {vec3}   3D point on curve
  */
  getPoint(t: number, optionalTarget: vec3): vec3 {
    let point = optionalTarget || vec3.create();
    const l = this.points.length;

    const p = (l - (this.closed ? 0 : 1)) * t;
    let intPoint = Math.floor(p);
    let weight = p - intPoint;

    if (this.closed) {
      intPoint += intPoint > 0 ? 0 : (Math.floor(Math.abs(intPoint) / l) + 1) * l;
    } else if (weight === 0 && intPoint === l - 1) {
      intPoint = l - 2;
      weight = 1;
    }

    let p0, p3; // 4 points (p1 & p2 defined below)

    if (this.closed || intPoint > 0) {
      p0 = this.points[(intPoint - 1) % l];
    } else {
      // extrapolate first point
      vec3.sub(this.tmp, this.points[0], this.points[1]);
      p0 = this.tmp;
    }

    const p1 = this.points[intPoint % l];
    const p2 = this.points[(intPoint + 1) % l];

    if (this.closed || intPoint + 2 < l) {
      p3 = this.points[(intPoint + 2) % l];
    } else {
      // extrapolate last point
      vec3.sub(this.tmp, this.points[l - 1], this.points[l - 2]);
      vec3.add(this.tmp, this.tmp, this.points[l - 1]);
      p3 = this.tmp;
    }

    if(this.curveType === 'centripetal' || this.curveType === 'chordal') {
      // init Centripetal / Chordal Catmull-Rom
      const pow = this.curveType === 'chordal' ? 0.5 : 0.25;
      vec3.squaredDistance(p0, p1);
      let dt0 = Math.pow(vec3.squaredDistance(p0, p1), pow);
      let dt1 = Math.pow(vec3.squaredDistance(p1, p2), pow);
      let dt2 = Math.pow(vec3.squaredDistance(p2, p3), pow);

      // safety check for repeated points
      if (dt1 < 1e-4) dt1 = 1.0;
      if (dt0 < 1e-4) dt0 = dt1;
      if (dt2 < 1e-4) dt2 = dt1;

      this.px.initNonuniformCatmullRom(p0[0], p1[0], p2[0], p3[0], dt0, dt1, dt2);
      this.py.initNonuniformCatmullRom(p0[1], p1[1], p2[1], p3[1], dt0, dt1, dt2);
      this.pz.initNonuniformCatmullRom(p0[2], p1[2], p2[2], p3[2], dt0, dt1, dt2);
    } else if (this.curveType === 'catmullrom') {
      this.px.initCatmullRom(p0[0], p1[0], p2[0], p3[0], this.tension);
      this.py.initCatmullRom(p0[1], p1[1], p2[1], p3[1], this.tension);
      this.pz.initCatmullRom(p0[2], p1[2], p2[2], p3[2], this.tension);
    }

    point = vec3.fromValues(this.px.calc(weight), this.py.calc(weight), this.pz.calc(weight));
    return point;
  }
}

// ==================================================
// Internal class for cubic polynomials
// ==================================================
// Code entirely based on https://github.com/mrdoob/three.js/blob/dev/src/math/Vector3.js
/*
  Based on an optimized C++ solution in
  - http://stackoverflow.com/questions/9489736/catmull-rom-curve-with-no-cusps-and-no-self-intersections/
  - http://ideone.com/NoEbVM
*/
class CubicPoly {
  c0 = 0;
  c1 = 0;
  c2 = 0;
  c3 = 0;

  init(x0: number, x1: number, t0: number, t1: number) {
    this.c0 = x0;
    this.c1 = t0;
    this.c2 = - 3 * x0 + 3 * x1 - 2 * t0 - t1;
    this.c3 = 2 * x0 - 2 * x1 + t0 + t1;
  }

  initCatmullRom(x0: number, x1: number, x2: number, x3: number, tension: number): void {
    this.init(x1, x2, tension * (x2 - x0), tension * (x3 - x1));
  }

  initNonuniformCatmullRom(x0: number, x1: number, x2: number, x3: number, dt0: number, dt1: number, dt2: number): void {
    // compute tangents when parameterized in [t1,t2]
    let t1 = (x1 - x0) / dt0 - (x2 - x0) / (dt0 + dt1) + (x2 - x1) / dt1;
    let t2 = (x2 - x1) / dt1 - (x3 - x1) / (dt1 + dt2) + (x3 - x2) / dt2;

    // rescale tangents for parametrization in [0,1]
    t1 *= dt1;
    t2 *= dt1;

    this.init(x1, x2, t1, t2);
  }

  calc(t: number): number {
    const t2 = t * t;
    const t3 = t2 * t;
    return this.c0 + this.c1 * t + this.c2 * t2 + this.c3 * t3;
  }
}