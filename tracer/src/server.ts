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
import { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import uuidv4 from 'uuid/v4';
import request from 'request-promise-native';
import os from 'os';

dotenv.config();

// Globals
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
app.get ('/api/tasks',   listTasks);
app.post('/api/tasks',   newTask);


// Global catch all for all requests not caught by other routes
// Just return a HTTP 400
app.use('*', function (req, res, next) {
  res.sendStatus(400);
})

// Start server
async function startServer() {
  let ctrlEndpoint = process.env.CONTROLLER_ENDPOINT;
  if(!ctrlEndpoint) {
    console.error(`### Error! No CONTROLLER_ENDPOINT supplied, exiting!`);
    process.exit(1);
  }

  let port = process.env.PORT || 8500;
  const server = app.listen(port, async () => {
    console.log(`### Tracer server listening on ${port}`);
  
    // Register with controller

    // Work out local address / IP
    let addr = process.env.LOCAL_ADDRESS || null;
    if(!addr) {
      for(let iface in os.networkInterfaces()) {
        if(iface.startsWith('eth')) {
          addr = os.networkInterfaces()[iface][0].address;
        }
      }
    }
    if(addr) {
      console.log(`### Detected local network address: ${addr}`);     
    } else {
      console.error(`### ERROR! Unable to get local net address, exiting!`);  
      process.exit(2);   
    }

    let regRequest = {
      endPoint: `http://${addr}:${port}/api`,
      id: uuidv4()
    }
    
    let resp = await request.post({
      url: `${ctrlEndpoint}/tracers`,
      body: JSON.stringify(regRequest), 
      headers: {'content-type' : 'application/json'}
    })
    .catch(err => {
      console.error(`### ERROR! Unable to register with controller API`);
      console.log(`### ERROR! ${err.message}, exiting!`);
      process.exit(3);   
    })
  });
}

// Begin!
startServer();

// =======================================================================================================

function getStatus(req: Request, res: Response) {
  res.status(200).send({msg:"Hello!"})
}

function newTask(req: Request, res: Response) {
  res.status(200).send({});
}

function listTasks(req: Request, res: Response) {
  console.log(req);
}
