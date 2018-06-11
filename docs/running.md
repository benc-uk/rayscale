# Running & Deploying 

Contents:
- [Running Locally without Docker](#running-locally-without-docker)
- [Running Locally with Docker](#running-locally-with-docker)
- [Running in Kubernetes](#running-in-kubernetes)
- [Running in Azure Container Instance](#running-in-azure-container-instance)
- [Quick Start To Using RayScale](#quick-start-guide)

## Running Locally without Docker
You can run both the *Controller* and *Tracer* locally using Node.js. To speed up rendering you can run more than one tracer however running more tracers than you have CPU cores on your machine will probably slow the process down.

### Pre-reqs
- Node.js (v8+, 8.9 and 8.11 have been tested)

### Steps
- Clone this repo into somewhere `git clone https://github.com/benc-uk/rayscale.git`
- Create two terminal windows (bash, PowerShell) both in the cloned project directory
- In first window build and start the controller:
  - `cd rayscale/controller`
  - `npm install`
  - `npm run build` (this will transpile source TypeScript into JavaScript in the `dist` subfolder)
  - `npm start`
  - Controller will start listening on port 9000
- In second window build and start a single tracer:
  - `cd rayscale/tracer`
  - `npm install`
  - `npm run build` (this will transpile source TypeScript into JavaScript in the `dist` subfolder)
  - `npm start`
  - Tracer will start on port 8500 and connect to the controller on port 9000
- To run multiple tracers, a shell script is provided; `run.sh` in the tracer directory. This starts each tracer on a different port (8550, 8551, 8552, etc) Simply run it under bash/WSL and pass the number of tracers you want to start, e.g. `./run.sh 3`
- Access the Web UI at `http://localhost:9000/`
- Jump to the [quick start guide](#quick-start-guide)

---

## Running Locally with Docker

### Pre-reqs
- Docker CE installed with Docker tools (`docker` & `docker-compose`), and running in Linux containers mode

### Steps
- Clone this repo into somewhere `git clone https://github.com/benc-uk/rayscale.git`
- Create a terminal window (bash, PowerShell) in the cloned project directory
- `cd etc/compose`
- `docker-compose build`
- `docker-compose up -d`
- If you want to add more tracers simply scale them up with: `docker-compose up -d --scale tracer=4`
- Access the Web UI at `http://localhost:9000/`
- Jump to the [quick start guide](#quick-start-guide)

---

## Running in Kubernetes

### Pre-reqs
- A Kubernetes cluster up and running (e.g. AKS)
- Command line tool `kubectl` on your machine connected to your cluster

### Steps
- Clone this repo into somewhere `git clone https://github.com/benc-uk/rayscale.git`
- Create a terminal window (bash, PowerShell) in the cloned project directory
- To use prebuilt images (`bencuk/rayscale-controller:stable` and `bencuk/rayscale-tracer:stable`)
- `cd etc/kubernetes`
- `kubectl apply -f rayscale.yaml`
- `k get svc controller-ui -w` and wait until external IP is assigned
- If you want to add more tracers simply scale them up with: `kubectl scale deployment tracer --replicas=8`
- Access the Web UI at `http://<external-ip>/`
- Jump to the [quick start guide](#quick-start-guide)

### Optional Image Build Steps
- If you want to build the images and push to your own repo or registry follow these steps. Change `<your-registry>` as required. Note. this will require Docker CE installed
- `cd etc/compose`
- `docker-compose build`
- `docker tag rayscale-tracer <your-registry>/rayscale/tracer`
- `docker tag rayscale-controller <your-registry>/rayscale/controller`
- `docker push <your-registry>/rayscale/tracer`
- `docker push <your-registry>/rayscale/controller`
- Edit `etc/kubernetes/rayscale.yaml` and change the image references to point to your registry

---

## Running in Azure Container Instance
Deploy to Azure Container Instances using the supplied ARM template
### [📘 ACI ARM Quick Start Template](../etc/aci-template/)

---

## Quick Start Guide
- Access the web UI, by opening the IP/domain name of the controller and port in your browser, `http://{controller-ip}:9000/`
- Open any of the provided [example jobs & scenes](../examples/jobs) 
- Copy and paste the whole YAML of the file into the "Job Editor" view of the web UI
- Tip: If you are running locally or with a single tracer, start with a low image resolution, modify the `width` & `height` to something such as 800 x 600
- Click 'Start Job'
- When job completes, view results and rendered image on the "Job Results" page 