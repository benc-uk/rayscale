//
// All the non API parts of the controller, the main job & task manager
// --------------------------------------------------------------------
// Ben C, Sept 2020
//

import randstr from 'randomstring';
import * as PNG from 'pngjs';
import fs from 'fs';
import child_process from 'child_process';
import { Job } from './lib/job';
import { Frame } from './lib/frame';
import { JobInput } from './lib/job-input';
import { Task } from './lib/task';
import { Tracer } from './lib/tracer';
import axios from 'axios';
import { CancelToken } from 'cancel-token';

// ====================================================================================================
// Class manages jobs, tasks tracers & and task results - it's the heart of everything
// ====================================================================================================
export class Scheduler {
  // Tracers is a dictionary map of strings -> Tracer
  // The key is the URL of that tracer, which has the bonus of being unique
  private tracers: { [id: string]: Tracer };
  private job: Job;
  private jobOutDir: string;
  private inputJobYaml: string;

  constructor(outDir: string) {
    // Tracers starts as empty dict
    this.tracers = {};
    this.jobOutDir = outDir;
  }

  // ====================================================================================
  // Register a new tracer that has come online
  // ====================================================================================
  public addTracer(endPoint: string, id: string): void {
    const tracer = new Tracer(endPoint, id);

    this.tracers[tracer.endPoint] = tracer;
    console.log(`### Tracer registered: ${tracer.endPoint}`);
  }

  // ====================================================================================
  // Regular tracer health check, remove tracers that are not contactable
  // ====================================================================================
  public tracerHealthCheck = async (): Promise<void> => {
    const TIMEOUT = parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 20000;

    // Skip checks when rendering a job, as that is synchronous and blocking
    if(this.job && (this.job.status == 'RUNNING' || this.job.status == 'FAILED')) {
      return;
    }

    for(const tid in this.tracers) {
      const endPoint = this.tracers[tid].endPoint;

      try {
        // Loooong story but timeouts in Axios simply don't work...
        // https://stackoverflow.com/a/54573024/1343261
        const canTokensource = CancelToken.source();
        setTimeout(() => {
          canTokensource.cancel();
        }, TIMEOUT);

        axios.defaults.timeout = TIMEOUT;
        const pingResp = await axios.get(`${endPoint}/ping`, {timeout: TIMEOUT, cancelToken: canTokensource.token});
        if(pingResp && pingResp.status == 200) {
          continue;
        } else {
          throw new Error(`Tracer ${tid} failed healthcheck`);
        }
      } catch(err) {
        console.log(`### Health check ${tid} failed, Unregistering tracer`);
        delete this.tracers[tid];
        console.log(`### Tracers online: ${Object.keys(this.tracers).length}`);
      }
    }
  };

