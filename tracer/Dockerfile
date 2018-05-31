FROM node:8-alpine AS build

ARG basedir="tracer"
WORKDIR /build

# NPM install packages
COPY ${basedir}/package*.json ./
RUN npm install --silent

COPY ${basedir}/tsconfig.json ./
COPY ${basedir}/src/ ./

# Compile TypeScript
RUN node_modules/typescript/bin/tsc

##############################################################

# FROM node:8-alpine

# LABEL version="0.0.1" 
# ARG basedir="tracer"
# WORKDIR /home/app

# # NPM install packages
# COPY ${basedir}/package*.json ./
# RUN npm install --production --silent

# # NPM is done, now copy in the the whole project to the workdir
# COPY --from=build ${basedir}/ .

# # Install bash inside container just for debugging 
# RUN apk update && apk add bash

# EXPOSE 4000
# CMD npm start