# RayScale
RayScale is a network distributed ray tracer written in Node.js designed for scaling using containers. The objective of RayScale is to demonstrate several points:
 - Parallel batch processing to break a slow & complex operation into smaller chunks, to gain performance benefits
 - How containers can be scaled extremely easily 
 - Scaling containers over a cluster such as Kubernetes
 - Use of Azure services such as Azure Container Instances to serverlessly provide massive scale
 - RESTful APIs
 - Use of TypeScript with Node.js and Express

### What Is Ray Tracing
In computer graphics, ray tracing is a rendering technique for generating an image by tracing the path of light as pixels in an image plane and simulating the effects of its encounters with virtual objects. The technique is capable of producing a very high degree of visual realism, usually higher than that of typical polygon based scanline rendering methods, but at a greater computational cost.

# Core Components (Microservices)
## Controller
## Tracers

# Basic System Architecture
https://user-images.githubusercontent.com/14982936/40764441-fbed1ee0-64a0-11e8-86e8-b861c13f11b4.png

# APIs
## Controller API

|Route|Method|Calls|Notes|
|---|---|---|---|
|/api/status|GET|getStatus()|*stub*|
|/api/job/{jobId}|GET|getJob()|*stub*|
|/api/job|POST|startJob()|Start a new job|
|/api/tracers|GET|listTracers()|*stub*|
|/api/tracers|POST|addTracer()|When a tracer is started, registers with controller via this call|
|/api/tasks/{taskId}|POST|taskComplete()|Completion of a task, normally binary image data|


# Models