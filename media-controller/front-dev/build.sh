#!/bin/sh

echo "Building mc-front-dev:${1:-latest}..."
${IMAGE_BUILDER:-docker} build -f Containerfile -t mc-front-dev:${1:-latest} .
