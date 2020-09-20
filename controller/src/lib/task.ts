//
// Data structure for the passing of tasks to the tracers
// Note. Is duplicated in tracer/lib
// ------------------------------------------------------------------
// Ben C, May 2018, update: Sept 2020
//

export class Task {
  id: string;             // Task id
  jobId: string;          // Job id task is part of
  index: number;          // Offset of task in job image, used when re-assembling
  imageWidth: number;     // Width of whole job image, in pixels
  imageHeight: number;    // Height of whole job image, in pixels
  maxDepth: number;       // Maximum recursion depth when ray tracing, default is 4
  skip: number;           // Row increment to speed up rendering but skip rows - NOT USED
  antiAlias: boolean;     // Enable anti-aliasing

  // Slice is the horizontal sub-region across the image, the task will render
  sliceStart: number;     // Slice offset start from top of image in pixels
  sliceHeight: number;    // Height of slice to be rendered

  // Animation
  frame: number;          // Frame number index
  time: number;           // Time in seconds
}