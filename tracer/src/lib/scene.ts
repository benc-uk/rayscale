import { Colour } from './colour';
import { Object3D } from './object3d';
import { Light } from './light';
import { Material } from './material';
import { vec3, vec4 } from 'gl-matrix';
import { Texture } from './texture';
import { TextureBasic } from './texture-basic';
import { TextureCheck } from './texture-check';
import { TextureImage } from './texture-image';
import { TextureManager } from './texture-manager';
import { Plane } from './plane';
import { Sphere } from './sphere';
import { Cuboid } from './cuboid';
import { Cylinder } from './cylinder';
import { Cone } from './cone';
import { ObjManager } from './obj-manager';
import { Mesh, BoundingBoxSettings } from './mesh';

// ====================================================================================================
// 
// ====================================================================================================
export class Scene {
  name: string;
  backgroundColour: Colour;
  ambientLevel: number;
  ior: number;

  cameraPos: vec3;      // Camera position in world
  cameraLookAt: vec3;   // Camera look at point
  cameraFov: number;    // Camera field of view in radians

  objects: Object3D[];
  lights: Light[];
  static presetMaterials: { [name: string]: Material; } = { };

  // ====================================================================================================
  // 
  // ====================================================================================================
  static parseScene(input: any): Promise<any> {

    return new Promise(async (resolve, reject) => {
    
      let scene: Scene = new Scene();
      console.log(`### Begin parsing scene...`);

      try {
        if(!input.name) throw('Scene name missing');
        if(!input.cameraPos) throw('Scene cameraPos missing');
        if(!input.cameraLookAt) throw('Scene cameraLookAt missing');
        
        if(!input.backgroundColour) 
          scene.backgroundColour = Colour.fromRGB(0, 0, 0);
        else
          scene.backgroundColour = Colour.fromRGB(input.backgroundColour[0], input.backgroundColour[1], input.backgroundColour[2]);
        
        if(!input.ambientLevel) 
          scene.ambientLevel = 0.1;
        else
          scene.ambientLevel = input.ambientLevel;
        
        if(!input.cameraFov) 
          scene.cameraFov = 30;
        else
          scene.cameraFov = input.cameraFov;

        scene.name = input.name;
        scene.ior = 1.0;
        scene.cameraPos = vec3.fromValues(input.cameraPos[0], input.cameraPos[1], input.cameraPos[2]);
        scene.cameraLookAt = vec3.fromValues(input.cameraLookAt[0], input.cameraLookAt[1], input.cameraLookAt[2]);
  
        // Parse presetMaterials materials
        Scene.presetMaterials.basic  = new Material(0.1,  1,   0,   5,  0, 0);
        Scene.presetMaterials.matte  = new Material(0.2,  0.8, 0,   2,  0, 0);
        Scene.presetMaterials.rubber = new Material(0.05, 0.9, 0.3, 2,  0, 0);
        Scene.presetMaterials.shiny  = new Material(0.05, 0.9, 1.2, 20, 0, 0);
        if(input.materials) {
          for(let rawMat of input.materials) {
            Scene.presetMaterials[rawMat.name] = await Scene.parseMaterial(rawMat);
          }
        }

        // Parse objects
        scene.objects = [];
        for(let rawObj of input.objects) {
          let obj: Object3D = null;

          if(!rawObj.type) throw(`Object type missing ${JSON.stringify(rawObj)}`);
          if(!rawObj.name) throw(`Object name missing ${JSON.stringify(rawObj)}`);
          if(!rawObj.pos) throw(`Object pos missing ${JSON.stringify(rawObj)}`);

          switch (rawObj.type.toLowerCase()) {
            case 'sphere':
              if(!rawObj.radius) throw(`Sphere radius missing ${JSON.stringify(rawObj)}`);
              obj = new Sphere(vec4.fromValues(rawObj.pos[0], rawObj.pos[1], rawObj.pos[2], 1), rawObj.radius, rawObj.name);
              break;

            case 'plane':
              if(!rawObj.rotate) { rawObj.rotate = []; rawObj.rotate[0] = 0; rawObj.rotate[1] = 0; rawObj.rotate[2] = 0; }
              obj = new Plane(vec4.fromValues(rawObj.pos[0], rawObj.pos[1], rawObj.pos[2], 1), vec3.fromValues(rawObj.rotate[0], rawObj.rotate[1], rawObj.rotate[2]), rawObj.name);
              break;

            case 'cuboid':
              if(!rawObj.size) throw(`Cuboid size missing ${JSON.stringify(rawObj)}`);
              if(!rawObj.rotate) { rawObj.rotate = []; rawObj.rotate[0] = 0; rawObj.rotate[1] = 0; rawObj.rotate[2] = 0; }
              obj = new Cuboid(vec4.fromValues(rawObj.pos[0], rawObj.pos[1], rawObj.pos[2], 1), 
                              vec3.fromValues(rawObj.rotate[0], rawObj.rotate[1], rawObj.rotate[2]), 
                              vec3.fromValues(rawObj.size[0], rawObj.size[1], rawObj.size[2]), rawObj.name);
              break;

            case 'cylinder':
              if(!rawObj.radius) throw(`Cylinder radius missing ${JSON.stringify(rawObj)}`);
              if(!rawObj.length) throw(`Cylinder length missing ${JSON.stringify(rawObj)}`);
              if(!rawObj.rotate) { rawObj.rotate = []; rawObj.rotate[0] = 0; rawObj.rotate[1] = 0; rawObj.rotate[2] = 0; }
              obj = new Cylinder(vec4.fromValues(rawObj.pos[0], rawObj.pos[1], rawObj.pos[2], 1), 
                                 vec3.fromValues(rawObj.rotate[0], rawObj.rotate[1], rawObj.rotate[2]), 
                                 rawObj.radius, rawObj.length, rawObj.capped, rawObj.name);
              break;

            case 'cone':
              if(!rawObj.radius) throw(`Cone radius missing ${JSON.stringify(rawObj)}`);
              if(!rawObj.length) throw(`Cone length missing ${JSON.stringify(rawObj)}`);
              if(!rawObj.rotate) { rawObj.rotate = []; rawObj.rotate[0] = 0; rawObj.rotate[1] = 0; rawObj.rotate[2] = 0; }
              obj = new Cone(vec4.fromValues(rawObj.pos[0], rawObj.pos[1], rawObj.pos[2], 1), 
                                 vec3.fromValues(rawObj.rotate[0], rawObj.rotate[1], rawObj.rotate[2]), 
                                 rawObj.radius, rawObj.length, rawObj.capped, rawObj.name);
              break;

            case 'mesh':
              if(!rawObj.src) throw(`Mesh src missing ${JSON.stringify(rawObj)}`);
              if(!rawObj.rotate) { rawObj.rotate = []; rawObj.rotate[0] = 0; rawObj.rotate[1] = 0; rawObj.rotate[2] = 0; }
              if(!rawObj.scale) { rawObj.scale = 1 }

              // Override mesh settings if provided 
              let boxSettings: BoundingBoxSettings = new BoundingBoxSettings(100, 5, 0.06);
              if(rawObj.boundingSettings) {
                boxSettings.maxDepth = rawObj.boundingSettings[0];
                boxSettings.maxFaces = rawObj.boundingSettings[1];
                boxSettings.vertexEpsilon = rawObj.boundingSettings[2];
              }
              if(rawObj.debug) boxSettings.debug = rawObj.debug;
              // Load .obj file into manager before creating Mesh object
              await ObjManager.getInstance().loadObjFile(rawObj.src);
              obj = new Mesh(rawObj.src, vec4.fromValues(rawObj.pos[0], rawObj.pos[1], rawObj.pos[2], 1), 
                             vec3.fromValues(rawObj.rotate[0], rawObj.rotate[1], rawObj.rotate[2]), 
                             rawObj.scale, rawObj.name, boxSettings);

              break;

            default:
              throw `Object type '${rawObj.type}' is invalid`
          }
          
          if(obj) {
            obj.material = await Scene.parseMaterial(rawObj.material)
            
            // Done with object
            console.log(`### Parsed new object ${obj.name}`);
            if(obj) scene.objects.push(obj);
          }
        }
  
        // Parse lights
        scene.lights = [];
        for(let rawLight of input.lights) {
          let b = 1;
          let r = 200;
          if(rawLight.brightness) b = rawLight.brightness;
          if(rawLight.radius) r = rawLight.radius;
          let light = new Light(vec4.fromValues(rawLight.pos[0], rawLight.pos[1], rawLight.pos[2], 1), b, r);   

          if(rawLight.colour) {
            light.colour = Colour.fromRGB(rawLight.colour[0], rawLight.colour[1], rawLight.colour[2])
          }

          if(light) scene.lights.push(light);
        }      

        resolve(scene);
      } catch(e) {
        reject(e);
      }
    });
  }

