#!/bin/sh

echo "Building localhost/mc-proxy:${1:-latest}..."
${IMAGE_BUILDER:-docker} build -f Containerfile -t localhost/mc-proxy:${1:-latest} .
