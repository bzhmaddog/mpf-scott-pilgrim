# mpf-scott-pilgrim

![CI](https://github.com/bzhmaddog/mpf-scott-pilgrim/actions/workflows/ci.yml/badge.svg)
![SonarQube](https://github.com/bzhmaddog/mpf-scott-pilgrim/actions/workflows/sonarqube.yml/badge.svg)

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=bzhmaddog_mpf-scott-pilgrim&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=bzhmaddog_mpf-scott-pilgrim)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=bzhmaddog_mpf-scott-pilgrim&metric=bugs)](https://sonarcloud.io/summary/new_code?id=bzhmaddog_mpf-scott-pilgrim)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=bzhmaddog_mpf-scott-pilgrim&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=bzhmaddog_mpf-scott-pilgrim)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=bzhmaddog_mpf-scott-pilgrim&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=bzhmaddog_mpf-scott-pilgrim)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=bzhmaddog_mpf-scott-pilgrim&metric=coverage)](https://sonarcloud.io/summary/new_code?id=bzhmaddog_mpf-scott-pilgrim)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=bzhmaddog_mpf-scott-pilgrim&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=bzhmaddog_mpf-scott-pilgrim)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=bzhmaddog_mpf-scott-pilgrim&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=bzhmaddog_mpf-scott-pilgrim)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=bzhmaddog_mpf-scott-pilgrim&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=bzhmaddog_mpf-scott-pilgrim)

Scott Pilgrim themed [Mission Pinball Framework](https://missionpinball.org/) configuration with a web-based media controller.

## Architecture

| Service | Image | Description |
|---|---|---|
| `mpf` | `mpf:1.0.0` | Mission Pinball (v0.80) Framework engine |
| `mc-back` | `mc-back:1.0.0` | Media controller backend (Node.js) |
| `mc-front` | `mc-front:1.0.0` | Media controller frontend (Angular production build served by nginx) |
| `mc-back-dev` | `mc-back-dev:latest` | Media controller backend (development, `tsx watch`) |
| `mc-front-dev` | `mc-front-dev:latest` | Media controller frontend (Angular dev server) |
| `mc-proxy` | `mc-proxy:1.0.0` | Reverse proxy (nginx) with SSL |

## Prerequisites

- [docker](https://docs.docker.com/engine/install/) or [podman](https://podman.io/docs/installation) + [podman-compose](https://github.com/containers/podman-compose)

> For a full Arch Linux setup (yay, nvm, docker, xorg, chromium…) see [INSTALL.md](INSTALL.md).

## Configuration

The container engine defaults to `podman`. Override it with `IMAGE_BUILDER`, either exported or inline on any `make` command:

```sh
export IMAGE_BUILDER=docker   # or podman (default)
```

All images share a single version defined in [`VERSION`](VERSION). The [`Makefile`](Makefile) reads it and exports it as `TAG`, which [`compose.yml`](compose.yml) uses for its image tags. Set `TAG` inline (e.g. `make build-prod TAG=2.0.0`) to override it. The `-dev` images always use `latest`.

`.env` is git-ignored and only meant for local compose overrides (see [`.env.example`](.env.example)). Never put secrets in a tracked file; shell secrets such as `SONAR_TOKEN` go in `.envrc` (also git-ignored).

Run `make help` to list all targets.

## Build images

```sh
make build                    # all images (prod + -dev)
make build-prod               # mpf, mc-back, mc-front, mc-proxy
make build-dev                # mc-back-dev, mc-front-dev
make build mc-front           # a specific image
make build-mpf TAG=2.0.0      # a single image with an explicit tag
make versions                 # list local image tags for this project
```

Available images: `mpf`, `mc-back`, `mc-front`, `mc-proxy`, `mc-back-dev`, `mc-front-dev`.

## Run

**Development** (Angular dev server: no hot reload):

```sh
make start-dev                # build the -dev images, then start the dev stack (detached)
make logs DEV=1 ARGS="-f"     # follow logs
make down DEV=1               # stop
make down DEV=1 ARGS="-v"     # stop and remove volumes
```

**Production**:

```sh
make start                    # start (detached)
make start TAG=2.0.0          # run a specific tag (overrides VERSION)
make logs ARGS="-f mpf"       # follow logs of one service
make down                     # stop
```

The proxy listens on `4443` (HTTPS).

The proxy starts first and serves a waiting page while backends initialize. SSL certificates are mounted from `certs/current/` — see [certs/Readme.md](certs/Readme.md) for generation instructions.

## Notes

- The stack uses a base + override compose setup: [`compose.yml`](compose.yml) is the production config, [`compose.dev.yml`](compose.dev.yml) overrides it for development.
- In development, nginx config, includes, and html files are mounted directly from the host — edit and reload with `podman exec mc-proxy nginx -s reload` without rebuilding.
- `mpf`, `mc-proxy` and `mc-front` run as non-root users. With rootless podman, `userns_mode: keep-id` in [`compose.yml`](compose.yml) maps your host user onto them so the bind mounts (`mpf-config/`, `certs/current/`) stay accessible: these files must be owned by the user running the stack.
- To enable CobraPin hardware in production, uncomment the `group_add` and `devices` sections of the `mpf` service in [`compose.yml`](compose.yml). The host user must be in the group owning the serial devices (`uucp` on Arch Linux).
