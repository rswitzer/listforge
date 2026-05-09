#!/usr/bin/env bash
# Ensures Auth:JwtSecret is set in the .NET user-secrets store for the API
# project. AuthOptions.JwtSecret has [MinLength(32)] + ValidateOnStart, so the
# API refuses to boot without a real value. The user-secrets store lives at
# ~/.microsoft/usersecrets/ on the container filesystem (not a persistent
# volume), so it is wiped on every devcontainer rebuild. Idempotent: a no-op
# when the secret is already set. Safe to run from both postCreateCommand
# (initial seeding) and postStartCommand (re-seed after rebuild). Production
# gets its key from a real secret manager — this script only ever fires in a
# dev container.

set -euo pipefail

PROJECT="src/ListForge.API"

if ! command -v dotnet >/dev/null 2>&1; then
  echo "ensure-jwt-secret: dotnet not on PATH; skipping" >&2
  exit 0
fi

if dotnet user-secrets list --project "$PROJECT" 2>/dev/null | grep -q '^Auth:JwtSecret = '; then
  exit 0
fi

dotnet user-secrets set Auth:JwtSecret "$(openssl rand -hex 32)" --project "$PROJECT" >/dev/null
echo "ensure-jwt-secret: seeded fresh dev Auth:JwtSecret"
