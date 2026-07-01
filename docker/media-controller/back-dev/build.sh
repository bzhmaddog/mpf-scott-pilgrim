#!/bin/sh

${IMAGE_BUILDER:-docker} build -f Containerfile -t mc-back-dev:${1:-latest} .
