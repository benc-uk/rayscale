//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { vec3, mat4, quat } from 'gl-matrix';
import { Ray } from '../ray';
import { Hit } from '../hit';
import { Material } from '../material';
import { Animation } from '../animation';
import { Utils } from '../utils';
import { TResult } from '../t-result';

// ====================================================================================
// Base interface all objects need to implement
// ====================================================================================
export interface Object3DInterface {
  // ====================================================================================================
  // Used by Raytracer main loop to test if a ray has hit this object
  // ====================================================================================================
  calcT(ray: Ray): TResult;

  // ====================================================================================================
  // Used by Raytracer main loop to get details of the hit; intersection point, normal etc.
  // ====================================================================================================
  getHitPoint(result: TResult): Hit;
}

// ====================================================================================
// Base class all objects inherit from
// ====================================================================================
export abstract class Object3D implements Object3DInterface {
  trans: mat4;              // Inverse transform matrix to move rays into object space
  transFwd: mat4;           // Forward transform matrix to move rays from object to world space
  material: Material;       // Material; color and other surface coefficients
  animations: Animation[];  // Animation set for this object

  constructor(public name: string, public pos: vec3, public rot: vec3, time: number, anims: Animation[]) {
    this.animations = new Array<Animation>();
    this.transFwd = mat4.identity(mat4.create());
    this.trans = mat4.identity(mat4.create());

    // Apply animation for time
    this.animations = anims;
    if(this.animations) {
      for(const anim of this.animations) {
        anim.updateObjectAtTime(this, time);
      }
    }

    // Build transforms based on position and rotation
    const rotQuat: quat = quat.identity(quat.create());
    quat.rotateX(rotQuat, rotQuat, Utils.degreeToRad(this.rot[0]));
    quat.rotateY(rotQuat, rotQuat, Utils.degreeToRad(this.rot[1]));
    quat.rotateZ(rotQuat, rotQuat, Utils.degreeToRad(this.rot[2]));
    mat4.fromRotationTranslationScale(this.transFwd, rotQuat, this.pos, [1, 1, 1]);
    mat4.invert(this.trans, this.transFwd);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  calcT(ray: Ray): TResult {
    throw new Error('Method not implemented.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getHitPoint(result: TResult): Hit {
    throw new Error('Method not implemented.');
  }
}

// ******************************************************************************************************

// ======================================================================================================
// Global static consts, and magic numbers
// ======================================================================================================
export class ObjectConsts {
  // We use epsilon tolerance values to stop artefacts and other floating point weirdness
  public static readonly EPSILON2: number = 0.01;
  public static readonly EPSILON3: number = 0.001;
  public static readonly EPSILON4: number = 0.0001;
  public static readonly EPSILON5: number = 0.00001;
}