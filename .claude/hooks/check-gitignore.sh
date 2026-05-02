#!/usr/bin/env bash
# PreToolUse hook: keep secrets out of the repo and nudge .gitignore
# updates when new build/cache artifacts appear.
#
#   - BLOCK (exit 2) writes to secret-shaped paths (.env, *.pem, id_rsa, ...).
#     The CI gitleaks job is a post-commit backstop; this hook is the
#     pre-commit gate.
#   - WARN (exit 0 + stderr) when a write lands at an artifact-shaped path
#     that `git check-ignore` says is not currently ignored. The model
#     should add a matching pattern to .gitignore in the same change.
#
# Bypass: LISTFORGE_SKIP_GITIGNORE_HOOK=1.
# Fails open if git is missing.

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

# ---- Pass A: secrets allowlist + denylist ---------------------------------

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

# ---- Pass B: artifact-shaped path that isn't gitignored -------------------

# Directory-segment matches. Use a leading "/" to anchor segment boundaries
# and avoid matching on substrings inside legitimate names.
in_artifact_dir=0
case "/$rel/" in
  */dist/*|*/build/*|*/out/*|*/target/*) in_artifact_dir=1 ;;
  */coverage/*|*/.nyc_output/*)          in_artifact_dir=1 ;;
  */node_modules/*|*/bin/*|*/obj/*)      in_artifact_dir=1 ;;
  */.cache/*|*/.parcel-cache/*|*/.next/*|*/.turbo/*|*/.vite/*) in_artifact_dir=1 ;;
  */__pycache__/*)                        in_artifact_dir=1 ;;
  */playwright-report/*|*/test-results/*) in_artifact_dir=1 ;;
esac

# File-name / extension matches.
in_artifact_file=0
case "$base" in
  *.log|*.tsbuildinfo|*.coverage|*.coveragexml|*.pyc) in_artifact_file=1 ;;
  .DS_Store|Thumbs.db)                                 in_artifact_file=1 ;;
esac

if [ "$in_artifact_dir" = "0" ] && [ "$in_artifact_file" = "0" ]; then
  exit 0
fi

# Ask git whether this path is already ignored. If git isn't on PATH,
# fail open per the project hook convention.
if ! command -v git >/dev/null 2>&1; then
  exit 0
fi

if git -C "$root" check-ignore -q "$rel" 2>/dev/null; then
  exit 0
fi

echo "[gitignore] $rel looks like a build artifact / cache but is not gitignored." >&2
echo "[gitignore] Add a matching pattern to .gitignore in this change, or commit deliberately." >&2
exit 0
