#!/bin/sh

echo "Building mpf:${1:-latest}..."
${IMAGE_BUILDER:-docker} build -f Containerfile -t mpf:${1:-latest} .
