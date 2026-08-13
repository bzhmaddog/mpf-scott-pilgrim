#!/bin/sh

echo "Building localhost/mc-back-dev:${1:-latest}..."
${IMAGE_BUILDER:-docker} build -f Containerfile -t localhost/mc-back-dev:${1:-latest} .
