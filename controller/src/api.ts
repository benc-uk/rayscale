import { Request, Response } from 'express';
import request from 'request-promise-native';
import uuidv4 from 'uuid/v4';

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
  
    this.job = req.body;
    this.job.id = uuidv4();
    this.job.status = "RUNNING"; 
    this.job.taskCount = this.tracers.length; 
    this.job.tasksComplete = 0; 
  
    // Create tasks and send to tracers
  
    res.status(200).send(this.job);
  }
  
  public listJobs = (req: Request, res: Response) => {
    console.log(req);
  }
  
  public listTracers = (req: Request, res: Response) => {
    console.log(req);
  }
  
  public taskComplete = (req: Request, res: Response) => {
    console.log("COMPLETE!!!!");
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
}