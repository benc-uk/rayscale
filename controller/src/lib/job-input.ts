import { Scene } from '../../../tracer/src/lib/scene';

export class JobInput {
  name:   string;     // Job name, no spaces
  width:  number;     // Output image width
  height: number;     // Output image height
  scene:  Scene;      // Scene to be rendered  
}