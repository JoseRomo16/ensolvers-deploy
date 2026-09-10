#!/usr/bin/env bash
#
# Sets up and runs the whole app with a single command:
#   ./start.sh
#
# Brings up PostgreSQL, the API and the SPA in Docker, applies the migrations
# and seeds the initial data. Docker is the only prerequisite. Ctrl+C stops
# everything.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

info() { printf '\033[1;34m==>\033[0m %s\n' "$1"; }
fail() { printf '\033[1;31mError:\033[0m %s\n' "$1" >&2; exit 1; }

# --- requirements -----------------------------------------------------------

command -v docker >/dev/null 2>&1 ||
  fail "Docker is required. See README.md for the supported versions."
docker compose version >/dev/null 2>&1 ||
  fail "The Docker Compose v2 plugin is required ('docker compose', not 'docker-compose')."
docker info >/dev/null 2>&1 ||
  fail "The Docker daemon is not running. Start Docker and try again."

# Used below to poll /api/health. Without this check a missing curl looks like
# an API that never starts, after a two-minute wait.
command -v curl >/dev/null 2>&1 ||
  fail "curl is required to check that the API came up. Install it and try again."

# --- configuration ----------------------------------------------------------

# The containers get their configuration from docker-compose.yml. These files
# are only needed by the "run each piece by hand" path documented in README.md.
info "Preparing environment files"
[ -f backend/.env ]  || cp backend/.env.example  backend/.env
[ -f frontend/.env ] || cp frontend/.env.example frontend/.env

BACKEND_PORT="${BACKEND_PORT:-3000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
API_URL="http://localhost:${BACKEND_PORT}/api"

# Both of these have to follow the ports actually in use, or overriding a port
# silently breaks the app: the SPA would keep calling :3000 and its origin would
# not be in the API's allow-list, which the browser reports only as a failed
# fetch. Explicit values from the environment still win.
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-${API_URL}}"
export CORS_ORIGIN="${CORS_ORIGIN:-http://localhost:${FRONTEND_PORT},http://localhost:3001}"

# Docker reports a port clash as a long "failed to bind host port" error from
# the daemon. Checking first turns that into something actionable.
port_in_use() {
  (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null && exec 3>&- && return 0
  return 1
}

# Skipped when our own stack is already up: those ports are meant to be taken.
if [ -z "$(docker compose ps -q 2>/dev/null)" ]; then
  for entry in "the API:${BACKEND_PORT}:BACKEND_PORT" \
               "the SPA:${FRONTEND_PORT}:FRONTEND_PORT" \
               "PostgreSQL:${POSTGRES_PORT}:POSTGRES_PORT"; do
    name="${entry%%:*}"
    rest="${entry#*:}"
    port="${rest%%:*}"
    variable="${rest##*:}"
    if port_in_use "$port"; then
      fail "Port ${port}, needed for ${name}, is already in use.
       Stop whatever is listening on it, or run:  ${variable}=<free port> ./start.sh"
    fi
  done
fi

cleanup() {
  echo
  info "Stopping the containers"
  # `down` rather than `stop`: Postgres treats SIGTERM as a smart shutdown and
  # waits for clients to disconnect, so a plain stop can leave it running past
  # the default grace period. The named volume survives, so data is kept.
  docker compose down --timeout 15 >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

# --- database ---------------------------------------------------------------

info "Starting PostgreSQL"
docker compose up -d --wait db

info "Building the images"
docker compose build backend frontend

# Run against a one-off container so the schema exists before the API boots.
info "Applying database migrations"
docker compose run --rm backend npm run migration:run:dist

info "Seeding initial data"
docker compose run --rm backend npm run seed:dist

# --- application ------------------------------------------------------------

info "Starting the API and the SPA"
docker compose up -d backend frontend

info "Waiting for the API to become healthy"
API_READY=0
for _ in $(seq 1 60); do
  if curl -sf "${API_URL}/health" >/dev/null 2>&1; then
    API_READY=1
    break
  fi
  sleep 2
done
if [ "$API_READY" -ne 1 ]; then
  docker compose logs --tail 40 backend >&2
  fail "The API did not become healthy. Container logs are above."
fi

echo
info "SPA      -> http://localhost:${FRONTEND_PORT}"
info "API      -> ${API_URL}"
info "Health   -> ${API_URL}/health"
echo
info "Following the container logs. Press Ctrl+C to stop everything."
echo

docker compose logs -f backend frontend
