//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { vec3 } from 'gl-matrix'
import { Colour } from './lib/colour'
import { Ray } from './lib/ray'
import { Scene } from './lib/scene'
import { Object3D } from './lib/object3d'
import { Task } from '../../controller/src/lib/task'
import { Utils } from './lib/utils'
import { SSL_OP_NETSCAPE_DEMO_CIPHER_CHANGE_BUG } from 'constants';
import { Sphere } from './lib/sphere';
import { Hit } from './lib/hit';

export class Raytracer {
  image: Buffer;
  task: Task;
  scene: Scene;
  
  constructor(task: Task, scene: any) {
    this.task = task
    this.scene = scene;

    // HACK HARDCODE SCENE HERE ARGH
    this.scene.objects = [];
    let sphere1: Sphere = new Sphere(vec3.fromValues(0, 0, -20), 1.0, 'sphere1');
    this.scene.objects.push(sphere1);
    
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

          // Field of view scaling factor
          let fovScale = Math.tan(Utils.degreeToRad(this.scene.cameraFov * 0.5)); 
          // This converts from raster space (output image) -> normalized space -> screen space
          let px: number = (2 * (x + 0.5) / this.task.imageWidth - 1) * fovScale  * aspectRatio; 
          let py: number = (1 - 2 * (y + 0.5) / this.task.imageHeight) * fovScale;

          // Create camera ray
          let origin: vec3 = vec3.fromValues(0.0, 0.0, 0.0);
          let dir: vec3 = vec3.fromValues(px, py, -1.0);
          //vec3.sub(dir, origin, dir); // Not required, when origin=[0,0,0] 
          let ray: Ray = new Ray(origin, dir);
          
          // Top of raytracing process, will recurse into the scene casting more rays
          let outPixel: Colour = this.shadeRay(ray);
          // Write resulting colour into output buffer
          outPixel.writePixeltoBuffer(this.image, this.task.imageWidth, x, bufferY);
        }
        bufferY++;
      }
      
      // Resolve the promise with the rendered image buffer
      resolve(this.image);
    })

    return myPromise;
  }

  private shadeRay(ray: Ray): Colour {

    let t: number = Number.MAX_VALUE;
    let hitObject = null;

    // Check all objects
    for(let obj of this.scene.objects) {
      let objT: number = obj.calcT(ray);

      if (objT > 0.0 && objT < t) {
        t = objT;
        hitObject = obj;
      }
    }

    // We have an object hit! Time to do more work 
    if(t > 0.0 && t < Number.MAX_VALUE) {
      let hit: Hit = hitObject.getHitPoint(t, ray);

      let lv: vec3 = vec3.create();
      let lightPos: vec3 = vec3.fromValues(0, 2.1, -22);
      vec3.subtract(lv, lightPos, hit.intersection);
      let lightDist: number = vec3.length(lv);
      vec3.normalize(lv, lv);
      let intens: number = Math.max(0.001, vec3.dot(lv, hit.normal));
      //console.log(hit.intersection);
      return new Colour(255*intens, 0, 0);
    }

    return new Colour(30, 30, 60);

    // let f = 0.3;
    // if(ray.dir[0] > -f && ray.dir[0] < f && ray.dir[1] > -f && ray.dir[1] < f) {
    //   //console.log(ray.toString());
    //   return new Colour(50, Math.floor(this.task.index*15), 20);
    // }

    // let c = new Colour(0, 0, 40);
    // if(Math.random() < 0.01) { let i = (Math.random()*200)+55; c = new Colour(i,i,i) }
    // return c;
  }
}