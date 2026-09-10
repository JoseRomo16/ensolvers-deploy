#!/usr/bin/env bash
#
# Sets up and runs the whole app with a single command:
#   ./start.sh
#
# Brings up PostgreSQL and the API in Docker, applies the migrations, seeds the
# initial data and starts the frontend. Ctrl+C stops everything.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

info() { printf '\033[1;34m==>\033[0m %s\n' "$1"; }
warn() { printf '\033[1;33mWarning:\033[0m %s\n' "$1" >&2; }
fail() { printf '\033[1;31mError:\033[0m %s\n' "$1" >&2; exit 1; }

# --- requirements -----------------------------------------------------------

command -v docker >/dev/null 2>&1 ||
  fail "Docker is required. See README.md for the supported versions."
docker compose version >/dev/null 2>&1 ||
  fail "The Docker Compose v2 plugin is required ('docker compose', not 'docker-compose')."
docker info >/dev/null 2>&1 ||
  fail "The Docker daemon is not running. Start Docker and try again."

command -v node >/dev/null 2>&1 ||
  fail "Node.js is required to run the frontend. See README.md."
command -v npm >/dev/null 2>&1 || fail "npm is required. See README.md."

NODE_VERSION="$(node -v)"
NODE_MAJOR="$(printf '%s' "${NODE_VERSION#v}" | cut -d. -f1)"
NODE_MINOR="$(printf '%s' "${NODE_VERSION#v}" | cut -d. -f2)"

if [ "$NODE_MAJOR" -lt 20 ]; then
  fail "Node.js 20.19 or newer is required (found $NODE_VERSION)."
fi
if { [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -lt 19 ]; } ||
   { [ "$NODE_MAJOR" -eq 22 ] && [ "$NODE_MINOR" -lt 12 ]; }; then
  warn "The frontend tooling expects Node ^20.19.0 or >=22.12.0 (found $NODE_VERSION)."
fi

# --- configuration ----------------------------------------------------------

info "Preparing environment files"
[ -f backend/.env ]  || cp backend/.env.example  backend/.env
[ -f frontend/.env ] || cp frontend/.env.example frontend/.env

BACKEND_PORT="${BACKEND_PORT:-3000}"
API_URL="http://localhost:${BACKEND_PORT}/api"

# --- database and API -------------------------------------------------------

info "Starting PostgreSQL"
docker compose up -d --wait db

info "Building the API image"
docker compose build backend

# Run against a one-off container so the schema exists before the API boots.
info "Applying database migrations"
docker compose run --rm backend npm run migration:run:dist

info "Seeding initial data"
docker compose run --rm backend npm run seed:dist

info "Starting the API"
docker compose up -d backend

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

# --- frontend ---------------------------------------------------------------

cleanup() {
  echo
  info "Stopping the containers"
  # `down` rather than `stop`: Postgres treats SIGTERM as a smart shutdown and
  # waits for clients to disconnect, so a plain stop can leave it running past
  # the default grace period. The named volume survives, so data is kept.
  docker compose down --timeout 15 >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

info "Installing frontend dependencies"
npm --prefix frontend install

echo
info "API      -> ${API_URL}"
info "Health   -> ${API_URL}/health"
info "Frontend -> http://localhost:5173"
echo

npm --prefix frontend run dev
