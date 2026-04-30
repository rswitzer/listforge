#!/usr/bin/env bash
# PostToolUse hook: warns (non-blocking) on banned UI copy in frontend edits.
# Exit 0 with stderr notes = Claude sees a warning but the write succeeds.
# See docs/spec-ui.md §UX Copy Style and §Design Anti-Patterns.

set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_common.sh
. "$SCRIPT_DIR/_common.sh"

file="$HOOK_FILE"
content="$HOOK_CONTENT"

[ -z "$file" ] && exit 0
[ -z "${content// }" ] && exit 0

# Only inspect frontend user-facing files.
case "$file" in
  *"frontend/src/"*) : ;;
  *) exit 0 ;;
esac
case "$file" in
  *.tsx|*.jsx|*.ts|*.js|*.md|*.mdx|*.html) : ;;
  *) exit 0 ;;
esac

warn() { echo "[ui-copy] $1" >&2; }

if grep -Eiq 'guardrail[[:space:]]+profile' <<<"$content"; then
  warn "'Guardrail Profiles' → use 'Shop Rules' in user-facing copy (docs/spec-ui.md §UX Copy Style)."
fi
if grep -Eiq '\bguardrails?\b' <<<"$content"; then
  warn "'Guardrail(s)' detected — prefer 'Shop Rules' unless this is an internal comment."
fi
if grep -Eiq 'generate[[:space:]]+listing' <<<"$content"; then
  warn "'Generate Listing' → use 'Create Listing' for the main action (docs/spec-ui.md §Information Architecture)."
fi
if grep -Eiq 'inference results|confidence output|taxonomy mapping|structured attributes' <<<"$content"; then
  warn "Technical AI terminology detected. Use soft helper text per docs/spec-ui.md §Uncertainty handling."
fi
if grep -Eiq 'confidence[[:space:]]+score|confidence:[[:space:]]*[0-9]' <<<"$content"; then
  warn "Exposed confidence score detected. docs/spec-ui.md forbids surfacing raw confidence — use phrases like 'Please double-check this field.'"
fi

exit 0
