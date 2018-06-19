//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { vec4, mat4 } from 'gl-matrix'
import { Colour } from './lib/colour'
import { Ray } from './lib/ray'
import { Scene } from './lib/scene'
import { Task } from './lib/task'
import { Utils } from './lib/utils'
import { Hit } from './lib/hit';
import { Stats } from './lib/stats';
import { TResult } from './lib/t-result';

// ====================================================================================================
// 
// ====================================================================================================
export class Raytracer {
  image: Buffer;
  task: Task;
  scene: Scene;
  
  constructor(task: Task, scene: Scene) {
    this.task = task
    this.scene = scene;
    
    console.log(`### New ray tracer for task ${this.task.index + 1}...`);
    this.image = Buffer.alloc(this.task.imageWidth * this.task.imageHeight * 3);
    //console.log(`### Max ray depth is: ${this.task.maxDepth}`)
  }

  // ====================================================================================================
  // 
  // ====================================================================================================
  public startTrace(): Buffer {
    if(this.task.imageWidth < this.task.imageHeight) { throw("Error, image width must be > height"); };
    let aspectRatio = this.task.imageWidth / this.task.imageHeight; // assuming width > height 

    // Create our camera transform and invert
    let camTrans = mat4.lookAt(mat4.create(), this.scene.cameraPos, this.scene.cameraLookAt, [0, 1, 0]);
    mat4.invert(camTrans, camTrans);

    let bufferY = 0;
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
    
    return this.image;
  }

  // ====================================================================================================
  // Main shading & lighting function, computes the colour of given ray
  // Used by main outer loop (camera rays) and with reflected rays too
  // ====================================================================================================
  private shadeRay(ray: Ray): Colour {
    // Prevent infinite recursion
    if(ray.depth > this.task.maxDepth) {
      return this.scene.backgroundColour;
    }

    let t: number = Number.MAX_VALUE;
    let objTResult: TResult;
    let hitObject = null;
    Stats.raysCast++;

    // First pass - Check all objects for ray intersection t
    for(let obj of this.scene.objects) {
      let tResult: TResult = obj.calcT(ray);

      // Find closest hit only, as that's how reality works
      if (tResult.t > 0.0 && tResult.t < t) {
        t = tResult.t;
        objTResult = tResult;
        hitObject = obj;
      }
    }

    // We have an object hit! Time to do more work 
    if(t > 0.0 && t < Number.MAX_VALUE) {
      // Get the intersection details moved here for speed
      let hit: Hit = hitObject.getHitPoint(objTResult);

      // outColour is an accumulator as we're looping over lights 
      let outColour: Colour = new Colour();
      // hitColour is the base colour of the object we've hit
      let hitColour: Colour = hitObject.material.texture.getColourAt(hit.u, hit.v).copy();
      if(hitObject.material.noShade) {
        return hitColour;
      }

      // Loop over all lights...
      for(let light of this.scene.lights) {

        // lightColour is a copy of the base colour modified for this light only
        let lightColour: Colour = hitColour.copy();

        // Lighting calculations
        let lv: vec4 = vec4.create();
        vec4.subtract(lv, light.pos, hit.intersection);
        let lightDist: number = vec4.length(lv);
        vec4.normalize(lv, lv);
        
        let lightIntensity: number = Math.max(0.001, vec4.dot(lv, hit.normal)) * light.brightness;

        // Light attenuation code here
        let lightAtten: number = 1 / (1 + (light.kl * lightDist) + (light.kq * (lightDist * lightDist)));

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

        // Diffuse, specular and shadow shading
        if(!shadow) {
          // Specular Phong shading
          let rv: number = Math.max(0.0, vec4.dot(hit.reflected, lv)); 
          let phong: number = Math.pow(rv, hitObject.material.hardness);
          // With Phong we modify the outColour directly
          outColour.blend(phong * hitObject.material.ks * light.brightness);

          // Normal hit in light
          lightColour.mult(lightIntensity * lightAtten * hitObject.material.kd);
        } else {
          // In shadow hit use material ka
          lightColour.mult(hitObject.material.ka * this.scene.ambientLevel);
        }
        
        // Add hitColour to our accumulator colour 
        outColour = Colour.add(outColour, lightColour);
      } // End of light loop

      // Reflection!
      if(hitObject.material.kr > 0) {        
        let rRay = new Ray(hit.intersection, hit.reflected);
        rRay.depth = ray.depth + 1;
        let reflectColour = this.shadeRay(rRay);
        reflectColour = reflectColour.multNew(hitObject.material.kr);
        outColour.add(reflectColour)
      }

      // Add ambient level once (outside light loop)
      let ambientColour = outColour.multNew(hitObject.material.ka * this.scene.ambientLevel);
      outColour.add(ambientColour);

      return outColour;
    } // End of object loop

    // Missed everything! 
    return this.scene.backgroundColour;
  }
}