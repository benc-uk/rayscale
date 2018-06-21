import { Task } from './task';
import * as PNG from 'pngjs';

export class Job {
  name: string;             // Job name, no spaces!
  startDate: Date;
  endDate: Date;
  startTime: any;
  durationTime: number;
  
  id: string;               // GUID (NOT USED)
  width: number;
  height: number;
  skip: number;             // Row increment to speed up rendering but skip rows - NOT USED

  status: string;           // e.g. "RUNNING"; 
  reason: string;
  taskCount: number;        // Total tasks in the job, e.g. number of tracers 
  tasksComplete: number;    // Tasks completed

  png: PNG.PNG;             // Output PNG image

  tasks: Task[];    

  stats: any;
}