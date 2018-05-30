import { Request, Response } from 'express';
import request from 'request-promise-native';
import { Raytracer } from './raytracer';

// =======================================================================================================

export class API {

  ctrlEndPoint: string;
  //task: any;

  constructor(ep: string) {
    this.ctrlEndPoint = ep;
  }

  public healthPing(req: Request, res: Response) {
    res.status(200).send({ resp: "Hello!" })
  }

  public getStatus(req: Request, res: Response) {
    res.status(200).send({ msg: "Hello!" })
  }

  public newTask = (req: Request, res: Response) => {
    // All starts here!
    let task = req.body.task;
    let scene = req.body.scene;
  
    console.log(`### Starting task ${JSON.stringify(task)}, ${scene}`);
    res.status(200).send({ msg: "OK" });

    let rt: Raytracer = new Raytracer(task, scene);
    rt.startTrace()
      .then(imgbuffer => {
        console.log(`### Task complete, sending image fragment back to controller`);
        request.post({
          url: `${this.ctrlEndPoint}/tasks/${task.id}`,
          body: imgbuffer,
          headers: { 'content-type': 'application/octet-stream' }
        })
        .then(res => {})
        .catch(err => { console.log(err) })
      })
      .catch(err => {
        console.log(`### ERROR! Raytracing failed, we're fubar now`);
        console.error(err);
      })
  }

  public listTasks(req: Request, res: Response) {
    console.log(req);
  }
}