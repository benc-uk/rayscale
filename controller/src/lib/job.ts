//
// Primary data structure for the controller
// Hold all details for a job, parsed from JobInput & computed values
// ------------------------------------------------------------------
// Ben C, May 2018, update: Sept 2020
//

import { Frame } from './frame';
import { JobStats } from './job-stats';

export class Job {
  name: string;             // Job name
  startDate: Date;          // Job start date
  endDate: Date;            // Job end date
  startTime: number;        // Timestamp (millisecs)
  durationTime: number;     // Duration (millisecs)
  id: string;               // GUID (NOT USED)
  width: number;            // Width of image to render in pixels (must be >= height)
  height: number;           // Height of image to render in pixels
  maxDepth: number;
  antiAlias: boolean;
  status: string;           // e.g. "RUNNING", "FAILED", "CANCELLED";
  reason: string;           // Text description of current status
  rawScene: Record<string, unknown>;        // Unparsed scene as given to us from jobInput
  stats: JobStats;          // General data bag for holding stats about the job

  frame: Frame;             // Current Frame being rendered, see frame.ts
  currentFrame: number;     // Frame number (starting at 1)
  frameCount: number;       // Total number of frames to be rendered
  tasksPerFrame: number;    // Task count per frame
  taskCount: number;        // Total number of tasks across all frames
  tasksComplete: number;    // Number of tasks completed

  framerate: number;        // Animation framerate in frames per second (e.g. 30)
  duration: number;         // Animation duration, in seconds
}