  // ====================================================================================================
  // Parse a preset or inline material
  // ====================================================================================================
  static async parseMaterial(input: any) {

    let m = new Material(0.1, 1, 0, 5, 0, 0);
    if(input.preset) {
      m = Object.assign({}, Scene.presetMaterials[input.preset]);
      if(!m) throw(`Preset material ${input.preset} not found`);
    }

    // Other material properties, override the preset if set
    if(input.hasOwnProperty('ka')) m.ka = input.ka;
    if(input.hasOwnProperty('kd')) m.kd = input.kd;
    if(input.hasOwnProperty('ks')) m.ks = input.ks;
    if(input.hasOwnProperty('kr')) m.kr = input.kr;
    if(input.hasOwnProperty('kt')) m.kt = input.kt;
    if(input.hasOwnProperty('ior')) m.ior = input.ior;
    if(input.noShade) m.noShade = input.noShade;
    if(input.hardness) m.hardness = input.hardness;

    // Type of texture check here
    let texture: Texture = null;
    if(input.texture) {
      //if(!input.texture.type) throw(`Texture missing type ${input.texture}`);
      //console.log(`### Parsing texture type: ${input.texture.type}`);
      switch (input.texture.type) {
        case 'basic':
          if(!input.texture.colour) throw(`Texture of type 'basic' requires colour`);
          var c: any = input.texture.colour;
          texture = TextureBasic.fromRGB(c[0], c[1], c[2])
          break;
        case 'check':
          if(!input.texture.colour1) throw(`Texture of type 'check' requires colour1`);
          if(!input.texture.colour2) throw(`Texture of type 'check' requires colour2`);
          var c1: any = input.texture.colour1;
          var c2: any = input.texture.colour2;
          texture = new TextureCheck(Colour.fromRGB(c1[0], c1[1], c1[2]), Colour.fromRGB(c2[0], c2[1], c2[2]));
          break;
        case 'image':
          if(!input.texture.src) throw(`Texture of type 'image' requires src`); 
          // The await here is super important, we can't carry on until all textures are loaded
          await TextureManager.getInstance().loadTexture(input.texture.src);
          texture = new TextureImage(input.texture.src);
          break;
        default:
          var c = input.texture.colour;
          texture = TextureBasic.fromRGB(c[0], c[1], c[2])
          break;
      }
            
      if(input.texture.scaleU) texture.scaleU = input.texture.scaleU;
      if(input.texture.scaleV) texture.scaleV = input.texture.scaleV;
      if(input.texture.flipU) texture.flipU = input.texture.flipU;
      if(input.texture.flipV) texture.flipV = input.texture.flipV;
      if(input.texture.swapUV) texture.swapUV = input.texture.swapUV;
      m.texture = texture;  
    }
    
    //console.log(`### Parsed material`);
    return m;
  }
}
