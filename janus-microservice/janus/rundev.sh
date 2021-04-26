#!/bin/sh
MY_IP=$(dig +short myip.opendns.com @resolver1.opendns.com)
sed -i "/nat_1_1_mapping =/c\\\tnat_1_1_mapping = \"$MY_IP\"" /usr/local/etc/janus/janus.jcfg
janus