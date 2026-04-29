#!/usr/bin/env bash
# One-time setup: point git at the tracked .githooks directory so the pre-push
# gate runs locally. Idempotent — safe to re-run.

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "${repo_root}"

git config core.hooksPath .githooks
chmod +x .githooks/* 2>/dev/null || true

echo "✓ core.hooksPath set to .githooks"
echo "  Pre-push gate is active. It will run backend + frontend + e2e suites"
echo "  whenever you push to main. Bypass with LISTFORGE_SKIP_PREPUSH=1 git push."
