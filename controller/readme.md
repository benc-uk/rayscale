# RayScale Controller

## Configuration
All configuration is done via environmental variables. When running locally dotenv (`.env`) files are the simplest way to modify the configuration, a sample `.env.sample` file is provided which can be renamed. When running as a container you must provide the environmental variables using what ever interface the container runtime provides (command line, YAML, ARM template etc)

| Name                      | Default        | Notes                                                                                                                                                                                                                     |
| ------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PORT**                  | 9000           | The port the server listens on                                                                                                                                                                                            |
| **HEALTH_CHECK_INTERVAL** | 90             | How often in seconds, to 'ping' tracers to check they are healthy and online. Setting lower than 60 sec with remote tracers you might trip over TCP timeouts (often 60 secs). Setting lower than 5 seconds is a bad idea. |
| **HEALTH_CHECK_TIMEOUT**  | 20000          | HTTP timeout, in millisecs for health check pings. Very low values will cause job failures if tracers have many textures and objects to load, or remote hosting of those assets is slow                                   |
| **DIR_JOBOUT**            | ./dist/../jobs | Where to store jobs, folder will be created if it doesn't exist. The default will be folder above the dist folder with compiled JS                                                                                        |


## Controller API

| Route               | Method | Calls          | Notes                                                                                                        |
| ------------------- | ------ | -------------- | ------------------------------------------------------------------------------------------------------------ |
| /api/status         | GET    | getStatus()    | Provide current status of the controller, active job, tracers online etc                                     |
| /api/jobs           | GET    | listJob()      | Lists completed and active jobs, by examining the jobs output folder                                         |
| /api/jobs           | POST   | startJob()     | Start a new job, POST body must contain a YAML job definition, and have content-type of `application/x-yaml` |
| /api/jobs/{job}     | DELETE | deleteJob()    | Delete a job output directory from the jobs directory                                                        |
| /api/tracers        | POST   | addTracer()    | When a tracer is started, it registers with the controller using this                                        |
| /api/tracers        | GET    | listTracers()  | List which tracers are online                                                                                |
| /api/tasks/{taskId} | POST   | taskComplete() | Called by tracer on completion of its task, normally binary image data                                       |
| /api/logs/{offset}  | GET    | getLogs()      | Fetches the controller logs (stdout)                                                                         |


## Data Structures

### Job Input
```typescript
name:   string;     // Job name, no spaces
width:  number;     // Output image width
height: number;     // Output image height
scene:  Scene;      // Scene to be rendered  
```