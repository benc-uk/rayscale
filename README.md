# RayScale
RayScale is a network distributed 3D graphics renderer based on ray tracing. Written in Node.js, RayScale is designed for scaling out using containers. The objective of RayScale as a project is to demonstrate several points:

 - Parallel batch processing to break a slow & complex operation into smaller chunks, to gain performance benefits
 - How containers can be scaled extremely easily 
 - Microservices architecture
 - Scaling containers over a cluster such as Kubernetes
 - Use of Azure services such as Azure Container Instances to serverlessly provide massive scale
 - RESTful APIs
 - Use of TypeScript with Node.js and Express

## What Is Ray Tracing
In computer graphics, ray tracing is a rendering technique for generating an image by tracing the path of light as pixels in an image plane and simulating the effects of its encounters with virtual objects. The technique is capable of producing a very high degree of visual realism, usually higher than that of typical polygon based scanline rendering methods, but at a greater computational cost.

## Ray Tracing Features
It is not the goal of this project to create a completely fully featured ray tracer, as the scope of that is almost limitless. 
RayScale currently provides:
- Primitive objects: Spheres, planes, cubeboids & cylinders
- Texture mapping; images (PNG) and checkerboard
- [Blinn-Phong illumination model](https://en.wikipedia.org/wiki/Phong_reflection_model) with per object surface properties
- Multiple light sources
- Positionable camera, FOV and image output at any resolution
- Job & scene definition language (YAML) 

## Sample Images
These are some sample images rendered with RayScale

<a href="https://raw.githubusercontent.com/benc-uk/rayscale/master/examples/renders/table.png"><img src="examples/renders/table.png"></a><a href="https://raw.githubusercontent.com/benc-uk/rayscale/master/examples/renders/hires.png"><img src="examples/renders/hires.png"></a>
<a href="https://raw.githubusercontent.com/benc-uk/rayscale/master/examples/renders/best.png"><img src="examples/renders/best.png"></a>




# Core Components (Microservices)
RayScale is comprised of two separate microservices, the *Controller* and the *Tracers*. Both are written in Node.js using TypeScript, and all interaction to/from these services is via REST API (using Express).

RayScale is intended to be run with a single *Controller* and one or more *Tracers* (either on the same machine as the controller (each on different TCP ports) or elsewhere on the network). Tracers can be started & stopped at any point, more added etc. and the *Controller* keeps track of tracers via health checks much like a network load balancer.

## Basic System Architecture
![diagram](https://user-images.githubusercontent.com/14982936/40764441-fbed1ee0-64a0-11e8-86e8-b861c13f11b4.png)

## Controller
Acts as control point and main interface with RayScale. It provides the API and Web UI for submitting jobs. It also coordinates the *Tracers*, keeps tracks on which tracers are online etc. The *Controller* splits up jobs into tasks and sends them to *Tracers*, and also reassembles & saves the results as they are sent back
### [📘 Controller documentation](controller/readme.md)

## Tracer 
Renders and ray traces tasks given to it via the *Controller*. Each *Tracer* registers itself with the *Controller* on startup. The *Tracer* carries out scene parsing and also the work of actually computing the ray tracing algorithm of the task it has been given. Once completed, the results are POSTed back to the controller as a binary buffer of image data
### [📘 Tracer documentation](tracer/readme.md)



# Web UI
The *Controller* provides a simple web UI, available at `http://<controler-addres>:<port>/ui`. The UI allows for:
- Job YAML editing and submission
- Viewing job results, rendered images and other outputs
- Viewing list of tracers online

<a href="https://user-images.githubusercontent.com/14982936/41202056-91deb0b8-6cbb-11e8-9cfd-0c46bcb55732.png"><img src="https://user-images.githubusercontent.com/14982936/41202056-91deb0b8-6cbb-11e8-9cfd-0c46bcb55732.png" width="300"></a> <a href="https://user-images.githubusercontent.com/14982936/41202057-91f49540-6cbb-11e8-8a89-6ee26b5772a6.png"><img src="https://user-images.githubusercontent.com/14982936/41202057-91f49540-6cbb-11e8-8a89-6ee26b5772a6.png" width="300"></a> 



# Objects & Terms 
As well as *Controller* & *Tracer* RayScale has several named objects and concepts which it's worth understanding:
- **JobInput** - A YAML document passed to the Controller to start a *Job*, at a high level it contains three things; job name, image dimensions and a scene definition. Full details are in the [job & scene reference guide](docs/reference.md)
- **Job** - Internal representation of a *Job*, managed by the controller, holding its status, an array of tasks, start time etc. When a job is completed most of this information is placed in `result.json`
- **Scene** - A description of what is to be rendered, consists of sets of parameters defining the camera position, lights and most importantly all the objects that make up the scene. The objects are described by type, position, size and their appearance. Full details are in the [job & scene reference guide](docs/reference.md)
- **Tasks** - The controller divides a *Job* into *Tasks*, one *Task* per *Tracer* online at the time of job submission. The *Controller* sends each *Task* out to all the *Tracers*. The *Task* contains the above *Scene* definition, the overall image size, and also the size of the sub-slice the task is to generate. The *Tracer* will only render the portion of the overall image given to it in the *Task*


# Running RayScale
As RayScale uses Node.js and is also containerised there are numerous ways you can run RayScale, here are a few that have been tried tested:
- Locally - without Docker
- Locally - with Docker
- In Kubernetes
- In [Azure Container Instances](https://azure.microsoft.com/en-gb/services/container-instances/)

### [📘 Full Docs - Running & Deploying RayScale](docs/running.md)



# Scene Definition Language
The way *Scenes* are defined is in YAML, there's 
### [📘 Full Docs - Job & Scene Definition Reference](docs/reference.md)



# Limitations and Design Constraints
These constraints are either by design or known issues
 - The system only allows for a single *Job* to be running at any time
 - Each *Tracer* is assigned a single task from the *Job*
 - Failure of any one *Task*, will result in a failed/incomplete job. *Job* and *Task* recovery is considered out of scope, and unlikely to be resolvable.
 - *Tracers* do not check to see if the *Controller* is active, it is assumed the controller is online at all times. Should the *Controller* be restarted for any reason, all *Tracers* will also need to be terminated and restarted. 

