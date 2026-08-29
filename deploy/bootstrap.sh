#!/usr/bin/env bash
# One-time VPS bootstrap: Docker + agent/.env + first build & start.
# Usage:  bash deploy/bootstrap.sh        (as root — Hetzner default — or a sudo user)
# Run it twice: once to create agent/.env (then fill in keys), again to deploy.
set -euo pipefail

cd "$(dirname "$0")/.."   # project root

if [ "$(id -u)" -eq 0 ]; then
  SUDO=""
else
  SUDO="sudo"
fi

echo "==> Installing Docker if needed"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | $SUDO sh
fi
$SUDO systemctl enable --now docker
$SUDO usermod -aG docker "$USER" || true

echo "==> Preparing agent/.env"
if [ ! -f agent/.env ]; then
  cp agent/.env.example agent/.env
  echo
  echo "Created agent/.env — fill in your keys (see deploy/hetzner-getting-started.md), then re-run:"
  echo "  bash deploy/bootstrap.sh"
  exit 0
fi

echo "==> Building and starting agent + tunnel"
docker compose -f deploy/docker-compose.yml up -d --build

echo
echo "Done. Get the tunnel URL with:"
echo "  docker compose -f deploy/docker-compose.yml logs ngrok | grep url"
echo "Then put  wss://<that-url>/ws  into your Twilio TwiML Bin — see deploy/hetzner-getting-started.md step 4."
