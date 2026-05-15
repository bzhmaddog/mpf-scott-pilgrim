#!/bin/sh

${IMAGE_BUILDER:-docker} build -f Containerfile -t mc-back:${1:-latest} .
