#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

MIN_NODE_MAJOR="${MIN_NODE_MAJOR:-20}"

log() { printf "%s\n" "$*"; }
die() { printf "ERROR: %s\n" "$*" >&2; exit 1; }

have_cmd() { command -v "$1" >/dev/null 2>&1; }

node_major() {
  node -p "process.versions.node.split('.')[0]" 2>/dev/null || true
}

ensure_dir() {
  [[ -d "$1" ]] || die "Missing directory: $1"
}

copy_file_if_missing() {
  local src="$1"
  local dst="$2"

  if [[ -f "$dst" ]]; then
    return 0
  fi
  [[ -f "$src" ]] || die "Missing template file: $src"

  log "Creating $dst from $(basename "$src") (placeholders only; update values before running the app)."
  umask 077
  cp "$src" "$dst"
}

main() {
  ensure_dir "$BACKEND_DIR"
  ensure_dir "$FRONTEND_DIR"

  have_cmd git || die "git not found. Install Git first."
  have_cmd node || die "node not found. Install Node.js v${MIN_NODE_MAJOR}+ first."
  have_cmd npm || die "npm not found. Install npm (or reinstall Node.js)."

  local major
  major="$(node_major)"
  [[ -n "$major" ]] || die "Unable to detect Node version."
  if (( major < MIN_NODE_MAJOR )); then
    die "Node.js v${MIN_NODE_MAJOR}+ required. Detected: v${major}."
  fi

  copy_file_if_missing "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  copy_file_if_missing "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env"

  log "Installing backend dependencies..."
  (cd "$BACKEND_DIR" && npm ci)

  log "Installing frontend dependencies..."
  (cd "$FRONTEND_DIR" && npm ci)

  log ""
  log "Done."
  log "Next steps:"
  log "1) Edit backend/.env and frontend/.env with real values."
  log "2) Start backend:  (cd backend  && npm run dev)"
  log "3) Start frontend: (cd frontend && npm run dev)"
  log "4) Optional seed:  (cd backend && node scripts/seedRecommendations.js --reset)"
}

main "$@"
