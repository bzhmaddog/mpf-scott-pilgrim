#!/bin/sh

echo "Building mc-front:${1:-latest}..."
${IMAGE_BUILDER:-docker} build -f Containerfile -t mc-front:${1:-latest} .
