#!/usr/bin/env bash
# Stop hook: at end-of-turn, scan untracked files for ones that look like
# build/cache artifacts but aren't currently in .gitignore. Warn-only;
# never blocks (run-affected-tests.sh is the only Stop hook that should
# block).
#
# Bypass: LISTFORGE_SKIP_GITIGNORE_HOOK=1 (matches check-gitignore.sh).
# Honors stop_hook_active to avoid loops.

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

PAYLOAD="$(cat 2>/dev/null || true)"

if command -v jq >/dev/null 2>&1 && [ -n "$PAYLOAD" ]; then
  STOP_ACTIVE="$(printf '%s' "$PAYLOAD" | jq -r '.stop_hook_active // false')"
  [ "$STOP_ACTIVE" = "true" ] && exit 0
fi

[ "${LISTFORGE_SKIP_GITIGNORE_HOOK:-0}" = "1" ] && exit 0

if ! command -v git >/dev/null 2>&1; then
  exit 0
fi

# Untracked entries only. `git status --porcelain` already excludes
# gitignored paths, so every "?? …" line is a genuine "not ignored, not
# tracked" file or directory.
UNTRACKED="$(git -C "$ROOT" status --porcelain 2>/dev/null \
  | awk '/^\?\? / { sub(/^\?\? /, ""); print }')"

[ -z "$UNTRACKED" ] && exit 0

looks_like_artifact() {
  local path="$1"
  local base
  base="$(basename "${path%/}")"

  case "/$path/" in
    */dist/*|*/build/*|*/out/*|*/target/*) return 0 ;;
    */coverage/*|*/.nyc_output/*)          return 0 ;;
    */node_modules/*|*/bin/*|*/obj/*)      return 0 ;;
    */.cache/*|*/.parcel-cache/*|*/.next/*|*/.turbo/*|*/.vite/*) return 0 ;;
    */__pycache__/*)                        return 0 ;;
    */playwright-report/*|*/test-results/*) return 0 ;;
  esac

  case "$base" in
    *.log|*.tsbuildinfo|*.coverage|*.coveragexml|*.pyc) return 0 ;;
    .DS_Store|Thumbs.db) return 0 ;;
  esac

  return 1
}

HITS=()
while IFS= read -r line; do
  [ -z "$line" ] && continue
  if looks_like_artifact "$line"; then
    HITS+=("$line")
  fi
done <<<"$UNTRACKED"

[ ${#HITS[@]} -eq 0 ] && exit 0

{
  echo "[gitignore] These untracked files look like build/cache artifacts:"
  for h in "${HITS[@]}"; do
    echo "[gitignore]   $h"
  done
  echo "[gitignore] Add patterns to .gitignore or remove them, then re-run."
} >&2

exit 0
