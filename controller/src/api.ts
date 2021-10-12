//
// API routes for controller, handles requests from UI and results from tracers
// ----------------------------------------------------------------------------
// Ben C, May 2018
// Major refactor: Sept 2020
//

import { Request, Response } from 'express';
import * as yaml from 'js-yaml';
import fs from 'fs';
import { JobInput } from './lib/job-input';
import { allLogs } from './server';
import { Scheduler } from './scheduler';

// ====================================================================================================
// Class acts as a holder for all API route handlers and some private functions they need
// ====================================================================================================
export class API {
  private scheduler: Scheduler;

  constructor(controller: Scheduler) {
    this.scheduler = controller;
  }

  // ====================================================================================
  // API: Register a new tracer/worker
  // ====================================================================================
  public addTracer = (req: Request, res: Response): void => {
    this.scheduler.addTracer(req.body.endPoint, req.body.id);
    res.contentType('application.json');
    res.status(200).send({ msg: 'Tracer registered' });

    console.log(`### Tracers online: ${this.scheduler.tracerCount}`);
  };

  // ====================================================================================
  // API: Start a new job, POST data is initial job data
  // ====================================================================================
  public startJob = (req: Request, res: Response): void => {
    res.type('application/json');
    console.log('### New job request received');

    // Check active job
    if(this.scheduler.getJob() && this.scheduler.getJob().status == 'RUNNING') {
      //console.log(`### Job rejected. There is currently an active job '${this.job.name}' with ${this.job.totalTasks} of ${this.job.tasksRemaining} tasks remaining`);
      console.log('### Job rejected. There is currently an active job');
      res.status(400).send({msg: 'There is currently an active job'}); return;
    }

    // Check if we have any tracers
    if(this.scheduler.tracerCount <= 0) {
      console.log('### Job rejected. No tracers online, unable to start job');
      res.status(400).send({msg: 'No tracers online'}); return;
    }

    // Convert YAML to JSON
    let jobInput: JobInput = null;
    try {
      jobInput = <JobInput>yaml.safeLoad(req.body.toString());
    } catch(err) {
      console.error(`### ERROR! YAML conversion failed ${err.message}`);
      res.status(400).send({msg: `YAML conversion failed ${err.message}`}); return;
    }

    // Create complete job object and kick everything off!
    try {
      // Pass the parsed YAML as a JobInput object, and raw YAML string
      const jobId = this.scheduler.createJob(jobInput, req.body.toString());
      res.status(200).send({msg: 'Job started', id: jobId});
    } catch(e) {
      res.status(400).send({msg: `Job invalid ${e}`});
    }
  };

  // ====================================================================================
  // API: Task results send back from tracer
  // ====================================================================================
  public taskComplete = (req: Request, res: Response): void => {
    const job = this.scheduler.getJob();

    // Ignore results if job not running (i.e CANCELLED or FAILED)
    if(job.status != 'RUNNING') {
      console.log(`### Task results '${req.params.id}' discarded as job is ${job.status}`);
      // Sending a 200 back might seem odd, but this is not an error or failure condition
      res.status(200).send({ msg: 'Task data discarded' });
      return;
    }

    // If we get anything other than binary data, that's a failure
    if(req.headers['content-type'] != 'application/octet-stream') {
      const reason = `Ray tracing failed, task ${req.body.taskIndex} had an error, ${req.body.error}`;
      this.scheduler.failJob(reason);
      console.error(`### ERROR! ${reason}`);
      // Sending a 200 back might seem odd, but we're confirming we got the error
      res.status(200).send({msg: reason});
      return;
    }

    const taskIndex = req.headers['x-task-index'];
    const tracerId: string = req.headers['x-tracer'].toString();
    console.log(`### Image buffer received from ${tracerId} for task: ${taskIndex}`);

    // We hold some stats about the completed task in HTTP headers, as the payload is binary
    job.stats.raysCreated += parseInt(req.headers['x-stats-rayscreated'].toString());
    job.stats.raysCast += parseInt(req.headers['x-stats-rayscast'].toString());
    job.stats.shadowRays += parseInt(req.headers['x-stats-shadowrays'].toString());
    job.stats.objectTests += parseInt(req.headers['x-stats-objtests'].toString());
    job.stats.meshFaceTests += parseInt(req.headers['x-stats-meshtests'].toString());

    try {
      this.scheduler.processTaskResults(req.params.id, req.body, tracerId);
      res.status(200).send({ msg: 'OK, task result buffer stored & processed' });
    } catch(err) {
      res.status(500).send({ msg: 'Failed to process results: '+err });
    }
  };

  // ====================================================================================
  // API: Provide current status
  // ====================================================================================
  public getStatus = (req: Request, res: Response): void => {
    const job = this.scheduler.getJob();

    if(job) {
      res.status(200).send({
        job: {
          name: job.name,
          status: job.status,
          reason: job.reason,
          started: job.startDate,
          frameCount: job.frameCount,
          currentFrame: job.currentFrame,
          taskCount: job.taskCount,
          tasksComplete: job.tasksComplete
        }
      });
    } else {
      res.status(200).send({ msg: 'Idle. No jobs have run yet' });
    }
  };

  // ====================================================================================
  // List out the jobs directory, used by the UI
  // ====================================================================================
  public listJobs = (req: Request, res: Response): void => {
    // FIXME: send back some contents, e.g. if video exists and first image frame (may not be 1)
    const jobData = { jobs: [] as string[] };
    fs.readdirSync(this.scheduler.outputDir).forEach(file => {
      jobData.jobs.push(file);
    });

    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(jobData);
  };

  // ====================================================================================
  // Delete a job directory, used by the UI
  // ====================================================================================
  public deleteJob = (req: Request, res: Response): void => {
    fs.rmdirSync(this.scheduler.outputDir + '/' + req.params.job, { recursive: true });

    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send({ msg: 'Job deleted' });
  };

  // ====================================================================================
  // List online tracers, used by the UI
  // ====================================================================================
  public listTracers = (req: Request, res: Response): void => {
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(this.scheduler.getTracers());
  };

  // ====================================================================================
  // Cancel job!
  // ====================================================================================
  public cancelJob = (req: Request, res: Response): void => {
    const job = this.scheduler.getJob();

    if(job && job.status == 'RUNNING') {
      this.scheduler.cancelJob();
      res.status(200).send({ msg: 'Job cancelled' });
    } else {
      res.status(400).send({ msg: 'No running job to cancel' });
    }
  };

  // ====================================================================================
  // Return server logs, starting at offset line
  // ====================================================================================
  public getLogs = (req: Request, res: Response): void => {
    if(req.params.offset) {
      const offset: number = parseInt(req.params.offset);
      res.status(200).send(allLogs.slice(offset));
      return;
    }
    res.status(200).send(allLogs);
  };
}