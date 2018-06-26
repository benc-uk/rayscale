//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import { Object3D, ObjectConsts } from './object3d';
import { Ray } from './ray';
import { vec3, vec4, mat4, quat } from 'gl-matrix';
import { Hit } from './hit';
import { Material } from './material';
import { Utils } from './utils';
import { Stats } from './stats';
import { TResult } from './t-result';
import { ObjManager } from './obj-manager';
import { ObjModel, Face } from 'obj-file-parser';

// ====================================================================================================
// Object consisting of a polygon mesh, created from OBJ format file
// ====================================================================================================
export class Mesh implements Object3D {
  // Base properties
  name: string;
  trans: mat4;
  transFwd: mat4;
  material: Material;

  // Mesh properties
  objModel: ObjModel;

  // ====================================================================================================
  // Create a ObjMesh
  // ====================================================================================================
  constructor(objFile: string, pos: vec4, rotation: vec3, name: string) {
    this.name = name;
    this.objModel = ObjManager.getInstance().getObjModel(objFile, 0);
    if(!this.objModel) {
      throw `Obj file ${objFile} not loaded in ObjectManager`;
    }

    this.transFwd = mat4.identity(mat4.create());
    this.trans = mat4.identity(mat4.create());
    let rot: quat = quat.identity(quat.create());
    quat.rotateX(rot, rot, Utils.degreeToRad(rotation[0]));
    quat.rotateY(rot, rot, Utils.degreeToRad(rotation[1]));
    quat.rotateZ(rot, rot, Utils.degreeToRad(rotation[2])); 
    mat4.fromRotationTranslationScale(this.transFwd, rot, [pos[0], pos[1], pos[2]], [1, 1, 1]);
    mat4.invert(this.trans, this.transFwd);
  }

  public calcT(inray: Ray): TResult {
    Stats.objectTests++;
    let ray: Ray = inray.transformNewRay(this.trans);
    let result = new TResult(0.0, ray);

    // !TODO: Bounding Box, REALLY IMPORTANT

    let maxt: number = Number.MAX_VALUE;
    let faceIndex = 0;
    for(let face of this.objModel.faces) {
      let v0: vec3 = vec3.fromValues(this.objModel.vertices[face.vertices[0].vertexIndex - 1].x,
        this.objModel.vertices[face.vertices[0].vertexIndex - 1].y,
        this.objModel.vertices[face.vertices[0].vertexIndex - 1].z);
      let v1: vec3 = vec3.fromValues(this.objModel.vertices[face.vertices[1].vertexIndex - 1].x,
        this.objModel.vertices[face.vertices[1].vertexIndex - 1].y,
        this.objModel.vertices[face.vertices[1].vertexIndex - 1].z);
      let v2: vec3 = vec3.fromValues(this.objModel.vertices[face.vertices[2].vertexIndex - 1].x,
        this.objModel.vertices[face.vertices[2].vertexIndex - 1].y,
        this.objModel.vertices[face.vertices[2].vertexIndex - 1].z);

      let faceHit: FaceHit = this.calcFaceHit(ray, v1, v0, v2);
      
      if(faceHit && faceHit.t < maxt) {
        result.t = faceHit.t;
        faceHit.face = faceIndex;
        result.flag = faceHit;
        maxt = faceHit.t;
      }
      faceIndex++;
    }
    return result;
  }

