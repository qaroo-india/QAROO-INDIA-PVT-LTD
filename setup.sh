#!/usr/bin/env bash
#
# Qaroo India production setup — run ONCE on the server (Linux/macOS).
#   bash setup.sh
#
# What it does:
#   1. Ensures backend/.env exists (auto-generates JWT_SECRET if blank)
#   2. Refuses to continue until real values replace the placeholders
#   3. Installs + builds the React frontend (frontend/dist/)
#   4. Installs backend prod deps and seeds/verifies the super admin
#   5. Starts the backend under PM2 and enables PM2 on boot
#
# After a successful run:  pm2 status / curl http://localhost:5000/api/health

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$REPO_DIR/backend"
FRONTEND_DIR="$REPO_DIR/frontend"
ENV_FILE="$BACKEND_DIR/.env"
TEMPLATE="$BACKEND_DIR/.env.production.example"
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
say()  { printf "${GREEN}[setup]${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}[setup]${NC} %s\n" "$*"; }
die()  { printf "${RED}[setup]${NC} %s\n" "$*"; exit 1; }

cd "$FRONTEND_DIR"

# --- 1. Create backend/.env if missing -------------------------------------
if [ ! -f "$ENV_FILE" ]; then
  [ -f "$TEMPLATE" ] || die "missing $TEMPLATE — use the GitHub copy"
  cp "$TEMPLATE" "$ENV_FILE"
  say "Created backend/.env from the production template."
fi

# --- 2. Auto-fill JWT_SECRET if blank/placeholder ---------------------------
if ! grep -qE '^JWT_SECRET=[^[:space:]]+' "$ENV_FILE"; then
  SECRET="$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
  sed -i.bak "s|^JWT_SECRET=.*|JWT_SECRET=$SECRET|" "$ENV_FILE"
  rm -f "$ENV_FILE.bak"
  say "Generated a new random JWT_SECRET."
fi

# --- 3. Validate critical values --------------------------------------------
fail=0
grep -qE '^MONGODB_URI=mongodb\+srv://'   "$ENV_FILE" || { warn "MONGODB_URI is not an Atlas (mongodb+srv) URI"; fail=1; }
grep -qE '^JWT_SECRET=[^[:space:]]{32,}$' "$ENV_FILE" || { warn "JWT_SECRET too short"; fail=1; }
grep -qE '^EMAIL_USER=[^[:space:]]+'      "$ENV_FILE" || { warn "EMAIL_USER is empty"; fail=1; }
grep -qE '^EMAIL_PASSWORD=[^[:space:]]+'  "$ENV_FILE" || { warn "EMAIL_PASSWORD is empty"; fail=1; }
grep -qE '^CLOUDINARY_'                   "$ENV_FILE" || { warn "Cloudinary keys are empty"; fail=1; }
grep -qE '^CLIENT_URL=https://'           "$ENV_FILE" || { warn "CLIENT_URL is not https://"; fail=1; }
grep -q  '^NODE_ENV=production'           "$ENV_FILE" || warn "NODE_ENV=production missing (cookies won't be Secure)"

if [ "$fail" -ne 0 ]; then
  die "Fill in the reported values in $ENV_FILE, then re-run: bash setup.sh"
fi
say "backend/.env looks complete."

# --- 4. Frontend: deps + build ---------------------------------------------
say "Installing frontend dependencies (this includes build tooling)..."
npm ci
say "Building the React app into frontend/dist/..."
npm run build

# --- 5. Backend: prod deps + seed admin -------------------------------------
say "Installing backend production dependencies..."
cd "$BACKEND_DIR"
npm ci --omit=dev
say "Seeding/verifying the super admin from ADMIN_* values in .env..."
npm run seed

# --- 6. PM2 start + boot persistence ----------------------------------------
command -v pm2 >/dev/null || die "PM2 not installed — run: npm i -g pm2"
say "Starting the backend under PM2..."
pm2 delete qaroo-backend >/dev/null 2>&1 || true
pm2 start "npm run start" --name qaroo-backend --cwd "$BACKEND_DIR"
pm2 save
pm2 startup systemd -u "$(whoami)" --hp "$HOME" || warn "Run manually: pm2 startup"

say "Done. Verify with:"
say "  pm2 status"
say "  curl http://localhost:5000/api/health"
say "Then point your reverse proxy / DNS at this server and test HTTPS."