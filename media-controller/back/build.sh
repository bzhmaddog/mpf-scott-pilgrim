#!/bin/sh

echo "Building localhost/mc-back:${1:-latest}..."
${IMAGE_BUILDER:-docker} build -f Containerfile -t localhost/mc-back:${1:-latest} .
