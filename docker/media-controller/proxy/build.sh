#!/bin/sh

${IMAGE_BUILDER:-docker} build -f Containerfile -t mc-proxy:${1:-latest} .
