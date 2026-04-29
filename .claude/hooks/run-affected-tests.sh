#!/usr/bin/env bash
# Stop hook: runs typecheck + tests for files touched in this turn.
# Exit 2 + stderr = block end-of-turn so the model fixes the failure.
# Exit 0 = allow stopping.
#
# Bypass: set LISTFORGE_SKIP_STOP_TESTS=1 (e.g. for doc-only sessions).
# Prevents infinite loops via stop_hook_active.

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
cd "$ROOT" || exit 0

# --- Read hook payload ------------------------------------------------------

PAYLOAD="$(cat 2>/dev/null || true)"

if command -v jq >/dev/null 2>&1 && [ -n "$PAYLOAD" ]; then
  STOP_ACTIVE="$(printf '%s' "$PAYLOAD" | jq -r '.stop_hook_active // false')"
  # Already re-entered after a prior block — let the model continue without
  # another gate, otherwise we loop forever on a genuinely red test.
  [ "$STOP_ACTIVE" = "true" ] && exit 0
fi

# --- Bypass -----------------------------------------------------------------

[ "${LISTFORGE_SKIP_STOP_TESTS:-0}" = "1" ] && exit 0

# --- Toolchain on PATH ------------------------------------------------------

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

# --- Compute touched files --------------------------------------------------

if ! command -v git >/dev/null 2>&1; then
  exit 0
fi

# Porcelain: each line is "XY path". Extract path; handle renames "old -> new".
# --untracked-files=all expands untracked directories into individual files,
# which matters on a fresh repo where most of src/ and frontend/ is untracked.
TOUCHED="$(git -C "$ROOT" status --porcelain --untracked-files=all 2>/dev/null \
  | sed -e 's/^...//' -e 's/.* -> //' \
  | sort -u)"

[ -z "$TOUCHED" ] && exit 0

# --- Bucket touched files ---------------------------------------------------

FRONTEND_TOUCHED=0
E2E_TOUCHED=0
BACKEND_PROJECTS=()

while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
    frontend/*)
      FRONTEND_TOUCHED=1
      ;;
    tests-e2e/*)
      E2E_TOUCHED=1
      ;;
    src/ListForge.Domain/*|tests/ListForge.Domain.Tests/*)
      BACKEND_PROJECTS+=("ListForge.Domain.Tests")
      ;;
    src/ListForge.Infrastructure/*|tests/ListForge.Infrastructure.Tests/*)
      BACKEND_PROJECTS+=("ListForge.Infrastructure.Tests")
      ;;
    src/ListForge.Application/*|tests/ListForge.Application.Tests/*)
      BACKEND_PROJECTS+=("ListForge.Application.Tests")
      ;;
    src/ListForge.API/*|tests/ListForge.API.Tests/*)
      BACKEND_PROJECTS+=("ListForge.API.Tests")
      ;;
    src/ListForge.Contracts/*)
      # Shared DTOs — both API and Application consume them.
      BACKEND_PROJECTS+=("ListForge.API.Tests")
      BACKEND_PROJECTS+=("ListForge.Application.Tests")
      ;;
  esac
done <<<"$TOUCHED"

# Deduplicate backend projects.
if [ ${#BACKEND_PROJECTS[@]} -gt 0 ]; then
  IFS=$'\n' read -r -d '' -a BACKEND_PROJECTS < <(
    printf '%s\n' "${BACKEND_PROJECTS[@]}" | sort -u && printf '\0'
  )
fi

# --- Run gates --------------------------------------------------------------

FAILURES=()

run_gate() {
  local label="$1"; shift
  if ! "$@" >/tmp/listforge-stop-hook.log 2>&1; then
    FAILURES+=("$label")
    {
      echo "[stop] FAILED: $label"
      echo "[stop] command: $*"
      echo "[stop] --- output (last 60 lines) ---"
      tail -n 60 /tmp/listforge-stop-hook.log
      echo "[stop] --- end ---"
    } >&2
  fi
}

if [ "$FRONTEND_TOUCHED" = "1" ]; then
  if command -v pnpm >/dev/null 2>&1; then
    run_gate "frontend typecheck" pnpm --dir "$ROOT/frontend" run typecheck
    run_gate "frontend tests (vitest --changed)" \
      pnpm --dir "$ROOT/frontend" exec vitest run --changed
  else
    echo "[stop] WARNING: pnpm not found on PATH; skipping frontend gates" >&2
  fi
fi

# Playwright runs when frontend code or any e2e spec was touched, AND specs exist.
if { [ "$FRONTEND_TOUCHED" = "1" ] || [ "$E2E_TOUCHED" = "1" ]; } \
  && ls "$ROOT"/tests-e2e/*.spec.ts >/dev/null 2>&1; then
  if command -v pnpm >/dev/null 2>&1; then
    run_gate "playwright e2e" pnpm --dir "$ROOT/frontend" exec playwright test
  fi
fi

if [ ${#BACKEND_PROJECTS[@]} -gt 0 ]; then
  if command -v dotnet >/dev/null 2>&1; then
    for proj in "${BACKEND_PROJECTS[@]}"; do
      csproj="tests/${proj}/${proj}.csproj"
      if [ -f "$ROOT/$csproj" ]; then
        run_gate "$proj" dotnet test "$ROOT/$csproj" \
          --nologo --verbosity quiet
      fi
    done
  else
    echo "[stop] WARNING: dotnet not found on PATH; skipping backend gates" >&2
  fi
fi

if [ ${#FAILURES[@]} -gt 0 ]; then
  echo "" >&2
  echo "[stop] Blocking end-of-turn: ${#FAILURES[@]} gate(s) failed (${FAILURES[*]})." >&2
  echo "[stop] Fix the failures above, or set LISTFORGE_SKIP_STOP_TESTS=1 to bypass." >&2
  exit 2
fi

exit 0
