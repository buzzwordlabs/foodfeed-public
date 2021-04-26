#!/bin/sh
AWS_MY_IP=$(curl -m 3 -s http://169.254.169.254/latest/meta-data/public-ipv4)
sed -i "/nat_1_1_mapping =/c\\\tnat_1_1_mapping = \"$AWS_MY_IP\"" /usr/local/etc/janus/janus.jcfg
janus