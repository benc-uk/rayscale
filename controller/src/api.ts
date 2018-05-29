import { Request, Response } from 'express';
import request from 'request-promise-native';
import uuidv4 from 'uuid/v4';
import * as PNG from 'pngjs';
import fs from 'fs';

export class API {

  private tracers: any = {};
  private job: any = {};
  private scene: any = {};

  constructor() {
    this.tracers = {};
    this.job = {};
    this.scene = {};
  }

  public getStatus = (req: Request, res: Response) => {
    res.status(200).send({msg:"Hello!"})
  }
  
  public addTracer = (req: Request, res: Response) => {
    let tracer = req.body;
  
    this.tracers[tracer.endPoint] = tracer;
    console.log(`### Tracer registered: ${tracer.endPoint}`);
  
    res.contentType('application.json');
    res.status(200).send({msg: "OK"});
  
    console.log(`### Tracers online: ${Object.keys(this.tracers).length}`);
  }
  
  public startJob = (req: Request, res: Response) => {
    if(this.tracers.length <= 0) {
      res.status(400).send({title: "No tracers online"}); return;
    }
  
    this.createJob(req.body)
  
    res.status(200).send({msg:"OK"});
  }
  
  public listJobs = (req: Request, res: Response) => {
    console.log(req);
  }
  
  public listTracers = (req: Request, res: Response) => {
    console.log(req);
  }
  
  public taskComplete = (req: Request, res: Response) => {
    let buff = req.body;

    console.log(`### Image buffer received from tracer`);
    for (var x = 0; x < this.job.width; x++) {
      for (var y = 0; y < this.job.height; y++) {
        let pngIdx = (this.job.width * y + x) << 2;
        let buffIndx = ((this.job.width * y + x) * 3);

        this.job.png.data[pngIdx + 0] = buff[buffIndx + 0];
        this.job.png.data[pngIdx + 1] = buff[buffIndx + 1];
        this.job.png.data[pngIdx + 2] = buff[buffIndx + 2];
        this.job.png.data[pngIdx + 3] = 255
      }
    }

    this.job.png.pack()
    .pipe(fs.createWriteStream('outfile.png'))
    .on('finish', function() {
      console.log('### PNG Written!');
    });
    
    res.send({})
  }
  
  public tracerHealthCheck = () => {
    //console.log(`### Running tracer health check...`);
    
    for(let tracer in this.tracers) {
      let endPoint = this.tracers[tracer].endPoint;
  
      // Call health ping API on tracer, expect 200 and nothing more
      // !TODO! Further validation, check id etc
      let resp = request(`${endPoint}/ping`)
      .catch(err => {
        console.log(`### Health check failed for ${endPoint}. Unregistering tracer`);
        delete this.tracers[tracer];
      });
    }
    //console.log(`### Tracers online: ${Object.keys(tracers).length}`);
  }

  public createJob(job: any) {
    // Basic stuff supplied to us    
    this.job = job;

    // Add extra properties and objects we need
    this.job.id = uuidv4();
    this.job.status = "RUNNING"; 
    this.job.taskCount = this.tracers.length; 
    this.job.tasksComplete = 0;
    this.job.png = new PNG.PNG({width:this.job.width, height:this.job.height});
  
    // Create tasks and send to tracers

    console.log(`### New job created: ${this.job.name} with ${this.job.taskCount} tasks`)
  }
}