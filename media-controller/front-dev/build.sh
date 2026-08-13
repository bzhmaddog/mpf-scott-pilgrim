#!/bin/sh

echo "Building localhost/mc-front-dev:${1:-latest}..."
${IMAGE_BUILDER:-docker} build -f Containerfile -t localhost/mc-front-dev:${1:-latest} .
