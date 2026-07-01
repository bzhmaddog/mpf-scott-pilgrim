#!/bin/sh

DEV=0
FOREGROUND=0
ARGS=""
for arg in "$@"; do
  if [ "$arg" = "--dev" ]; then
    DEV=1
  elif [ "$arg" = "--fg" ] || [ "$arg" = "--foreground" ]; then
    FOREGROUND=1
  else
    ARGS="$ARGS $arg"
  fi
done

set -- $ARGS
if [ $# -gt 0 ] && [ "${1#-}" = "$1" ]; then
  COMMAND="$1"; shift
else
  COMMAND="up"
fi

# Run `up` detached by default; pass --fg to keep it in the foreground.
if [ "$COMMAND" = "up" ] && [ "$FOREGROUND" -eq 0 ]; then
  case " $* " in
    *" -d "*|*" --detach "*) ;;
    *) set -- -d "$@" ;;
  esac
fi

BUILDER="${IMAGE_BUILDER:-docker}"

cd "$(dirname "$0")/docker"

if [ "$DEV" -eq 1 ]; then
  FILES="-f compose.yml -f compose.dev.yml"
else
  FILES="-f compose.yml"
fi

if [ "$BUILDER" = "podman" ] && command -v podman-compose >/dev/null 2>&1; then
  exec podman-compose $FILES "$COMMAND" "$@"
else
  exec $BUILDER compose $FILES "$COMMAND" "$@"
fi
