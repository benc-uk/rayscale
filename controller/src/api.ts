import { Request, Response } from 'express';
import request from 'request-promise-native';
import uuidv4 from 'uuid/v4';
import * as PNG from 'pngjs';
import fs from 'fs';
import { Job } from './lib/job';
import { Task } from './lib/task';
import { Tracer } from './lib/tracer';
import { Scene } from '../../tracer/src/lib/scene';

export class API {

  private tracers: { [id: string]: Tracer };
  private job: Job;
  private jobOutDir: string;

  constructor(outDir: string) {
    // Tracers starts as empty dict  
    this.tracers = {};
    this.jobOutDir = outDir;
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
    if(Object.keys(this.tracers).length <= 0) {
      console.log(`### No tracers online, unable to start job`);
      res.status(400).send({title: "No tracers online"}); return;
    }
  
    // Create complete job object and kick everything off
    this.createJob(req.body)
    res.status(200).send({msg: "Job started", id: this.job.id});
  }

  //
  // API: Task results send back from tracer
  //
  public taskComplete = (req: Request, res: Response) => {
    let taskId = req.params.id;
    
    // If we get anything other than binary data, that's a failure
    if(req.headers['content-type'] != 'application/octet-stream') {
      console.error(`### ERROR! Task ${taskId} has failed, job will not complete`);
      this.job.status = "FAILED";
      return;
    }

    let buff = req.body;
    let task = this.job.tasks.find(t => t.id == taskId);

    // !TODO! - Check for no active job

    console.log(`### Image buffer received for task: ${taskId}`);

    this.job.tasksComplete++;

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
    
    res.send({})
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
      let resp = request(`${endPoint}/ping`)
      .catch(err => {
        console.log(`### Health check failed for ${endPoint}. Unregistering tracer`);
        delete this.tracers[tid];
      });
    }
    //console.log(`### Tracers online: ${Object.keys(tracers).length}`);
  }

  //
  // Create a new render job, with sub tasks fired off to tracers
  //
  public createJob(jobInput: any) {
    // Basic job info supplied to us
    this.job = new Job();
    this.job.name = jobInput.name;
    this.job.width = jobInput.width;
    this.job.height = jobInput.height;
    this.job.scene = new Scene();

    // Add extra properties and objects we need
    this.job.id = uuidv4();
    this.job.status = "RUNNING"; 
    this.job.taskCount = Object.keys(this.tracers).length; 
    this.job.tasksComplete = 0;
    this.job.png = new PNG.PNG({width:this.job.width, height:this.job.height});
  
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

      request.post({
        uri: `${tracer.endPoint}/tasks`,
        body: JSON.stringify({ task: task, scene: jobInput.scene }),
        headers: { 'content-type': 'application/json' }
      })
      .catch(err => {
        console.error(`### ERROR! Unable to send task to tracer ${err.message}`);
        this.job.status = "FAILED";
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

    let outDir = `${this.jobOutDir}/${this.job.name}`;
    if (!fs.existsSync(outDir)){
      fs.mkdirSync(outDir);
    }

    this.job.png.pack()
    .pipe(fs.createWriteStream(`${outDir}/render.png`))
    .on('finish', () => {
      console.log('### PNG Written!');
      this.job.status = "COMPLETE";
    });
  }

  //
  // API Stubs
  //
  public getStatus = (req: Request, res: Response) => {
    res.status(200).send({msg:"API stub"})
  }
  
  public listJobs = (req: Request, res: Response) => {
    res.status(200).send({msg:"API stub"})
  }
  
  public listTracers = (req: Request, res: Response) => {
    res.status(200).send({msg:"API stub"})
  }
}