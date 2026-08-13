#!/bin/sh

echo "Building localhost/mpf:${1:-latest}..."
${IMAGE_BUILDER:-docker} build -f Containerfile -t localhost/mpf:${1:-latest} .
