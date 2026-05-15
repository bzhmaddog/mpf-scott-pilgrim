# mpf-scott-pilgrim

Scott Pilgrim themed [Mission Pinball Framework](https://missionpinball.org/) configuration with a web-based media controller.

## Architecture

| Service | Image | Description |
|---|---|---|
| `mpf` | `mpf:latest` | Mission Pinball Framework engine |
| `mc-back` | `mc-back:1.0.0` | Media controller backend (Node.js) |
| `mc-front` | `mc-front:1.0.0` | Media controller frontend (Angular, production build) |
| `mc-front-dev` | `mc-front-dev:latest` | Media controller frontend (Angular dev server, hot-reload) |
| `mc-proxy` | `mc-proxy:latest` | Reverse proxy (nginx) with SSL |

## Prerequisites

- [docker](https://docs.docker.com/engine/install/) or [podman](https://podman.io/docs/installation)

> For a full Arch Linux setup (yay, nvm, docker, xorg, chromium…) see [INSTALL.md](INSTALL.md).

## Configuration

Set the `IMAGE_BUILDER` environment variable to the container engine to use:

```sh
export IMAGE_BUILDER=docker   # or podman
```

## Build images

```sh
sh build.sh                        # all production images
sh build.sh mc-front-dev          # dev frontend image
sh build.sh mc-back mc-front      # specific images
```

Available targets: `mpf`, `mc-back`, `mc-front`, `mc-front-dev`, `mc-proxy`.

## Run

**Development** (hot-reload frontend mounted as a volume):

```sh
sh dev.sh          # attached
sh dev.sh -d       # detached
sh dev.sh down     # stop
sh dev.sh down -v  # stop and remove volumes
```

**Production**:

```sh
sh prod.sh         # attached
sh prod.sh -d      # detached
sh prod.sh down    # stop
```

The proxy listens on:

| Port | Protocol |
|---|---|
| `80` | HTTP |
| `443` | HTTPS |
| `4443` | HTTPS (alternate) |

The stack uses a base + override compose setup: [`docker/compose.yml`](docker/compose.yml) is the production config, [`docker/compose.dev.yml`](docker/compose.dev.yml) overrides it for development. To enable CobraPin hardware in production, uncomment the `devices` section in `docker/compose.yml`.

## Shell into a running container

Each service has a `shell.sh` helper:

```sh
sh docker/mpf/shell.sh
sh docker/media-controller/back/shell.sh
sh docker/media-controller/front/shell.sh
sh docker/media-controller/dev/shell.sh
sh docker/media-controller/proxy/shell.sh
```
