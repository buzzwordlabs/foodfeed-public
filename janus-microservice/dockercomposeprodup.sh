#!/bin/bash
AWS_MY_IP=$(curl -m 3 -s http://169.254.169.254/latest/meta-data/public-ipv4) docker-compose up --build -d && rm -rf janusstreamsaver/.prodenv
