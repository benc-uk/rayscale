//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import axios from 'axios';
import ObjFileParser from 'obj-file-parser';

export class ObjManager {
  // Singleton!
  private static _instance: ObjManager;
  // Dictionary map of OBJFile(s) keyed on URL string
  private objs: { [url: string]: ObjFileParser.ObjFile };

  private constructor() {
    this.objs = {};
  }

  // Return singleton instance
  static getInstance(): ObjManager {
    if(!ObjManager._instance) {
      ObjManager._instance = new ObjManager();
    }
    return ObjManager._instance;
  }

  // Load a new remote OBJ file into manager
  public loadObjFile(url: string): Promise<number> {
    // skip already loaded objs
    if(this.objs[url]) {
      return;
    }

    console.log(`### Loading obj file mesh from: ${url}`);

    return new Promise((resolve, reject) => {
      axios.get(url, {responseType: 'text'})
        .then(respData => {
          try {
            // Parse OBJ and store in cache, we use the url as object key
            if(respData && respData.data) {
              const parser = new ObjFileParser(respData.data);
              this.objs[url] = parser.parse();
            }

            // Validate some stuff
            if(!this.objs[url].models[0]) throw 'File must contain at least one model';
            if(this.objs[url].models[0].vertexNormals.length <= 0) throw 'File didn\'t contain any normals';

            resolve(respData.status);
          } catch(e) {
            // Important we delete it for future runs, as we are singleton
            delete this.objs[url];
            reject(`OBJ file did not parse. ${e}`);
          }
        })
        .catch(err => {
          reject(err.status);
          console.error(`### ERROR! Failed to load obj from ${url}. Status code: ${err.statusCode}`);
        });
    });
  }

  // Wipe out cache
  public clearCache(): void {
    console.log('### ObjManager is clearing cached obj meshes');
    delete this.objs;
    this.objs = {};
  }

  // Return ObjModel for given URL string, and model number
  public getObjModel(url: string, model: number): ObjFileParser.ObjModel {
    return this.objs[url].models[model];
  }
}
