//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

export class Colour {
  r: number; g: number; b: number;

  constructor(r: number = 0, g: number = 0, b: number = 0) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  toString() {
    return `${this.r}, ${this.g}, ${this.b}`
  }

  writePixeltoBuffer(img: Buffer, width: number, x: number, y: number) {
    let idx = (width*y + x) * 3;
    img[idx + 0] = this.r;
    img[idx + 1] = this.g;
    img[idx + 2] = this.b;
  }
}