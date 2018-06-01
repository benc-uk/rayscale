#
# ** CONTROLLER ** Dockerfile
#

FROM node:8-alpine AS build

WORKDIR /build

# NPM install packages
COPY controller/package*.json ./controller/
WORKDIR /build/controller
RUN npm install --silent

# Now we need source, for both components
COPY controller/src/ /build/controller/src
COPY tracer/src/ /build/tracer/src
COPY controller/tsconfig.json /build/controller/tsconfig.json

# Compile TypeScript
WORKDIR /build/controller
RUN node node_modules/typescript/bin/tsc

##############################################################

FROM node:8-alpine

LABEL version="0.0.1" 
WORKDIR /app/controller
ENV PORT 9000
ENV HEALTH_CHECK_INTERVAL 5
ENV DIR_WEBUI /app/controller/webui
ENV DIR_JOBOUT /app/controller/jobs

# NPM install packages
COPY controller/package*.json ./
RUN npm install --production --silent

# NPM is done, now copy in the the whole project to the workdir
COPY --from=build /build/controller/dist/ ./dist
COPY controller/webui/ ./webui
RUN mkdir jobs

# Install bash inside container just for debugging 
RUN apk update && apk add bash

EXPOSE 9000
CMD npm start