import { Task } from './task';
import * as PNG from 'pngjs';

export class Job {
  name: string;             // Job name
  startDate: Date;          // Job start date
  endDate: Date;            // Job end date
  startTime: number;        // Timestamp (millisecs)
  durationTime: number;     // Duration (millisecs)
  id: string;               // GUID (NOT USED)
  width: number;            // Width of image to render in pixels (must be >= height)
  height: number;           // Height of image to render in pixels
  status: string;           // e.g. "RUNNING"; 
  reason: string;           // Text description of current status
  rawScene: any;            // Unparsed scene as given to us from jobInput
  stats: any;               // General data bag for holding stats about the job
  
  png: PNG.PNG;             // Output PNG image buffer

  taskQueue: string[];      // Ids of tasks not yet assigned
  tasks: Task[];            // Tasks this job has been split into
  tasksComplete: number;    // Tasks completed

  get totalTasks(): number {
    return this.tasks.length;
  }

  get tasksInQueue(): number {
    return this.taskQueue.length;
  }  

  get tasksRemaining(): number {
    return this.totalTasks - this.tasksComplete;
  }
}