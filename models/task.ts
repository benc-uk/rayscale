export class Task {
  
  id: string;        // GUID
  index: number;     // Offset of task in current job, used when re-assembling 
  width: number;     // Width of render region, in pixels, currently always the same as job width
  height: number;    // Height of render region, in pixels
}