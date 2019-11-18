FROM node:10.16.0-stretch as builder

WORKDIR /swarm
ADD . /swarm

RUN npm install
