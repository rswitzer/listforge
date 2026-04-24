#!/usr/bin/env bash
# Shared helpers for Claude Code hooks. Sourced by other hook scripts.
# Reads a JSON payload on stdin and exposes:
#   HOOK_PAYLOAD   raw JSON
#   HOOK_FILE      tool_input.file_path
#   HOOK_CONTENT   merged candidate text: new_string + content (whichever are present)

set -u

HOOK_PAYLOAD="$(cat)"

if ! command -v jq >/dev/null 2>&1; then
  # Missing jq: fail open so hooks never block the user on tooling gaps.
  echo "[hook] jq not installed; skipping check" >&2
  exit 0
fi

HOOK_FILE="$(printf '%s' "$HOOK_PAYLOAD" | jq -r '.tool_input.file_path // ""')"
HOOK_NEW="$(printf '%s' "$HOOK_PAYLOAD" | jq -r '.tool_input.new_string // ""')"
HOOK_BODY="$(printf '%s' "$HOOK_PAYLOAD" | jq -r '.tool_input.content // ""')"
HOOK_CONTENT="$HOOK_NEW
$HOOK_BODY"

export HOOK_PAYLOAD HOOK_FILE HOOK_CONTENT
