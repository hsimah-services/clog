#!/usr/bin/env bash
#
# Clog development stack.
#
# Self-contained: brings up WordPress, MySQL, Redis, phpMyAdmin, Mailpit and the
# Vite dev server in containers, with ./server bind-mounted as the `clog` plugin.
# Nothing but a container runtime is required on the host.
#
# Works with podman (rootless, via its Docker-compatible socket) or Docker.
# Editor-agnostic: run it from a terminal, from Emacs `M-x compile`, or from the
# VS Code task in .vscode/tasks.json.
#
# Usage: scripts/dev.sh [up|down|restart|logs|status|reset|wp|shell]

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

log()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!!\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31mxx\033[0m %s\n' "$*" >&2; exit 1; }

# --- Pick a container runtime and a compose command -------------------------
#
# COMPOSE is set to the argv of the compose command to run. When podman is the
# runtime, DOCKER_HOST is exported so the Docker-compatible compose CLI talks to
# the rootless podman socket instead of looking for a Docker daemon.
COMPOSE=()

setup_podman() {
  local sock="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}/podman/podman.sock"

  if [ ! -S "$sock" ]; then
    log "Starting rootless podman socket..."
    systemctl --user start podman.socket \
      || die "Could not start podman.socket. Try: systemctl --user enable --now podman.socket"
    for _ in $(seq 1 20); do
      [ -S "$sock" ] && break
      sleep 0.5
    done
  fi
  [ -S "$sock" ] || die "podman socket never appeared at $sock"

  export DOCKER_HOST="unix://$sock"
}

detect_compose() {
  # 1. A real Docker daemon, if one is reachable.
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    if docker compose version >/dev/null 2>&1; then
      COMPOSE=(docker compose)
    elif command -v docker-compose >/dev/null 2>&1; then
      COMPOSE=(docker-compose)
    else
      die "Docker is running but no compose plugin is installed."
    fi
    return
  fi

  # 2. Podman, driving a Docker-compatible compose CLI over its socket.
  if command -v podman >/dev/null 2>&1; then
    setup_podman
    if command -v docker-compose >/dev/null 2>&1; then
      COMPOSE=(docker-compose)
    elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
      COMPOSE=(docker compose)
    elif podman compose version >/dev/null 2>&1; then
      COMPOSE=(podman compose)
    else
      die "podman is installed but has no compose provider.
  Fedora:  sudo dnf install docker-compose
  Other:   install docker-compose or podman-compose, then re-run."
    fi
    return
  fi

  # 3. Docker installed but the daemon is down.
  if command -v docker >/dev/null 2>&1; then
    log "Docker daemon is not responding, trying to start it..."
    if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files docker.service >/dev/null 2>&1; then
      sudo systemctl start docker || die "Failed to start docker.service"
    elif grep -qi microsoft /proc/version 2>/dev/null; then
      # WSL: the daemon lives in Docker Desktop on the Windows side.
      powershell.exe -Command "Start-Process 'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe'" || true
    fi
    for _ in $(seq 1 60); do
      docker info >/dev/null 2>&1 && break
      sleep 1
    done
    docker info >/dev/null 2>&1 || die "Docker daemon still unreachable."
    detect_compose
    return
  fi

  die "No container runtime found. Install podman (plus docker-compose) or Docker."
}

# --- Preflight --------------------------------------------------------------

preflight() {
  if [ ! -f .env ]; then
    [ -f .env.example ] || die ".env is missing and there is no .env.example to copy."
    warn ".env not found — creating one from .env.example"
    cp .env.example .env
  fi

  # docker-compose bind-mounts ./client/dist into the plugin. If the directory
  # does not exist the runtime creates it with unpredictable ownership, so make
  # it ourselves. It stays empty until `npm run build` populates it; the dev
  # server on :3000 does not need it.
  mkdir -p client/dist
}

# --- Commands ---------------------------------------------------------------

cmd_up() {
  preflight; detect_compose
  log "Using: ${COMPOSE[*]}${DOCKER_HOST:+  (DOCKER_HOST=$DOCKER_HOST)}"
  "${COMPOSE[@]}" up --build -d "$@"
  cat <<'EOM'

Clog is starting. First run pulls images and installs WordPress — give it a minute.

  WordPress      http://localhost:8080
  WP admin       http://localhost:8080/wp-admin   (credentials from .env)
  Client (Vite)  http://localhost:3000/clog
  GraphQL        http://localhost:8080/graphql
  phpMyAdmin     http://localhost:8081
  Mailpit        http://localhost:8025

  Follow setup:  scripts/dev.sh logs wordpress
EOM
}

cmd_down()    { detect_compose; "${COMPOSE[@]}" down "$@"; }
cmd_restart() { cmd_down; cmd_up; }
cmd_logs()    { detect_compose; "${COMPOSE[@]}" logs -f "$@"; }
cmd_status()  { detect_compose; "${COMPOSE[@]}" ps "$@"; }

# Destroys the database and the WordPress install. Volumes are not recoverable.
cmd_reset() {
  detect_compose
  warn "This deletes the db_data and wp_data volumes: the database, uploads and"
  warn "the entire WordPress install are destroyed. ./server and ./client are untouched."
  read -r -p "Type 'reset' to confirm: " reply
  [ "$reply" = "reset" ] || die "Aborted."
  "${COMPOSE[@]}" down -v
  log "Volumes removed. Run 'scripts/dev.sh up' for a clean install."
}

# WP-CLI inside the WordPress container, e.g. `scripts/dev.sh wp plugin list`
cmd_wp()    { detect_compose; "${COMPOSE[@]}" exec wordpress wp --allow-root "$@"; }
cmd_shell() { detect_compose; "${COMPOSE[@]}" exec "${1:-wordpress}" bash; }

case "${1:-up}" in
  up)      shift || true; cmd_up "$@" ;;
  down)    shift || true; cmd_down "$@" ;;
  restart) shift || true; cmd_restart ;;
  logs)    shift || true; cmd_logs "$@" ;;
  status|ps) shift || true; cmd_status "$@" ;;
  reset)   shift || true; cmd_reset ;;
  wp)      shift || true; cmd_wp "$@" ;;
  shell)   shift || true; cmd_shell "$@" ;;
  *)       die "Unknown command '$1'. Use: up|down|restart|logs|status|reset|wp|shell" ;;
esac
