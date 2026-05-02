#!/usr/bin/env bash
# Runs once after the devcontainer is built. Brings the workspace to a usable
# state so `dotnet test` and `pnpm test` work immediately.

set -euo pipefail

# The Node devcontainer feature installs nvm + node + pnpm under
# /usr/local/share/nvm, but non-login shells don't auto-source it.
export NVM_DIR="${NVM_DIR:-/usr/local/share/nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
fi

echo "==> Toolchain"
dotnet --version
node --version
pnpm --version

echo "==> Restoring .NET solution"
dotnet restore ListForge.sln

echo "==> Fixing volume mount ownership (volumes come up as root)"
sudo chown -R "$(id -u):$(id -g)" frontend/node_modules || true
sudo chown -R "$(id -u):$(id -g)" "$HOME/.claude" || true

echo "==> Installing frontend dependencies"
(cd frontend && pnpm install --frozen-lockfile=false)

echo "==> Ensuring Claude Code is installed"
.devcontainer/ensure-claude.sh

echo "==> Installing Chromium runtime libs + Xvfb (apt)"
# Playwright 1.x's `--with-deps` officially supports Ubuntu 22.04/24.04. The
# devcontainer base is Debian 12 (Bookworm), where `--with-deps` commonly
# no-ops. Install the libs explicitly so Chromium has everything it needs
# regardless of the active Playwright version's dep map.
#
# The Node devcontainer feature drops a yarn apt source whose signing key
# rotates and is sometimes stale on the base image, breaking `apt-get update`.
# We use pnpm via Corepack and don't need this source — remove it so apt is
# stable for the rest of the script.
sudo rm -f /etc/apt/sources.list.d/yarn.list
sudo apt-get update
sudo apt-get install -y --no-install-recommends \
  libxcb1 libx11-6 libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 \
  libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
  libgtk-3-0 libpangocairo-1.0-0 libatk1.0-0 \
  libcairo-gobject2 libcairo2 libgdk-pixbuf-2.0-0 libglib2.0-0 \
  libasound2 libfreetype6 libfontconfig1 libdbus-1-3 \
  libnss3 libnspr4 libatk-bridge2.0-0 libcups2 libxkbcommon0 \
  libatspi2.0-0 libgbm1 \
  xvfb

echo "==> Installing Playwright Chromium binary"
(cd frontend && pnpm exec playwright install chromium)

echo "==> Done. Try: dotnet test ListForge.sln"
