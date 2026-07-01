#!/bin/sh

echo "Building mc-back:${1:-latest}..."
${IMAGE_BUILDER:-docker} build -f Containerfile -t mc-back:${1:-latest} .