  // ====================================================================================================
  // Möller–Trumbore intersection algorithm
  // Taken from: https://en.wikipedia.org/wiki/M%C3%B6ller%E2%80%93Trumbore_intersection_algorithm
  // =====================================================================================ray===============
  private calcFaceHit(ray: Ray, vertex0: vec3, vertex1: vec3, vertex2: vec3): FaceHit {
    let edge1: vec3 = vec3.sub(vec3.create(), vertex1, vertex0);
    let edge2: vec3 = vec3.sub(vec3.create(), vertex2, vertex0);
    let h: vec3 = vec3.cross(vec3.create(), [ray.dx, ray.dy, ray.dz], edge2);
    let a: number = vec3.dot(edge1, h);
    if (a > -ObjectConsts.EPSILON4 && a < ObjectConsts.EPSILON4)
        return null;
    let f: number = 1 / a;
    let s: vec3 = vec3.sub(vec3.create(), [ray.px, ray.py, ray.pz], vertex0); 
    let u: number = f * (vec3.dot(s, h));
    if (u < 0.0 || u > 1.0) 
      return null;
    let q: vec3 = vec3.cross(vec3.create(), s, edge1);
    let v: number = f * (vec3.dot([ray.dx, ray.dy, ray.dz], q)); 
    if (v < 0.0 || u + v > 1.0) 
      return null;
    let t: number = f * (vec3.dot(edge2, q)); 
    if (t > ObjectConsts.EPSILON5) {
      return new FaceHit(u, v, t)
    } else { 
      return null;
    }
  }

  public getHitPoint(result: TResult): Hit {
    let i: vec4 = result.ray.getPoint(result.t - ObjectConsts.EPSILON5);

    // Normal is from hit face, we use the flag to hold this
    let face = this.objModel.faces[result.flag.face];
    let n0 = vec4.fromValues(this.objModel.vertexNormals[face.vertices[0].vertexNormalIndex - 1].x,
                             this.objModel.vertexNormals[face.vertices[0].vertexNormalIndex - 1].y,
                             this.objModel.vertexNormals[face.vertices[0].vertexNormalIndex - 1].z, 0);
    let n1 = vec4.fromValues(this.objModel.vertexNormals[face.vertices[1].vertexNormalIndex - 1].x,
                             this.objModel.vertexNormals[face.vertices[1].vertexNormalIndex - 1].y,
                             this.objModel.vertexNormals[face.vertices[1].vertexNormalIndex - 1].z, 0);
    let n2 = vec4.fromValues(this.objModel.vertexNormals[face.vertices[2].vertexNormalIndex - 1].x,
                             this.objModel.vertexNormals[face.vertices[2].vertexNormalIndex - 1].y,
                             this.objModel.vertexNormals[face.vertices[2].vertexNormalIndex - 1].z, 0);
        
    // vec4.scale(n0, n0, 1 - result.flag.u);
    // vec4.scale(n0, n0, 1 - result.flag.v);
    // vec4.scale(n1, n1, result.flag.u);
    // vec4.scale(n2, n2, result.flag.v);
    // let n = vec4.add(vec4.create(), n0, n1);
    // //vec4.normalize(n, n);
    // n = vec4.add(n, n, n2);
    // vec4.normalize(n, n);
    // n[3] = 0;

    let nx = ( (1.0 - (result.flag.u + result.flag.v)) * n1[0] + n0[0] * result.flag.u + n2[0] * result.flag.v);
    let ny = ( (1.0 - (result.flag.u + result.flag.v)) * n1[1] + n0[1] * result.flag.u + n2[1] * result.flag.v);
    let nz = ( (1.0 - (result.flag.u + result.flag.v)) * n1[2] + n0[2] * result.flag.u + n2[2] * result.flag.v);
    let n = vec4.fromValues(nx, ny, nz, 0);
    vec4.normalize(n, n);

    // let u = Math.abs((i[0] % this.material.texture.scaleU) / this.material.texture.scaleU);
    // if(i[0] < 0) u = 1 - u;
    // let v = Math.abs((i[2] % this.material.texture.scaleV) / this.material.texture.scaleV);
    // if(i[2] < 0) v = 1 - v;
    
    // move i back to world space
    vec4.transformMat4(i, i, this.transFwd);

    // calc reflected ray about the normal, & move to world
    let r: vec4 = result.ray.reflect(n);
    vec4.transformMat4(r, r, this.transFwd);
    vec4.normalize(r, r);   

    // Move normal into world
    // vec4.transformMat4(n, n, this.transFwd);
    //vec4.normalize(n, n);
    
    let hit: Hit = new Hit(i, n, r, 0, 0);
    return hit;
  }
}

class FaceHit {
  t: number;
  u: number; 
  v: number;
  face: number;

  constructor(u: number, v: number, t: number) {
    this.u = u;
    this.v = v;
    this.t = t;    
  }
}