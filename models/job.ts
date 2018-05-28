class Job {
  name: string;             // Job name, no spaces!
  id: string;               // GUID
  status: string;           // e.g. "RUNNING"; 
  taskCount: number;        // Total tasks in the job, e.g. number of tracers 
  tasksComplete: number;    // Tasks completed
}