import { Request, Response } from 'express';
import axios from 'axios';
import os from 'os';
import { Raytracer } from './raytracer';
import { Task } from './lib/task';
import { Scene } from './lib/scene';
import { Stats } from './lib/stats';
//import { PngManager } from './lib/png-manager';
//import { ObjManager } from './lib/obj-manager';
import { Utils } from './lib/utils';

// =======================================================================================================

export class API {
  ctrlEndPoint: string;
  tracerEndPoint: string;
  lastJobId: string;
  lastScene: Scene;
  raytracer: Raytracer;

  constructor(ep: string) {
    this.ctrlEndPoint = ep;
    this.lastJobId = '';
  }

  //
  // Respond to health pings with HTTP 200 and a simple JSON message
  //
  public healthPing(req: Request, res: Response): void {
    res.status(200).send({
      message: 'Hello! I am alive',
      host: os.hostname(),
      port: req.socket.localPort
    });
  }

  public newTask = async (req: Request, res: Response): Promise<void> => {
    // All starts here!
    const task: Task = req.body.task;
    let scene: Scene = null;

    // We only parse the scene on new jobs, this way the tracer
    // can accept multiple tasks for the same job without re-parsing the scene
    // NOTE: Had to disable this optimisation, as fundamental at odds with animation
    // We need a clean state for each render
    //if(task.jobId != this.lastJobId {
    Stats.reset();
    // Clear out caches, or not
    /* if(process.env.CLEAR_CACHE != 'false') {
        PngManager.getInstance().clearCache();
        ObjManager.getInstance().clearCache();
    } */

    // Parse scene
    try {
      scene = await Scene.parseScene(req.body.scene, task.jobId, task.time);
    } catch(err) {
      console.error(`### ERROR! ${err}, Scene did not parse correctly, task rejected`);
      res.contentType('application/json');
      res.status(460).send({ error: `Scene did not parse correctly: ${err}. Task rejected` });
    }

    if(!scene) {
      return;
    }

    this.lastJobId = task.jobId;
    this.lastScene = scene;
    // } else {
    //   console.log(`### Scene parsing skipped for job: ${task.jobId}`);
    //   scene = this.lastScene;
    // }

    console.log('### Starting task...');

    // Send OK back before starting tracing
    res.status(202).send({ msg: 'Task accepted' });

    // Start the ray tracer for the give task & scene
    try {
      // Go!
      this.raytracer = new Raytracer(task, scene);
      const imgSlice = this.raytracer.runRayTrace();

      // Log stats
      console.log('### Task complete, sending image fragment back to controller');
      console.log(`### Rays created: ${Utils.numberWithCommas(Stats.raysCreated)}`);
      console.log(`### Rays cast:    ${Utils.numberWithCommas(Stats.raysCast)}`);
      console.log(`### Shadow rays:  ${Utils.numberWithCommas(Stats.shadowRays)}`);
      console.log(`### Object tests: ${Utils.numberWithCommas(Stats.objectTests)}`);
      console.log(`### Face tests: ${Utils.numberWithCommas(Stats.meshFaceTests)}`);

      // Send image buffer to controller as binary (octet-stream)
      await axios.post(
        `${this.ctrlEndPoint}/tasks/${task.frame}/${task.id}`,
        imgSlice,
        { headers: {
          'content-type': 'application/octet-stream',
          'x-tracer': this.tracerEndPoint,
          'x-task-id': task.id,
          'x-task-index': task.index,
          'x-stats-rayscreated': Stats.raysCreated,
          'x-stats-rayscast': Stats.raysCast,
          'x-stats-shadowrays': Stats.shadowRays,
          'x-stats-objtests': Stats.objectTests,
          'x-stats-meshtests': Stats.meshFaceTests
        },
        maxContentLength: Infinity // Apparently this is a thing
        });
    } catch(e) {
      console.log(`### ERROR! ${e}. Ray tracing task failed`);
      await axios.post(
        `${this.ctrlEndPoint}/tasks/${task.frame}/${task.id}`,
        { error: e.toString(), taskIndex: task.index },
        { headers: { 'content-type': 'application/json'}}
      );
    }
  };

  public getStatus(req: Request, res: Response): void {
    res.status(200).send({ msg: 'Hello!' });
  }

  // stub
  public listTasks(req: Request, res: Response): void {
    console.log('### API stub');
  }

}