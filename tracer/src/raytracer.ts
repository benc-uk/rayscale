//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { vec3, vec4, mat4, quat } from 'gl-matrix'
import { Colour } from './lib/colour'
import { Ray } from './lib/ray'
import { Scene } from './lib/scene'
import { Object3D } from './lib/object3d'
import { Task } from './lib/task'
import { Utils } from './lib/utils'
import { Sphere } from './lib/sphere';
import { Hit } from './lib/hit';
import { Stats } from './lib/stats';
import { TResult } from './lib/t-result';

import fs from 'fs';
import { Plane } from './lib/plane';
import * as PNG from 'pngjs';

export class Raytracer {
  image: Buffer;
  task: Task;
  scene: Scene;
  static MAX_DEPTH = 3;
  txttemp: any;
  txttemp2: any;
  
  constructor(task: Task, scene: Scene) {
    this.task = task
    this.scene = scene;
    
    console.log(`### New ray tracer for task ${this.task.index + 1}...`)
    this.image = Buffer.alloc(this.task.imageWidth * this.task.imageHeight * 3);
  }

  //
  //
  //
  public startTrace() {
    
    var myPromise = new Promise((resolve, reject) => {

      //// REMOVE THIS LATER
      ///////////////////////////
      let f = fs.readFileSync('./textures/st.png');
      this.txttemp = PNG.PNG.sync.read(f).data;
      let f2 = fs.readFileSync('./textures/wood.png');
      this.txttemp2 = PNG.PNG.sync.read(f2).data;

      let aspectRatio = this.task.imageWidth / this.task.imageHeight; // assuming width > height 

      // Create our camera transform and invert
      let camTrans = mat4.lookAt(mat4.create(), this.scene.cameraPos, this.scene.cameraLookAt, [0, 1, 0]);
      mat4.invert(camTrans, camTrans);

      let bufferY = 0
      for (var y = this.task.sliceStart; y < (this.task.sliceStart + this.task.sliceHeight); y++) {
        for (var x = 0; x < this.task.imageWidth; x++) {

          // Field of view scaling factor
          let fovScale = Math.tan(Utils.degreeToRad(this.scene.cameraFov * 0.5)); 

          // This converts from raster space (output image) -> normalized space -> screen space
          let px: number = (2 * (x + 0.5) / this.task.imageWidth - 1) * fovScale  * aspectRatio; 
          let py: number = (1 - 2 * (y + 0.5) / this.task.imageHeight) * fovScale;

          // Create camera ray, starting at origin and pointing into -z 
          let origin: vec4 = vec4.fromValues(0.0, 0.0, 0.0, 1);
          let dir: vec4 = vec4.fromValues(px, py, -1.0, 0);
          //vec4.sub(dir, origin, dir); // Not required, when origin=[0,0,0] 
          let ray: Ray = new Ray(origin, dir);

          // Now move ray with respect to camera transform (into world space)
          ray.transform(camTrans);
          ray.depth = 1;
          
          // Top of raytracing process, will recurse into the scene casting more rays, (lots more!)
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

  //
  //
  //
  private shadeRay(ray: Ray): Colour {
    let t: number = Number.MAX_VALUE;
    let tRay = null;
    let hitObject = null;
    Stats.raysCast++;

    // Check all objects for ray intersection t
    for(let obj of this.scene.objects) {
      let tResult: TResult = obj.calcT(ray);
      let objT = tResult.t;

      // Find closest hit only, as that's how reality works
      if (objT > 0.0 && objT < t) {
        t = objT;
        tRay = tResult.ray;
        hitObject = obj;
      }
    }

    // We have an object hit! Time to do more work 
    if(t > 0.0 && t < Number.MAX_VALUE) {
      let hit: Hit = hitObject.getHitPoint(t, tRay);

      // !TODO! Loop here for all lights!

      let hitColour: Colour = hitObject.material.texture.getColourAt(hit.u, hit.v).copy();
      //Colour = hitObject.material.colour.copy(); 
      
      // REMOVE THIS HACK
      /*
      if(hitObject.name == "wall white" || hitObject.name == "wood") {

        let tx = Math.floor(hit.u * 512);
        let ty = Math.floor(hit.v * 512);
        var idx = (512 * ty + tx) << 2;

        if(hitObject.name == "wood") {
          hitColour = Colour.fromRGB(this.txttemp2[idx], this.txttemp2[idx+1], this.txttemp2[idx+2]);
        } else {
          hitColour = Colour.fromRGB(this.txttemp[idx], this.txttemp[idx+1], this.txttemp[idx+2]);
        }

      } else if(hitObject instanceof Plane) {
        if(hit.u > 0.5 && hit.v > 0.5) hitColour = Colour.BLACK.copy();
        if(hit.u < 0.5 && hit.v < 0.5) hitColour = Colour.BLACK.copy();
      }*/

      // Lighting calculations
      let lv: vec4 = vec4.create();
      let lightPos: vec4 = this.scene.lights[0].pos;
      vec4.subtract(lv, lightPos, hit.intersection);
      let lightDist: number = vec4.length(lv);
      vec4.normalize(lv, lv);
      let intens: number = Math.max(0.001, vec4.dot(lv, hit.normal));

      // Light attenuation code here
      //let ld = lightDist / 72;
      //intens *= 1/Math.pow(ld, 4);

      // Are we in shadow?
      let shadowRay: Ray = new Ray(hit.intersection, lv);
      let shadowT: number = Number.MAX_VALUE;
      let shadow: boolean = false;
      for(let obj of this.scene.objects) {
        let shadTestT = obj.calcT(shadowRay).t;
        Stats.shadowRays++;
        
        if (shadTestT > 0.0 && shadTestT < shadowT && shadTestT < lightDist) {
          shadowT = shadTestT;
          break;
        }
      }
      if(shadowT > 0.0 && shadowT < Number.MAX_VALUE) {
        shadow = true;
      }

      // Specular Phong shading
      let rv: number = Math.max(0.0, vec4.dot(hit.reflected, lv)); 
      let phong: number = Math.pow(rv, hitObject.material.hardness) * hitObject.material.ks;
      hitColour.blend(phong);

      // Diffuse, ambient and shadow shading
      if(!shadow) {
        // Normal hit in light
        let dc = hitColour.multNew(intens * hitObject.material.kd);
        let ac = hitColour.multNew(hitObject.material.ka);
        hitColour = Colour.add(dc, ac);
      } else {
        // In shadow hit use matrial ka
        hitColour.mult(hitObject.material.ka * this.scene.ambientLevel);
      }

      // Reflection!
      if(hitObject.material.kr > 0 && ray.depth < Raytracer.MAX_DEPTH) {        

        let rRay = new Ray(hit.intersection, hit.reflected);
        rRay.depth = ray.depth + 1;
        let reflectColour = this.shadeRay(rRay);
        reflectColour = reflectColour.multNew(hitObject.material.kr);
        hitColour = Colour.add(hitColour, reflectColour);
      }

      return hitColour;
    }

    // Background stars!
    if(Math.random() < 0.002 && ray.depth <= 1) {
      let r = (Math.random() * 0.8) + 0.2;
      return new Colour(r, r, r);
    } else {

      return this.scene.backgroundColour.multNew(ray.dir[1]);
    }
  }
}