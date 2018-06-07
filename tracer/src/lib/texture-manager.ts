//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import * as pngjs from 'pngjs';
import request from 'request-promise-native';
export class TextureManager {

  private static _instance: TextureManager;
  private textures: any;

  private constructor() {
    this.textures = {};
  }

  static getInstance(): TextureManager {
    if(!TextureManager._instance) {
      TextureManager._instance = new TextureManager();
    }
    return TextureManager._instance;
  }

  public loadTexture(url: string): Promise<string> {
    // skip already loaded textures
    if(this.textures[url]) {
      return
    }
    
    console.log(`### Loading texture from: ${url}`);

    return new Promise((resolve, reject) => {
      request({uri: url, resolveWithFullResponse: true, encoding: null})
      .then(respData => {
        // Convert to PNG and store
        try {
          // We use the url as object key
          this.textures[url] = {};
          this.textures[url].png = pngjs.PNG.sync.read(respData.body); 
          resolve(respData.statusCode);
        } catch(e) {
          // Important we delete it for future runs, as we are singleton
          delete this.textures[url];
          reject(`PNG did not parse. ${e}`);
        }
      })
      .catch(err => {
        reject(err.statusCode);
        console.error(`### ERROR! Failed to load texture from ${url}. Status code: ${err.statusCode}`);
      })

    });
  }

  public clearTextures() {
    console.log(`### TextureManager is clearing cached textures`);
    delete this.textures;
    this.textures = {};
  }

  public getTexturePNG(url: string): pngjs.PNG {
    return this.textures[url].png;
  }
}