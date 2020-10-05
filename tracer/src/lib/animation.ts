//
// Rayscale - Base raytracing classes
// (C) Ben Coleman 2020
//

export interface Animation {
  start: number;
  duration: number;
  propertyName: string;

  /**
  * Generic method all animations should have to apply their animation to a given
  * entity at a given time (seconds)
  * @param {any} entity - An object, could be a Object3D, a Light or a Camera
  * @param {number} time - Time in seconds
  */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateAtTime(entity: any, time: number): void;
}
