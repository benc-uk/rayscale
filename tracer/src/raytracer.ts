//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { vec3 } from 'gl-matrix'

export class Raytracer {

  constructor(task: any, scene: any) {

  }

  public startTrace() {
    var myPromise = new Promise(function(resolve, reject) {

      for (let n = 0; n < 5; n++) {
        console.log(n);
        for (let i = 0; i < 499900000.0; i++) {
          var val = Math.pow(9000.0, 9000.0);
        }
      }
      console.log(`about to resolve`);
      
      resolve(true);
    })

    return myPromise;
  }
}