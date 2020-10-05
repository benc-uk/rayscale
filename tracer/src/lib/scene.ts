/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-prototype-builtins */
import { Colour } from './colour';
import { Object3D } from './objects/object3d';
import { Animation } from './animation';
import { Light } from './light';
import { Material } from './material';
import { vec3, vec4 } from 'gl-matrix';
import { Texture } from './textures/texture';
import { TextureBasic } from './textures/texture-basic';
import { TextureCheckUV } from './textures/texture-check-uv';
import { TextureImage } from './textures/texture-image';
import { NoiseTexture, TurbulenceTexture, NoiseLib, MarbleTexture, WoodTexture } from './textures/texture-noise';
import { PngManager } from './png-manager';
import { Plane } from './objects/plane';
import { Sphere } from './objects/sphere';
import { Cuboid } from './objects/cuboid';
import { Cylinder } from './objects/cylinder';
import { Cone } from './objects/cone';
import { ObjManager } from './obj-manager';
import { Mesh, BoundingBoxSettings } from './objects/mesh';
import { AnimationVector } from './animation-vector';
import { Camera } from './camera';
import { AnimationSpline } from './animation-spline';

// TODO: Support variables e.g. host name string for textures, positions too?

// ====================================================================================================
// Scene is a fundamental class holding all details of a scene to be rendered
// ====================================================================================================
export class Scene {
  backgroundColour: Colour;
  ambientLevel: number;
  ior: number;
  seed: string;

  camera: Camera;

  objects: Object3D[];
  lights: Light[];
  static presetMaterials: { [name: string]: Material; } = { };
  static randomSeed: string;

