#
# ** TRACER ** Dockerfile
#

FROM node:12-alpine AS build

WORKDIR /build

# NPM install packages
COPY tracer/package*.json ./tracer/
WORKDIR /build/tracer
RUN npm install --silent

# Now we need source, for both components
COPY controller/src/ /build/controller/src
COPY tracer/src/ /build/tracer/src
COPY tracer/tsconfig.json /build/tracer/tsconfig.json

# Compile TypeScript
WORKDIR /build/tracer
RUN node node_modules/typescript/bin/tsc

##############################################################

FROM node:12-alpine
LABEL org.label-schema.name="RayScale: Tracer" \
      org.label-schema.description="Tracer microservice for RayScale app" \    
      org.label-schema.version="2.0.1" \
      org.label-schema.vcs-url=https://github.com/benc-uk/rayscale

WORKDIR /app/tracer
ENV PORT 8500
#ENV CONTROLLER_ENDPOINT http://changeme:9000/api

# NPM install packages
COPY tracer/package*.json ./
RUN npm install --production --silent

# NPM is done, now copy in the the whole project to the workdir
COPY --from=build /build/tracer/dist/ ./dist

# Install bash inside container just for debugging 
RUN apk update && apk add bash

EXPOSE 8500
CMD npm start