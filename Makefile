SHELL := /bin/sh

ROOT_DIR := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))

IMAGE_BUILDER ?= podman
ENV_TAG := $(shell [ -f .env ] && sed -n 's/^TAG=//p' .env | tail -n 1)
TAG ?= $(if $(ENV_TAG),$(ENV_TAG),latest)

DEV ?= 0
FOREGROUND ?= 0
COMMAND ?= up
ARGS ?=
EXISTING_ONLY ?= 0

BUILD_IMAGE_TARGETS := mpf mc-back mc-front mc-proxy mc-front-dev mc-back-dev
REQUESTED_BUILD_TARGETS := $(filter $(BUILD_IMAGE_TARGETS),$(MAKECMDGOALS))

COMPOSE_FILES := -f compose.yml
ifeq ($(DEV),1)
COMPOSE_FILES += -f compose.dev.yml
endif

ifeq ($(COMMAND),up)
ifeq ($(FOREGROUND),1)
DETACH_ARG :=
else ifneq (,$(findstring -d,$(ARGS)))
DETACH_ARG :=
else ifneq (,$(findstring --detach,$(ARGS)))
DETACH_ARG :=
else
DETACH_ARG := -d
endif
else
DETACH_ARG :=
endif

.PHONY: help \
	build build-prod build-dev build-dev-all \
	build-mpf build-mc-back build-mc-front build-mc-proxy build-mc-front-dev build-mc-back-dev \
	mpf mc-back mc-front mc-proxy mc-front-dev mc-back-dev dev dev-all \
	compose start start-dev down stop restart logs ps pull versions versions-short

help:
	@echo "Build targets (TAG=$(TAG), IMAGE_BUILDER=$(IMAGE_BUILDER)):"
	@echo "  make build                 # Build all images (core + -dev)"
	@echo "  make build mc-front        # Build a specific image via build"
	@echo "  make build-prod            # mpf, mc-back, mc-front, mc-proxy"
	@echo "  make build-dev             # mc-back-dev + mc-front-dev (always latest)"
	@echo "  make build-dev-all         # build-dev + build-prod"
	@echo "  make build-mpf TAG=1.0.0   # Build a single image with explicit tag"
	@echo "  make mc-back TAG=1.0.0     # Alias form of single-image targets"
	@echo ""
	@echo "Compose targets (run.sh equivalent):"
	@echo "  make start                 # Prod compose up (detached by default)"
	@echo "  make start-dev             # Build latest -dev images + dev compose up (others use TAG)"
	@echo "  make down ARGS=\"-v\""
	@echo "  make logs ARGS=\"-f proxy\""
	@echo "  make compose COMMAND=exec ARGS=\"proxy sh\" DEV=1"
	@echo "  make versions              # List local image tags for this project"
	@echo "  make versions-short        # List only local image tags that exist"

ifneq ($(filter build,$(MAKECMDGOALS)),)
ifneq ($(strip $(REQUESTED_BUILD_TARGETS)),)
build: $(REQUESTED_BUILD_TARGETS)
else
build: build-dev-all
endif
else
build: build-dev-all
endif

build-dev: build-mc-back-dev build-mc-front-dev

build-dev-all: build-dev build-prod

build-prod: build-mpf build-mc-back build-mc-front build-mc-proxy

build-mpf:
	@cd $(ROOT_DIR)/mpf && sh build.sh "$(TAG)"

build-mc-back:
	@cd $(ROOT_DIR)/media-controller/back && sh build.sh "$(TAG)"

build-mc-front:
	@cd $(ROOT_DIR)/media-controller/front && sh build.sh "$(TAG)"

build-mc-proxy:
	@cd $(ROOT_DIR)/media-controller/proxy && sh build.sh "$(TAG)"

build-mc-front-dev:
	@cd $(ROOT_DIR)/media-controller/front-dev && sh build.sh "latest"

build-mc-back-dev:
	@cd $(ROOT_DIR)/media-controller/back-dev && sh build.sh "latest"

mpf: build-mpf
mc-back: build-mc-back
mc-front: build-mc-front
mc-proxy: build-mc-proxy
mc-front-dev: build-mc-front-dev
mc-back-dev: build-mc-back-dev
dev: build-dev
dev-all: build-dev-all

