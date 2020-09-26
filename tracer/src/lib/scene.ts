/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-prototype-builtins */
import { Colour } from './colour';
import { Object3D } from './object3d';
import { Light } from './light';
import { Material } from './material';
import { vec3, vec4 } from 'gl-matrix';
import { TextureBasic } from './texture-basic';
import { TextureCheckUV } from './texture-check-uv';
import { TextureImage } from './texture-image';
import { PngManager } from './png-manager';
import { Plane } from './plane';
import { Sphere } from './sphere';
import { Cuboid } from './cuboid';
import { Cylinder } from './cylinder';
import { Cone } from './cone';
import { ObjManager } from './obj-manager';
import { Mesh, BoundingBoxSettings } from './mesh';
import { NoiseTexture, TurbulenceTexture, NoiseLib, MarbleTexture, WoodTexture } from './texture-noise';
import { Texture } from './texture';
import { AnimationTranslate } from './animation-translate';

// ====================================================================================================
//
// ====================================================================================================
export class Scene {
  backgroundColour: Colour;
  ambientLevel: number;
  ior: number;
  seed: string;

  cameraPos: vec3;      // Camera position in world
  cameraLookAt: vec3;   // Camera look at point
  cameraFov: number;    // Camera field of view in radians

  objects: Object3D[];
  lights: Light[];
  static presetMaterials: { [name: string]: Material; } = { };
  static randomSeed: string;

