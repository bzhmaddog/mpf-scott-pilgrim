#!/bin/sh

SCRIPT_DIR="$(cd "$(dirname "$0")/docker" && pwd)"

# Shared tag from docker/.env (same source compose uses).
# An inline/env TAG (e.g. `TAG=2.0.0 sh build.sh`) overrides the .env default.
TAG_OVERRIDE="${TAG}"
[ -f "$SCRIPT_DIR/.env" ] && . "$SCRIPT_DIR/.env"
TAG="${TAG_OVERRIDE:-${TAG:-latest}}"

build_mpf()       { ( cd "$SCRIPT_DIR/mpf"                   && sh build.sh "${1:-$TAG}" ); }
build_mc_back()   { ( cd "$SCRIPT_DIR/media-controller/back"  && sh build.sh "${1:-$TAG}" ); }
build_mc_front()  { ( cd "$SCRIPT_DIR/media-controller/front" && sh build.sh "${1:-$TAG}" ); }
build_mc_front_dev()    { ( cd "$SCRIPT_DIR/media-controller/front-dev"   && sh build.sh "latest" ); }
build_mc_back_dev()    { ( cd "$SCRIPT_DIR/media-controller/back-dev"   && sh build.sh "latest" ); }
build_mc_proxy()  { ( cd "$SCRIPT_DIR/media-controller/proxy" && sh build.sh "${1:-$TAG}" ); }

build_all() {
  build_mpf
  build_mc_back
  build_mc_front
  build_mc_proxy
}

build_dev() {
  build_mc_back_dev
  build_mc_front_dev
}

build_dev_all() {
  build_mc_back_dev
  build_mc_front_dev
  build_all "$1"
}


usage() {
  echo "Usage: $0 [target[:tag] ...]"
  echo "       $0                      builds all images using tag from docker/.env (TAG=$TAG)"
  echo "       $0 mc-back:1.0.0        builds mc-back with tag 1.0.0"
  echo "Targets: mpf, mc-back, mc-front, mc-front-dev, mc-proxy"
}

echo "Building with: ${IMAGE_BUILDER:-docker}"

if [ $# -eq 0 ]; then
  build_all
  exit 0
fi

for arg in "$@"; do
  target="${arg%%:*}"
  tag="${arg#*:}"
  [ "$tag" = "$arg" ] && tag=""

  case "$target" in
    mpf)          build_mpf      "$tag" ;;
    mc-back)      build_mc_back  "$tag" ;;
    mc-front)     build_mc_front "$tag" ;;
    mc-proxy)     build_mc_proxy "$tag" ;;
    mc-front-dev) build_mc_front_dev ;;
    mc-back-dev) build_mc_back_dev ;;
    dev)          build_dev ;;
    dev-all)      build_dev_all "$tag" ;;
    *)            echo "Unknown target: $target"; usage; exit 1 ;;
  esac
done
