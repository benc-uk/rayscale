import pngjs from 'pngjs';
import fs from 'fs';

var arr = new Array();
for (var x = 0; x < 2000; x++) {
  arr[x] = new Array();
  for (var y = 0; y < 400; y++) {
    arr[x][y] = null;
  }
}

arr[54][43] = [34,6,33];

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
