//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { vec4, mat4 } from 'gl-matrix';
import { Colour } from './lib/colour';
import { Ray } from './lib/ray';
import { Scene } from './lib/scene';
import { Task } from './lib/task';
import { Utils } from './lib/utils';
import { Hit } from './lib/hit';
import { Stats } from './lib/stats';
import { TResult } from './lib/t-result';
import { ObjectConsts, Object3D } from './lib/object3d';
import { Mesh } from './lib/mesh';

// ====================================================================================================
// The core & heart of everything
// ====================================================================================================
export class Raytracer {
  image: Buffer;
  task: Task;
  scene: Scene;

  constructor(task: Task, scene: Scene) {
    this.task = task;
    this.scene = scene;

    console.log(`### New ray tracer for task ${this.task.index + 1} in job ${this.task.jobId}...`);
    this.image = Buffer.alloc(this.task.imageWidth * this.task.imageHeight * 3);
  }

  // ====================================================================================================
  // Main top level function to start the process
  // ====================================================================================================
  public runRayTrace(): Buffer {
    if(this.task.imageWidth < this.task.imageHeight) { throw('Error, image width must be > height'); }
    const aspectRatio = this.task.imageWidth / this.task.imageHeight; // assuming width > height

    // Create our camera transform and invert
    const camTrans = mat4.lookAt(mat4.create(), this.scene.cameraPos, this.scene.cameraLookAt, [0, 1, 0]);
    mat4.invert(camTrans, camTrans);

    // Image buffer row
    let bufferY = 0;
    // Pixel caches only used for anti-aliasing
    let cacheCorner: Colour = null;
    const cacheRow: Colour[] = [];

    // Main pixel casting loop, note we only render the slice of the image we're given in the task
    for (let y = this.task.sliceStart; y < (this.task.sliceStart + this.task.sliceHeight); y ++) {
      for (let x = 0; x < this.task.imageWidth; x++) {

        // Field of view scaling factor
        const fovScale = Math.tan(Utils.degreeToRad(this.scene.cameraFov * 0.5));

        // Top of ray tracing process
        let outPixel: Colour;

        if(this.task.antiAlias) {
          // Fire 5 rays. one in center and one in each corner of pixel
          const outPixel0: Colour = this.shadeRay(this.makeCameraRay(x+0.5, y+0.5, camTrans, fovScale, aspectRatio));

          // All this  weird rubbish casts additional rays but also uses cached values
          // The cache consists of corner values of the previous pixel on the current row
          // - and the bottom corner pixels of the previous row above
          // !GOTCHA: We call copy on the colours, which solved some bugs
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
            outPixel3 = cacheCorner.copy();
          } else {
            outPixel3 = this.shadeRay(this.makeCameraRay(x, y+1, camTrans, fovScale, aspectRatio));
            cacheRow[x] = outPixel3.copy();
          }
          const outPixel4: Colour = this.shadeRay(this.makeCameraRay(x+1, y+1, camTrans, fovScale, aspectRatio));
          cacheRow[x+1] = outPixel4.copy();
          cacheCorner = outPixel4.copy();

          // Weighting of colour values is important
          outPixel0.mult(0.5);
          outPixel1.mult(0.125);
          outPixel2.mult(0.125);
          outPixel3.mult(0.125);
          outPixel4.mult(0.125);

          // Add the 5 colours up
          outPixel = Colour.add(outPixel0, outPixel1);
          outPixel = Colour.add(outPixel, outPixel2);
          outPixel = Colour.add(outPixel, outPixel3);
          outPixel = Colour.add(outPixel, outPixel4);
        } else {
          // Without anti-aliasing we just cast one ray in center of each pixel
          outPixel = this.shadeRay(this.makeCameraRay(x+0.5, y+0.5, camTrans, fovScale, aspectRatio));
        }

        // We have the final pixel colour so write to the image buffer
        outPixel.writePixeltoBuffer(this.image, this.task.imageWidth, x, bufferY);
      }

      // Image row complete
      cacheCorner = null;
      bufferY++;
      const perc: number = Math.round((bufferY / this.task.sliceHeight) * 100);
      if(bufferY % Math.floor(this.task.sliceHeight / 10) == 0) console.log(`### Task '${this.task.index + 1} / ${this.task.jobId}' rendered ${perc}%`);
    }

