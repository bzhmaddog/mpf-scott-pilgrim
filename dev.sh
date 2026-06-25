#!/bin/sh

if [ $# -gt 0 ] && [ "${1#-}" = "$1" ]; then
  COMMAND="$1"; shift
else
  COMMAND="up"
fi

BUILDER="${IMAGE_BUILDER:-docker}"

cd "$(dirname "$0")/docker"

# Check and execute with the appropriate compose command
if [ "$BUILDER" = "podman" ]; then
  if command -v podman-compose >/dev/null 2>&1; then
    exec podman-compose -f compose.yml -f compose.dev.yml "$COMMAND" "$@"
  else
    exec podman compose -f compose.yml -f compose.dev.yml "$COMMAND" "$@"
  fi
else
  exec $BUILDER compose -f compose.yml -f compose.dev.yml "$COMMAND" "$@"
fi
