//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

export class Colour {
  r: number; g: number; b: number;

  constructor(r = 0, g = 0, b = 0) {
    this.r = Math.min(Math.max(r, 0), 1);
    this.g = Math.min(Math.max(g, 0), 1);
    this.b = Math.min(Math.max(b, 0), 1);
  }

  public static fromRGB(r: number, g: number, b: number): Colour {
    return new Colour(r / 255, g / 255, b / 255);
  }

  public toString(): string {
    return `r:${this.r}, g:${this.g}, b:${this.b}`;
  }

  public writePixeltoBuffer(img: Buffer, width: number, x: number, y: number): void {
    const idx = (width * y + x) * 3;
    img[idx + 0] = this.r * 255;
    img[idx + 1] = this.g * 255;
    img[idx + 2] = this.b * 255;
  }

  public static fromPNGBuffer(img: Buffer, width: number, x: number, y: number): Colour {
    const idx = (width * y + x) << 2;
    return Colour.fromRGB(img[idx], img[idx+1], img[idx+2]);
  }

  public multNew(v: number): Colour {
    return new Colour(this.r * v, this.g * v, this.b * v);
  }

  public mult(v: number): void {
    this.r *= v;
    this.g *= v;
    this.b *= v;
    this.r = Math.min(1, Math.max(0, this.r));
    this.g = Math.min(1, Math.max(0, this.g));
    this.b = Math.min(1, Math.max(0, this.b));
  }

  public multColour(c: Colour): void {
    this.r = this.r * c.r; this.g = this.g * c.g; this.b = this.b * c.b;
    this.r = Math.min(1, this.r);
    this.g = Math.min(1, this.g);
    this.b = Math.min(1, this.b);
  }

  public multRGB(r: number, g: number, b: number): void {
    this.r = this.r * r; this.g = this.g * g; this.b = this.b * b;
    this.r = Math.min(1, this.r);
    this.g = Math.min(1, this.g);
    this.b = Math.min(1, this.b);
  }

  public static add(c1: Colour, c2: Colour): Colour {
    const c = new Colour;
    c.r = c1.r+c2.r;
    c.g = c1.g+c2.g;
    c.b = c1.b+c2.b;
    c.r = Math.min(1, c.r);
    c.g = Math.min(1, c.g);
    c.b = Math.min(1, c.b);
    return c;
  }

  public add(c: Colour): void {
    this.r += c.r;
    this.g += c.g;
    this.b += c.b;

    this.r = Math.min(1, this.r);
    this.g = Math.min(1, this.g);
    this.b = Math.min(1, this.b);
  }

  public copy(): Colour {
    return new Colour(this.r, this.g, this.b);
  }

  public blend(v: number): void {
    this.r = this.r * (1 - v) + v;
    this.g = this.g * (1 - v) + v;
    this.b = this.b * (1 - v) + v;

    this.r = Math.min(1, this.r);
    this.g = Math.min(1, this.g);
    this.b = Math.min(1, this.b);
  }

  public blendRGB(r: number, g: number, b: number): void {
    this.r = this.r * (1 - r) + r;
    this.g = this.g * (1 - g) + g;
    this.b = this.b * (1 - b) + b;

    this.r = Math.min(1, this.r);
    this.g = Math.min(1, this.g);
    this.b = Math.min(1, this.b);
  }

  public toArray(): Float32Array {
    const a = new Float32Array(3);
    a[0] = this.r * 255; a[1] = this.g * 255; a[2] = this.b * 255;
    return a;
  }

  static BLACK   = new Colour(0, 0, 0);
  static WHITE   = new Colour(1, 1, 1);
  static RED     = new Colour(1, 0, 0);
  static GREEN   = new Colour(0, 1, 0);
  static BLUE    = new Colour(0, 0, 1);
  static PURPLE  = new Colour(1, 0, 1);
  static YELLOW  = new Colour(1, 1, 0);
}