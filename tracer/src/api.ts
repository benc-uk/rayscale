import { Request, Response } from 'express';
import request from 'request-promise-native';
import { Raytracer } from './raytracer';

// =======================================================================================================

export class API {

  ctrlEndPoint: string;

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

    let rt: Raytracer = new Raytracer({}, {});
  
    console.log(`### Starting task ${task}, ${scene}`);
    res.status(200).send({ msg: "OK" });

    rt.startTrace()
      .then(() => {
        console.log(`### Task complete, letting controller know`);
        request.post({
          url: `${this.ctrlEndPoint}/tasks`,
          body: {msg: "Task done"},
          headers: { 'content-type': 'application/json' }
        })
        .then(res => { console.log(res) })
        .catch(err => { console.log(err) })
      })
  }

  public listTasks(req: Request, res: Response) {
    console.log(req);
  }
}