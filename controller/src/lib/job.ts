import { Task } from './task';
import { Scene } from '../../../tracer/src/lib/scene';

export class Job {
  name: string;             // Job name, no spaces!
  scene: Scene;             // Scene to be rendered

  id: string;               // GUID (NOT USED)
  width: number;
  height: number;

  status: string;           // e.g. "RUNNING"; 
  taskCount: number;        // Total tasks in the job, e.g. number of tracers 
  tasksComplete: number;    // Tasks completed

  png: any;                 // Weakly typed, should be pngjs.PNG

  tasks: Task[];
}