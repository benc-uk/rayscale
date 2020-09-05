# RayScale Tracer

## Configuration
All configuration is done via environmental variables. When running locally dotenv (`.env`) files are the simplest way to modify the configuration, a sample `.env.sample` file is provided which can be renamed. When running as a container you must provide the environmental variables using what ever interface the container runtime provides (command line, YAML, ARM template etc)

| Name                    | Default                   | Notes                                                                                                                               |
| ----------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **CONTROLLER_ENDPOINT** | http://localhost:9000/api | URL of controller API endpoint, e.g. `http://blahblah:9000/api` unless running locally you will need to set and override this value |
| **PORT**                | 8500                      | The port the server listens on                                                                                                      |
| **CLEAR_CACHE**         | true                      | Skip clearing texture & object cache. Can speed up re-renders of same scene, but could case memory bloat                            |
| **USE_IPADDRESS**       | false                     | Register with controller using detected IP not hostname                                                                             |
| **HOSTNAME**            | *none*                    | Override automatic hostname detection, rarely used if ever                                                                          |


## Tracer API

| Route       | Method | Calls        | Notes                                                |
| ----------- | ------ | ------------ | ---------------------------------------------------- |
| /api/ping   | GET    | healthPing() | Used by controller to check which tracers are online |
| /api/status | GET    | getStatus()  | *stub*                                               |
| /api/tasks  | GET    | listTasks()  | *stub*                                               |
| /api/tasks  | POST   | newTask()    | Start a new task on this tracer                      |

## Data Structures

!TODO!

Test