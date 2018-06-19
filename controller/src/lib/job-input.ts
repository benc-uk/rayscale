
export class JobInput {
  name:     string;     // Job name, no spaces
  width:    number;     // Output image width
  height:   number;     // Output image height
  maxDepth: number;     // Maximum recursion depth when ray tracing, default is 4
  scene:    any;        // Scene to be rendered, unparsed JSON 
}