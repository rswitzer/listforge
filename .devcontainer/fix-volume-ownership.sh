#!/usr/bin/env bash
# Runs as onCreateCommand (before updateContentCommand). Fresh Docker named
# volumes default to root:root; chown them to the container user so pnpm and
# Claude Code can write inside them.
set -euo pipefail
sudo chown -R "$(id -u):$(id -g)" /workspaces/listforge/frontend/node_modules
sudo chown -R "$(id -u):$(id -g)" "$HOME/.claude"
