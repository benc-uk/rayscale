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
import { Sphere } from './lib/sphere';
import { Hit } from './lib/hit';

export class Raytracer {
  image: Buffer;
  task: Task;
  scene: Scene;
  
  constructor(task: Task, scene: Scene) {
    this.task = task
    this.scene = scene;
    
    console.log(`### New Raytracer for task ${this.task.index + 1}...`)
    //console.dir(this.task);
    //console.dir(this.scene);
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
        let perc: number = Math.round((bufferY / this.task.sliceHeight) * 100);
        if(bufferY % Math.floor(this.task.sliceHeight / 10) == 0) console.log(`### Percent of task ${this.task.index + 1} rendered ${perc}%`);
      }
      
      // Resolve the promise with the rendered image buffer
      resolve(this.image);
    })

    return myPromise;
  }

  private shadeRay(ray: Ray): Colour {
    let t: number = Number.MAX_VALUE;
    let hitObject = null;

    // Check all objects for ray intersection t
    for(let obj of this.scene.objects) {
      let objT: number = obj.calcT(ray);

      // Find closest hit only, as that's how reality works
      if (objT > 0.0 && objT < t) {
        t = objT;
        hitObject = obj;
      }
    }

    // We have an object hit! Time to do more work 
    if(t > 0.0 && t < Number.MAX_VALUE) {
      let hit: Hit = hitObject.getHitPoint(t, ray);

      // !TODO! Loop here for all lights!

      let hitColour: Colour = hitObject.material.colour.copy();

      let lv: vec3 = vec3.create();
      let lightPos: vec3 = this.scene.lights[0].pos;
      vec3.subtract(lv, lightPos, hit.intersection);
      let lightDist: number = vec3.length(lv);
      vec3.normalize(lv, lv);
      let intens: number = Math.max(0.001, vec3.dot(lv, hit.normal));

      let shadowRay: Ray = new Ray(hit.intersection, lv);
      let shadowT: number = Number.MAX_VALUE;
      let shadow: boolean = false;
      for(let obj of this.scene.objects) {
        let shadTestT = obj.calcT(shadowRay);
        
        if (shadTestT > 0.0 && shadTestT < shadowT && shadTestT < lightDist) {
          shadowT = shadTestT;
          break;
        }
      }
      if(shadowT > 0.0 && shadowT < Number.MAX_VALUE) {
        shadow = true;
      }

      let rv: number = Math.max(0.0, vec3.dot(hit.reflected, lv));  // angle between light and reflected ray
      let phong: number = Math.pow(rv, hitObject.material.hardness) * hitObject.material.ks; // calc the Phong specular term
      
      hitColour.blend(phong);

      if(!shadow) {
        // Normal hit in light
        let dc = hitColour.multNew(intens * hitObject.material.kd);
        let ac = hitColour.multNew(hitObject.material.ka);
        hitColour = Colour.add(dc, ac);
      } else {
        // In shadow hit use matrial ka
        hitColour.mult(hitObject.material.ka);
      }

      // Reflection!
      if(hitObject.material.kr > 0) {
        let reflectColour = this.shadeRay(new Ray(hit.intersection, hit.reflected))
        reflectColour = reflectColour.multNew(hitObject.material.kr);
        hitColour = Colour.add(hitColour, reflectColour);
      }

      return hitColour;
    }

    // Backgorund stars!
    if(Math.random() < 0.002) {
      let r = (Math.random() * 0.8) + 0.2;
      return new Colour(r, r, r);
    }
    return this.scene.backgroundColour;
  }
}