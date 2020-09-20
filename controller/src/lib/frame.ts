//
// Holds frame level data, including image buffer & tasks
// ------------------------------------------------------
// Ben C, Sept 2020
//

import { Task } from './task';
import * as PNG from 'pngjs';

export class Frame {
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