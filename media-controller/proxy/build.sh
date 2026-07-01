#!/bin/sh

echo "Building mc-proxy:${1:-latest}..."
${IMAGE_BUILDER:-docker} build -f Containerfile -t mc-proxy:${1:-latest} .
