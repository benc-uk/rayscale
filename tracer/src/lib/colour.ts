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

  public toString() {
    return `r:${this.r}, g:${this.g}, b:${this.b}`
  }

  writePixeltoBuffer(img: Buffer, width: number, x: number, y: number) {
    let idx = (width*y + x) * 3;
    img[idx + 0] = this.r;
    img[idx + 1] = this.g;
    img[idx + 2] = this.b;
  }

  static BLACK   = new Colour(0,   0,   0);
  static WHITE   = new Colour(255, 255, 255);
  static RED     = new Colour(255, 0,   0);
  static GREEN   = new Colour(0,   255, 0);
  static BLUE    = new Colour(0,   0,   255);
  static PURPLE  = new Colour(255, 0,   255);
  static YELLOW  = new Colour(255, 255, 0);
}