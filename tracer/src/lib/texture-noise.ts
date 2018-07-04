//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import SimplexNoise from 'simplex-noise';
import { Texture } from './texture';
import { Colour } from './colour';
import { Scene } from './scene';

// ====================================================================================================
// Simplex noise based 3D/solid textures
// ====================================================================================================

// ====================================================================================================
// Basic Simplex noise
// ====================================================================================================
export class NoiseTexture extends Texture {
  solid: boolean = true;
  scale: number[];
  noise: SimplexNoise;
  colour1: Colour;
  colour2: Colour;
  mult: number;
  pow: number;

  constructor(scale: number[], c1: Colour, c2: Colour, mult: number, pow: number) {
    super();
    this.noise = new SimplexNoise(Scene.randomSeed);
    this.colour1 = c1;
    this.colour2 = c2;
    this.scale = scale;
    this.mult = mult;
    this.pow = pow;
  }

  public getColourAtSolid(x: number, y: number, z: number): Colour {
    x *= this.scale[0];
    y *= this.scale[1];
    z *= this.scale[2];
    let coloura = this.colour1.copy();
    let colourb = this.colour2.copy();

    var val = this.noise.noise3D(x, y, z);
    // Modify to range 0-1
    val = (val + 1) / 2;
    val *= this.mult;
    val = Math.pow(val, this.pow);

    coloura.mult(val);
    colourb.mult(1 - val);
    coloura.add(colourb);
    return coloura;
  }
}

// ====================================================================================================
// Turbulence generated with fractal noise
// ====================================================================================================
export class TurbulenceTexture extends Texture {
  solid: boolean = true;
  scale: number[];
  noise: SimplexNoise;
  colour1: Colour;
  colour2: Colour;
  size: number;
  mult: number;
  pow: number;
  abs: boolean;

  constructor(scale: number[], c1: Colour, c2: Colour, size: number, mult: number, pow: number, abs: boolean) {
    super();
    this.noise = new SimplexNoise(Scene.randomSeed);
    this.colour1 = c1;
    this.colour2 = c2;
    this.scale = scale;
    this.size = size;
    this.mult = mult;
    this.pow = pow;
    this.abs = abs;
  }

  public getColourAtSolid(x: number, y: number, z: number): Colour {
    x *= this.scale[0];
    y *= this.scale[1];
    z *= this.scale[2];
    // let val = 0.0;
    // let size = this.size;
    // let initialSize = size;
    // while(size >= 1) {
    //   if(this.abs)
    //     val += Math.abs(this.noise.noise3D(x / size, y / size, z / size) * size);
    //   else
    //     val += this.noise.noise3D(x / size, y / size, z / size) * size;
    //   size /= 2.0;
    // }
    // val = (val / (initialSize * 2));

    let val = NoiseLib.turb(x, y, z, this.size, this.abs);

    // Move to range 0~1
    val = (val + 1) / 2;
    val *= this.mult;
    val = Math.pow(val, this.pow);
    
    let coloura = this.colour1.copy();
    let colourb = this.colour2.copy();

    coloura.mult(val);
    colourb.mult(1 - val);
    coloura.add(colourb);
    return coloura;
  }
}

// ====================================================================================================
// Marble like effect created with turbulence
// ====================================================================================================
export class MarbleTexture extends Texture {
  solid: boolean = true;
  scale: number[];
  noise: SimplexNoise;
  colour1: Colour;
  colour2: Colour;
  periods: number[];
  turbPower: number;
  turbSize: number;
  mult: number;
  pow: number;

  constructor(scale: number[], c1: Colour, c2: Colour, periods: number[], turbPower: number, turbSize: number, mult: number, pow: number) {
    super();
    this.noise = new SimplexNoise(Scene.randomSeed);
    this.colour1 = c1;
    this.colour2 = c2;
    this.scale = scale;
    this.periods = periods;
    this.turbPower = turbPower;
    this.turbSize = turbSize;
    this.mult = mult;
    this.pow = pow;
  }

  public getColourAtSolid(x: number, y: number, z: number): Colour {
    x *= this.scale[0];
    y *= this.scale[1];
    z *= this.scale[2];
    let noiseSize = 256;
    let xyValue = x * this.periods[0] / noiseSize + y * this.periods[1] / noiseSize + z * this.periods[2] / noiseSize + this.turbPower * Math.abs(NoiseLib.turb(x, y, z, this.turbSize, false));
    let val = Math.abs(Math.sin(xyValue * 3.14159));
    let coloura = this.colour1.copy();
    let colourb = this.colour2.copy();
    val = Math.pow(val * this.mult, this.pow);

    coloura.mult(val);
    colourb.mult(1 - val);
    coloura.add(colourb);
    return coloura;
  }
}

export class NoiseLib {
  static noise: SimplexNoise;

  static initNoise(seed: string) {
    NoiseLib.noise = new SimplexNoise(seed);
  }

  static turb(x: number, y: number, z: number, initialSize: number, abs: boolean): number {
    let val = 0.0;
    let size = initialSize;
    //let initialSize = size;
    while(size >= 1) {
      if(abs)
        val += Math.abs(NoiseLib.noise.noise3D(x / size, y / size, z / size) * size);
      else
        val += NoiseLib.noise.noise3D(x / size, y / size, z / size) * size;
      size /= 2.0;
    }
    val = (val / (initialSize * 2));
    return val;
  }
}