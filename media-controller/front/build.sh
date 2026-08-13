#!/bin/sh

echo "Building localhost/mc-front:${1:-latest}..."
${IMAGE_BUILDER:-docker} build -f Containerfile -t localhost/mc-front:${1:-latest} .
