#!/bin/sh

if [ $# -gt 0 ] && [ "${1#-}" = "$1" ]; then
  COMMAND="$1"; shift
else
  COMMAND="up"
fi

cd "$(dirname "$0")/docker" && ${IMAGE_BUILDER:-docker} compose -f compose.yml -f compose.dev.yml "$COMMAND" "$@"
