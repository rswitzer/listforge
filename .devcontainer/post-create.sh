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

echo "==> Fixing node_modules ownership (volume mounts come up as root)"
sudo chown -R "$(id -u):$(id -g)" frontend/node_modules || true

echo "==> Installing frontend dependencies"
(cd frontend && pnpm install --frozen-lockfile=false)

echo "==> Installing Claude CLI"
npm install -g @anthropic-ai/claude-cli

echo "==> Done. Try: dotnet test ListForge.sln"
