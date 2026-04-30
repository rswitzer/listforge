#!/usr/bin/env bash
# PostToolUse hook: lints the just-written/edited file by extension.
# Warn-only — exit 0 always, findings go to stderr prefixed with "[lint] …".
# Mirrors check-ui-copy.sh in style; never blocks the edit.
#
# Coverage:
#   frontend/**/*.{ts,tsx,js,jsx}  → ESLint (via pnpm exec)
#   src|tests/**/*.cs              → dotnet format whitespace --verify-no-changes
#   **/*.json                      → jq empty (parse check)
#
# Bypass: set LISTFORGE_SKIP_LINT_HOOK=1.
# Fails open if the relevant toolchain isn't on PATH.

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

# shellcheck source=_common.sh
. "$SCRIPT_DIR/_common.sh"

[ "${LISTFORGE_SKIP_LINT_HOOK:-0}" = "1" ] && exit 0

file="$HOOK_FILE"
[ -z "$file" ] && exit 0
[ -e "$file" ] || exit 0

# Make toolchains discoverable, same approach as run-affected-tests.sh.
[ -r /tmp/listforge-env.sh ] && . /tmp/listforge-env.sh

if [ -d "$HOME/.dotnet" ]; then
  export PATH="$HOME/.dotnet:$PATH"
  export DOTNET_ROOT="$HOME/.dotnet"
fi

if ! command -v pnpm >/dev/null 2>&1; then
  for nodebin in "$HOME"/.nvm/versions/node/*/bin; do
    [ -d "$nodebin" ] && { export PATH="$nodebin:$PATH"; break; }
  done
fi

# Compute repo-relative path for cleaner output and tool inputs.
case "$file" in
  "$ROOT"/*) rel="${file#"$ROOT"/}" ;;
  /*)        rel="$file" ;;
  *)         rel="$file" ;;
esac

warn() { echo "[lint] $1" >&2; }

run_capture() {
  # Runs "$@" capturing stdout+stderr; on non-zero, prints lines prefixed with "[lint] $label: ".
  local label="$1"; shift
  local out
  if ! out="$("$@" 2>&1)"; then
    if [ -n "$out" ]; then
      while IFS= read -r line; do
        echo "[lint] $label: $line" >&2
      done <<<"$out"
    else
      warn "$label: failed (no output)"
    fi
    return 1
  fi
  return 0
}

case "$rel" in
  # ---- Frontend: ESLint ----
  frontend/*.ts|frontend/*.tsx|frontend/*.js|frontend/*.jsx|frontend/**/*.ts|frontend/**/*.tsx|frontend/**/*.js|frontend/**/*.jsx)
    case "$rel" in
      frontend/node_modules/*|frontend/dist/*|frontend/playwright-report/*|frontend/test-results/*)
        exit 0
        ;;
    esac
    if ! command -v pnpm >/dev/null 2>&1; then
      exit 0
    fi
    if [ ! -f "$ROOT/frontend/eslint.config.js" ] && [ ! -f "$ROOT/frontend/eslint.config.mjs" ]; then
      # ESLint not configured yet — silently skip rather than nag.
      exit 0
    fi
    run_capture "eslint" pnpm --silent --dir "$ROOT/frontend" exec eslint --no-error-on-unmatched-pattern "$ROOT/$rel" || true
    exit 0
    ;;

  # ---- Backend: dotnet format whitespace ----
  src/*.cs|tests/*.cs|src/**/*.cs|tests/**/*.cs)
    if ! command -v dotnet >/dev/null 2>&1; then
      exit 0
    fi
    if [ ! -f "$ROOT/ListForge.sln" ]; then
      exit 0
    fi
    run_capture "dotnet format" dotnet format whitespace "$ROOT/ListForge.sln" \
      --verify-no-changes --include "$rel" --verbosity quiet || true
    exit 0
    ;;

  # ---- JSON: parse check ----
  *.json)
    case "$rel" in
      */node_modules/*|node_modules/*|frontend/dist/*|frontend/playwright-report/*|frontend/test-results/*|*/coverage/*)
        exit 0
        ;;
    esac
    if ! command -v jq >/dev/null 2>&1; then
      exit 0
    fi
    run_capture "jq" jq empty "$file" || true
    exit 0
    ;;
esac

exit 0
