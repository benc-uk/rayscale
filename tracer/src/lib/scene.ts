import { Colour } from './colour';
import { Object3D } from './object3d';
import { Sphere } from './sphere';
import { Light } from './light';
import { Material } from './material';
import { vec3, vec4 } from 'gl-matrix';
import { Plane } from './plane';
import { Texture } from './texture';
import { TextureBasic } from './texture-basic';
import { TextureCheck } from './texture-check';
import { TextureImage } from './texture-image';
import { TextureManager } from './texture-manager';

export class Scene {
  name: string;
  backgroundColour: Colour;
  ambientLevel: number;

  cameraPos: vec3;      // Camera position in world
  cameraLookAt: vec3;   // Camera look at point
  cameraFov: number;    // Camera field of view in radians

  objects: Object3D[];
  lights: Light[];

  static parseScene(input: any): Promise<any> {

    return new Promise(async (resolve, reject) => {
      // Important we clear out old textures
      if(!process.env.SKIP_TEXTURE_RESET)
        TextureManager.getInstance().clearTextures();
      let scene: Scene = new Scene();

      try {
        if(Object.keys(input).indexOf('name') < 0) throw('Scene name missing');
        if(Object.keys(input).indexOf('backgroundColour') < 0) throw('Scene backgroundColour missing');
        if(Object.keys(input).indexOf('ambientLevel') < 0) throw('Scene ambientLevel missing');
        if(Object.keys(input).indexOf('cameraFov') < 0) throw('Scene cameraFov missing');
        if(Object.keys(input).indexOf('cameraPos') < 0) throw('Scene cameraPos missing');
        if(Object.keys(input).indexOf('cameraLookAt') < 0) throw('Scene cameraLookAt missing');
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

          if(Object.keys(rawObj).indexOf('type') < 0) throw(`Object type missing ${JSON.stringify(rawObj)}`);
          if(Object.keys(rawObj).indexOf('name') < 0) throw(`Object name missing ${JSON.stringify(rawObj)}`);
          if(Object.keys(rawObj).indexOf('pos') < 0) throw(`Object pos missing ${JSON.stringify(rawObj)}`);

          switch (rawObj.type.toLowerCase()) {
            case 'sphere':
              obj = new Sphere(vec4.fromValues(rawObj.pos[0], rawObj.pos[1], rawObj.pos[2], 1), rawObj.size, rawObj.name);
              break;
            case 'plane':
              obj = new Plane(vec4.fromValues(rawObj.pos[0], rawObj.pos[1], rawObj.pos[2], 1), vec3.fromValues(rawObj.rotate[0], rawObj.rotate[1], rawObj.rotate[2]), 1, rawObj.name);
              break;
            default:
              throw `Object type '${rawObj.type}' is invalid`
          }
  
          // Material properties
          switch(rawObj.material.preset) {
            case 'none':
              obj.material = new Material(0, 0, 0, 0, 0); break;
            case 'matte':
              obj.material = new Material(0.1, 0.9, 0, 0, 0); break;
            case 'shiny':
              obj.material = new Material(0.2, 0.9, 0.9, 20, 0); break;
            case 'vshiny':
              obj.material = new Material(0.1, 0.9, 1.5, 80, 0); break;
            default:
              obj.material = new Material(0.1, 0.9, 0, 0, 0);
          }
  
          // Type of texture check here
          let texture: Texture = null;
          switch(rawObj.material.texture.type) {
            case 'basic':
              var c: any = rawObj.material.texture.colour;
              texture = TextureBasic.fromRGB(c[0], c[1], c[2])
              break;
            case 'check':
              var c1: any = rawObj.material.texture.colour1;
              var c2: any = rawObj.material.texture.colour2; 
              texture = new TextureCheck(Colour.fromRGB(c1[0], c1[1], c1[2]), Colour.fromRGB(c2[0], c2[1], c2[2]));
              break;
            case 'image':
              // The await here is super important, we can't carry on until all textures are loaded
              await TextureManager.getInstance().loadTexture(rawObj.material.texture.url);
              texture = new TextureImage(rawObj.material.texture.url);
              break;
            default:
              var c = rawObj.material.texture.colour;
              texture = TextureBasic.fromRGB(c[0], c[1], c[2])
              break;
          }
  
          if(rawObj.material.texture.u) texture.scaleU = rawObj.material.texture.u;
          if(rawObj.material.texture.v) texture.scaleV = rawObj.material.texture.v;
  
          // Other material properties, override the preset if set
          obj.material.texture = texture;     
          if(rawObj.material.ka) obj.material.ka = rawObj.material.ka;
          if(rawObj.material.kd) obj.material.kd = rawObj.material.kd;
          if(rawObj.material.ks) obj.material.ks = rawObj.material.ks;
          if(rawObj.material.kr) obj.material.kr = rawObj.material.kr;
          if(rawObj.material.hardness) obj.material.hardness = rawObj.material.hardness;
          
          // Done with object
          if(obj) scene.objects.push(obj);
        }
  
        // Parse lights
        scene.lights = [];
        for(let rawLight of input.lights) {
          let b = 1;
          let r = 200;
          if(rawLight.brightness) b = rawLight.brightness;
          if(rawLight.radius) r = rawLight.radius;
          let light = new Light(vec4.fromValues(rawLight.pos[0], rawLight.pos[1], rawLight.pos[2], 1), b, r);
          
          if(light) scene.lights.push(light);
        }      

        resolve(scene);
      } catch(e) {
        reject(e);
      }
    });
  }
}



      // - CUBE OF SPHERES - 
      // Add a floor of coloured spheres to the scene, 
      // ** TEST CODE **
      /*for(let z = -10; z <= 10; z+= 4) {
        for(let x = -10; x <= 10; x+= 4) {
          for(let y = 0; y <= 20; y+= 6) {
            let m = new Material(0.05, 0.9, 1.5, 50, 0.5);
            
            let s = new Sphere(vec4.fromValues(x, y, z, 1), 2, `sphere,${z}, ${x}`);
            let r = ((z+40)*5) - ((y+10)*2);
            let g = ((x+20)*2.5) - ((y+10)*5);
            let b = ((y+10)*3)+0;
  
            m.texture = new TextureBasic(Colour.fromRGB(r, g, b));
  
            s.material = m;
            scene.objects.push(s);
          }
        }
      }*/
  