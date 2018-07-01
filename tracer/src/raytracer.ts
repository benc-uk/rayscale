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
import { ObjectConsts, Object3D } from './lib/object3d';
import { Mesh } from './lib/mesh';

// ====================================================================================================
// 
// ====================================================================================================
export class Raytracer {
  image: Buffer;
  task: Task;
  scene: Scene;
  
  constructor(task: Task, scene: Scene) {
    this.task = task
    // Skip not implemented so always set to 1
    this.task.skip = 1;
    this.scene = scene;
    
    console.log(`### New ray tracer for task ${this.task.index + 1} in job ${this.task.jobId}...`);
    this.image = Buffer.alloc(this.task.imageWidth * this.task.imageHeight * 3);
    //console.log(`### Max ray depth is: ${this.task.maxDepth}`)
  }

  // ====================================================================================================
  // 
  // ====================================================================================================
  public startTrace(): Buffer {
    if(this.task.imageWidth < this.task.imageHeight) { throw("Error, image width must be > height") };
    let aspectRatio = this.task.imageWidth / this.task.imageHeight; // assuming width > height 

    // Create our camera transform and invert
    let camTrans = mat4.lookAt(mat4.create(), this.scene.cameraPos, this.scene.cameraLookAt, [0, 1, 0]);
    mat4.invert(camTrans, camTrans);

    let bufferY = 0;
    let cacheCorner: Colour = null;
    let cacheRow: Colour[] = new Array();
    for (var y = this.task.sliceStart; y < (this.task.sliceStart + this.task.sliceHeight); y += this.task.skip) {
      for (var x = 0; x < this.task.imageWidth; x++) {

        // Field of view scaling factor
        let fovScale = Math.tan(Utils.degreeToRad(this.scene.cameraFov * 0.5)); 

        // Top of ray tracing process, will recurse into the scene casting more rays, (lots more!)

        let outPixel: Colour;
        if(this.task.antiAlias) {
          // Fire 5 rays. one in center and one in each corner of pixel
          let outPixel0: Colour = this.shadeRay(this.makeCameraRay(x+0.5, y+0.5, camTrans, fovScale, aspectRatio));
          
          let outPixel1: Colour;
          let outPixel2: Colour;
          let outPixel3: Colour;
          if(cacheRow[x]) {
            outPixel1 = cacheRow[x].copy();
          } else {
            outPixel1 = this.shadeRay(this.makeCameraRay(x, y, camTrans, fovScale, aspectRatio));
          }
          if(cacheRow[x+1]) {
            outPixel2 = cacheRow[x+1].copy();
          } else {
            outPixel2 = this.shadeRay(this.makeCameraRay(x+1, y, camTrans, fovScale, aspectRatio));
          }
          if(cacheCorner) {
            outPixel3 = cacheCorner.copy();;
          } else {
            outPixel3 = this.shadeRay(this.makeCameraRay(x, y+1, camTrans, fovScale, aspectRatio));
            cacheRow[x] = outPixel3.copy();
          }

          let outPixel4: Colour = this.shadeRay(this.makeCameraRay(x+1, y+1, camTrans, fovScale, aspectRatio));
          cacheRow[x+1] = outPixel4.copy();
          cacheCorner = outPixel4.copy();

          // Weighting is important
          outPixel0.mult(0.5);
          outPixel1.mult(0.125);
          outPixel2.mult(0.125);
          outPixel3.mult(0.125);
          outPixel4.mult(0.125);

          // Add 5 colours up
          outPixel = Colour.add(outPixel0, outPixel1);
          outPixel = Colour.add(outPixel, outPixel2);
          outPixel = Colour.add(outPixel, outPixel3);
          outPixel = Colour.add(outPixel, outPixel4);
        } else {
          outPixel = this.shadeRay(this.makeCameraRay(x+0.5, y+0.5, camTrans, fovScale, aspectRatio));
        }
        outPixel.writePixeltoBuffer(this.image, this.task.imageWidth, x, bufferY);
      }
      cacheCorner = null;
      bufferY++;
      let perc: number = Math.round((bufferY / this.task.sliceHeight) * 100);
      if(bufferY % Math.floor(this.task.sliceHeight / 10) == 0) console.log(`### Task '${this.task.index + 1} / ${this.task.jobId}' rendered ${perc}%`);
    }
    
    return this.image;
  }