  // ====================================================================================
  // Create a new render job, with sub tasks fired off to tracers
  // ====================================================================================
  public createJob(jobInput: JobInput, jobRawYAML: string): string {
    // Job object holds a lot of state
    this.job = new Job();

    // We only use the raw YAML when saving the results, mainly as a reference
    this.inputJobYaml = jobRawYAML;

    // Basic checks
    if(!jobInput.name) throw('Job must have a name');
    if(!jobInput.width) throw('Job must have a width');
    if(!jobInput.height) throw('Job must have a height');
    if(!jobInput.scene) throw('Job must have a scene');

    // Animation settings
    if(jobInput.animation) {
      if(!jobInput.animation.duration) throw('Job animation must have a duration');
      this.job.duration = jobInput.animation.duration;

      if(jobInput.animation.framerate)
        this.job.framerate = jobInput.animation.framerate;
      else
        this.job.framerate = 30;

      this.job.frameCount = this.job.duration * this.job.framerate;
    } else {
      this.job.duration = 0;
      this.job.framerate = 0;
      this.job.frameCount = 1;
    }

    // Basic job info supplied to us
    this.job.name = jobInput.name;
    this.job.width = jobInput.width;
    this.job.height = jobInput.height;

    // Add extra properties and objects we need
    this.job.startDate = new Date();
    this.job.startTime = new Date().getTime();
    this.job.id = randstr.generate(5);
    this.job.status = 'RUNNING';
    this.job.reason = '';
    this.job.stats = {
      raysCreated: 0,
      raysCast: 0,
      shadowRays: 0,
      objectTests: 0,
      meshFaceTests: 0
    };
    this.job.maxDepth = jobInput.maxDepth || 4;
    this.job.antiAlias = jobInput.antiAlias || false;
    this.job.rawScene = jobInput.scene;
    this.job.taskCount = 0;
    this.job.tasksComplete = 0;

    this.job.tasksPerFrame = 0;
    if(!jobInput.tasks || typeof jobInput.tasks !== 'number') {
      this.job.tasksPerFrame = Object.keys(this.tracers).length;
      console.log(`### WARNING! Task count not supplied, using default: ${this.job.tasksPerFrame}`);
    } else {
      this.job.tasksPerFrame = jobInput.tasks;
      if(this.job.tasksPerFrame > this.job.height) {
        this.job.status = 'FAILED';
        throw 'Error! Can not request more tasks than image height!';
      }
      if(this.job.tasksPerFrame < Object.keys(this.tracers).length) {
        this.job.status = 'FAILED';
        throw 'Error! Task count should at least be equal to number of tracers';
      }
    }
    this.job.taskCount = this.job.tasksPerFrame * this.job.frameCount;

    // Create initial frame, or only frame for static images
    this.job.currentFrame = 1;
    this.createNewFrame(this.job.currentFrame);

    console.log(`### New job created: '${this.job.name}' with ${this.job.taskCount} tasks`);
    console.log(`### Job will render ${this.job.frameCount} frames`);

    // Delete old PNGs from output dir
    const outDir = `${this.jobOutDir}/${this.job.name}`;
    fs.readdir(outDir, (error, files) => {
      if (error) {
        // ignore probably as the directory doesn't exist
        return;
      }
      for(const file of files.filter(name => /\.png$/.test(name))) {
        fs.unlink(`${outDir}/${file}`, err => {if (err) throw err;});
      }
    });

    // First pass, send out tasks for first frame
    // One for each online tracer
    for(const tid in this.tracers) {
      const tracer = this.tracers[tid];
      this.assignTaskToTracer(this.job.currentFrame, tracer);
    }

    return this.job.id;
  }

  // ====================================================================================================
  // Create a new frame, assign tasks to it & advance the job
  // ====================================================================================================
  private createNewFrame(frameIndex: number) {
    const frame = new Frame();
    frame.png = new PNG.PNG({ width: this.job.width, height: this.job.height });

    // Create tasks
    // Logic to slice image into sub-regions is here
    frame.tasks = [];
    frame.taskQueue = [];
    frame.tasksComplete = 0;

    // Using ceil here removes rounding bug where image height not divisible by number tasks
    const sliceHeight = Math.ceil(this.job.height / this.job.tasksPerFrame);
    for(let taskIndex = 0; taskIndex < this.job.tasksPerFrame; taskIndex++) {
      const task = new Task();
      task.id = randstr.generate(5);
      task.jobId = this.job.id;
      task.imageWidth = this.job.width;
      task.imageHeight = this.job.height;
      task.index = taskIndex;
      task.sliceStart = taskIndex * sliceHeight;
      task.sliceHeight = sliceHeight;
      task.maxDepth = this.job.maxDepth;
      task.antiAlias = this.job.antiAlias;
      task.frame = frameIndex;
      task.time = (1/this.job.framerate) * frameIndex;

      frame.tasks.push(task);
      frame.taskQueue.push(task.id);
    }

    // Update current frame
    this.job.currentFrame = frameIndex;
    this.job.frame = frame;
  }

