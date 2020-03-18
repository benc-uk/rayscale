//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

import * as pngjs from 'pngjs';
import request from 'request-promise-native';

export class PngManager {
  // Singleton!
  private static _instance: PngManager;
  // Dictionary map of PNG images keyed on URL string
  private textures: { [url: string]: pngjs.PNG };

  private constructor() {
    this.textures = {};
  }

  // Return singleton instance
  static getInstance(): PngManager {
    if(!PngManager._instance) {
      PngManager._instance = new PngManager();
    }
    return PngManager._instance;
  }

  // Load a new remote PNG texture into manager
  public loadTexture(url: string): Promise<string> {
    // skip already loaded textures
    if(this.textures[url]) {
      return;
    }

    console.log(`### Loading texture from: ${url}`);

    return new Promise((resolve, reject) => {
      request({uri: url, resolveWithFullResponse: true, encoding: null})
        .then(respData => {
        // Convert to PNG and store
          try {
          // We use the url as object key
            this.textures[url] = pngjs.PNG.sync.read(respData.body);
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
        });

    });
  }

  // Wipe out textures
  public clearCache(): void {
    console.log('### TextureManager is clearing cached textures');
    delete this.textures;
    this.textures = {};
  }

  // Return PNG for given URL string
  public getTexturePNG(url: string): pngjs.PNG {
    return this.textures[url];
  }
}
