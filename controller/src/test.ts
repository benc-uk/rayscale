import pngjs from 'pngjs';
import fs from 'fs';
import request from 'request-promise-native';

class Colour {
  r: number; g: number; b: number;

  constructor(r: number = 0, g: number = 0, b: number = 0) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  toString() {
    return `${this.r}, ${this.g}, ${this.b}`
  }

  writePixel(img: Buffer, width: number, x: number, y: number) {
    let idx = (width*y + x) * 3;
    img[idx + 0] = this.r;
    img[idx + 1] = this.g;
    img[idx + 2] = this.b;
  }
}

let h = 32;
let w = 255;
let imgbuff = Buffer.alloc(w * h * 3);

for (var x = 0; x < w; x++) {
  for (var y = 0; y < h; y++) {
    let s = (x / w);
    let col = new Colour(255-Math.floor(255*s), Math.floor(255*s), 0);
    col.writePixel(imgbuff, w, x, y);
  }
}

let resp = request.post({
  uri: `http://localhost:9000/api/tasks`,
  body: imgbuff, 
  headers: {'content-type': 'application/octet-stream'}
})
.catch(err => {
  console.log(err);
  process.exit(3);   
})

//process.exit(0);   

//console.dir(arr);

// var png = new pngjs.PNG({
//   width: 100,
//   height: 100
// });

// for (var y = 0; y < png.height; y++) {
//   for (var x = 0; x < png.width; x++) {
//       var idx = (png.width * y + x) << 2;
//       png.data[idx+0] = 44;
//       png.data[idx+1] = 180;
//       png.data[idx+2] = 89;
//       png.data[idx+3] = 255;
//   }
// }

// png.pack().pipe(fs.createWriteStream('newOut.png'));
