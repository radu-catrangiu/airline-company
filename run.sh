#!/bin/bash

docker build -t bd2-app ./app

docker stack deploy -c stack.yaml bd2