    return this.image;
  }

  // ====================================================================================================
  // Create camera rays to cast into the scene for a given pixel
  // ====================================================================================================
  private makeCameraRay(x: number, y: number, camTrans: mat4, fovScale: number, aspectRatio: number): Ray {
    // This converts from raster space (output image) -> normalized space -> screen space
    const px: number = (2 * (x + 0.5) / this.task.imageWidth - 1) * fovScale  * aspectRatio;
    const py: number = (1 - 2 * (y + 0.5) / this.task.imageHeight) * fovScale;

    // Create camera ray, starting at origin and pointing into -z
    const origin: vec4 = vec4.fromValues(0.0, 0.0, 0.0, 1);
    const dir: vec4 = vec4.fromValues(px, py, -1.0, 0);
    const ray: Ray = new Ray(origin, dir);

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

    // Before we start, set t to max, and hitObject to null
    let t: number = Number.MAX_VALUE;
    let objTResult: TResult;
    let hitObject = null;
    Stats.raysCast++;

    // First pass - Check all objects for ray intersection t with calls to calcT
    for(const obj of this.scene.objects) {
      const tResult: TResult = obj.calcT(ray);

      // Find closest hit only, as that's how reality works
      if (tResult.t > 0.0 && tResult.t < t) {
        t = tResult.t;
        objTResult = tResult;
        hitObject = obj;
      }
    }

    // We have an object hit! Time to do more work
    if(t > 0.0 && t < Number.MAX_VALUE) {
      // Get the intersection details, which are stored in a 'Hit' struct
      const hit: Hit = hitObject.getHitPoint(objTResult);

      // outColour is an accumulator as we're looping over lights
      let outColour: Colour = new Colour();

      // hitColour is the base colour of the object we've hit,
      // - We get this by finding the texture colour at the u,v coords of the hit
      let hitColour: Colour;
      if(hitObject.material.texture.solid) {
        //console.log(`calling ${hitObject.name} solid`);

        hitColour = hitObject.material.texture.getColourAtSolid(hit.intersection[0], hit.intersection[1], hit.intersection[2]).copy();
      } else {
        hitColour = hitObject.material.texture.getColourAt(hit.u, hit.v).copy();
      }

      // noShade disables all illumination & shading
      if(hitObject.material.noShade) {
        return hitColour;
      }

      //
      // Lighting calculations
      //

      // Loop over all lights...
      for(const light of this.scene.lights) {

        // shadeColour is a copy of the base colour modified for this light only
        const shadeColour: Colour = hitColour.copy();

        // lv is vector pointing to light
        const lightVect: vec4 = vec4.create();
        vec4.subtract(lightVect, light.pos, hit.intersection);
        const lightDist: number = vec4.length(lightVect);
        vec4.normalize(lightVect, lightVect);

        const minLight = hitObject.material.ka * this.scene.ambientLevel;
        const lightIntensity: number = Math.max(minLight, vec4.dot(lightVect, hit.normal)) * light.brightness;

        // Light attenuation code here
        const lightAtten: number = 1 / (1 + (light.kl * lightDist) + (light.kq * (lightDist * lightDist)));

        //
        // Shadow calculations
        //

        // Shadow ray points from hit point to the light
        const shadowRay: Ray = new Ray(hit.intersection, lightVect);

        // Fudging shadow ray position can help with some issues
        // - but also introduce others
        shadowRay.pos[0] += hit.normal[0] * ObjectConsts.EPSILON2;
        shadowRay.pos[1] += hit.normal[1] * ObjectConsts.EPSILON2;
        shadowRay.pos[2] += hit.normal[2] * ObjectConsts.EPSILON2;
        let shadowT: number = Number.MAX_VALUE;
        let shadow = false;

        // Work out if we're in shadow
        if(vec4.dot(lightVect, hit.normal) > 0) {
          for(const obj of this.scene.objects) {
            // Shadow checks also call calcT for all objects to find intersection
            const shadTestT = obj.calcT(shadowRay).t;
            Stats.shadowRays++;
            // Self shadowing checks
            if(obj == hitObject && hitObject instanceof Mesh) {
              // The shadow terminator problem!
              const stp = vec4.dot(shadowRay.dir, hit.normal);
              if(stp > ObjectConsts.EPSILON2) continue;
            }
            // We can exit the first time we find a hit which is closer than the light
            if (shadTestT > 0.0 && shadTestT < shadowT && shadTestT < lightDist) {
              shadowT = shadTestT;
              break;
            }
          }

          // Final test if we hit anything
          if(shadowT > 0.0 && shadowT < Number.MAX_VALUE) {
            shadow = true;
          }
        } else {
          // if dot product of normal and lightVect < 0 we're automatically in self shadow
          shadow = true;
        }

        //
        // Blinn-Phong Illumination model - diffuse, specular and shadow shading
        //

        if(!shadow) {
          // Specular Phong term
          const rv: number = Math.max(0.0, vec4.dot(hit.reflected, lightVect));
          const phong: number = Math.pow(rv, hitObject.material.hardness);
          // With Phong we modify the outColour directly
          outColour.blendRGB(phong * hitObject.material.ks * light.brightness * light.colour.r,
            phong * hitObject.material.ks * light.brightness * light.colour.g,
            phong * hitObject.material.ks * light.brightness * light.colour.b);

          // Diffuse term
          shadeColour.multRGB(lightIntensity * lightAtten * hitObject.material.kd * light.colour.r,
            lightIntensity * lightAtten * hitObject.material.kd * light.colour.g,
            lightIntensity * lightAtten * hitObject.material.kd * light.colour.b);

        } else {
          // In shadow, use material ka & scene ambient level, nothing else
          shadeColour.mult(hitObject.material.ka * this.scene.ambientLevel);
        }

        // Add hitColour to our accumulator colour
        outColour = Colour.add(outColour, shadeColour);
      } // End of light loop

      //
      // Reflections
      //

      // If object has kr, then need to handle reflection
      if(hitObject.material.kr > 0) {
        // Create reflected ray based on hit
        const reflectRay = new Ray(hit.intersection, hit.reflected);
        reflectRay.depth = ray.depth + 1;

        // Recursion - call shadeRay again!
        let reflectColour = this.shadeRay(reflectRay);

        // Add resulting colour multiplied by kr
        reflectColour = reflectColour.multNew(hitObject.material.kr);
        outColour.add(reflectColour);
      }

      //
      // Transparency.
      //

      // Note. This is VERY LIKELY not to be optically correct, but looks OK
      if(hitObject.material.kt > 0) {

        // Find refracted direction
        const refractDir = this.calcRefractionDir(ray, hit, hitObject);

        let transRay: Ray;
        // Are we refracted or total internal reflection
        if(refractDir) {
          // Use refraction direction
          transRay = new Ray(hit.intersection, refractDir);
        } else {
          // Use *reflection* ray direction
          transRay = new Ray(hit.intersection, hit.reflected);
        }

        // Move new ray inside object, use the normal at the hit
        // Reflections don't work otherwise
        transRay.pos[0] -= hit.normal[0] * 0.2; //transRay.dir[0] * 0.1; //ObjectConsts.E5SILON2;
        transRay.pos[1] -= hit.normal[1] * 0.2; //transRay.dir[1] * 0.1; //ObjectConsts.EPSILON2;
        transRay.pos[2] -= hit.normal[2] * 0.2; //transRay.dir[2] * 0.1; //ObjectConsts.EPSILON2;
        transRay.depth = ray.depth + 1;

        // What is new ray inside?
        let tFade = 1.0;
        if(!ray.inside) {
          // If ray was in "air" ray spawns inside the object we just hit
          transRay.inside = hitObject;
          tFade = 0.8;
        } else {
          // If we hit the same object while inside it, and refracted -> then we're outside again
          if(ray.inside == hitObject && refractDir != null) {
            transRay.inside = null;
          }
          // Ray traversing inside object
          transRay.inside = ray.inside;
        }

        // Shade transparent ray and add to colour
        const transColour = this.shadeRay(transRay).copy();
        transColour.mult(hitObject.material.kt * tFade);
        outColour.add(transColour);
      }

      // Add ambient level once (outside light loop)
      const ambientColour = outColour.multNew(hitObject.material.ka * this.scene.ambientLevel);
      outColour.add(ambientColour);

      // Distance attenuation fog - it doesn't look very good
      // let distAtt = (1 / (t)) * 90;
      // distAtt = Utils.clamp(distAtt, 0, 1);

      // let fogColour = Colour.fromRGB(118, 129, 137);
      // fogColour.mult(1-distAtt)
      // outColour.mult(distAtt);
      // outColour.add(fogColour);

      // WOW! We're done, return resulting colour !
      return outColour;
    } // End of object loop

    // Missed everything!
    return this.scene.backgroundColour.copy();
  }

  // ====================================================================================================
  // Calculate direction for transparency - refraction or null when total internal reflection
  // ====================================================================================================
  private calcRefractionDir(ray: Ray, hit: Hit, hitObject: Object3D): vec4 {

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
    const c1: number  = -vec4.dot(ray.dir, hit.normal);
    const cs2: number = 1.0 - (eta * eta * (1.0 - c1 * c1));

    // Direction of refracted ray
    const dirOut: vec4 = vec4.create();

    // Test for total internal reflection
    // Return null which means use a reflected ray instead
    if (cs2 < 0) {
      return null;
    }
    const tmp: number = eta * c1 - Math.sqrt(cs2);

    // Also no idea about this either
    dirOut[0] = (eta * ray.dir[0]) + (tmp * hit.normal[0]);
    dirOut[1] = (eta * ray.dir[1]) + (tmp * hit.normal[1]);
    dirOut[2] = (eta * ray.dir[2]) + (tmp * hit.normal[2]);
    dirOut[3] = 0;

    return dirOut;
  }
}