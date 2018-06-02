//import { Scene } from '../../../tracer/src/lib/scene';

export class JobInput {
  name:   string;     // Job name, no spaces
  width:  number;     // Output image width
  height: number;     // Output image height
  scene:  any;        // Scene to be rendered, unparsed JSON 
}