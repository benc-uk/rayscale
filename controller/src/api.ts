import { Request, Response } from 'express';
import request from 'request-promise-native';
import uuidv4 from 'uuid/v4';
import * as PNG from 'pngjs';
import * as yaml from 'js-yaml';
import fs from 'fs';
import { Job } from './lib/job';
import { JobInput } from './lib/job-input';
import { Task } from './lib/task';
import { Tracer } from './lib/tracer';

export class API {

  private tracers: { [id: string]: Tracer };
  private job: Job;
  private jobOutDir: string;
  private rawJob: any;
  private checkInterval: number;

  constructor(outDir: string, checkInterval: number) {
    // Tracers starts as empty dict  
    this.tracers = {};
    this.jobOutDir = outDir;
    this.checkInterval = checkInterval;
  }

  //
  // API: Register a new tracer/worker
  // 
  public addTracer = (req: Request, res: Response) => {
    let tracer = new Tracer();
    tracer.id = req.body.id;
    tracer.endPoint = req.body.endPoint;

    this.tracers[tracer.endPoint] = tracer;
    console.log(`### Tracer registered: ${tracer.endPoint}`);

    res.contentType('application.json');
    res.status(200).send({msg: "Tracer registered"});
  
    console.log(`### Tracers online: ${Object.keys(this.tracers).length}`);
  }
  
  //
  // API: Start a new job, POST data is inital job data
  //
  public startJob = (req: Request, res: Response) => {
    res.type('application/json');
    console.log(`### New job request received`);

    // Check active job
    // !TODO! Removed temporary
    if(this.job && this.job.status == "RUNNING") {
      console.log(`### Job rejected. There is currently an active job '${this.job.name}' with ${this.job.taskCount - this.job.tasksComplete} tasks remaining`);
      res.status(400).send({msg: "There is currently an active job"}); return;
    }

    // Check if we have any tracers
    if(Object.keys(this.tracers).length <= 0) {
      console.log(`### Job rejected. No tracers online, unable to start job`);
      res.status(400).send({msg: "No tracers online"}); return;
    }

    // Convert YAML to JSON
    let jobInput: any = null;
    try {
      jobInput = yaml.safeLoad(req.body.toString());
    } catch(err) {
      console.error(`### ERROR! YAML conversion failed ${err.message}`);
      res.status(400).send({msg: `YAML conversion failed ${err.message}`}); return;
    }

    // Create complete job object and kick everything off
    try {
      this.createJob(jobInput)
    } catch(e) {
      console.log("EEEE", e);
      res.status(400).send({msg: `Job invalid ${e}`});
      return;
    }
    res.status(200).send({msg: "Job started", id: this.job.id});
  }

  //
  // API: Task results send back from tracer
  //
  public taskComplete = (req: Request, res: Response) => {
    let taskId = req.params.id;
    let taskIndex = req.headers['x-task-index'];
    let taskTracer = req.headers['x-tracer'];
    this.job.stats.raysCreated += parseInt(req.headers['x-stats-rayscreated'].toString());
    this.job.stats.raysCast += parseInt(req.headers['x-stats-rayscast'].toString());
    this.job.stats.shadowRays += parseInt(req.headers['x-stats-shadowrays'].toString());
    this.job.stats.objectTests += parseInt(req.headers['x-stats-objtests'].toString());

    // If we get anything other than binary data, that's a failure
    if(req.headers['content-type'] != 'application/octet-stream') {
      console.error(`### ERROR! Task ${taskId} has failed, job will not complete`);
      this.job.status = "FAILED";
      this.job.reason = `Ray tracing failed, task ${taskIndex} had an error`;
      res.status(200).send({msg: "OK, you failed"});
      return;
    }
    console.log(`### Image buffer received from ${taskTracer} for task: ${taskIndex}`);

    let buff = req.body;
    let task = this.job.tasks.find(t => t.id == taskId);

    this.job.tasksComplete++;
    console.log(`### Tasks completed: ${this.job.tasksComplete} of ${this.job.taskCount}`);

    for (var x = 0; x < this.job.width; x++) {
      let yBuff = 0;

      for (var y = task.sliceStart; y < (task.sliceStart+task.sliceHeight); y++) {
        let pngIdx = (this.job.width * y + x) << 2;
        let buffIndx = ((this.job.width * yBuff + x) * 3);

        this.job.png.data[pngIdx + 0] = buff[buffIndx + 0];
        this.job.png.data[pngIdx + 1] = buff[buffIndx + 1];
        this.job.png.data[pngIdx + 2] = buff[buffIndx + 2];
        this.job.png.data[pngIdx + 3] = 255
        yBuff++;
      }
    }

    if(this.job.tasksComplete == this.job.taskCount) {
      // We're DONE!
      this.completeJob();
    } 
    
    res.status(200).send({msg: "OK, slice buffer stored"});
  }
  
