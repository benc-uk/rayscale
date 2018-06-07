//
// Tracer server
// ---------------------------------------------
// Ben C, May 2018
//

// Load in modules, and create Express app 
import express from 'express';
import bodyParser from 'body-parser';
import logger from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import uuidv4 from 'uuid/v4';
import request from 'request-promise-native';
import os from 'os';
import { Utils } from './lib/utils'
import { API } from './api';

dotenv.config();

// Globals
var scene: any = {};

const app = express();
app.use(cors());
app.use(bodyParser.json())

// Set up logging
// if (app.get('env') === 'production') {
//     app.use(logger('combined'));
//   } else {
//     app.use(logger('dev'));
// }
console.log(`### Node environment mode is '${app.get('env')}'`);

// Initial checks
let ctrlEndpoint = process.env.CONTROLLER_ENDPOINT;
if(!ctrlEndpoint) {
  console.error(`### Error! No CONTROLLER_ENDPOINT supplied, exiting!`);
  process.exit(1);
}

// Routing here
let api = new API(ctrlEndpoint)
app.get ('/api/ping',    api.healthPing);
app.get ('/api/status',  api.getStatus);
app.get ('/api/tasks',   api.listTasks);
app.post('/api/tasks',   api.newTask);
// Global catch all for all requests not caught by other routes
app.use('*', function (req, res, next) {
  res.sendStatus(400);
})

// Start server
let port = process.env.PORT || 8500;
const server = app.listen(port, async () => {
  console.log(`### Tracer server listening on ${port}`);

  // Get hostname / IP address info
  let hostname = null;
  if(process.env.USE_IPADDRESS == 'true') {
    hostname = Utils.getNetInterfaceIP();
  } else {
    hostname = os.hostname()
  }
  if(hostname) {
    console.log(`### Detected hostname: ${hostname}`);     
  } else {
    console.error(`### ERROR! Unable to get hostname, exiting!`);  
    process.exit(2);   
  }

  // Register with controller
  api.tracerEndPoint = `http://${hostname}:${port}/api`;
  let regRequest = {
    endPoint: `http://${hostname}:${port}/api`,
    id: uuidv4()
  }
  
  let resp = await request.post({
    url: `${ctrlEndpoint}/tracers`,
    body: JSON.stringify(regRequest), 
    headers: {'content-type': 'application/json'}
  })
  .catch(err => {
    console.error(`### ERROR! Unable to register with controller API`);
    console.log(`### ERROR! ${err.message}, exiting!`);
    process.exit(3);   
  })

});
