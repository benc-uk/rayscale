//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2018
//

export class Stats {
  static raysCast: number = 0
  static raysCreated: number = 0
  static shadowRays: number = 0
  static objectTests: number = 0

  static reset() {
    Stats.raysCast = 0
    Stats.raysCreated = 0
    Stats.shadowRays = 0
    Stats.objectTests = 0
  }
}