import { Request, Response } from 'express';
import axios from 'axios';
import os from 'os';
import { Raytracer } from './raytracer';
import { Task } from './lib/task';
import { Scene } from './lib/scene';
import { Stats } from './lib/stats';
import { numberWithCommas } from './lib/utils';
//import { PngManager } from './lib/png-manager';
//import { ObjManager } from './lib/obj-manager';

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

    // FIXME: Had to disable this parsing optimization, as fundamental at odds with animation
    // Investigate caching/cloning properties of objects that have animations

    // We only parse the scene on new jobs, this way the tracer
    // can accept multiple tasks for the same job without re-parsing the scene
    // if(task.jobId != this.lastJobId {

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
      console.log(`### Rays created: ${numberWithCommas(Stats.raysCreated)}`);
      console.log(`### Rays cast:    ${numberWithCommas(Stats.raysCast)}`);
      console.log(`### Shadow rays:  ${numberWithCommas(Stats.shadowRays)}`);
      console.log(`### Object tests: ${numberWithCommas(Stats.objectTests)}`);
      console.log(`### Face tests: ${numberWithCommas(Stats.meshFaceTests)}`);

      // Send image buffer to controller as binary (octet-stream)
      await axios.post(
        `${this.ctrlEndPoint}/tasks/${task.frame}/${task.id}`,
        imgSlice,
        { headers: {
          'content-type': 'application/octet-stream',
          'x-tracer': this.tracerEndPoint,
          'x-task-id': task.id,
          'x-task-index': task.index.toString(),
          'x-stats-rayscreated': Stats.raysCreated.toString(),
          'x-stats-rayscast': Stats.raysCast.toString(),
          'x-stats-shadowrays': Stats.shadowRays.toString(),
          'x-stats-objtests': Stats.objectTests.toString(),
          'x-stats-meshtests': Stats.meshFaceTests.toString()
        },
        maxContentLength: Infinity, // Apparently this is a thing
        maxBodyLength: Infinity
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