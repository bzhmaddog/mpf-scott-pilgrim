#!/bin/sh

export SSL_CRT_FILE=$HOME/mpf-scott-pilgrim/mc/mc/certs/server.crt
export SSL_KEY_FILE=$HOME/mpf-scott-pilgrim/mc/mc/certs/server.key

node mc/server.js
