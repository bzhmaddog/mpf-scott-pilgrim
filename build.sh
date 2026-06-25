#!/bin/sh

SCRIPT_DIR="$(dirname "$0")/docker"

build_mpf()       { cd "$SCRIPT_DIR/mpf"                   && sh build.sh "${1:-latest}" && cd - > /dev/null; }
build_mc_back()   { cd "$SCRIPT_DIR/media-controller/back"  && sh build.sh "${1:-latest}" && cd - > /dev/null; }
build_mc_front()  { cd "$SCRIPT_DIR/media-controller/front" && sh build.sh "${1:-latest}" && cd - > /dev/null; }
build_mc_dev()    { cd "$SCRIPT_DIR/media-controller/dev"   && sh build.sh "${1:-latest}" && cd - > /dev/null; }
build_mc_proxy()  { cd "$SCRIPT_DIR/media-controller/proxy" && sh build.sh "${1:-latest}" && cd - > /dev/null; }

build_all() {
  build_mpf
  build_mc_back
  build_mc_front
  build_mc_proxy
}

usage() {
  echo "Usage: $0 [target[:tag] ...]"
  echo "       $0                      builds all production images with tag latest"
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
  [ "$tag" = "$arg" ] && tag="latest"

  case "$target" in
    mpf)          build_mpf      "$tag" ;;
    mc-back)      build_mc_back  "$tag" ;;
    mc-front)     build_mc_front "$tag" ;;
    mc-front-dev) build_mc_dev   "$tag" ;;
    mc-proxy)     build_mc_proxy "$tag" ;;
    *)            echo "Unknown target: $target"; usage; exit 1 ;;
  esac
done
