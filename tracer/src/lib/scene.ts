import { Colour } from './colour';
import { Object3D } from './object3d';
import { Sphere } from './sphere';
import { Light } from './light';
import { Material } from './material';
import { vec3 } from 'gl-matrix';
import { Plane } from './plane';

export class Scene {
  name: string;
  backgroundColour: Colour;
  ambientLevel: number;

  cameraPos: vec3;    // Not used yet
  cameraDir: vec3;    // Not used yet
  cameraFov: number;  // Camera field of view in radians

  objects: Object3D[];
  lights: Light[];

  static parseScene(input: any): Scene {

    let scene: Scene = new Scene();

    // SUPER BASIC parser, don't have time for any better right now

    try {
      scene.name = input.name;
      scene.backgroundColour = Colour.fromRGB(input.backgroundColour[0], input.backgroundColour[1], input.backgroundColour[2]);
      scene.ambientLevel = input.ambientLevel;
      scene.cameraFov = input.cameraFov;

      // Parse objects
      scene.objects = [];
      for(let rawObj of input.objects) {
        let obj: Object3D = null;
        switch (rawObj.type.toLowerCase()) {
          case 'sphere':
            obj = new Sphere(vec3.fromValues(rawObj.pos[0], rawObj.pos[1], rawObj.pos[2]), rawObj.size, rawObj.name);
            break;
          case 'plane':
            console.dir(rawObj);
            obj = new Plane(vec3.fromValues(rawObj.pos[0], rawObj.pos[1], rawObj.pos[2]), vec3.fromValues(rawObj.norm[0], rawObj.norm[1], rawObj.norm[2]), rawObj.name);
            break;
          default:
            throw `Object type '${rawObj.type}' is invalid`
        }

        // Material properties
        obj.material = new Material();
        obj.material.colour = Colour.fromRGB(rawObj.material.colour[0], rawObj.material.colour[1], rawObj.material.colour[2]);
        obj.material.ka = rawObj.material.ka;
        obj.material.kd = rawObj.material.kd;
        obj.material.ks = rawObj.material.ks;
        obj.material.kr = rawObj.material.kr;
        obj.material.hardness = rawObj.material.hardness;

        if(obj) scene.objects.push(obj);
      }

      // Parse lights
      scene.lights = [];
      for(let rawLight of input.lights) {
        let light = new Light(vec3.fromValues(rawLight.pos[0], rawLight.pos[1], rawLight.pos[2]));
        
        if(light) scene.lights.push(light);
      }      
    } catch(e) {
      console.log(`### ERROR! Scene parse failed, ${e}`);
      return null;
    }
    return scene;
  }
}