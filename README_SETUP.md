# System Configuration & Setup Guide (SkillNest)

This guide takes you from **cloning the repo** to a **fully running local development environment** (backend + frontend) for this project.

## Project Context (fill/adjust as needed)

- **Project Name:** SkillNest (repo folder: `new_skillnest`)
- **Primary Runtime:** Node.js (recommended **v20+**)
- **Backend Framework:** Express (ESM) + Socket.IO
- **Frontend Framework:** React + Vite
- **Database:** MongoDB (Atlas or local Docker/MongoDB)
- **3rd-party services (optional but supported):** Stripe, Cloudinary, SMTP (Mailtrap or equivalent)

## Repository Layout

- `backend/` – Express API, MongoDB (Mongoose), Stripe webhook, Socket.IO server
- `frontend/` – React + Vite UI (dev server on `http://localhost:3000`)

## Prerequisites (Global Tools)

Install these **before** you start:

- **Git** (2.x): `git --version`
- **Node.js** (**v20+**) and **npm** (comes with Node):
  - `node --version`
  - `npm --version`
- **MongoDB** (choose one):
  - **MongoDB Atlas** connection string (recommended for teams), OR
  - **Local MongoDB** (MongoDB 7.x), OR
  - **Docker** (recommended for local DB): `docker --version`

Optional (only needed for the corresponding features):

- **Stripe CLI** (for local webhook testing): `stripe --version`
- **Cloudinary account** (for image uploads)
- **SMTP credentials** (Mailtrap recommended for dev email flows; Gmail SMTP also works for real delivery)

## 1) Clone the Repository

```bash
git clone <YOUR_GIT_REMOTE_URL>
cd new_skillnest
```

## 2) Environment Configuration (`.env` templates)

This repo expects **two** env files:

- `backend/.env` (server + DB + Stripe + Cloudinary + email)
- `frontend/.env` (Vite client-side env)

Templates are provided and intended to be copied:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2.1 Backend: `backend/.env`

Create `backend/.env` with the following template (use real values for your environment; do **not** commit secrets):

```bash
# Server
PORT=4000
FRONTEND_URL=http://localhost:3000
# Optional: used for email verification links (defaults to http://localhost:${PORT})
BACKEND_URL=http://localhost:4000

# Database (MongoDB)
# Preferred: full connection string (Atlas or local)
MONGO_URI=mongodb://127.0.0.1:27017/skillnest

# Auth
JWT_SECRET=replace_me_with_a_long_random_string

# SMTP (optional; required for password reset / email verification flows)
# Dev (Mailtrap)
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=replace_me
EMAIL_PASSWORD=replace_me
# Production / real inbox delivery (Gmail SMTP with App Password)
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=465
# EMAIL_SECURE=true
# EMAIL_USER=youraddress@gmail.com
# EMAIL_PASSWORD=your_google_app_password

# Cloudinary (optional; required for image uploads)
CLOUDINARY_CLOUD_NAME=replace_me
CLOUDINARY_API_KEY=replace_me
CLOUDINARY_API_SECRET=replace_me

# Stripe (optional; required for marketplace checkout + webhook)
STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_WEBHOOK_SECRET=whsec_replace_me

# Moderation tuning (optional; sensible defaults exist)
AUTO_HIDE_UNIQUE_THRESHOLD=5
AUTO_HIDE_PRIORITY_THRESHOLD=60
RECENT_REPORT_WINDOW_MS=900000
USER_REPORT_RATE_WINDOW_MS=3600000
USER_REPORT_RATE_LIMIT=20
```

Notes:

- The backend uses **`MONGO_URI`** for DB connectivity.
- `EMAIL_*`, `CLOUDINARY_*`, and `STRIPE_*` can be left unset if you’re not using those features yet (the app will skip some behaviors or return configuration errors for those endpoints).

### 2.2 Frontend: `frontend/.env`

Create `frontend/.env` with:

```bash
# Optional: if unset, frontend defaults to http://localhost:4000
VITE_API_URL=http://localhost:4000

# Optional: only needed if/when the UI uses Stripe.js directly
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_replace_me
```

## 3) Install Dependencies

This repo has **separate** Node projects for backend and frontend.

### 3.1 Backend deps

```bash
cd backend
npm ci
```

### 3.2 Frontend deps

```bash
cd ../frontend
npm ci
```

## 4) Database Setup (Initialize + Seed)

There are no schema “migrations” (MongoDB + Mongoose), but you must have a reachable MongoDB instance and optionally seed dev data.

### Option A: MongoDB via Docker (recommended local)

```bash
docker run -d --name skillnest-mongo \
  -p 27017:27017 \
  -v skillnest-mongo:/data/db \
  mongo:7
```

Then set in `backend/.env`:

```bash
MONGO_URI=mongodb://127.0.0.1:27017/skillnest
```

### Option B: MongoDB Atlas

Set in `backend/.env`:

```bash
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
```

### 4.1 Seed dev users/posts (recommended for first run)

This repo includes a seed script:

```bash
cd backend
node scripts/seedRecommendations.js --reset --users=50 --postsPerUser=5
```

The script prints a sample login email/password (default password is `SeedPass123!` unless overridden via `--password=...`).

## 5) Run the App (Dev Mode)

You’ll run **two processes** in separate terminals.

### 5.1 Start backend API

```bash
cd backend
npm run dev
```

Expected:

- API starts on `http://localhost:4000`
- `GET /` returns `{ "msg": "Welcome to the app" }`

### 5.2 Start frontend dev server

```bash
cd frontend
npm run dev
```

Expected:

- UI starts on `http://localhost:3000`

## 6) Optional: Stripe Webhook (Local)

The backend listens for Stripe webhook events at:

- `POST API_URL/marketplace/webhook`

If you want to test webhooks locally with Stripe CLI:

```bash
stripe login
stripe listen --forward-to API_URL/marketplace/webhook
```

Then copy the printed webhook signing secret into `backend/.env` as `STRIPE_WEBHOOK_SECRET`.

## 7) Troubleshooting / Common Gotchas

- **Node version errors (Vite/ESM):** Use Node **v20+**. If you use `nvm`, run `nvm use 20`.
- **Backend fails to start with “Missing MONGO_URI”:** Ensure `backend/.env` exists and has `MONGO_URI=...`.
- **CORS errors in browser:** Frontend should run on `http://localhost:3000` (Vite config pins port `3000`). If you change ports, update backend CORS origin list and `FRONTEND_URL`.
- **Stripe errors:**
  - “Stripe is not configured” → set `STRIPE_SECRET_KEY`.
  - Webhook signature verification fails → ensure `STRIPE_WEBHOOK_SECRET` matches your Stripe CLI listener secret and that the webhook route receives the **raw** request body (already implemented).
- **Cloudinary upload fails:** Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- **Email flows fail (forgot password / verification):** Set `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD` (Mailtrap recommended for dev). For Gmail SMTP, also set `EMAIL_SECURE=true` when using port `465` (or use port `587` with `EMAIL_SECURE=false`).
- **Port already in use:** Change `PORT` in `backend/.env` or stop the process using the port.

## 8) Automated Setup Script (`setup.sh`)

This script checks your environment and installs dependencies for both apps. It can also generate **placeholder** `.env` files if they’re missing.

### Run it

```bash
chmod +x setup.sh
./setup.sh
```

### `setup.sh` (source)

```bash
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

  # Create placeholder env files if missing (copied from .env.example).
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
```
