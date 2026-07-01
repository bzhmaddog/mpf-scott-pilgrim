#!/bin/sh

${IMAGE_BUILDER:-docker} build -f Containerfile -t mc-front-dev:${1:-latest} .
