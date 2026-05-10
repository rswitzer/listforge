#!/usr/bin/env bash
# PreToolUse hook: keep secrets out of the repo.
#
#   - BLOCK (exit 2) writes to secret-shaped paths (.env, *.pem, id_rsa, ...).
#     The CI gitleaks job is a post-commit backstop; this hook is the
#     pre-commit gate.
#
# Artifact-path warnings (build outputs, caches, logs that aren't gitignored)
# live in the check-untracked-ignorable.sh Stop hook, which scans the whole
# working tree at end-of-turn.
#
# Bypass: LISTFORGE_SKIP_GITIGNORE_HOOK=1.

set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_common.sh
. "$SCRIPT_DIR/_common.sh"

[ "${LISTFORGE_SKIP_GITIGNORE_HOOK:-0}" = "1" ] && exit 0

file="$HOOK_FILE"
[ -z "$file" ] && exit 0

root="${CLAUDE_PROJECT_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

# Normalize to a repo-relative path (matches check-tdd.sh).
case "$file" in
  "$root"/*) rel="${file#"$root"/}" ;;
  /*)        rel="$file" ;;
  *)         rel="$file" ;;
esac

base="$(basename "$rel")"

# ---- Secrets allowlist + denylist -----------------------------------------

# Allowlist first. Templates and public keys are never secrets.
# (`*` matches the empty string, so `*.env.example` covers both
# `.env.example` and `app.env.example`.)
case "$base" in
  *.env.example|*.env.sample|*.env.template) exit 0 ;;
  *.pub)                                     exit 0 ;;
esac

deny_secret() {
  echo "[gitignore] Refusing to write secret-shaped path: $rel." >&2
  echo "[gitignore] If this is a real secret, store it outside the repo (env var, secret manager)." >&2
  echo "[gitignore] If this is a sample/template, use .env.example or a *.template suffix." >&2
  echo "[gitignore] Bypass once with LISTFORGE_SKIP_GITIGNORE_HOOK=1 if you know what you're doing." >&2
  exit 2
}

# Env-file family: any .env* basename that didn't hit the allowlist above.
case "$base" in
  .env|.env.*) deny_secret ;;
esac

# Private key / cert material by extension.
case "$base" in
  *.pem|*.key|*.pfx|*.p12) deny_secret ;;
esac

# Common credentials filenames.
case "$base" in
  credentials.json|secrets.json|service-account*.json|serviceAccount*.json) deny_secret ;;
esac

# SSH private keys by name.
case "$base" in
  id_rsa|id_dsa|id_ecdsa|id_ed25519) deny_secret ;;
esac

# Anything explicitly tagged "private".
case "$base" in
  *.private|*.private.*) deny_secret ;;
esac

exit 0
