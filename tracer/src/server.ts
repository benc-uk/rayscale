//
// Tracer server
// ---------------------------------------------
// Ben C, May 2018
//

// Load in modules, and create Express app
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 }from 'uuid';
import axios from 'axios';
import os from 'os';
import { Utils } from './lib/utils';
import { API } from './api';
import fs from 'fs';

// Just to grab the version num
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

dotenv.config();

// Globals
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Set up logging
// if (app.get('env') === 'production') {
//     app.use(logger('combined'));
//   } else {
//     app.use(logger('dev'));
// }
console.log(`### Node environment mode is '${app.get('env')}'`);

// Initial checks
const ctrlEndpoint = process.env.CONTROLLER_ENDPOINT || 'http://localhost:9000/api';
if(!ctrlEndpoint) {
  console.error('### Error! No CONTROLLER_ENDPOINT supplied, exiting!');
  process.exit(1);
}

// Routing here
const api = new API(ctrlEndpoint);
app.get('/api/ping',   api.healthPing);
app.get('/api/status', api.getStatus);
app.get('/api/tasks',  api.listTasks);
app.post('/api/tasks', api.newTask);
// Global catch all for all requests not caught by other routes
app.use('*', function (req, res, next) {
  res.sendStatus(400);
});

// Start server
const port = process.env.PORT || 8500;
app.listen(port, async () => {
  console.log(`### Tracer version ${packageJson.version} starting`);
  console.log(`### Tracer server listening on ${port}`);

  // Get hostname / IP address or used fixed name
  let hostname = process.env.OVERRIDE_HOSTNAME || null;
  if(!hostname){
    if(process.env.USE_IPADDRESS == 'true') {
      hostname = Utils.getNetInterfaceIP();
    } else {
      hostname = os.hostname();
    }

    if(hostname) {
      console.log(`### Detected hostname: ${hostname}`);
    } else {
      console.error('### ERROR! Unable to get hostname, exiting!');
      process.exit(2);
    }
  } else {
    console.log(`### Using hostname override: ${hostname}`);
  }

  // Register with controller
  api.tracerEndPoint = `http://${hostname}:${port}/api`;
  const regRequest = {
    endPoint: `http://${hostname}:${port}/api`,
    id: uuidv4()
  };

  await axios.post(
    `${ctrlEndpoint}/tracers`,
    JSON.stringify(regRequest),
    { headers: {'content-type': 'application/json'} }
  )
    .catch(err => {
      console.error('### ERROR! Unable to register with controller API');
      console.log(`### ERROR! ${err.message}, exiting!`);
      process.exit(3);
    });

});
