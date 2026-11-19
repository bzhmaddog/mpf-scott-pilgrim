# Plan: support Docker alongside podman

Status: **planned, not implemented.** Written 2026-11-19, after the non-root containers change
(see [README.md](../README.md#notes)) made `compose.yml` podman-specific.

## What is podman-only today

| Where | Podman-only part | What Docker does with it |
|---|---|---|
| `compose.yml`: `mpf`, `mc-proxy` | `userns_mode: "keep-id:uid=…,gid=…"` | Should refuse to start them: Docker's `userns_mode` only accepts `host` |
| `compose.yml`: `mpf` (commented) | `group_add: [keep-groups]` for the CobraPin serial devices | Treats `keep-groups` as a group name, so the container fails to start |
| `Makefile` `compose` target | Chooses `podman-compose`, else `<engine> compose` | Already works |

The image builds already work with Docker: `build.sh` uses `${IMAGE_BUILDER:-docker} build -f Containerfile`,
and `COPY --chmod` needs BuildKit, which modern Docker uses by default.

## Why simply removing `keep-id` breaks Docker

In rootful Docker, a user ID inside a container is the same user ID on the host. So:

- **`mpf` (uid 1000):** works only because `mpfuser` happens to be uid 1000 on archpinball.
- **`mc-proxy` (uid 101):** can't read `certs/current/server.key` (mode 0600, owned by 1000), so TLS fails.

## Approach: run both containers as the host user on either engine

Instead of mapping the host user onto the image's user (what `keep-id:uid=…` does now), run the
containers as the host user's own uid and gid on both engines:

1. **`compose.yml` (shared):**
   - remove `userns_mode`;
   - `mpf`: add `user: "${HOST_UID}:${HOST_GID}"`;
   - `mc-proxy`: add `user: "${HOST_UID}:0"`. The unprivileged NGINX image is built to run as any uid
     with group 0, since its writable paths (`conf.d`, `/tmp`) are group-0 writable.
2. **`compose.podman.yml` (new override):** `userns_mode: keep-id` on `mpf` and `mc-proxy`. Without the
   `uid=` option, rootless podman maps your host uid to the same uid inside the container, so the
   `user:` above lines up.
3. **No Docker override needed:** rootful Docker already keeps uids identical.
4. **`Makefile`:**
   - export `HOST_UID := $(shell id -u)` and `HOST_GID := $(shell id -g)`;
   - add `-f compose.podman.yml` to `COMPOSE_FILES` when `IMAGE_BUILDER=podman`.
5. **Images:** keep `USER mpf` and `USER nginx` as safe defaults for anyone running the images without
   compose. Sonar's root-user rule (S6471) stays satisfied.

## CobraPin hardware (cabinet only)

Move the commented `devices` and `group_add` lines into an opt-in override, enabled with
`make start HARDWARE=1`:

- **`compose.hardware.yml`:** the `devices:` list (`/dev/cobrapin_board_0`, `/dev/cobrapin_board_1`).
- **`compose.hardware.podman.yml`:** `group_add: [keep-groups]`.
- **Docker:** `group_add: ["${SERIAL_GID}"]`, where the Makefile exports
  `SERIAL_GID := $(shell getent group uucp | cut -d: -f3)`.

The host user must be in the group owning the serial devices (`uucp` on Arch Linux) with either engine.

## Docs and CI

- **README:** list Docker or podman as prerequisites, explain `HARDWARE=1`, and note that rootless Docker
  isn't supported (unless open question 1 decides otherwise).
- **CI:** a GitHub Actions job (the runners have Docker) that:
  - runs `docker compose -f compose.yml config` to catch podman-only syntax;
  - builds the four production images with `IMAGE_BUILDER=docker`.

## Testing

On archpinball, which already has Docker, `docker-compose` and `mpfuser` in the `docker` group:

1. Run `make build-prod` and `make start`, once with `IMAGE_BUILDER=podman` and once with
   `IMAGE_BUILDER=docker`.
2. Run `id` in each container: `mpf` and `mc-proxy` should show uid 1000.
3. `https://archpinball.dev:4443` should load, and MPF should connect to the media controller.
4. MPF should write to `mpf-config/logs`, and new files should be owned by `mpfuser`.
5. On the cabinet, run `make start HARDWARE=1` with each engine. MPF should open `/dev/cobrapin_board_*`.
6. Run the dev stack (`make start-dev`) with both engines.

## Unverified points (check first when implementing)

- The exact error Docker gives for `userns_mode: keep-id`.
- The unprivileged NGINX image running as an arbitrary uid with group 0, including the
  `envsubst` template step in `/docker-entrypoint.d`.
- `podman-compose` filling `user:` from environment variables, and `keep-id` without `uid=` combined
  with an explicit `user:`.

## Open questions

1. **Rootless Docker:** it maps uids like rootless podman but has no `keep-id`. Support it, or document
   it as unsupported?
2. **Hardware flag:** is `HARDWARE=1` the right way to turn on the cabinet setup, or keep it as
   commented-out lines in `compose.yml`?
3. **Running compose without make:** `HOST_UID`/`HOST_GID` come from the Makefile. Should
   `.env.example` document setting them, with a `1000` default in compose (`${HOST_UID:-1000}`)?
