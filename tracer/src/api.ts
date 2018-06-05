import { Request, Response } from 'express';
import request from 'request-promise-native';
import { Raytracer } from './raytracer';
import { Task } from './lib/task';
import { Scene } from './lib/scene';
import { Stats } from './lib/stats';

// =======================================================================================================

export class API {

  ctrlEndPoint: string;
  tracerEndPoint: string;

  constructor(ep: string) {
    this.ctrlEndPoint = ep;
  }

  public healthPing(req: Request, res: Response) {
    res.status(200).send({ resp: "Hello! I am alive" })
  }

  public newTask = (req: Request, res: Response) => {
    // All starts here!
    let task: Task = req.body.task;
    let scene = null;

    console.log(`### Starting task...`);

    // Parse scene
    scene = Scene.parseScene(req.body.scene);
    if(!scene) {
      console.error(`### ERROR! Scene did not parse correctly, task rejected`);
      res.status(500).send({ error: "Scene did not parse correctly, task rejected" });
      return; 
    }

    res.status(200).send({ msg: "OK" });

    let rt: Raytracer = new Raytracer(task, scene);
    rt.startTrace()
      .then(imgbuffer => {
        console.log(`### Task complete, sending image fragment back to controller`);
        console.log(Stats)
        request.post({
          url: `${this.ctrlEndPoint}/tasks/${task.id}`,
          body: imgbuffer,
          headers: { 
            'content-type': 'application/octet-stream',
            'x-tracer': this.tracerEndPoint,
            'x-task-id': task.id,
            'x-task-index': task.index
          }
        })
        .then(res => {})
        .catch(err => { console.log(err) })
      })
      .catch(err => {
        console.log(`### ERROR! Raytracing failed, we're fubar now`);
        console.error(err);
      })
  }

  public getStatus(req: Request, res: Response) {
    res.status(200).send({ msg: "Hello!" })
  }

  public listTasks(req: Request, res: Response) {
    console.log(req);
  }
}