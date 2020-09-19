
export class JobInput {
  name:      string;     // Job name, no spaces
  tasks:     number;     // Number of tasks to split into
  width:     number;     // Output image width
  height:    number;     // Output image height
  maxDepth:  number;     // Maximum recursion depth when ray tracing, default is 4
  antiAlias: boolean;    // Enable anti-aliasing, default is false
  animation: Animation;  // Animation settings, can be omitted when rendering a single image
  scene:     Record<string, unknown>;     // Scene to be rendered, unparsed JSON
}

class Animation {
  framerate: number;        // Animation framerate in frames per second (e.g. 30)
  duration: number;         // Animation duration, in seconds
}