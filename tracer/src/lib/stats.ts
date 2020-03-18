//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

export class Stats {
  static raysCast = 0;
  static raysCreated = 0;
  static shadowRays = 0;
  static objectTests = 0;
  static meshFaceTests = 0;

  static reset(): void {
    Stats.raysCast = 0;
    Stats.raysCreated = 0;
    Stats.shadowRays = 0;
    Stats.objectTests = 0;
    Stats.meshFaceTests = 0;
  }
}