  // ====================================================================================================
  // Create camera rays to cast into the scene for a given pixel
  // ====================================================================================================
  private makeCameraRay(x: number, y: number, camTrans: mat4, fovScale: number, aspectRatio: number): Ray {
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

    return ray;
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
      //console.log(`!!!! ${tResult.t}`);

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

        // shadeColour is a copy of the base colour modified for this light only
        let shadeColour: Colour = hitColour.copy();

        // Lighting calculations
        let lv: vec4 = vec4.create();
        vec4.subtract(lv, light.pos, hit.intersection);
        let lightDist: number = vec4.length(lv);
        vec4.normalize(lv, lv);
        
        let minLight = hitObject.material.ka * this.scene.ambientLevel
        let lightIntensity: number = Math.max(minLight, vec4.dot(lv, hit.normal)) * light.brightness;

        // Light attenuation code here
        let lightAtten: number = 1 / (1 + (light.kl * lightDist) + (light.kq * (lightDist * lightDist)));

        // Are we in shadow?
        let shadowRay: Ray = new Ray(hit.intersection, lv);
        // !TODO: Do we need to fudge the shadow ray pos ?
        // shadowRay.pos[0] += hit.normal[0] * 0.01;
        // shadowRay.pos[1] += hit.normal[1] * 0.01;
        // shadowRay.pos[2] += hit.normal[2] * 0.01;
        let shadowT: number = Number.MAX_VALUE; 
        let shadow: boolean = false;
        if(vec4.dot(lv, hit.normal) > 0) {
          for(let obj of this.scene.objects) {
            let shadTestT = obj.calcT(shadowRay).t;
            Stats.shadowRays++;
            // Self shadowing checks
            if(obj == hitObject && hitObject instanceof Mesh) {
              // The shadow terminator problem!
              let stp = vec4.dot(shadowRay.dir, hit.normal);
              if(stp > ObjectConsts.EPSILON2) continue
            }
            if (shadTestT > 0.0 && shadTestT < shadowT && shadTestT < lightDist) {
              shadowT = shadTestT;
              break;
            }
          }
          if(shadowT > 0.0 && shadowT < Number.MAX_VALUE) {
            shadow = true;
          }
        } else {
          shadow = true;
        }

        // Diffuse, specular and shadow shading
        if(!shadow) {
          // Specular Phong shading
          let rv: number = Math.max(0.0, vec4.dot(hit.reflected, lv)); 
          let phong: number = Math.pow(rv, hitObject.material.hardness);
          // With Phong we modify the outColour directly
          outColour.blendRGB(phong * hitObject.material.ks * light.brightness * light.colour.r,
            phong * hitObject.material.ks * light.brightness * light.colour.g,
            phong * hitObject.material.ks * light.brightness * light.colour.b);

          // Normal hit in light
          shadeColour.multRGB(lightIntensity * lightAtten * hitObject.material.kd * light.colour.r,
            lightIntensity * lightAtten * hitObject.material.kd * light.colour.g,
            lightIntensity * lightAtten * hitObject.material.kd * light.colour.b);

        } else {
          // In shadow, use material ka & scene ambient level 
          shadeColour.mult(hitObject.material.ka * this.scene.ambientLevel);
        }
        
        // Add hitColour to our accumulator colour 
        outColour = Colour.add(outColour, shadeColour);
      } // End of light loop

      // Reflection!
      if(hitObject.material.kr > 0) {        
        let reflectRay = new Ray(hit.intersection, hit.reflected);
        reflectRay.depth = ray.depth + 1;
        let reflectColour = this.shadeRay(reflectRay);
        reflectColour = reflectColour.multNew(hitObject.material.kr);
        outColour.add(reflectColour)
      }

      // Transparency.
      // Note. This is VERY LIKELY not to be optically correct, but looks OK
      if(hitObject.material.kt > 0) {  

        // Find refracted direction
        let newDir = this.calcRefractionDir(ray, hit, hitObject);

        let transRay: Ray;
        // Are we refracted or total internal reflection
        if(newDir)
          transRay = new Ray(hit.intersection, newDir);
        else
          transRay = new Ray(hit.intersection, hit.reflected);

        // Slide ray a fraction along direction
        // Reflections don't work otherwise
        transRay.pos[0] += transRay.dir[0] * ObjectConsts.EPSILON2;
        transRay.pos[1] += transRay.dir[1] * ObjectConsts.EPSILON2;
        transRay.pos[2] += transRay.dir[2] * ObjectConsts.EPSILON2;
        transRay.depth = ray.depth + 1;

        // What is new ray inside?
        let tFade = 1.0
        if(!ray.inside) {
          // If ray was in "air" ray spawns inside the object we just hit
          transRay.inside = hitObject;
          tFade = 0.8;
        } else {
          // Ray traversing inside object
          transRay.inside = ray.inside;
        }

        // Shade transparent ray and add to colour
        let transColour = this.shadeRay(transRay).copy();
        transColour.mult(hitObject.material.kt * tFade);
        outColour.add(transColour);
      }

      // Add ambient level once (outside light loop)
      let ambientColour = outColour.multNew(hitObject.material.ka * this.scene.ambientLevel);
      outColour.add(ambientColour);

      return outColour;
    } // End of object loop

    // Missed everything! 
    return this.scene.backgroundColour.copy();
  }

  // ====================================================================================================
  // Calculate direction for transparency - refraction or null when total internal reflection
  // ====================================================================================================
  private calcRefractionDir(ray: Ray, hit: Hit, hitObject: Object3D) {
    
    // The ratio of the index of refraction is key
    let eta: number;
    if(!ray.inside) {
      // When outside an object take ratio of the "air" IOR with the hit object IOR
      eta = this.scene.ior / hitObject.material.ior;
    } else {
      // When inside an object, take ratio of that objects IOR with the air
      // NOTE. Big assumption we don't have nested transparent objects!
      eta = ray.inside.material.ior / this.scene.ior;
    }

		// Some maths
		let c1: number  = -vec4.dot(ray.dir, hit.normal);
		let cs2: number = 1.0 - (eta * eta * (1.0 - c1 * c1));

    // Direction of refracted ray
    let dirOut: vec4 = vec4.create();

    // Test for total internal reflection 
    if (cs2 < 0) {
			return null;
		}
		let tmp: number = eta * c1 - Math.sqrt(cs2);

    // Also no idea about this either
		dirOut[0] = (eta * ray.dir[0]) + (tmp * hit.normal[0]);
		dirOut[1] = (eta * ray.dir[1]) + (tmp * hit.normal[1]);
    dirOut[2] = (eta * ray.dir[2]) + (tmp * hit.normal[2]);
    dirOut[3] = 0;

		return dirOut;
	}
}