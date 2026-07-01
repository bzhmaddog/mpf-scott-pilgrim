#!/bin/sh

echo "Building mc-back-dev:${1:-latest}..."
${IMAGE_BUILDER:-docker} build -f Containerfile -t mc-back-dev:${1:-latest} .
