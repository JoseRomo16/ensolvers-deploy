#!/usr/bin/env bash
#
# Sets up and runs the whole app with a single command:
#   ./start.sh
#
# Installs dependencies for both apps, creates the .env files, applies the
# database migrations and starts the API and the SPA. Ctrl+C stops both.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

info() { printf '\033[1;34m==>\033[0m %s\n' "$1"; }
warn() { printf '\033[1;33mWarning:\033[0m %s\n' "$1" >&2; }
fail() { printf '\033[1;31mError:\033[0m %s\n' "$1" >&2; exit 1; }

# --- requirements -----------------------------------------------------------

command -v node >/dev/null 2>&1 || fail "Node.js is not installed. See README.md for the required version."
command -v npm  >/dev/null 2>&1 || fail "npm is not installed. See README.md for the required version."

NODE_VERSION="$(node -v)"
NODE_MAJOR="$(printf '%s' "${NODE_VERSION#v}" | cut -d. -f1)"
NODE_MINOR="$(printf '%s' "${NODE_VERSION#v}" | cut -d. -f2)"

if [ "$NODE_MAJOR" -lt 20 ]; then
  fail "Node.js 20.19 or newer is required (found $NODE_VERSION)."
fi
if { [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -lt 19 ]; } ||
   { [ "$NODE_MAJOR" -eq 22 ] && [ "$NODE_MINOR" -lt 12 ]; }; then
  warn "Vite expects Node ^20.19.0 or >=22.12.0 (found $NODE_VERSION). The app usually still runs."
fi

# --- configuration ----------------------------------------------------------

info "Preparing environment files"
[ -f backend/.env ]  || cp backend/.env.example  backend/.env
[ -f frontend/.env ] || cp frontend/.env.example frontend/.env

BACKEND_PORT="$(grep -E '^PORT=' backend/.env | cut -d= -f2 | tr -d '[:space:]' || true)"
BACKEND_PORT="${BACKEND_PORT:-3000}"

# --- install and build ------------------------------------------------------

info "Installing backend dependencies"
npm --prefix backend install

info "Installing frontend dependencies"
npm --prefix frontend install

info "Applying database migrations (creates the SQLite schema)"
npm --prefix backend run migration:run

info "Building the backend"
npm --prefix backend run build

# --- run --------------------------------------------------------------------

BACKEND_PID=""
cleanup() {
  [ -n "$BACKEND_PID" ] || return 0
  kill -0 "$BACKEND_PID" 2>/dev/null || return 0

  kill "$BACKEND_PID" 2>/dev/null || true
  for _ in 1 2 3 4 5; do
    kill -0 "$BACKEND_PID" 2>/dev/null || return 0
    sleep 1
  done
  # Still alive after the grace period: do not leave the port taken.
  kill -9 "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

info "Starting the API on http://localhost:${BACKEND_PORT}/api"
# Run node directly with `exec` so that $! is the node process itself.
# Going through `npm run start` would make $! the npm wrapper, and killing a
# wrapper does not kill its child: Ctrl+C would leave node holding the port.
( cd backend && exec node dist/main.js ) &
BACKEND_PID=$!

# Wait for the API so the SPA's first request does not land on a closed port.
if command -v curl >/dev/null 2>&1; then
  for _ in $(seq 1 30); do
    if curl -sf "http://localhost:${BACKEND_PORT}/api/notes" >/dev/null 2>&1; then
      break
    fi
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
      fail "The backend stopped while starting up. Check the output above."
    fi
    sleep 1
  done
else
  sleep 3
fi

info "Starting the SPA on http://localhost:5173"
npm --prefix frontend run dev