  // ====================================================================================
  // Regular tracer health check, remove tracers that are not contactable
  // ====================================================================================
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
  public processTaskResults(taskId: string, buff: any, tracerId: string): void {
    // Locate the task by taskId, we could also use taskIndex
    const task = this.job.frame.tasks.find(t => t.id == taskId);

    this.job.frame.tasksComplete++;
    console.log(`### Frame: ${this.job.currentFrame} - tasks completed: ${this.job.frame.tasksComplete} of ${this.job.frame.totalTasks}`);

    // Inject task's slice of returned image data into PNG data buffer for the frame
    for (let x = 0; x < this.job.width; x++) {
      let yBuff = 0;

      for (let y = task.sliceStart; y < (task.sliceStart + task.sliceHeight); y++) {
        // Index into the returned buffer and the job's PNG data
        const pngIdx = (this.job.width * y + x) << 2;         // I'll admit to not understanding this
        const buffIndx = ((this.job.width * yBuff + x) * 3);

        // Standard RGBA tuple, discarding alpha
        this.job.frame.png.data[pngIdx + 0] = buff[buffIndx + 0];
        this.job.frame.png.data[pngIdx + 1] = buff[buffIndx + 1];
        this.job.frame.png.data[pngIdx + 2] = buff[buffIndx + 2];
        this.job.frame.png.data[pngIdx + 3] = 255;
        yBuff++;
      }
    }

    this.job.tasksComplete++;

    if(this.job.frame.tasksRemaining <= 0) {
      // Save frame result as PNG
      this.writeFramePNG(this.job.currentFrame);

      if(this.job.currentFrame >= this.job.frameCount) {
        // Last frame, so we're done!!
        this.completeJob();
      } else {
        // Work on next frame, the +1 is pretty important!
        this.createNewFrame(this.job.currentFrame + 1);
        // Assign tasks again for new frame
        for(const tid in this.tracers) {
          const tracer = this.tracers[tid];
          this.assignTaskToTracer(this.job.currentFrame, tracer);
        }
      }
    } else {
      // If there's more work left in the job, assign to this tracer
      if(this.job.frame.tasksInQueue > 0) {
        const tracer: Tracer = this.tracers[tracerId];
        this.assignTaskToTracer(this.job.currentFrame, tracer);
      }
    }
  }

  // ====================================================================================================
  // Assign a random unassigned task to a remote tracer via the REST API
  // Payload is simple JSON object with two members, task and scene
  // ====================================================================================================
  private async assignTaskToTracer(frameNum: number, tracer: Tracer): Promise<void> {
    // Frame holds everything we need like tasks
    const frame = this.job.frame;

    // Sanity/edge case check
    if(frame.tasksRemaining <= 0) return;

    // Get random task not yet assigned in this frame
    // Why random? image slices will contain a mixture of complexity and take different times
    const unassignedTaskIndex = Math.floor(Math.random() * frame.taskQueue.length);
    const taskId = frame.taskQueue[unassignedTaskIndex];
    // Remember to remove from array!
    frame.taskQueue.splice(unassignedTaskIndex, 1);
    const task = frame.tasks.find(t => t.id == taskId);

    // Send to tracer
    console.log(`### Sending frame: ${frameNum}, task ${task.id}:${task.index} to ${tracer.endPoint}`);
    try {
      await axios.post(
        `${tracer.endPoint}/tasks`,
        JSON.stringify({ task: task, scene: this.job.rawScene }),
        { headers: { 'content-type': 'application/json' } }
      );
    } catch (err) {
      let details = '';
      if(err.response && err.response.data) {
        details = JSON.stringify(err.response.data);
      }
      console.error(`### ERROR! Unable to send task to tracer ${err} ${details}`);
      this.job.status = 'FAILED';
      this.job.reason = err.message;
    }
  }

