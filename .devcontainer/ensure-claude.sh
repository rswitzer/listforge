#!/usr/bin/env bash
# Idempotently ensures Claude Code is installed. Safe to run on every
# container start: short-circuits when `claude` is already on PATH.

set -euo pipefail

export NVM_DIR="${NVM_DIR:-/usr/local/share/nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
fi

if command -v claude >/dev/null 2>&1; then
  exit 0
fi

echo "==> Installing Claude Code"
npm install -g @anthropic-ai/claude-code

NPM_BIN="$(npm config get prefix)/bin"
if [ -x "$NPM_BIN/claude" ] && [ ! -e /usr/local/bin/claude ]; then
  echo "==> Symlinking $NPM_BIN/claude -> /usr/local/bin/claude"
  sudo ln -sf "$NPM_BIN/claude" /usr/local/bin/claude
fi

if ! command -v claude >/dev/null 2>&1; then
  echo "ERROR: claude installed to $NPM_BIN but not on PATH. PATH=$PATH" >&2
  exit 1
fi
