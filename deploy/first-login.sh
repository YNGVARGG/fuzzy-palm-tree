#!/usr/bin/env bash
# First login on the fresh Hetzner server (run as root): system update, deps,
# clone the agent code, then bootstrap (Docker + .env + build).
# Usage:  bash deploy/first-login.sh
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root (Hetzner default): sudo bash deploy/first-login.sh" >&2
  exit 1
fi

echo '==> Updating the system (this can take a few minutes)'
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

echo '==> Installing git, curl, ufw'
apt-get install -y git curl ca-certificates ufw

echo '==> Firewall: allow SSH only (ngrok dials out; Twilio never hits the VPS)'
ufw allow OpenSSH
ufw --force enable

echo '==> Cloning the agent code (public repo)'
if [ ! -d /opt/company-phone-agent/.git ]; then
  git clone https://github.com/YNGVARGG/fuzzy-palm-tree.git /opt/company-phone-agent
fi
cd /opt/company-phone-agent

echo '==> Bootstrap (installs Docker, creates agent/.env on first run)'
bash deploy/bootstrap.sh

echo
echo '==> NEXT STEPS:'
echo '  1. SECURITY: your root password was shared in a chat log — change it NOW:'
echo '       passwd'
echo '  2. Fill in keys:  nano /opt/company-phone-agent/agent/.env'
echo '  3. Deploy:  cd /opt/company-phone-agent && bash deploy/bootstrap.sh'