  // ====================================================================================================
  // Main scene parser, convert JSON into a real Scene with Object3Ds and Lights etc etc
  // ====================================================================================================
  static parseScene(input: any, jobId: string, time: number): Promise<Scene> {

    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      // Start with an empty scene
      const scene: Scene = new Scene();
      console.log('### Begin parsing scene...');

      try {
        // NOTE: We need to use the same random seed across all tracers
        // This prevents banding with randomized noiseTextures
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

        scene.ior = 1.0;

        if(!input.camera) throw('Scene camera missing');
        if(!input.camera.pos) throw(`Camera pos missing ${JSON.stringify(input.camera)}`);
        if(!input.camera.lookAt) throw(`Camera lookAt missing ${JSON.stringify(input.camera)}`);

        // Camera field of view, with default of 30
        let cameraFov = 30;
        if(input.camera.fov)
          cameraFov = input.camera.fov;

        // Parse camera animations and create Camera
        const cameraAnims = this.parseAnimations(input.camera);
        scene.camera = new Camera(vec3.fromValues(input.camera.pos[0], input.camera.pos[1], input.camera.pos[2]),
          vec3.fromValues(input.camera.lookAt[0], input.camera.lookAt[1], input.camera.lookAt[2]),
          cameraFov, time, cameraAnims);

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

          // Parse all object animations
          const anims = this.parseAnimations(rawObj);

          switch (rawObj.type.toLowerCase()) {
            case 'sphere':
              if(!rawObj.radius) throw(`Sphere radius missing ${JSON.stringify(rawObj)}`);
              obj = new Sphere(vec3.fromValues(rawObj.pos[0], rawObj.pos[1], rawObj.pos[2]), rawObj.radius, rawObj.name, time, anims);
              break;

            case 'plane':
              if(!rawObj.rotate) { rawObj.rotate = []; rawObj.rotate[0] = 0; rawObj.rotate[1] = 0; rawObj.rotate[2] = 0; }
              obj = new Plane(vec3.fromValues(rawObj.pos[0], rawObj.pos[1], rawObj.pos[2]), vec3.fromValues(rawObj.rotate[0], rawObj.rotate[1], rawObj.rotate[2]), rawObj.name, time, anims);
              break;

            case 'cuboid':
              if(!rawObj.size) throw(`Cuboid size missing ${JSON.stringify(rawObj)}`);
              if(!rawObj.rotate) { rawObj.rotate = []; rawObj.rotate[0] = 0; rawObj.rotate[1] = 0; rawObj.rotate[2] = 0; }
              obj = new Cuboid(vec3.fromValues(rawObj.pos[0], rawObj.pos[1], rawObj.pos[2]),
                vec3.fromValues(rawObj.rotate[0], rawObj.rotate[1], rawObj.rotate[2]),
                vec3.fromValues(rawObj.size[0], rawObj.size[1], rawObj.size[2]), rawObj.name, time, anims);
              break;

            case 'cylinder':
              if(!rawObj.radius) throw(`Cylinder radius missing ${JSON.stringify(rawObj)}`);
              if(!rawObj.length) throw(`Cylinder length missing ${JSON.stringify(rawObj)}`);
              if(!rawObj.rotate) { rawObj.rotate = []; rawObj.rotate[0] = 0; rawObj.rotate[1] = 0; rawObj.rotate[2] = 0; }
              obj = new Cylinder(vec3.fromValues(rawObj.pos[0], rawObj.pos[1], rawObj.pos[2]),
                vec3.fromValues(rawObj.rotate[0], rawObj.rotate[1], rawObj.rotate[2]),
                rawObj.radius, rawObj.length, rawObj.capped, rawObj.name, time, anims);
              break;

            case 'cone':
              if(!rawObj.radius) throw(`Cone radius missing ${JSON.stringify(rawObj)}`);
              if(!rawObj.length) throw(`Cone length missing ${JSON.stringify(rawObj)}`);
              if(!rawObj.rotate) { rawObj.rotate = []; rawObj.rotate[0] = 0; rawObj.rotate[1] = 0; rawObj.rotate[2] = 0; }
              obj = new Cone(vec3.fromValues(rawObj.pos[0], rawObj.pos[1], rawObj.pos[2]),
                vec3.fromValues(rawObj.rotate[0], rawObj.rotate[1], rawObj.rotate[2]),
                rawObj.radius, rawObj.length, rawObj.capped, rawObj.name, time, anims);
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
                rawObj.scale, rawObj.name, boxSettings, time, anims);

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
          let b = 1;    // Default radius and brightness
          let r = 200;
          if(rawLight.brightness) b = rawLight.brightness;
          if(rawLight.radius) r = rawLight.radius;

          // Lights can be animated, wow weee!
          const lightAnims = this.parseAnimations(rawLight);

          // Default colour is white
          let lightColour = new Colour(1, 1, 1);
          if(rawLight.colour) {
            lightColour = Colour.fromRGB(rawLight.colour[0], rawLight.colour[1], rawLight.colour[2]);
          }

          // Build light and add to scene
          const light = new Light(vec4.fromValues(rawLight.pos[0], rawLight.pos[1], rawLight.pos[2], 1), b, r, lightColour, time, lightAnims);
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

  // ====================================================================================================
  // Parse and return an array of animations
  // ====================================================================================================
  static parseAnimations(rawObj: any): Animation[] {
    const anims = new Array<Animation>();

    // Might have no animations
    if(!rawObj.animation) return anims;

    for(const rawAnim of rawObj.animation) {
      if(!rawAnim.type) throw('Animation missing required field \'type\'');
      if(!rawAnim.property) throw('Animation missing required field \'property\'');
      if(!rawAnim.hasOwnProperty('start')) throw('Animation missing required field \'start\'');
      if(typeof rawAnim.start !== 'number') throw('Animation start must be a number');
      if(typeof rawAnim.duration !== 'number') throw('Animation duration must be a number');

      if(!rawAnim.duration) throw('Animation missing required field \'duration\'');

      switch(rawAnim.type.toLowerCase()) {
        case 'vector': {
          if(!rawAnim.hasOwnProperty('target')) throw('Animation type vector missing required field \'target\'');
          const anim = new AnimationVector(rawAnim.property, rawAnim.target, rawAnim.start, rawAnim.duration);
          anims.push(anim);
          break;
        }

        case 'spline': {
          if(!rawAnim.hasOwnProperty('points')) throw('Animation type vector missing required field \'points\'');
          const anim = new AnimationSpline(rawAnim.property, rawAnim.points, rawAnim.start, rawAnim.duration);
          anims.push(anim);
          break;
        }

        default: {
          throw `Animation type '${rawAnim.type}' is invalid, must be 'vector' or 'spline'`;
        }
      }
    }

    return anims;
  }
}
