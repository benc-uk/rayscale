
export class JobInput {
  name:      string;     // Job name, no spaces
  tasks:     number;     // Number of tasks to split into
  width:     number;     // Output image width
  height:    number;     // Output image height
  maxDepth:  number;     // Maximum recursion depth when ray tracing, default is 4
  antiAlias: boolean;    // Enable anti-aliasing, default is false
  scene:     Record<string, unknown>;     // Scene to be rendered, unparsed JSON
}