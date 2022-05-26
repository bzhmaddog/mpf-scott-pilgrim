#!/bin/sh

export SSL_CRT_FILE=$HOME/.ssh/ssl/server.crt
export SSL_KEY_FILE=$HOME/.ssh/ssl/server.key

node mc/server.js
