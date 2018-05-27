//
// Master server, REST API and control point
// ---------------------------------------------
// Ben C, May 2018
//

// Load in modules, and create Express app 
import express from 'express';
import bodyParser from 'body-parser';
import logger from 'morgan';
import cors from 'cors';
import { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import uuidv4 from 'uuid/v4';

dotenv.config();

// Globals
var tracers: any = {};
var job: any = {};
var scene: any = {};

const app:Application = express();
app.use(cors());
app.use(bodyParser.json())

// Set up logging
if (app.get('env') === 'production') {
    app.use(logger('combined'));
  } else {
    app.use(logger('dev'));
}
console.log(`### Node environment mode is '${app.get('env')}'`);

// Routing here!
app.get ('/api/status',  getStatus);
app.get ('/api/jobs',    listJobs);
app.post('/api/jobs',    startJob);
app.get ('/api/tracers', listTracers);
app.post('/api/tracers', addTracer);

// Global catch all for all requests not caught by other routes
// Just return a HTTP 400
app.use('*', function (req, res, next) {
  res.sendStatus(400);
})

// Start server
let port = process.env.PORT || 9000;
let checkInterval = process.env.HEALTH_CHECK_INTERVAL || "10";
const server = app.listen(port, function () {
  console.log(`### Controller server listening on ${port}`);
  setInterval(tracerHealthCheck, parseInt(checkInterval) * 1000);
});

// =======================================================================================================

function getStatus(req: Request, res: Response) {
  res.status(200).send({msg:"Hello!"})
}

function addTracer(req: Request, res: Response) {
  let tracer = req.body;
  //console.log(tracer);
  
  tracers[tracer.id] = tracer;

  console.log(`### ${JSON.stringify(tracer)}`);
  res.contentType('application.json');
  res.status(200).send({h:"shit"});

  console.log(`### Tracers online: ${Object.keys(tracers).length}`);
}

function startJob(req: Request, res: Response) {
  if(tracers.length <= 0) {
    res.status(400).send({title: "No tracers online"}); return;
  }

  job = req.body;
  job.id = uuidv4();
  job.status = "RUNNING"; 
  job.tasks = tracers.length; 
  job.complete = 0; 

  // Create tasks and send to tracers

  res.status(200).send(job);
}

function listJobs(req: Request, res: Response) {
  console.log(req);
}

function listTracers(req: Request, res: Response) {
  console.log(req);
}

function tracerHealthCheck() {
  console.log(`### Running tracer health check...`);
  
  for(let tracer in tracers) {
    console.log(tracers[tracer]);
  }
}