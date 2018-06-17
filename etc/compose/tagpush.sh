#!/bin/bash

#
# Tag and push images
# Supply two paramters, first is registry/repo to push to, second is tag
#

docker tag rayscale-tracer:latest $1/rayscale-tracer:$2
docker tag rayscale-controller:latest $1/rayscale-controller:$2
docker push $1/rayscale-tracer:$2
docker push $1/rayscale-controller:$2
