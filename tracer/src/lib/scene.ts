import { Colour } from './colour';
import { Object3D } from './object3d';
import { Sphere } from './sphere';
import { Light } from './light';
import { Material } from './material';
import { vec3 } from 'gl-matrix';

export class Scene {
  name: string;
  backgroundColour: Colour;

  cameraPos: vec3;    // Not used yet
  cameraDir: vec3;    // Not used yet
  cameraFov: number;  // Camera field of view in radians

  objects: Object3D[];
}