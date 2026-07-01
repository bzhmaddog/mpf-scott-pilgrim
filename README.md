# mpf-scott-pilgrim

![Front-end](https://github.com/bzhmaddog/mpf-scott-pilgrim/actions/workflows/ci-front.yml/badge.svg)
![Back-end](https://github.com/bzhmaddog/mpf-scott-pilgrim/actions/workflows/ci-back.yml/badge.svg)

Scott Pilgrim themed [Mission Pinball Framework](https://missionpinball.org/) configuration with a web-based media controller.

## Architecture

| Service | Image | Description |
|---|---|---|
| `mpf` | `mpf:1.0.0` | Mission Pinball (v0.80) Framework engine |
| `mc-back` | `mc-back:1.0.0` | Media controller backend (Node.js) |
| `mc-front` | `mc-front:1.0.0` | Media controller frontend (Angular production build served by nginx) |
| `mc-front-dev` | `mc-front-dev:latest` | Media controller frontend (Angular dev server) |
| `mc-proxy` | `mc-proxy:1.0.0` | Reverse proxy (nginx) with SSL |

## Prerequisites

- [docker](https://docs.docker.com/engine/install/) or [podman](https://podman.io/docs/installation) + [podman-compose](https://github.com/containers/podman-compose)

> For a full Arch Linux setup (yay, nvm, docker, xorg, chromium…) see [INSTALL.md](INSTALL.md).

## Configuration

Set the `IMAGE_BUILDER` environment variable to the container engine to use:

```sh
export IMAGE_BUILDER=docker   # or podman
```

## Build images

```sh
sh build.sh                        # all images using TAG from .env
sh build.sh mc-front-dev          # dev frontend image
sh build.sh mc-back mc-front      # specific images
sh build.sh mc-back:2.0.0         # specific image with an explicit tag
TAG=2.0.0 sh build.sh             # override the default tag for all images
```

Available targets: `mpf`, `mc-back`, `mc-front`, `mc-front-dev`, `mc-proxy`.

All images share a single version defined by `TAG` in [`.env`](.env) (read by `build.sh`, `compose.yml`, and `run.sh`). Set `TAG` inline (e.g. `TAG=2.0.0 sh build.sh`) to override the `.env` default. Development overrides in [`compose.dev.yml`](compose.dev.yml) always use `latest`.

## Run

**Development** (Angular dev server : No hot reload):

```sh
sh run.sh --dev          # attached
sh run.sh --dev -d       # detached
sh run.sh --dev down     # stop
sh run.sh --dev down -v  # stop and remove volumes
```

**Production**:

```sh
sh run.sh           # attached
sh run.sh -d        # detached
sh run.sh down      # stop
TAG=2.0.0 sh run.sh # run a specific tag (overrides .env)
```

The proxy listens on:

| Port | Protocol |
|---|---|
| `8080` | HTTP (redirects to HTTPS) |
| `4443` | HTTPS |

The proxy starts first and serves a waiting page while backends initialize. SSL certificates are expected in `certs/202x/` — see [certs/Readme.md](certs/Readme.md) for generation instructions.

## Notes

- The stack uses a base + override compose setup: [`compose.yml`](compose.yml) is the production config, [`compose.dev.yml`](compose.dev.yml) overrides it for development.
- In development, nginx config, includes, and html files are mounted directly from the host — edit and reload with `podman exec mc-proxy nginx -s reload` without rebuilding.
- To enable CobraPin hardware in production, uncomment the `devices` section in [`compose.yml`](compose.yml).