  // ====================================================================================================
  // Main scene parser, convert JSON into a real Scene with Object3Ds and Lights etc etc
  // ====================================================================================================
  static parseScene(input: any, jobId: string): Promise<Scene> {

    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {

      const scene: Scene = new Scene();
      console.log('### Begin parsing scene...');

      try {
        if(!input.cameraPos) throw('Scene cameraPos missing');
        if(!input.cameraLookAt) throw('Scene cameraLookAt missing');

        // NOTE: We need to use the same random seed across all tracers otherwise
        // We'll get banding with noiseTextures
        if(!input.seed)
          scene.seed = jobId;
        else
          scene.seed = input.seed;
        NoiseLib.initNoise(scene.seed);

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

        scene.ior = 1.0;
        scene.cameraPos = vec3.fromValues(input.cameraPos[0], input.cameraPos[1], input.cameraPos[2]);
        scene.cameraLookAt = vec3.fromValues(input.cameraLookAt[0], input.cameraLookAt[1], input.cameraLookAt[2]);

        // Parse presetMaterials materials
        Scene.presetMaterials.basic  = new Material(0.1,  1,   0,   5,  0, 0);
        Scene.presetMaterials.matte  = new Material(0.2,  0.8, 0,   2,  0, 0);
        Scene.presetMaterials.rubber = new Material(0.05, 0.9, 0.3, 2,  0, 0);
        Scene.presetMaterials.shiny  = new Material(0.05, 0.9, 1.2, 20, 0, 0);

        if(input.materials) {
          for(const rawMat of input.materials) {
            Scene.presetMaterials[rawMat.name] = await Scene.parseMaterial(rawMat);
          }
        }

        // Parse objects
        scene.objects = [];
        for(const rawObj of input.objects) {
          let obj: Object3D = null;

          if(!rawObj.type) throw(`Object type missing ${JSON.stringify(rawObj)}`);
          if(!rawObj.name) throw(`Object name missing ${JSON.stringify(rawObj)}`);
          if(!rawObj.pos) throw(`Object pos missing ${JSON.stringify(rawObj)}`);
          if(!rawObj.material) throw(`Object material: missing ${JSON.stringify(rawObj)}`);

          // FIXME: TEMPORARY!!!!
          const a = new AnimationTranslate(vec3.fromValues(18, -59, -200), 5);
          const b = new AnimationTranslate(vec3.fromValues(18, 0, 20), 5);

          switch (rawObj.type.toLowerCase()) {
            case 'sphere':
              if(!rawObj.radius) throw(`Sphere radius missing ${JSON.stringify(rawObj)}`);
              obj = new Sphere(vec3.fromValues(rawObj.pos[0], rawObj.pos[1], rawObj.pos[2]), rawObj.radius, rawObj.name);
              obj.animations.push(a);
              obj.animations.push(b);
              break;

            case 'plane':
              if(!rawObj.rotate) { rawObj.rotate = []; rawObj.rotate[0] = 0; rawObj.rotate[1] = 0; rawObj.rotate[2] = 0; }
              obj = new Plane(vec3.fromValues(rawObj.pos[0], rawObj.pos[1], rawObj.pos[2]), vec3.fromValues(rawObj.rotate[0], rawObj.rotate[1], rawObj.rotate[2]), rawObj.name);
              break;

            case 'cuboid':
              if(!rawObj.size) throw(`Cuboid size missing ${JSON.stringify(rawObj)}`);
              if(!rawObj.rotate) { rawObj.rotate = []; rawObj.rotate[0] = 0; rawObj.rotate[1] = 0; rawObj.rotate[2] = 0; }
              obj = new Cuboid(vec3.fromValues(rawObj.pos[0], rawObj.pos[1], rawObj.pos[2]),
                vec3.fromValues(rawObj.rotate[0], rawObj.rotate[1], rawObj.rotate[2]),
                vec3.fromValues(rawObj.size[0], rawObj.size[1], rawObj.size[2]), rawObj.name);
              break;

            case 'cylinder':
              if(!rawObj.radius) throw(`Cylinder radius missing ${JSON.stringify(rawObj)}`);
              if(!rawObj.length) throw(`Cylinder length missing ${JSON.stringify(rawObj)}`);
              if(!rawObj.rotate) { rawObj.rotate = []; rawObj.rotate[0] = 0; rawObj.rotate[1] = 0; rawObj.rotate[2] = 0; }
              obj = new Cylinder(vec3.fromValues(rawObj.pos[0], rawObj.pos[1], rawObj.pos[2]),
                vec3.fromValues(rawObj.rotate[0], rawObj.rotate[1], rawObj.rotate[2]),
                rawObj.radius, rawObj.length, rawObj.capped, rawObj.name);
              break;

            case 'cone':
              if(!rawObj.radius) throw(`Cone radius missing ${JSON.stringify(rawObj)}`);
              if(!rawObj.length) throw(`Cone length missing ${JSON.stringify(rawObj)}`);
              if(!rawObj.rotate) { rawObj.rotate = []; rawObj.rotate[0] = 0; rawObj.rotate[1] = 0; rawObj.rotate[2] = 0; }
              obj = new Cone(vec3.fromValues(rawObj.pos[0], rawObj.pos[1], rawObj.pos[2]),
                vec3.fromValues(rawObj.rotate[0], rawObj.rotate[1], rawObj.rotate[2]),
                rawObj.radius, rawObj.length, rawObj.capped, rawObj.name);
              break;

            case 'mesh': {
              if(!rawObj.src) throw(`Mesh src missing ${JSON.stringify(rawObj)}`);
              if(!rawObj.rotate) { rawObj.rotate = []; rawObj.rotate[0] = 0; rawObj.rotate[1] = 0; rawObj.rotate[2] = 0; }
              if(!rawObj.scale) { rawObj.scale = 1; }

              // Override mesh settings if provided
              const boxSettings: BoundingBoxSettings = new BoundingBoxSettings(100, 5, 0.06);
              if(rawObj.boundingSettings) {
                boxSettings.maxDepth = rawObj.boundingSettings[0];
                boxSettings.maxFaces = rawObj.boundingSettings[1];
                boxSettings.vertexEpsilon = rawObj.boundingSettings[2];
              }

              if(rawObj.debug) boxSettings.debug = rawObj.debug;

              // Load .obj file into manager before creating Mesh object
              await ObjManager.getInstance().loadObjFile(rawObj.src);

              // Now create the Object3D
              obj = new Mesh(rawObj.src, vec3.fromValues(rawObj.pos[0], rawObj.pos[1], rawObj.pos[2]),
                vec3.fromValues(rawObj.rotate[0], rawObj.rotate[1], rawObj.rotate[2]),
                rawObj.scale, rawObj.name, boxSettings);

              break;
            }
            default: {
              throw `Object type '${rawObj.type}' is invalid`;
            }
          }

          if(obj) {
            obj.material = await Scene.parseMaterial(rawObj.material);

            // Done with object
            console.log(`### Parsed new object ${obj.name}`);
            if(obj) scene.objects.push(obj);
          }
        }

        // Parse lights
        scene.lights = [];
        for(const rawLight of input.lights) {
          let b = 1;
          let r = 200;
          if(rawLight.brightness) b = rawLight.brightness;
          if(rawLight.radius) r = rawLight.radius;
          const light = new Light(vec4.fromValues(rawLight.pos[0], rawLight.pos[1], rawLight.pos[2], 1), b, r);

          if(rawLight.colour) {
            light.colour = Colour.fromRGB(rawLight.colour[0], rawLight.colour[1], rawLight.colour[2]);
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
  static async parseMaterial(input: any): Promise<Material> {
    // Initialize the baseline/default material
    const material: Material = new Material(0.1, 1, 0, 5, 0, 0);

    // Handle preset material lookup
    if(input.preset) {
      // A simple/brute force copy, why not use Object.assign or spread operator?
      // Because everything went to hell when I tried that, trust me, this is safer
      material.ka = Scene.presetMaterials[input.preset].ka;
      material.kd = Scene.presetMaterials[input.preset].kd;
      material.ks = Scene.presetMaterials[input.preset].ks;
      material.kr = Scene.presetMaterials[input.preset].kr;
      material.hardness = Scene.presetMaterials[input.preset].hardness;
      material.noShade = Scene.presetMaterials[input.preset].noShade;
      material.kt = Scene.presetMaterials[input.preset].kt;
      material.ior = Scene.presetMaterials[input.preset].ior;

      material.textures = [];
      for(const tex of Scene.presetMaterials[input.preset].textures) {
        material.textures.push(tex);
      }
      if(!material) throw(`Preset material ${input.preset} not found`);
    }

    // Other material properties, override the preset if set
    if(input.hasOwnProperty('ka')) material.ka = input.ka;
    if(input.hasOwnProperty('kd')) material.kd = input.kd;
    if(input.hasOwnProperty('ks')) material.ks = input.ks;
    if(input.hasOwnProperty('kr')) material.kr = input.kr;
    if(input.hasOwnProperty('kt')) material.kt = input.kt;
    if(input.hasOwnProperty('ior')) material.ior = input.ior;
    if(input.noShade) material.noShade = input.noShade;
    if(input.hardness) material.hardness = input.hardness;

    // Begin texture parsing
    if(input.texture) {
      // Texture can be an array OR a single object, just a convenience
      if(Array.isArray(input.texture)) {
        for(const textureInput of input.texture) {
          material.textures.push(await this.parseTexture(textureInput));
        }
      } else {
        material.textures[0] = await this.parseTexture(input.texture);
      }
    }

    return material;
  }

  // ====================================================================================================
  // Parse and return a texture
  // ====================================================================================================
  static async parseTexture(textureInput: any): Promise<Texture> {
    let texture: Texture = null;
    console.log(`### Parsing texture type: ${textureInput.type}`);

    switch (textureInput.type) {
      case 'basic': {
        if(!textureInput.colour) throw('Texture of type \'basic\' requires colour');
        const c: number[] = textureInput.colour;
        texture = TextureBasic.fromRGB(c[0], c[1], c[2]);
        break;
      }
      case 'check': {
        if(!textureInput.colour1) throw('Texture of type \'check\' requires colour1');
        if(!textureInput.colour2) throw('Texture of type \'check\' requires colour2');
        const c1: number[] = textureInput.colour1;
        const c2: number[] = textureInput.colour2;
        texture = new TextureCheckUV(Colour.fromRGB(c1[0], c1[1], c1[2]), Colour.fromRGB(c2[0], c2[1], c2[2]));
        break;
      }
      case 'image': {
        if(!textureInput.src) throw('Texture of type \'image\' requires src');
        // The await here is super important, we can't carry on until all textures are loaded
        await PngManager.getInstance().loadTexture(textureInput.src);
        texture = new TextureImage(textureInput.src);
        break;
      }
      case 'noise': {
        if(!textureInput.colour1) throw('Texture of type \'noise\' requires colour1');
        if(!textureInput.colour2) throw('Texture of type \'noise\' requires colour2');
        if(!textureInput.scale) { textureInput.scale = []; textureInput.scale[0] = 1; textureInput.scale[1] = 1; textureInput.scale[2] = 1; }
        const c1: number[] = textureInput.colour1;
        const c2: number[] = textureInput.colour2;
        if(!textureInput.mult) { textureInput.mult = 1; }
        if(!textureInput.pow) { textureInput.pow = 1; }
        texture = new NoiseTexture(textureInput.scale, Colour.fromRGB(c1[0], c1[1], c1[2]), Colour.fromRGB(c2[0], c2[1], c2[2]), textureInput.mult, textureInput.pow);
        break;
      }
      case 'turbulence': {
        if(!textureInput.colour1) throw('Texture of type \'noise\' requires colour1');
        if(!textureInput.colour2) throw('Texture of type \'noise\' requires colour2');
        if(!textureInput.scale) { textureInput.scale = []; textureInput.scale[0] = 1; textureInput.scale[1] = 1; textureInput.scale[2] = 1; }
        if(!textureInput.size) { textureInput.size = 32; }
        if(!textureInput.mult) { textureInput.mult = 1; }
        if(!textureInput.pow) { textureInput.pow = 1; }
        if(!textureInput.abs) { textureInput.abs = false; }
        const c1: number[] = textureInput.colour1;
        const c2: number[] = textureInput.colour2;
        texture = new TurbulenceTexture(textureInput.scale, Colour.fromRGB(c1[0], c1[1], c1[2]), Colour.fromRGB(c2[0], c2[1], c2[2]), textureInput.size, textureInput.mult, textureInput.pow, textureInput.abs);
        break;
      }
      case 'marble': {
        if(!textureInput.colour1) throw('Texture of type \'marble\' requires colour1');
        if(!textureInput.colour2) throw('Texture of type \'marble\' requires colour2');
        if(!textureInput.periods) { textureInput.periods = [10, 5, 5]; }
        if(!textureInput.turbPower) { textureInput.turbPower = 5; }
        if(!textureInput.turbSize) { textureInput.turbSize = 32; }
        if(!textureInput.mult) { textureInput.mult = 1; }
        if(!textureInput.pow) { textureInput.pow = 1; }
        const c1: number[] = textureInput.colour1;
        const c2: number[] = textureInput.colour2;
        texture = new MarbleTexture(textureInput.scale,
          Colour.fromRGB(c1[0], c1[1], c1[2]),
          Colour.fromRGB(c2[0], c2[1], c2[2]), textureInput.periods, textureInput.turbPower, textureInput.turbSize, textureInput.mult, textureInput.pow);
        break;
      }
      case 'wood': {
        if(!textureInput.colour1) throw('Texture of type \'wood\' requires colour1');
        if(!textureInput.colour2) throw('Texture of type \'wood\' requires colour2');
        if(!textureInput.period) { textureInput.period = 6; }
        if(!textureInput.axis) { textureInput.axis = 1; }
        if(!textureInput.offset) { textureInput.offset = [0, 0, 0]; }
        if(!textureInput.turbPower) { textureInput.turbPower = 5; }
        if(!textureInput.turbSize) { textureInput.turbSize = 32; }
        if(!textureInput.mult) { textureInput.mult = 1; }
        if(!textureInput.pow) { textureInput.pow = 1; }
        const c1: number[] = textureInput.colour1;
        const c2: number[] = textureInput.colour2;
        texture = new WoodTexture(textureInput.scale,
          Colour.fromRGB(c1[0], c1[1], c1[2]),
          Colour.fromRGB(c2[0], c2[1], c2[2]), textureInput.period, textureInput.turbPower, textureInput.turbSize, textureInput.mult, textureInput.pow, textureInput.axis, textureInput.offset);
        break;
      }
      default: {
        const c = textureInput.colour;
        texture = TextureBasic.fromRGB(c[0], c[1], c[2]);
        break;
      }
    }

    if(textureInput.scaleU) texture.scaleU = textureInput.scaleU;
    if(textureInput.scaleV) texture.scaleV = textureInput.scaleV;
    if(textureInput.flipU) (texture as TextureImage).flipU = textureInput.flipU;
    if(textureInput.flipV) (texture as TextureImage).flipV = textureInput.flipV;
    if(textureInput.swapUV) (texture as TextureImage).swapUV = textureInput.swapUV;

    return texture;
  }
}
