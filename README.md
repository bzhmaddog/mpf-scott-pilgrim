# mpf-scott-pilgrim

Scott Pilgrim themed [Mission Pinball Framework](https://missionpinball.org/) configuration with a web-based media controller.

## Architecture

| Service | Image | Description |
|---|---|---|
| `mpf` | `mpf:0.80` | Mission Pinball Framework engine |
| `mc-back` | `mc-back:1.0.0` | Media controller backend (Node.js) |
| `mc-front` | `mc-front:1.0.0` | Media controller frontend (Angular production build served by lighttpd) |
| `mc-front-dev:latest` | Media controller frontend (Angular dev server) |
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
sh build.sh                        # all production images (tag: latest)
sh build.sh mc-front-dev          # dev frontend image
sh build.sh mc-back mc-front      # specific images
sh build.sh mc-back:1.0.0         # specific image with a custom tag
```

Available targets: `mpf`, `mc-back`, `mc-front`, `mc-front-dev`, `mc-proxy`.

Tags default to `latest` when omitted. Production images in [`docker/compose.yml`](docker/compose.yml) reference versioned tags (e.g. `mc-back:1.0.0`) while development overrides in [`docker/compose.dev.yml`](docker/compose.dev.yml) use `latest`.

## Run

**Development** (Angular dev server : No hot reload):

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
| `8080` | HTTP (redirects to HTTPS) |
| `4443` | HTTPS |

The proxy starts first and serves a waiting page while backends initialize. SSL certificates are expected in `certs/202x/` — see [certs/Readme.md](certs/Readme.md) for generation instructions.

## Shell into a running container

Each service has a `shell.sh` helper:

```sh
sh docker/mpf/shell.sh
sh docker/media-controller/back/shell.sh
sh docker/media-controller/front/shell.sh
sh docker/media-controller/dev/shell.sh
sh docker/media-controller/proxy/shell.sh
```

## Notes

- The stack uses a base + override compose setup: [`docker/compose.yml`](docker/compose.yml) is the production config, [`docker/compose.dev.yml`](docker/compose.dev.yml) overrides it for development.
- In development, nginx config, includes, and html files are mounted directly from the host — edit and reload with `podman exec mc-proxy nginx -s reload` without rebuilding.
- To enable CobraPin hardware in production, uncomment the `devices` section in [`docker/compose.yml`](docker/compose.yml).
