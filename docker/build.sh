#!/bin/sh

#DEFAULT_IMAGE_BUILDER_BINARY=podman
#DEFAULT_TARGETS=mpf:0.80,mc-back:1.0.0,mc-front-dev:latest,mc-front:1.0.0,proxy:latest
#VALID_IMAGES=mpf mc-back mc-front-dev mc-front proxy

# Default valid targets and images
VALID_TARGETS=("mpf:0.80" "mc-back:1.0.0" "mc-front-dev:latest" "mc-front:1.0.0" "proxy:latest")
VALID_IMAGES=("mpf" "mc-back" "mc-front-dev" "mc-front" "proxy")

BINARY="podman"  # Default binary

# Parse the arguments
for arg in "$@"; do
  if [[ "$arg" == "--docker" ]]; then
    DOCKER_FLAG=true
  elif [[ " ${VALID_TARGETS[@]} " =~ " $arg " ]]; then
    echo "Target '$arg' found in the list of valid targets."
  elif [[ " ${VALID_IMAGES[@]} " =~ " $arg " ]]; then
    echo "Image '$arg' found in the list of valid images."
  else
    echo "Argument '$arg' is not a valid target or image."
  fi
done

# Output the selected binary
echo "Using binary: $BINARY"
