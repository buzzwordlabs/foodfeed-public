#!/bin/sh
sed -i '/INSTANCE_URL/d' .env
AWS_MY_IP=$(curl -m 3 -s http://169.254.169.254/latest/meta-data/local-ipv4)
INSTANCE_URL="http://"$AWS_MY_IP":8001"
echo "INSTANCE_URL=\"$INSTANCE_URL\"" >> .env