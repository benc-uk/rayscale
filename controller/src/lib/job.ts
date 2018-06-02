import { Task } from './task';
//import { Scene } from '../../../tracer/src/lib/scene';
import * as PNG from 'pngjs';

export class Job {
  name: string;             // Job name, no spaces!
  //scene: any;               // Scene to be rendered, replace with 
  startDate: Date;
  endDate: Date;
  startTime: any;
  durationTime: number;
  
  id: string;               // GUID (NOT USED)
  width: number;
  height: number;

  status: string;           // e.g. "RUNNING"; 
  taskCount: number;        // Total tasks in the job, e.g. number of tracers 
  tasksComplete: number;    // Tasks completed

  png: PNG.PNG;             // Output PNG image

  tasks: Task[];    
}