  //
  // Regular tracer health check, remove tracers that are not contactable 
  //
  public tracerHealthCheck = () => {
    //console.log(`### Running tracer health check...`);
    
    for(let tid in this.tracers) {
      let endPoint = this.tracers[tid].endPoint;
  
      // Call health ping API on tracer, expect 200 and nothing more
      // !TODO! Further validation, check id etc
      request({ uri: `${endPoint}/ping`, timeout: this.checkInterval - 1 })
      .catch(err => {
        console.log(`### Health check failed for ${endPoint} - Unregistering tracer`);
        delete this.tracers[tid];

        // If we had a job in progress we're probably screwed, so fail the job
        if(this.job && this.job.status == "RUNNING") {
          console.log(`### ERROR! One or more tracers went offline while job was running`);
          this.job.status = "FAILED";
          this.job.reason = `One or more tracers went offline while job was running`;
        }

        console.log(`### Tracers online: ${Object.keys(this.tracers).length}`);
      });
    }
    //console.log(`### Tracers online: ${Object.keys(tracers).length}`);
  }

  //
  // Create a new render job, with sub tasks fired off to tracers
  //
  public createJob(jobInput: JobInput) {

    // Basic checks
    if(!jobInput.name) throw('Job must have a name');
    if(!jobInput.width) throw('Job must have a width');
    if(!jobInput.height) throw('Job must have a height');
    if(!jobInput.scene) throw('Job must have a scene');

    // Basic job info supplied to us
    this.job = new Job();
    this.job.startDate = new Date();
    this.job.startTime = new Date().getTime();
    this.job.name = jobInput.name;
    this.job.width = jobInput.width;
    this.job.height = jobInput.height;

    // Add extra properties and objects we need
    this.job.id = uuidv4();
    this.job.status = "RUNNING"; 
    this.job.reason = ""; 
    this.job.taskCount = Object.keys(this.tracers).length; 
    this.job.tasksComplete = 0;
    this.job.png = new PNG.PNG({width:this.job.width, height:this.job.height});
    this.job.stats = {
      raysCreated: 0,
      raysCast: 0,
      shadowRays: 0,
      objectTests: 0
    };
  
    // Create tasks and send to tracers
    // Logic to slice image into sub-regions is here
    let sliceHeight = Math.floor(this.job.height / this.job.taskCount);
    this.job.tasks = [];
    let taskIndex = 0;
    for(let tid in this.tracers) {
      let tracer = this.tracers[tid];

      // !TODO! sliceHeight needs to account for remainder when non-integer
      let task = new Task();
      task.id = uuidv4();
      task.imageWidth = this.job.width;
      task.imageHeight = this.job.height;
      task.index = taskIndex;
      task.sliceStart = taskIndex * sliceHeight;
      task.sliceHeight = sliceHeight;

      this.job.tasks.push(task); 

      this.rawJob = jobInput;
      console.log(`### Sending task ${task.index} to ${tracer.endPoint}`);
      request.post({
        uri: `${tracer.endPoint}/tasks`,
        body: JSON.stringify({ task: task, scene: jobInput.scene }),
        headers: { 'content-type': 'application/json' }
      })
      .then()
      .catch(err => {
        console.error(`### ERROR! Unable to send task to tracer ${err}`);
        this.job.status = "FAILED";
        this.job.reason = err.message;
      })

      taskIndex++;
    }

    console.log(`### New job created: ${this.job.name} with ${this.job.taskCount} tasks`)
  }

  //
  // Job completion, output image, gather stats etc
  //
  completeJob() {
    if(this.job.status != "RUNNING") {
      return;
    }
    this.job.endDate = new Date();
    this.job.durationTime = (new Date().getTime() - this.job.startTime) / 1000;
    console.log(`### Job completed in ${this.job.durationTime} seconds`);

    let outDir = `${this.jobOutDir}/${this.job.name}`;
    if (!fs.existsSync(outDir)){
      fs.mkdirSync(outDir);
    }

    this.job.png.pack()
    .pipe(fs.createWriteStream(`${outDir}/render.png`))
    .on('finish', () => {
      console.log(`### Render complete, ${outDir}/render.png saved`);
      this.job.status = "COMPLETE";
      this.job.reason = `Render completed in ${this.job.durationTime} seconds`;
      let stats: any = {
        status: this.job.status,
        reason: this.job.reason,
        start: this.job.startDate,
        end: this.job.endDate,
        durationTime: this.job.durationTime,
        imageWidth: this.job.width,
        imageHeight: this.job.height,
        pixels: this.job.width * this.job.height,
        tracersUsed: Object.keys(this.tracers).length,
        stats: this.job.stats
      };
  
      let yamlOut: string = yaml.safeDump(this.rawJob, {});
      fs.writeFileSync(`${outDir}/result.json`, JSON.stringify(stats, null, 2));
      fs.writeFileSync(`${outDir}/job.yaml`, yamlOut);      
    });
  }

  //
  // Provide current status
  //
  public getStatus = (req: Request, res: Response) => {
    if(this.job) {
      res.status(200).send({
        job: {
          name: this.job.name,
          status: this.job.status,
          reason: this.job.reason,
          started: this.job.startDate,
          tasksComplete: this.job.tasksComplete,
          taskCount: this.job.taskCount
        }
      })
    } else {
      res.status(200).send({ msg: "Controller has no job, maybe nothing has run yet" });
    }
  }
  
  //
  // List out the jobs directory, used by the UI
  //
  public listJobs = (req: Request, res: Response) => {
    let jobData: any = {jobs:[]};
    fs.readdirSync(this.jobOutDir).forEach(file => {
      jobData.jobs.push(file);
    })

    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.status(200).send(jobData)
  }

  //
  // List online tracers, used by the UI
  //
  public listTracers = (req: Request, res: Response) => {
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.status(200).send(this.tracers)
  }
}