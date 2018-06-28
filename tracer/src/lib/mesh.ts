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
  private objModel: ObjModel;
  //private transNorm: mat4;
  private b1: vec4;
  private b2: vec4;
  private box: BoundingBox;
  private debug: boolean = true;

  // ====================================================================================================
  // Create a ObjMesh
  // ====================================================================================================
  constructor(objFile: string, pos: vec4, rotation: vec3, scale: vec3, name: string, debug: boolean) {
    this.name = name;
    this.objModel = ObjManager.getInstance().getObjModel(objFile, 0);
    if(!this.objModel) {
      throw `Obj file ${objFile} not loaded in ObjectManager`;
    }

    this.transFwd = mat4.identity(mat4.create());
    this.trans = mat4.identity(mat4.create());
    //this.transNorm = mat4.identity(mat4.create());
    let rot: quat = quat.identity(quat.create());
    quat.rotateX(rot, rot, Utils.degreeToRad(rotation[0]));
    quat.rotateY(rot, rot, Utils.degreeToRad(rotation[1]));
    quat.rotateZ(rot, rot, Utils.degreeToRad(rotation[2])); 
    mat4.fromRotationTranslationScale(this.transFwd, rot, [pos[0], pos[1], pos[2]], [scale[0], scale[1], scale[2]]);
    mat4.invert(this.trans, this.transFwd);
    //mat4.transpose(this.transNorm, this.transFwd);

    // !TODO: Remove later
    this.debug = debug;

    // Bounding box
    let min = vec3.fromValues(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    let max = vec3.fromValues(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
    this.box = new BoundingBox(min, max)
    for(let face of this.objModel.faces) {
      for(let vert of face.vertices) {
        let vertPoint = this.objModel.vertices[vert.vertexIndex - 1];
        if(vertPoint.x < this.box.min[0]) this.box.min[0] = vertPoint.x;
        if(vertPoint.y < this.box.min[1]) this.box.min[1] = vertPoint.y;
        if(vertPoint.z < this.box.min[2]) this.box.min[2] = vertPoint.z;
        if(vertPoint.x > this.box.max[0]) this.box.max[0] = vertPoint.x;
        if(vertPoint.y > this.box.max[1]) this.box.max[1] = vertPoint.y;
        if(vertPoint.z > this.box.max[2]) this.box.max[2] = vertPoint.z;
      }
      this.box.faces.push(face);
    }
    
    // vec4.transformMat4(this.b1, this.b1, this.trans);
    // vec4.transformMat4(this.b2, this.b2, this.trans);   
  }

  public calcT(inray: Ray): TResult {
    Stats.objectTests++;
    let ray: Ray = inray.transformNewRay(this.trans);
    let result = new TResult(0.0, ray);

    // Bounding box stuff!
    let boxt = Mesh.boundingBoxTest(ray, this.box);
    if(boxt > 0.0) {
      // In debug mode we stop when we hit the box and return that result
      if(this.debug) {
        result.t = boxt;
        return result;
      }

      let maxt: number = Number.MAX_VALUE;
      let faceIndex = 0;
      for(let face of this.box.faces) {
        let v0: vec3 = vec3.fromValues(this.objModel.vertices[face.vertices[0].vertexIndex - 1].x,
          this.objModel.vertices[face.vertices[0].vertexIndex - 1].y,
          this.objModel.vertices[face.vertices[0].vertexIndex - 1].z);
        let v1: vec3 = vec3.fromValues(this.objModel.vertices[face.vertices[1].vertexIndex - 1].x,
          this.objModel.vertices[face.vertices[1].vertexIndex - 1].y,
          this.objModel.vertices[face.vertices[1].vertexIndex - 1].z);
        let v2: vec3 = vec3.fromValues(this.objModel.vertices[face.vertices[2].vertexIndex - 1].x,
          this.objModel.vertices[face.vertices[2].vertexIndex - 1].y,
          this.objModel.vertices[face.vertices[2].vertexIndex - 1].z);

        // Note the weird order of vertices here: swapping v1 and v0 fixed EVERYTHING!
        let faceHit: FaceHit = this.calcFaceHit(ray, v1, v0, v2); 
        
        if(faceHit && faceHit.t < maxt) {
          result.t = faceHit.t + ObjectConsts.EPSILON5;
          maxt = faceHit.t;

          // Store extra face hit data, including which faceIndex in the result flag 
          faceHit.face = faceIndex;
          result.flag = faceHit;
        }
        faceIndex++;
      }
      return result;
    } else {
      return result;
    }
  }

  // ====================================================================================================
  // 
  // ====================================================================================================
  private static boundingBoxTest(ray: Ray, box: BoundingBox): number {
    let t1, t2, tnear = -Number.MAX_VALUE, tfar = Number.MAX_VALUE, temp;
    let intersectFlag: boolean = true;

    // Code stolen from 
    // http://ray-tracing-conept.blogspot.com/2015/01/ray-box-intersection-and-normal.html
    for (let i = 0; i < 3; i++) {
      if (ray.dir[i] == 0) {
        if (ray.pos[i] < box.min[i] || ray.pos[i] > box.max[i])
          intersectFlag = false;
      } else {
        t1 = (box.min[i] - ray.pos[i]) / ray.dir[i];
        t2 = (box.max[i] - ray.pos[i]) / ray.dir[i];
        if (t1 > t2) {
          temp = t1;
          t1 = t2;
          t2 = temp;
        }
        if (t1 > tnear) 
          tnear = t1;
        if (t2 < tfar)
          tfar = t2;
        if (tnear > tfar)
          intersectFlag = false;
        if (tfar < 0)
          intersectFlag = false;
      }
    }
    if (intersectFlag) {
      // Now we handle if we're inside the cuboid
      if(tnear < 0) {
        return tfar;
      } else {
        return tnear;
      }
    } else {
      return 0;
    }

  }

  // ====================================================================================================
  // Möller–Trumbore intersection algorithm
  // Taken from: https://en.wikipedia.org/wiki/M%C3%B6ller%E2%80%93Trumbore_intersection_algorithm
  // =====================================================================================ray===============
  private calcFaceHit(ray: Ray, vertex0: vec3, vertex1: vec3, vertex2: vec3): FaceHit {
    Stats.meshFaceTests++;
    let edge1: vec3 = vec3.sub(vec3.create(), vertex1, vertex0);
    let edge2: vec3 = vec3.sub(vec3.create(), vertex2, vertex0);
    let h: vec3 = vec3.cross(vec3.create(), [ray.dx, ray.dy, ray.dz], edge2);
    let a: number = vec3.dot(edge1, h);
    if (a > -ObjectConsts.EPSILON4 && a < ObjectConsts.EPSILON4)
        return null;

    let f: number = 1.0 / a;
    let s: vec3 = vec3.sub(vec3.create(), [ray.px, ray.py, ray.pz], vertex0); 
    let u: number = f * (vec3.dot(s, h));
    if (u < -ObjectConsts.EPSILON4 || u > 1 + ObjectConsts.EPSILON4) 
      return null;
    let q: vec3 = vec3.cross(vec3.create(), s, edge1);
    let v: number = f * (vec3.dot([ray.dx, ray.dy, ray.dz], q)); 
    if (v < -ObjectConsts.EPSILON4 || u + v > 1 + ObjectConsts.EPSILON4) 
      return null;
      
    let t: number = f * (vec3.dot(edge2, q)); 
    if (t > ObjectConsts.EPSILON4) {
      return new FaceHit(u, v, t)
    } else { 
      return null;
    }
  }

  // ====================================================================================================
  // 
  // ====================================================================================================
  public getHitPoint(result: TResult): Hit {
    let i: vec4 = result.ray.getPoint(result.t - ObjectConsts.EPSILON2);

    // Normal is from hit face, we use the flag to hold this
    let n = vec4.fromValues(0.0, 0.0, 0.0, 0);
    if(!this.debug) {
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

      let nx = (1.0 - (result.flag.u + result.flag.v)) * n1[0] + n0[0] * result.flag.u + n2[0] * result.flag.v;
      let ny = (1.0 - (result.flag.u + result.flag.v)) * n1[1] + n0[1] * result.flag.u + n2[1] * result.flag.v;
      let nz = (1.0 - (result.flag.u + result.flag.v)) * n1[2] + n0[2] * result.flag.u + n2[2] * result.flag.v;
      n = vec4.fromValues(nx, ny, nz, 0);
    } else {
      n = vec4.fromValues(0.33, 0.33, 0.33, 0);
    }

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
    vec4.transformMat4(n, n, this.transFwd);
    vec4.normalize(n, n);
    
    let hit: Hit = new Hit(i, n, r, 0, 0);
    return hit;
  }
}

// ====================================================================================================
// Extra junk we need to add to a TResult on a hit, this holds info about the face that was hit
// ====================================================================================================
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

// ====================================================================================================
// 
// ====================================================================================================
class BoundingBox {
  min: vec3; 
  max: vec3;
  faces: Face[];

  constructor(min: vec3, max: vec3) {
    this.min = min;
    this.max = max;
    this.faces = new Array<Face>();
  }
}