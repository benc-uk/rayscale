//
// Shared definition
//

export class Task {
  
  id: string;             // GUID
  index: number;          // Offset of task in current job, used when re-assembling 
  imageWidth: number;     // Width of whole job image, in pixels
  imageHeight: number;    // Height of whole job image, in pixels

  // Slice is the horizontal sub-region across the image, the task will render
  sliceStart: number;     // Slice offset start from top of image in pixels
  sliceHeight: number;    // Height of slice to be rendered
}