  // ====================================================================================
  // Job completion, write stats and handle job status
  // ====================================================================================
  private completeJob(): void {
    const outDir = `${this.jobOutDir}/${this.job.name}`;
    if (!fs.existsSync(outDir)){
      fs.mkdirSync(outDir);
    }

    this.job.endDate = new Date();
    this.job.durationTime = (new Date().getTime() - this.job.startTime) / 1000;

    if(this.job.status == 'CANCELLED') {
      fs.writeFileSync(`${outDir}/result.json`, JSON.stringify({
        status: this.job.status,
        reason: this.job.reason,
        start: this.job.startDate,
        end: this.job.endDate,
        durationTime: this.job.durationTime
      }, null, 2));
      fs.writeFileSync(`${outDir}/job.yaml`, this.inputJobYaml);
      return;
    }

    if(this.job.status != 'RUNNING') {
      return;
    }

    // Output debug info and stats JSON
    this.job.status = 'COMPLETE';
    this.job.reason = `Render completed in ${this.job.durationTime} seconds`;
    const results = {
      status: this.job.status,
      reason: this.job.reason,
      start: this.job.startDate,
      end: this.job.endDate,
      durationTime: this.job.durationTime,
      imageWidth: this.job.width,
      imageHeight: this.job.height,
      pixels: this.job.width * this.job.height,
      tasks: this.job.taskCount,
      frames: this.job.frameCount,
      tracersUsed: Object.keys(this.tracers).length,
      RPP: this.job.stats.raysCast / (this.job.width * this.job.height),
      stats: this.job.stats
    };
    console.log('### Results details: ', results);
    console.log(`### Job completed in ${this.job.durationTime} seconds`);

    // Supplementary result files
    fs.writeFileSync(`${outDir}/result.json`, JSON.stringify(results, null, 2));
    fs.writeFileSync(`${outDir}/job.yaml`, this.inputJobYaml);

    // Render video
    const videoFilename = 'video.mp4';
    child_process.exec(`ffmpeg -hide_banner -loglevel warning -framerate ${this.job.framerate} -i "result_%05d.png" -vcodec libx264 -pix_fmt yuv420p -y -tune animation -preset veryslow ${videoFilename}`, {cwd:`${outDir}`}, (error, stdout, stderr) => {
      if (error) {
        console.error(`### Video generation ffmpeg error: ${error}`);
        return;
      }
      if(stdout) console.log(`### Video generation ffmpeg output: ${stdout}`);
      if(stderr) console.log(`### Video generation ffmpeg error: ${stderr}`);
      console.log(`### Video generation of ${videoFilename} complete!`);
    });
  }

  // ====================================================================================
  // Save a frame as PNG to the output dir
  // ====================================================================================
  private writeFramePNG(frameNum: number): void {
    const outDir = `${this.jobOutDir}/${this.job.name}`;
    if (!fs.existsSync(outDir)){
      fs.mkdirSync(outDir);
    }

    // Write out result PNG file
    this.job.frame.png.pack()
      .pipe(fs.createWriteStream(`${outDir}/result_${frameNum.toString().padStart(5, '0')}.png`));
  }

  // ====================================================================================
  // Fail the current job
  // ====================================================================================
  public failJob(reason: string): void {
    this.job.status = 'FAILED';
    this.job.reason = reason;
  }

  // ====================================================================================
  // Cancel the current job
  // ====================================================================================
  public cancelJob(): void {
    this.job.status = 'CANCELLED';
    this.job.reason = 'Cancelled by user at '+(new Date().toDateString());
    this.completeJob();
  }

  // ====================================================================================
  // Getter for job, needed a LOT by the API
  // ====================================================================================
  public getJob(): Job {
    return this.job;
  }

  // ====================================================================================
  // Getter for tracer list, needed by API listTracers
  // ====================================================================================
  public getTracers(): { [id: string]: Tracer } {
    return this.tracers;
  }

  // ====================================================================================
  // Getters for various properties
  // ====================================================================================
  get tracerCount(): number {
    return Object.keys(this.tracers).length;
  }
  get outputDir(): string {
    return this.jobOutDir;
  }
}