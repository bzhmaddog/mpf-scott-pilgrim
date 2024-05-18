#!/bin/sh

address=$1
port=$2
finished=
spin='-\|/'
i=0

# Wait for the docker container to respond
while ! timeout 0.1 ping -c 1 -n $address &> /dev/null
do
  i=$(( (i+1) %4 ))
  printf "\r${spin:$i:1}"
  sleep .1
done

# Wait for the front http server to respond
while [ -z "$finished" ]
do
  finished=$(wget -qO- http://$address:$port)

  i=$(( (i+1) %4 ))
  printf "\r${spin:$i:1}"
  sleep .1
done

# Launch chrome
startx
