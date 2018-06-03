import { Colour } from './colour';
import { Object3D } from './object3d';
import { Sphere } from './sphere';
import { Light } from './light';
import { Material } from './material';
import { vec3, vec4 } from 'gl-matrix';
import { Plane } from './plane';

export class Scene {
  name: string;
  backgroundColour: Colour;
  ambientLevel: number;

  cameraPos: vec3;      // Camera position in world
  cameraLookAt: vec3;   // Camera look at point
  cameraFov: number;    // Camera field of view in radians

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
      scene.cameraPos = vec3.fromValues(input.cameraPos[0], input.cameraPos[1], input.cameraPos[2]);
      scene.cameraLookAt = vec3.fromValues(input.cameraLookAt[0], input.cameraLookAt[1], input.cameraLookAt[2]);

      // Parse objects
      scene.objects = [];
      for(let rawObj of input.objects) {
        let obj: Object3D = null;
        switch (rawObj.type.toLowerCase()) {
          case 'sphere':
            obj = new Sphere(vec4.fromValues(rawObj.pos[0], rawObj.pos[1], rawObj.pos[2], 1), rawObj.size, rawObj.name);
            break;
          case 'plane':
            console.dir(rawObj);
            //obj = new Plane(vec4.fromValues(rawObj.pos[0], rawObj.pos[1], rawObj.pos[2]), vec3.fromValues(rawObj.norm[0], rawObj.norm[1], rawObj.norm[2]), rawObj.name);
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
        let light = new Light(vec4.fromValues(rawLight.pos[0], rawLight.pos[1], rawLight.pos[2], 1));
        
        if(light) scene.lights.push(light);
      }      
    } catch(e) {
      console.log(`### ERROR! Scene parse failed, ${e}`);
      return null;
    }

    //
    /*for(let z = -40; z <= 10; z+= 3) {
      for(let x = -13; x <= 28; x+= 3) {
        let m = new Material();
        m.colour = Colour.fromRGB(0, 0, 0);
        m.ka = 0.5;
        m.kd = 0.9;
        m.ks = 1.3;
        m.kr = 0.0;
        m.hardness = 70;

        let s = new Sphere(vec4.fromValues(x, -2, z, 1), 2, `sphere,${z}, ${x}`);
        let r = ((z+40)*5)+0;
        let g = ((x+20)*3)+0;
        m.colour = Colour.fromRGB(r, g, 0);
        s.material = m;
        scene.objects.push(s);
      }
    }*/
    
    return scene;
  }
}