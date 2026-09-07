#!/usr/bin/env bash
#
# Run a build-time PHP command against Clog's server plugin, in a throwaway container.
#
#   scripts/php.sh composer install
#   scripts/php.sh vendor/bin/eleph-codegen doctor --project .
#   scripts/php.sh vendor/bin/eleph generate --project .
#   scripts/php.sh bash                       # interactive shell
#
# There is no host PHP and generation needs 8.3, so this is how the eleph commands
# get run. It is deliberately not part of docker-compose.yml: generating code is a
# build step and must not require the runtime stack to be up. The container is
# removed on exit (--rm) and podman has no daemon, so nothing is left running.
#
# The working directory inside the container is `server/`, which is where eleph.json
# lives and where every command in the build loop is run from.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PARENT="$(dirname "$ROOT")"

IMAGE="clog-php:8.3"
CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/clog/composer"

# The framework checkouts server/composer.json points at as path repositories.
# Composer resolves those relative to server/, so they have to be mounted at the
# same relative position they occupy on the host — hence /work/<name> alongside
# /work/clog, rather than each one somewhere convenient.
SIBLINGS=(elephentity elephentity-codegen elephentity-codegen-php)

if command -v podman >/dev/null 2>&1; then
    ENGINE=podman
elif command -v docker >/dev/null 2>&1; then
    ENGINE=docker
else
    echo "scripts/php.sh: needs podman or docker." >&2
    echo "  Fedora:  sudo dnf install podman" >&2
    exit 1
fi

if ! "$ENGINE" image inspect "$IMAGE" >/dev/null 2>&1; then
    echo "Building $IMAGE (first run only)..." >&2
    "$ENGINE" build -t "$IMAGE" -f "$ROOT/.docker/php/Dockerfile" "$ROOT/.docker/php"
fi

MOUNTS=(-v "$ROOT:/work/clog:z")
for sibling in "${SIBLINGS[@]}"; do
    if [ ! -d "$PARENT/$sibling" ]; then
        echo "scripts/php.sh: $PARENT/$sibling is missing." >&2
        echo "  server/composer.json requires it as a path repository. Clone it beside this" >&2
        echo "  checkout, or swap the path repositories for Packagist constraints." >&2
        exit 1
    fi
    MOUNTS+=(-v "$PARENT/$sibling:/work/$sibling:z")
done

# Run as the host user so nothing in the working tree ends up owned by root.
# Rootless podman already maps the host user, and passing --user there would
# double-map it, so this is docker-only.
USER_ARGS=()
if [ "$ENGINE" = "docker" ]; then
    USER_ARGS=(--user "$(id -u):$(id -g)")
fi

# A host directory rather than a named volume: under docker's --user a named volume
# would be created root-owned and unwritable, and this works identically for podman.
mkdir -p "$CACHE_DIR"

# Interactive only when attached to a terminal, so CI and pipes still work.
TTY_ARGS=()
if [ -t 0 ] && [ -t 1 ]; then
    TTY_ARGS=(-it)
fi

exec "$ENGINE" run --rm \
    "${TTY_ARGS[@]}" \
    "${USER_ARGS[@]}" \
    `# :z relabels the mounts for SELinux, which Fedora enforces by default.` \
    "${MOUNTS[@]}" \
    -v "$CACHE_DIR:/composer:z" \
    -e COMPOSER_HOME=/composer \
    `# An arbitrary UID has no passwd entry, so HOME is unset and some tools fall over.` \
    -e HOME=/tmp \
    -w /work/clog/server \
    "$IMAGE" "$@"
