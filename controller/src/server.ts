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
import { API } from './api';

dotenv.config();

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
const api = new API();
app.get ('/api/status',  api.getStatus);
app.get ('/api/jobs',    api.listJobs);
app.post('/api/jobs',    api.startJob);
app.get ('/api/tracers', api.listTracers);
app.post('/api/tracers', api.addTracer);
app.post('/api/tasks',   api.taskComplete);

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
  console.log(`### Health checks run every ${checkInterval} seconds`);
  setInterval(api.tracerHealthCheck, parseInt(checkInterval) * 1000);
});
