//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { vec3 } from 'gl-matrix'
import { Colour } from './lib/colour'

export class Raytracer {

  image: Buffer;
  imageWidth: number;
  imageHeight: number;
  task: any;
  
  constructor(task: any, scene: any) {
    this.task = task;
    this.imageHeight = task.height;
    this.imageWidth = task.width;
    
    console.log(`### New Raytracer ${this.imageWidth}, ${this.imageHeight}`)
    this.image = Buffer.alloc(this.imageWidth * this.imageHeight * 3);
  }

  public startTrace() {
    var myPromise = new Promise((resolve, reject) => {
      let b = Math.floor(255*Math.random());
      for (var x = 0; x < this.imageWidth; x++) {
        for (var y = 0; y < this.imageHeight; y++) {
          let s = (x / this.imageWidth);
          let colour = new Colour(255-Math.floor(55*s*this.task.index), Math.floor(100*s), b);

          colour.writePixeltoBuffer(this.image, this.imageWidth, x, y);
        }
      }
      
      resolve(this.image);
    })

    return myPromise;
  }
}