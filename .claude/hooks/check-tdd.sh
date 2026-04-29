#!/usr/bin/env bash
# PreToolUse hook: blocks production-code writes/edits that lack a matching test.
# Exit 2 + stderr message = deny and surface reason to the model.
# See architecture.md §Testing Strategy and §Decision Log (TDD mandatory).

set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_common.sh
. "$SCRIPT_DIR/_common.sh"

file="$HOOK_FILE"

# Fail open when we have nothing to inspect.
[ -z "$file" ] && exit 0

# Project root — set by Claude Code when a hook fires; fall back to two-up from script dir.
root="${CLAUDE_PROJECT_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

# Normalize to a repo-relative path for globbing.
case "$file" in
  "$root"/*) rel="${file#"$root"/}" ;;
  /*)        rel="$file" ;;
  *)         rel="$file" ;;
esac

deny() {
  echo "[tdd] $1" >&2
  echo "[tdd] Write the failing test first (Red), then the production file. See architecture.md §Testing Strategy." >&2
  exit 2
}

# --- Always allow: the test file itself -------------------------------------

case "$rel" in
  tests/*|*/tests/*) exit 0 ;;
esac
case "$rel" in
  *.test.ts|*.test.tsx|*.spec.ts|*.spec.tsx) exit 0 ;;
esac

# --- Exempt paths (no test required) ----------------------------------------

# Backend exemptions.
case "$rel" in
  src/ListForge.API/Program.cs)                               exit 0 ;;
  src/ListForge.API/Startup.cs)                               exit 0 ;;
  src/ListForge.API/appsettings*.json)                        exit 0 ;;
  */Migrations/*)                                             exit 0 ;;
  */DbContext.cs|*/AppDbContext.cs|*/ListForgeDbContext.cs)   exit 0 ;;
  *Configuration.cs)                                          exit 0 ;;
  *ServiceCollectionExtensions.cs|*DependencyInjection.cs)    exit 0 ;;
  src/ListForge.Contracts/*)                                  exit 0 ;;
  *.csproj|*.sln|*.props|*.targets|*.json|*.yml|*.yaml|*.md)  exit 0 ;;
esac

# Domain *interfaces only* — repository contracts and service contracts don't need their own tests;
# their implementations do. Detect by filename prefix + interface-only content.
case "$rel" in
  src/ListForge.Domain/*/I*.cs|src/ListForge.Domain/I*.cs)
    if grep -Eq '\binterface[[:space:]]+I[A-Z]' <<<"$HOOK_CONTENT" && \
       ! grep -Eq '\b(class|record|struct)[[:space:]]+[A-Z]' <<<"$HOOK_CONTENT"; then
      exit 0
    fi
    ;;
esac

# Frontend exemptions.
case "$rel" in
  frontend/src/main.tsx|frontend/src/main.ts)   exit 0 ;;
  frontend/src/vite-env.d.ts)                   exit 0 ;;
  *.d.ts)                                       exit 0 ;;
  frontend/src/**/types.ts|frontend/src/types.ts) exit 0 ;;
  # Test infrastructure (setup files, fixtures, mocks) is exempt — it's not behavior under test.
  frontend/src/test/*|frontend/src/__tests__/*|frontend/src/**/test/setup.ts|frontend/src/**/__mocks__/*) exit 0 ;;
  *.css|*.scss|*.svg|*.png|*.jpg|*.jpeg|*.ico)  exit 0 ;;
esac

# Barrel exemption: index.ts[x] files that *only* re-export are exempt.
# Anything else (logic, default exports, components) under index.* must have a test.
case "$rel" in
  frontend/src/**/index.ts|frontend/src/**/index.tsx|frontend/src/index.ts|frontend/src/index.tsx)
    # Strip blank lines and `//`-comment lines, then check that every remaining
    # line is an `export … from …` re-export. If any non-export line survives,
    # it's not a true barrel and a test is required.
    body="$(printf '%s' "$HOOK_CONTENT" \
      | sed -E '/^[[:space:]]*$/d; /^[[:space:]]*\/\//d')"
    if [ -n "$body" ] && ! grep -Eqv '^[[:space:]]*export[[:space:]].*[[:space:]]from[[:space:]]' <<<"$body"; then
      exit 0
    fi
    ;;
esac

# --- Production files that require a test -----------------------------------

