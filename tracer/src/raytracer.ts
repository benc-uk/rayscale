//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { vec3 } from 'gl-matrix'
import { Colour } from './lib/colour'
import { Ray } from './lib/ray'
import { Scene } from './lib/scene'
import { Task } from '../../controller/src/lib/task'
import { Utils } from './lib/utils'

export class Raytracer {
  image: Buffer;
  task: Task;
  scene: Scene;
  
  constructor(task: Task, scene: any) {
    this.task = task
    this.scene = scene;
    
    console.log(`### New Raytracer...`)
    console.dir(this.task);
    console.dir(this.scene);
    this.image = Buffer.alloc(this.task.imageWidth * this.task.imageHeight * 3);
  }

  public startTrace() {
    var myPromise = new Promise((resolve, reject) => {
      let aspectRatio = this.task.imageWidth / this.task.imageHeight; // assuming width > height 

      let bufferY = 0
      for (var y = this.task.sliceStart; y < (this.task.sliceStart + this.task.sliceHeight); y++) {
        for (var x = 0; x < this.task.imageWidth; x++) {

          // Calculate starting camera rays, to begin tracing process
          // See https://www.scratchapixel.com/lessons/3d-basic-rendering/ray-tracing-generating-camera-rays/generating-camera-rays
          let fovScale = Math.tan(Utils.degreeToRad(this.scene.cameraFov * 0.5)); 
          let px: number = (2 * (x + 0.5) / this.task.imageWidth - 1) * fovScale  * aspectRatio; 
          let py: number = (1 - 2 * (y + 0.5) / this.task.imageHeight) * fovScale;
          let origin: vec3 = vec3.fromValues(0.0, 0.0, 0.0);
          let dir: vec3 = vec3.fromValues(px, py, -1.0);
          //vec3.sub(dir, origin, dir); // Not required, when origin=[0,0,0] 

          let ray: Ray = new Ray(origin, dir);
          
          let outPixel: Colour = this.shadeRay(ray);
          outPixel.writePixeltoBuffer(this.image, this.task.imageWidth, x, bufferY);
        }
        bufferY++;
      }
      
      resolve(this.image);
    })

    return myPromise;
  }

  private shadeRay(ray: Ray): Colour {
    //console.log(ray.toString());
    
    let f = 0.3;
    if(ray.dir[0] > -f && ray.dir[0] < f && ray.dir[1] > -f && ray.dir[1] < f) {
      //console.log(ray.toString());
      return new Colour(50, Math.floor(this.task.index*15), 20);
    }

    let c = new Colour(0, 0, 40);
    if(Math.random() < 0.01) { let i = (Math.random()*200)+55; c = new Colour(i,i,i) }
    return c;
  }
}