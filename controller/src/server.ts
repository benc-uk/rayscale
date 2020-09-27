//
// Master server, REST API and control point
// ---------------------------------------------
// Ben C, May 2018
//

// Load in modules, and create Express app
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import { API } from './api';
import { Scheduler } from './scheduler';

// Just to grab the version num
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Config from dotenv ('.env') files
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.raw({ limit: '100mb', type: 'application/octet-stream' }));
app.use(bodyParser.raw({ limit: '10mb', type: 'application/x-yaml' }));

// Without this, express-static will return 304 sometimes
app.set('etag', false);
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

const webUIDir = `${__dirname}/../webui`;
const jobOutDir = process.env.JOB_OUTPUT || `${__dirname}/../jobs`;
const checkInterval: number = parseInt(process.env.HEALTH_CHECK_INTERVAL || '80') * 1000;

// Create job dir if missing
if (!fs.existsSync(jobOutDir)){
  fs.mkdirSync(jobOutDir);
}

// Main controller, all logic is really in here
// Note. This is nothing to do with the 'controller' in MVC
const controller = new Scheduler(jobOutDir);

// API and app routing here
const api = new API(controller);
app.get('/api/status',        api.getStatus);
app.get('/api/jobs',          api.listJobs);
app.post('/api/jobs',         api.startJob);
app.delete('/api/jobs/:job',  api.deleteJob);
app.post('/api/jobs/cancel',  api.cancelJob);
app.post('/api/tracers',      api.addTracer);
app.get('/api/tracers',       api.listTracers);
app.get('/api/logs/:offset?', api.getLogs);
app.post('/api/tasks/:frame/:id',    api.taskComplete);
app.get('/', function(req, res) {
  res.redirect('/ui');
});

app.use('/ui', express.static(webUIDir, { etag: false, maxAge: 0 }));
app.use('/jobs', express.static(jobOutDir));



// Silly stuff to intercept calls to console.log so we can capture them
export const allLogs: string[] = [];
const cl = console.log;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
console.log = function(...args: any) {
  let line = '';
  for(const arg of args) {
    if(typeof arg === 'object')
      line += JSON.stringify(arg, null, 2);
    else
      line += arg.toString();
  }
  allLogs.push(`${line}\n`);
  cl.apply(console, args);
};

// Start server
const port = process.env.PORT || 9000;

app.listen(port, function () {
  console.log(`### Node environment mode is '${app.get('env')}'`);
  console.log(`### Controller version ${packageJson.version} starting`);
  console.log(`### Controller server listening on ${port}`);
  console.log(`### Web UI serving static content from: ${webUIDir}`);

  console.log(`### Tracer health checks run every ${checkInterval/1000} seconds [${checkInterval}ms]`);

  // Setup polling of tracers with good old setInterval
  setInterval(controller.tracerHealthCheck, checkInterval);
});
