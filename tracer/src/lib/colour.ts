//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

export class Colour {
  r: number; g: number; b: number;

  constructor(r: number = 0, g: number = 0, b: number = 0) {
    this.r = Math.min(Math.max(r, 0), 1);
    this.g = Math.min(Math.max(g, 0), 1);
    this.b = Math.min(Math.max(b, 0), 1);
  }

  static fromRGB(r: number, g: number, b: number): Colour {
    return new Colour(r / 255, g / 255, b / 255);
  }

  public toString() {
    return `r:${this.r}, g:${this.g}, b:${this.b}`
  }

  writePixeltoBuffer(img: Buffer, width: number, x: number, y: number) {
    let idx = (width * y + x) * 3;
    img[idx + 0] = this.r * 255;
    img[idx + 1] = this.g * 255;
    img[idx + 2] = this.b * 255;
  }

  public multNew(v: number): Colour {
    return new Colour(this.r * v, this.g * v, this.b * v)
  }

  public mult(v: number) {
    this.r = this.r * v; this.g = this.g * v; this.b = this.b * v;
  }

  public copy(): Colour {
    return new Colour(this.r, this.g, this.b);
  }

  public blend(v: number) {
    this.r = this.r * (1 - v) + v;
    this.g = this.g * (1 - v) + v;
    this.b = this.b * (1 - v) + v;

    this.r = Math.min(1, this.r);
    this.g = Math.min(1, this.g);
    this.b = Math.min(1, this.b);
  }

  static BLACK   = new Colour(0, 0, 0);
  static WHITE   = new Colour(1, 1, 1);
  static RED     = new Colour(1, 0, 0);
  static GREEN   = new Colour(0, 1, 0);
  static BLUE    = new Colour(0, 0, 1);
  static PURPLE  = new Colour(1, 0, 1);
  static YELLOW  = new Colour(1, 1, 0);
}