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

// Config from dotenv ('.env') files
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.raw({ limit: '100mb', type: 'application/octet-stream' }));
app.use(bodyParser.raw({ limit: '10mb', type: 'application/x-yaml' }));

const webUIDir = `${__dirname}/../webui`;
const jobOutDir = process.env.JOB_OUTPUT || `${__dirname}/../jobs`;
const checkInterval: number = parseInt(process.env.HEALTH_CHECK_INTERVAL || '80') * 1000;

// Create job dir if missing
if (!fs.existsSync(jobOutDir)){
  fs.mkdirSync(jobOutDir);
}

// API and app routing here
const api = new API(jobOutDir, checkInterval);
app.get('/api/status',      api.getStatus);
app.get('/api/jobs',        api.listJobs);
app.post('/api/jobs',        api.startJob);
app.post('/api/jobs/cancel', api.cancelJob);
app.post('/api/tracers',     api.addTracer);
app.get('/api/tracers',     api.listTracers);
app.post('/api/tasks/:id',   api.taskComplete);
app.get('/', function(req, res) {
  res.redirect('/ui');
});

app.use('/ui', express.static(webUIDir, { etag: false, maxAge: 0 }));
app.use('/jobs', express.static(jobOutDir));

// Start server
const port = process.env.PORT || 9000;

app.listen(port, function () {
  console.log(`### Node environment mode is '${app.get('env')}'`);
  console.log(`### Controller version ${require('../package.json').version} starting`);
  console.log(`### Controller server listening on ${port}`);
  console.log(`### Web UI serving static content from: ${webUIDir}`);

  console.log(`### Tracer health checks run every ${checkInterval/1000} seconds`);
  // Setup polling of tracers with good old setInterval
  setInterval(api.tracerHealthCheck, checkInterval);
});
