# RayScale
RayScale is a network distributed ray tracer written in Node.js designed for scaling out using containers. The objective of RayScale is to demonstrate several points:
 - Parallel batch processing to break a slow & complex operation into smaller chunks, to gain performance benefits
 - How containers can be scaled extremely easily 
 - Scaling containers over a cluster such as Kubernetes
 - Use of Azure services such as Azure Container Instances to serverlessly provide massive scale
 - RESTful APIs
 - Use of TypeScript with Node.js and Express

### What Is Ray Tracing
In computer graphics, ray tracing is a rendering technique for generating an image by tracing the path of light as pixels in an image plane and simulating the effects of its encounters with virtual objects. The technique is capable of producing a very high degree of visual realism, usually higher than that of typical polygon based scanline rendering methods, but at a greater computational cost.

### Sample Images
![render 1](https://user-images.githubusercontent.com/14982936/40837744-627bab34-6593-11e8-981f-4df7685ba76c.png)
![render 2](https://user-images.githubusercontent.com/14982936/40837745-628f91b2-6593-11e8-9917-f05a2ac277bd.png)



# Core Components (Microservices)
## Controller
Carries out job coordination & orchestration of tasks to tracers  
(Todo - more info)

## Tracers
Renders and ray traces images given to it via the **Controller**  
(Todo - more info)



# Basic System Architecture
![diagram](https://user-images.githubusercontent.com/14982936/40764441-fbed1ee0-64a0-11e8-86e8-b861c13f11b4.png)



# APIs
## Controller API

|Route|Method|Calls|Notes|
|---|---|---|---|
|/api/status|GET|getStatus()|*stub*|
|/api/job/{jobId}|GET|getJob()|*stub*|
|/api/job|POST|startJob()|Start a new job|
|/api/tracers|GET|listTracers()|*stub*|
|/api/tracers|POST|addTracer()|When a tracer is started, it registers with the controller using this|
|/api/tasks/{taskId}|POST|taskComplete()|Completion of a task, normally binary image data|

## Tracer API

|Route|Method|Calls|Notes|
|---|---|---|---|
|/api/ping|GET|healthPing()|Used by controller to check which tracers are online|
|/api/status|GET|getStatus()|*stub*|
|/api/tasks|GET|listTasks()|*stub*|
|/api/tasks|POST|newTask()|Start a new task on this tracer|


# Models

## Job Input
```typescript
name:   string;     // Job name, no spaces
width:  number;     // Output image width
height: number;     // Output image height
scene:  Scene;      // Scene to be rendered  
```

## Job
## Scene
## Tracer
## Task