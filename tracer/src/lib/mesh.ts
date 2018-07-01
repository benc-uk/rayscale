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
import { ObjModel, Face, Vertex } from 'obj-file-parser';
import { TextureBasic } from './texture-basic';
import { Colour } from './colour';

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
  public objModel: ObjModel;
  private boundingBox: BoundingBox;
  private debug: boolean = true;
  public boxSettings: BoundingBoxSettings;

  // ====================================================================================================
  // Create a ObjMesh
  // ====================================================================================================
  constructor(objFile: string, pos: vec4, rotation: vec3, scale: number, name: string, debug: boolean, bbSettings: BoundingBoxSettings) {
    this.name = name;
    // Why the JSON parsing here? This is a hacky way to give me a deep copy of the object
    this.objModel = JSON.parse(JSON.stringify(ObjManager.getInstance().getObjModel(objFile, 0))); 
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

    // !TODO: Remove later
    this.debug = debug;
    
    // Pre scale mesh, yes this is a bit of a hack and we should be using the matrix transforms
    // Note. This is why we needed a deep clone of the objModel 
    // Otherwise we would modify the source data and mess up subsequent renders
    for(let vertPoint of this.objModel.vertices) {
      vertPoint.x *= scale;
      vertPoint.y *= scale;
      vertPoint.z *= scale;
    }

    // Outer bounding box
    let min = vec3.fromValues(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    let max = vec3.fromValues(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
    for(let vertPoint of this.objModel.vertices) {
      if(vertPoint.x < min[0]) min[0] = vertPoint.x;
      if(vertPoint.y < min[1]) min[1] = vertPoint.y;
      if(vertPoint.z < min[2]) min[2] = vertPoint.z;
      if(vertPoint.x > max[0]) max[0] = vertPoint.x;
      if(vertPoint.y > max[1]) max[1] = vertPoint.y;
      if(vertPoint.z > max[2]) max[2] = vertPoint.z;
    }

    // Default settings for bounding box
    this.boxSettings = bbSettings;
    // Create top level bounding box, depth = 0
    this.boundingBox = new BoundingBox(0, vec3.clone(min), vec3.clone(max), this);
  }

  // ====================================================================================================
  // Standard calc T method required by all objects
  // ====================================================================================================
  public calcT(inray: Ray): TResult {
    Stats.objectTests++;
    let ray: Ray = inray.transformNewRay(this.trans);
    let result = new TResult(0.0, ray);

    // Bounding box test, get list of boxes we hit
    let boxResult = Mesh.boundingBoxTest(ray, this.boundingBox);
    if(boxResult.length > 0) {
      // In debug mode we stop when we hit the box and return that result
      if(this.debug) {
        result.t = 5;
        let box = boxResult[boxResult.length-1];
        (<TextureBasic>this.material.texture).colour = box.debugColour.copy();
        return result;
      }

      let maxt: number = Number.MAX_VALUE;
      // Loop through all hot boxes, and the faces within them
      for(let box of boxResult) {
        for(let face of box.faces) {
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
            faceHit.face = face;
            result.data = faceHit;
          }
        }
      }
      return result;
    } else {
      // No boxes hit = total miss
      return result;
    }
  }

  // ====================================================================================================
  // Bounding box tests, mindbending recursion into itself and return all hit child boxes
  // ====================================================================================================
  private static boundingBoxTest(ray: Ray, box: BoundingBox): BoundingBox[] {
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
      // If we've hit this box, need to check nested child boxes
      if(box.hasChildren()) {
        // Test all child boxes and return box hit results together
        // Note. We have to test all possible hit boxes, not just the closest one!
        let tempBoxArray = new Array<BoundingBox>();
        for(let childBox of box.children) {
          let hitBoxesTest = this.boundingBoxTest(ray, childBox);
          if(hitBoxesTest.length > 0) {
            for(let box of hitBoxesTest) {
              tempBoxArray.push(box)
            }
          }
        }
        return tempBoxArray;
      }
      // Hit but no children so return just yourself
      return [box];
    } else {
      // Miss = return no boxes
      return [];
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
  // Standard getHitPoint details required by all Object3D
  // - Important! Input Ray should already be in object space
  // Note. We don't support u, v texture mapping on meshes... yet
  // ====================================================================================================
  public getHitPoint(result: TResult): Hit {
    let i: vec4 = result.ray.getPoint(result.t - ObjectConsts.EPSILON2);

    // Normal is from hit face, we use the flag to hold this
    let n = vec4.fromValues(0.0, 0.0, 0.0, 0);
    if(!this.debug) {
      let face = result.data.face;
      let n0 = vec4.fromValues(this.objModel.vertexNormals[face.vertices[0].vertexNormalIndex - 1].x,
                              this.objModel.vertexNormals[face.vertices[0].vertexNormalIndex - 1].y,
                              this.objModel.vertexNormals[face.vertices[0].vertexNormalIndex - 1].z, 0);
      let n1 = vec4.fromValues(this.objModel.vertexNormals[face.vertices[1].vertexNormalIndex - 1].x,
                              this.objModel.vertexNormals[face.vertices[1].vertexNormalIndex - 1].y,
                              this.objModel.vertexNormals[face.vertices[1].vertexNormalIndex - 1].z, 0);
      let n2 = vec4.fromValues(this.objModel.vertexNormals[face.vertices[2].vertexNormalIndex - 1].x,
                              this.objModel.vertexNormals[face.vertices[2].vertexNormalIndex - 1].y,
                              this.objModel.vertexNormals[face.vertices[2].vertexNormalIndex - 1].z, 0);

      let nx = (1.0 - (result.data.u + result.data.v)) * n1[0] + n0[0] * result.data.u + n2[0] * result.data.v;
      let ny = (1.0 - (result.data.u + result.data.v)) * n1[1] + n0[1] * result.data.u + n2[1] * result.data.v;
      let nz = (1.0 - (result.data.u + result.data.v)) * n1[2] + n0[2] * result.data.u + n2[2] * result.data.v;
      n = vec4.fromValues(nx, ny, nz, 0);
    } else {
      // Debug, just make a normal up
      n = vec4.fromValues(0.33, 0.33, 0.33, 0);
    }
    
    // move i back to world space
    vec4.transformMat4(i, i, this.transFwd);

    // calc reflected ray about the normal, & move to world
    let r: vec4 = result.ray.reflect(n);
    vec4.transformMat4(r, r, this.transFwd);
    vec4.normalize(r, r);   

    // Move normal into world
    vec4.transformMat4(n, n, this.transFwd);
    vec4.normalize(n, n);
    
    // u & v set to zero/ignored
    let hit: Hit = new Hit(i, n, r, 0, 0);
    return hit;
  }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// Private classes just used for Mesh here
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

// ====================================================================================================
// Extra junk we need to add to a TResult on a hit, this holds info about the face that was hit
// ====================================================================================================
class FaceHit {
  t: number;
  u: number; 
  v: number;
  face: Face;

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
  public min: vec3; 
  public max: vec3;
  public faces: Face[];
  public children: BoundingBox[];
  public depth: number;
  private mesh: Mesh;
  public debugColour: Colour;

  constructor(depth: number, min: vec3, max: vec3, mesh: Mesh) {
    this.depth = depth;
    this.min = min;
    this.max = max;
    this.mesh = mesh;
    this.children = new Array<BoundingBox>();
    this.debugColour = new Colour(Math.random(), Math.random(), Math.random());

    console.log(`### Creating bounding box, depth ${this.depth}: [${min[0]}, ${min[1]}, ${min[2]}] -> [${max[0]}, ${max[1]}, ${max[2]}]`);
    
    if(depth == 0) {
      // Special case, no need to check for top level box, it always contains ALL faces
      // Just copy array (which should be )
      this.faces = this.mesh.objModel.faces.slice();
    } else {
      this.faces = new Array<Face>(); 
      for(let face of mesh.objModel.faces) {
        let v0: Vertex = mesh.objModel.vertices[face.vertices[0].vertexIndex - 1];
        let v1: Vertex = mesh.objModel.vertices[face.vertices[1].vertexIndex - 1];
        let v2: Vertex = mesh.objModel.vertices[face.vertices[2].vertexIndex - 1];
        // Check if *ANY* point in face is inside this box, if so add it
        if(this.containsPoint(v0) || this.containsPoint(v1) || this.containsPoint(v2)) {
          this.faces.push(face);
        }
      }
    }
    console.log(`### Bounding box contains ${this.faces.length} faces`);

    if(this.faces.length > mesh.boxSettings.maxFaces && this.depth < mesh.boxSettings.maxDepth) 
      this.subDivide();
  }

  public subDivide(): void {    
    let midx = this.min[0] + ((this.max[0] - this.min[0]) / 2);
    let midy = this.min[1] + ((this.max[1] - this.min[1]) / 2);
    let midz = this.min[2] + ((this.max[2] - this.min[2]) / 2);

    let bb1b = new BoundingBox(this.depth + 1, vec3.fromValues(this.min[0], this.min[1], this.min[2]), vec3.fromValues(midx, midy, midz), this.mesh);
    let bb2b = new BoundingBox(this.depth + 1, vec3.fromValues(this.min[0], midy, this.min[2]),        vec3.fromValues(midx, this.max[1], midz), this.mesh);
    let bb3b = new BoundingBox(this.depth + 1, vec3.fromValues(midx, this.min[1], this.min[2]),        vec3.fromValues(this.max[0], midy, midz), this.mesh);
    let bb4b = new BoundingBox(this.depth + 1, vec3.fromValues(midx, midy, this.min[2]),               vec3.fromValues(this.max[0], this.max[1], midz), this.mesh);
    let bb1f = new BoundingBox(this.depth + 1, vec3.fromValues(this.min[0], this.min[1], midz), vec3.fromValues(midx, midy, this.max[2]), this.mesh);
    let bb2f = new BoundingBox(this.depth + 1, vec3.fromValues(this.min[0], midy, midz),        vec3.fromValues(midx, this.max[1], this.max[2]), this.mesh);
    let bb3f = new BoundingBox(this.depth + 1, vec3.fromValues(midx, this.min[1], midz),        vec3.fromValues(this.max[0], midy, this.max[2]), this.mesh);
    let bb4f = new BoundingBox(this.depth + 1, vec3.fromValues(midx, midy, midz),               vec3.fromValues(this.max[0], this.max[1], this.max[2]), this.mesh);

    if(bb1b.hasFaces()) this.children.push(bb1b);
    if(bb2b.hasFaces()) this.children.push(bb2b); 
    if(bb3b.hasFaces()) this.children.push(bb3b);
    if(bb4b.hasFaces()) this.children.push(bb4b); 
    if(bb1f.hasFaces()) this.children.push(bb1f);
    if(bb2f.hasFaces()) this.children.push(bb2f); 
    if(bb3f.hasFaces()) this.children.push(bb3f);
    if(bb4f.hasFaces()) this.children.push(bb4f); 
  }

  public containsPoint(vertex: Vertex): boolean {
    if(vertex.x > this.min[0] - this.mesh.boxSettings.vertexEpsilon && vertex.x < this.max[0] + this.mesh.boxSettings.vertexEpsilon && 
       vertex.y > this.min[1] - this.mesh.boxSettings.vertexEpsilon && vertex.y < this.max[1] + this.mesh.boxSettings.vertexEpsilon &&
       vertex.z > this.min[2] - this.mesh.boxSettings.vertexEpsilon && vertex.z < this.max[2] + this.mesh.boxSettings.vertexEpsilon) {
      return true;
    }
    return false;
  }

  public hasChildren(): boolean {
    return this.children.length > 0;
  }

  public hasFaces(): boolean {
    return this.faces.length > 0;
  }  
}

// ====================================================================================================
// Exported class for setting bounding box parameters
// ====================================================================================================
export class BoundingBoxSettings {
  public maxFaces: number;
  public maxDepth: number;
  public vertexEpsilon: number;

  constructor(maxFaces: number, maxDepth: number, vertexEpsilon: number) {
    this.maxFaces = maxFaces;
    this.maxDepth = maxDepth;
    this.vertexEpsilon = vertexEpsilon;
  }
}