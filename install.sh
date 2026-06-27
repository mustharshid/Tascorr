#!/usr/bin/env bash

# install.sh - Deploy Tascorr application on a generic webhosting environment.
# Assumes the host provides a Linux shell with Node.js (>=20), npm, and git.
# The script can be copied to the target directory and executed.

set -e

#--- Configuration -----------------------------------------------------------
# Change these values if needed before running the script.
APP_DIR="$(pwd)"                # Directory where the script resides (project root)
REPO_URL="https://github.com/YourUsername/tascorr.git"  # Replace with your repo URL
ENV_FILE=".env"
# --------------------------------------------------------------

echo "=== Tascorr Deployment Script ==="

# 1. Ensure required tools are available
for cmd in git node npm; do
  if ! command -v $cmd >/dev/null 2>&1; then
    echo "Error: $cmd is not installed. Install it and re‑run the script." >&2
    exit 1
  fi
done

# 2. Clone repository if not already present
if [ ! -d "$APP_DIR/.git" ]; then
  echo "Cloning repository..."
  git clone "$REPO_URL" "$APP_DIR"
else
  echo "Repository already present – pulling latest changes..."
  git pull origin main
fi

# 3. Install Node dependencies
echo "Installing npm packages..."
npm ci

# 4. Build front‑end assets (Vite)
echo "Building client bundle..."
npm run build

# 5. Set up environment variables
if [ ! -f "$ENV_FILE" ]; then
  echo "Creating .env file..."
  cat <<EOF > $ENV_FILE
# ==== Tascorr Environment ==== 
# Database connection – change as needed for your host
# Example for SQLite (default in development):
DATABASE_URL="file:./prisma/dev.db"
# For MySQL / PostgreSQL you can use:
# DATABASE_URL="mysql://user:password@host:3306/dbname"

# JWT secret – generate a strong random string
JWT_SECRET="$(openssl rand -base64 48)"

# Server configuration
PORT=5005
HOST=0.0.0.0
EOF
else
  echo ".env file already exists – leaving untouched."
fi

# 6. Run Prisma migrations (create tables if they don't exist)
# Uses SQLite by default; for MySQL/Postgres the same command works.
if npx prisma migrate deploy; then
  echo "Database migrations applied."
else
  echo "Migrations failed – you may need to run 'npx prisma migrate dev' locally first."
fi

# 7. Install PM2 (process manager) globally if not present
if ! command -v pm2 >/dev/null 2>&1; then
  echo "Installing PM2 globally..."
  npm install -g pm2
fi

# 8. Start the backend in production mode using PM2
# The compiled server entry point is ./dist/server/server/index.js after Vite build.
# Ensure the build output exists – if not, run the build again.
if [ ! -f "dist/server/server/index.js" ]; then
  echo "Server entry not found – running Vite build again..."
  npm run build
fi

# Use a stable name so we can restart easily.
pm2 start ./dist/server/server/index.js --name tascorr
pm2 save

# 9. Optional – set up a reverse proxy (e.g., Nginx) to map a sub‑directory.
# Provide a sample Nginx snippet the user can copy.
cat <<'NGINX' > nginx_tascorr.conf
# Nginx configuration for soft.thinksafe.mv/tascorr (or any sub‑path)
# Adjust root and upstream as needed.

location /tascorr/ {
    proxy_pass http://127.0.0.1:5005/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    # Remove the /tascorr prefix before forwarding (if you want clean URLs)
    proxy_redirect off;
    rewrite ^/tascorr/(.*) /$1 break;
}
NGINX

echo "--- Installation complete! ---"

echo "You may now configure your web server (Apache/Nginx) to proxy /tascorr/ to http://localhost:5005/."

echo "To update the app later, simply run:"

echo "  git pull && npm ci && npm run build && pm2 restart tascorr"

exit 0