compose:
	@cd $(ROOT_DIR) && \
	if [ "$(IMAGE_BUILDER)" = "podman" ] && command -v podman-compose >/dev/null 2>&1; then \
		podman-compose $(COMPOSE_FILES) "$(COMMAND)" $(DETACH_ARG) $(ARGS); \
	else \
		$(IMAGE_BUILDER) compose $(COMPOSE_FILES) "$(COMMAND)" $(DETACH_ARG) $(ARGS); \
	fi

start:
	@$(MAKE) compose COMMAND=up DEV=0 FOREGROUND=0 ARGS="$(ARGS)" IMAGE_BUILDER=$(IMAGE_BUILDER)

start-dev:
	@$(MAKE) build-dev TAG=latest IMAGE_BUILDER=$(IMAGE_BUILDER)
	@$(MAKE) compose COMMAND=up DEV=1 FOREGROUND=0 ARGS="$(ARGS)" IMAGE_BUILDER=$(IMAGE_BUILDER)

down:
	@$(MAKE) compose COMMAND=down DEV=$(DEV) ARGS="$(ARGS)" IMAGE_BUILDER=$(IMAGE_BUILDER)

stop:
	@$(MAKE) compose COMMAND=stop DEV=$(DEV) ARGS="$(ARGS)" IMAGE_BUILDER=$(IMAGE_BUILDER)

restart:
	@$(MAKE) compose COMMAND=restart DEV=$(DEV) ARGS="$(ARGS)" IMAGE_BUILDER=$(IMAGE_BUILDER)

logs:
	@$(MAKE) compose COMMAND=logs DEV=$(DEV) ARGS="$(ARGS)" IMAGE_BUILDER=$(IMAGE_BUILDER)

ps:
	@$(MAKE) compose COMMAND=ps DEV=$(DEV) ARGS="$(ARGS)" IMAGE_BUILDER=$(IMAGE_BUILDER)

pull:
	@$(MAKE) compose COMMAND=pull DEV=$(DEV) ARGS="$(ARGS)" IMAGE_BUILDER=$(IMAGE_BUILDER)

versions:
	@set -eu; \
	existing_only="$(EXISTING_ONLY)"; \
	cli="$(IMAGE_BUILDER)"; \
	if ! command -v "$$cli" >/dev/null 2>&1; then \
		if command -v podman >/dev/null 2>&1; then \
			cli="podman"; \
		elif command -v docker >/dev/null 2>&1; then \
			cli="docker"; \
		else \
			echo "Container CLI not found: $(IMAGE_BUILDER), podman, or docker"; \
			exit 1; \
		fi; \
	fi; \
	if [ "$$cli" = "podman" ] && command -v podman-compose >/dev/null 2>&1; then \
		refs="$$(podman-compose -f compose.yml config --images 2>/dev/null || true)"; \
	else \
		refs="$$("$$cli" compose -f compose.yml config --images 2>/dev/null || true)"; \
	fi; \
	if [ -z "$$refs" ]; then \
		compose_files="compose.yml"; \
		if [ "$(DEV)" = "1" ] && [ -f compose.dev.yml ]; then \
			compose_files="$$compose_files compose.dev.yml"; \
		fi; \
		refs="$$(awk -v tag="$(TAG)" '/^[[:space:]]*image:[[:space:]]*/ { ref=$$2; gsub(/"/, "", ref); gsub(/\$$\{TAG:-latest\}/, tag, ref); print ref }' $$compose_files | sort -u)"; \
	fi; \
	if [ -z "$$refs" ]; then \
		echo "No image references found in compose config."; \
		exit 0; \
	fi; \
	if [ "$$existing_only" = "1" ]; then \
		echo "Existing local image tags:"; \
	else \
		echo "Available local images:"; \
	fi; \
	for ref in $$refs; do \
		repo="$${ref%:*}"; \
		requested_tag="$${ref##*:}"; \
		tags="$$("$$cli" image ls --format '{{.Repository}}:{{.Tag}}' "$$repo" 2>/dev/null || true)"; \
		if [ -n "$$tags" ]; then \
			echo "- $$repo (requested: $$requested_tag, cli: $$cli)"; \
			echo "$$tags" | sed 's/^/  - /'; \
		else \
			if [ "$$existing_only" != "1" ]; then \
				echo "- $$repo (requested: $$requested_tag): not present locally"; \
			fi; \
		fi; \
	done

versions-short:
	@$(MAKE) versions EXISTING_ONLY=1 DEV=$(DEV) TAG=$(TAG) IMAGE_BUILDER=$(IMAGE_BUILDER)