# Helper: is there any *Tests.cs in the given directory (repo-relative)?
dir_has_tests() {
  local dir="$1"
  [ -d "$root/$dir" ] || return 1
  find "$root/$dir" -maxdepth 1 -type f -name '*Tests.cs' -print -quit 2>/dev/null | grep -q .
}

# Helper: does a specific test file exist?
test_file_exists() {
  [ -f "$root/$1" ]
}

# Backend: .cs files under Domain / Application / Infrastructure / API Controllers.
if [[ "$rel" == src/ListForge.Domain/*.cs ]] || \
   [[ "$rel" == src/ListForge.Infrastructure/*.cs ]] || \
   [[ "$rel" == src/ListForge.API/Controllers/*.cs ]]; then

  # src/ListForge.X/Sub/Path/Name.cs → tests/ListForge.X.Tests/Sub/Path/NameTests.cs
  layer="${rel#src/ListForge.}"
  project="${layer%%/*}"                       # e.g., Domain, Infrastructure, API
  subpath="${layer#*/}"                        # e.g., Listings/ListingDraft.cs
  name_base="$(basename "$subpath" .cs)"
  sub_dir="$(dirname "$subpath")"

  # API test project name is "ListForge.API.Tests".
  case "$project" in
    API) test_project="ListForge.API.Tests" ;;
    *)   test_project="ListForge.${project}.Tests" ;;
  esac

  expected_file="tests/${test_project}/${sub_dir}/${name_base}Tests.cs"
  expected_dir="tests/${test_project}/${sub_dir}"

  if test_file_exists "$expected_file" || dir_has_tests "$expected_dir"; then
    exit 0
  fi

  deny "No test found for $rel (expected $expected_file)."
fi

# Application: folder-level match — any *Tests.cs in the mirrored feature folder counts.
if [[ "$rel" == src/ListForge.Application/*.cs ]]; then
  subpath="${rel#src/ListForge.Application/}"
  sub_dir="$(dirname "$subpath")"
  expected_dir="tests/ListForge.Application.Tests/${sub_dir}"

  if dir_has_tests "$expected_dir"; then
    exit 0
  fi

  name_base="$(basename "$subpath" .cs)"
  expected_file="${expected_dir}/${name_base}Tests.cs"
  deny "No test found for $rel (expected ${expected_file} or any *Tests.cs in ${expected_dir}/)."
fi

# Frontend pages (top-level routed screens): require BOTH a sibling Vitest test
# AND a matching Playwright spec under tests-e2e/. Pages are user-facing features;
# the e2e spec proves the screen works in a real browser, not just in jsdom.
case "$rel" in
  frontend/src/pages/*.tsx)
    page_name="$(basename "$rel" .tsx)"
    page_dir="$(dirname "$rel")"
    page_lower="$(printf '%s' "$page_name" | tr '[:upper:]' '[:lower:]')"

    sibling_test="${page_dir}/${page_name}.test.tsx"
    expected_e2e_exact="tests-e2e/${page_name}.spec.ts"
    expected_e2e_lower="tests-e2e/${page_lower}.spec.ts"

    if ! test_file_exists "$sibling_test"; then
      deny "No Vitest test for page $rel (expected $sibling_test)."
    fi

    if ! test_file_exists "$expected_e2e_exact" && ! test_file_exists "$expected_e2e_lower"; then
      deny "No Playwright spec for page $rel (expected $expected_e2e_exact or $expected_e2e_lower). Pages are user-facing features and must have an e2e spec."
    fi

    exit 0
    ;;
esac

# Frontend components/hooks (anything under src/ that isn't a page): require a
# sibling .test.tsx / .test.ts.
case "$rel" in
  frontend/src/*.tsx|frontend/src/*.ts)
    dir="$(dirname "$rel")"
    name_base="$(basename "$rel")"
    name_no_ext="${name_base%.*}"
    ext="${name_base##*.}"

    sibling_tsx="$dir/${name_no_ext}.test.tsx"
    sibling_ts="$dir/${name_no_ext}.test.ts"

    if test_file_exists "$sibling_tsx" || test_file_exists "$sibling_ts"; then
      exit 0
    fi

    deny "No test found for $rel (expected sibling ${name_no_ext}.test.${ext})."
    ;;
esac

# Nothing matched — fail open. Hook is scoped to paths it knows how to check.
exit 0
