//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import request from 'request-promise-native';
import ObjFileParser from 'obj-file-parser'

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
  public loadObjFile(url: string): Promise<string> {
    // skip already loaded objs
    if(this.objs[url]) {
      return
    }
    
    console.log(`### Loading obj file mesh from: ${url}`);

    return new Promise((resolve, reject) => {
      request({uri: url, resolveWithFullResponse: true, encoding: null})
      .then(respData => {
        // Convert to PNG and store
        try {
          // We use the url as object key
          let parser = new ObjFileParser(respData.body.toString());
        
          // Parse OBJ and store in cache
          this.objs[url] = parser.parse();
          resolve(respData.statusCode);
        } catch(e) {
          // Important we delete it for future runs, as we are singleton
          delete this.objs[url];
          reject(`OBJ file did not parse. ${e}`);
        }
      })
      .catch(err => {
        reject(err.statusCode);
        console.error(`### ERROR! Failed to load obj from ${url}. Status code: ${err.statusCode}`);
      })

    });
  }

  // Wipe out cache
  public clearCache() {
    console.log(`### ObjManager is clearing cached obj meshes`);
    delete this.objs;
    this.objs = {};
  }

  // Return ObjModel for given URL string, and model number
  public getObjModel(url: string, model: number): ObjFileParser.ObjModel {
    return this.objs[url].models[model];
  }
}
