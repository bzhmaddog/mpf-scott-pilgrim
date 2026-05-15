#!/bin/sh

${IMAGE_BUILDER:-docker} build -f Containerfile -t mc-front:${1:-latest} .
