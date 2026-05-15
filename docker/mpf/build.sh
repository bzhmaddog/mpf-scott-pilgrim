#!/bin/sh

${IMAGE_BUILDER:-docker} build -f Containerfile -t mpf:${1:-latest} .
