#!/usr/bin/env bash
# PreToolUse hook: blocks edits that violate ListForge architectural boundaries.
# Exit 2 + stderr message = deny and surface reason to the model.
# See architecture.md §Solution Structure, §Non-Goals, §Decision Log.

set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_common.sh
. "$SCRIPT_DIR/_common.sh"

file="$HOOK_FILE"
content="$HOOK_CONTENT"

# Fail open when we have nothing to inspect.
[ -z "$file" ] && exit 0
[ -z "${content// }" ] && exit 0

deny() {
  echo "[arch] $1" >&2
  echo "[arch] See architecture.md — edit blocked. Fix the violation or ask the user to override." >&2
  exit 2
}

# --- Backend layering ---------------------------------------------------------

case "$file" in
  *"src/ListForge.Domain/"*|*"src/ListForge.Application/"*)
    if grep -Eq '^\s*using\s+(Supabase|Anthropic|Etsy)(\.|;)' <<<"$content"; then
      deny "Provider SDK (Supabase/Anthropic/Etsy) used in Domain/Application. Vendors live in Infrastructure behind interfaces ($file)."
    fi
    if grep -Eq '^\s*using\s+Microsoft\.EntityFrameworkCore' <<<"$content"; then
      deny "EF Core referenced in Domain/Application. ORM concerns belong in Infrastructure ($file)."
    fi
    if grep -Eq '\bIRepository<' <<<"$content"; then
      deny "Generic IRepository<T> detected. Use per-aggregate repositories (IListingDraftRepository, etc.) — see architecture.md §Repository Pattern Guidance ($file)."
    fi
    ;;
esac

case "$file" in
  *"src/ListForge.Domain/"*)
    if grep -Eq ':\s*INotification\b|MediatR\.INotification' <<<"$content"; then
      deny "MediatR domain event (INotification) added in Domain. v1 explicitly forbids domain events — see architecture.md §Non-Goals ($file)."
    fi
    ;;
esac

# --- Frontend vendor isolation ------------------------------------------------

case "$file" in
  *"frontend/src/"*)
    if grep -Eq "['\"]@supabase/supabase-js['\"]|['\"]@anthropic-ai/sdk['\"]" <<<"$content"; then
      deny "Frontend imported a provider SDK directly. The React app must only call the ListForge backend — see architecture.md §Authentication and Authorization ($file)."
    fi
    if grep -Eq "https?://[^\"'[:space:]]*(etsy\.com|api\.anthropic\.com|\.supabase\.co)" <<<"$content"; then
      deny "Frontend points at a third-party API (Etsy/Anthropic/Supabase). All external calls must go through the ListForge backend ($file)."
    fi
    ;;
esac

exit 0
