# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Status

This repo currently contains only planning documents — no code, no build tooling, no tests yet. Treat the three spec files as the source of truth until they are superseded by code or newer decisions:

- `docs/PRD.md` — product requirements, feature list (F1–F8), decisions already made.
- `docs/architecture.md` — implementation guidance; explicitly the "default architectural source of truth" for v1.
- `docs/spec-ui.md` — screens, flows, tone, copy, responsive behavior.

When implementing, read the relevant spec section first. If a decision is marked "open" or missing, stop and ask rather than inventing product behavior (this is called out explicitly in `docs/architecture.md`).

## What ListForge Is

A web app that helps independent Etsy sellers (initial wedge: jewelry makers) generate SEO-optimized listings from photos plus a short prompt, using AI. Reusable per-shop guidance profiles ("Shop Rules") are applied at generation time. Target user is non-technical — flows are wizard-driven and copy stays plain-language.

## Intended Architecture (v1)

Modular monolith, not microservices. Backend REST API + separate React SPA. The frontend must never talk directly to the database, Etsy, or any AI provider — only to the ListForge backend.

### Solution layout

```
/src
  /ListForge.API              ASP.NET Core entry point, controllers, DI composition root
  /ListForge.Application      Use cases, MediatR command/query handlers, validation
  /ListForge.Domain           Aggregates, value objects, repository + service contracts
  /ListForge.Infrastructure   EF Core, Identity, JWT issuance, local storage, Claude, Etsy implementations
  /ListForge.Contracts        API request/response DTOs (kept separate from domain)
/frontend
  /src                        React + Vite + Tailwind + shadcn/ui
```

### Tech stack

- Backend: ASP.NET Core (C#), EF Core (code-first migrations) on Postgres, MediatR for CQRS (added when first use case appears).
- Database: Postgres. Dev runs in `docker compose` (devcontainer attaches to the same compose network so the IPv4/IPv6 thing the free tier of Supabase forced on us doesn't recur). Production host deferred — Neon free tier is the leading candidate, but no commitment yet.
- Auth: ASP.NET Core Identity stores users in our Postgres; we issue symmetric-key JWTs via `JwtTokenIssuer`. The frontend treats the access/refresh pair as opaque tokens.
- File storage: `LocalFileStorage` (filesystem) in dev. Cloud object storage via `IFileStorage` is deferred until publish-flow work needs it.
- AI: Claude (Anthropic) — behind `IImageAnalysisService` / `IListingGenerationService`.
- Etsy: API v3 — behind a dedicated integration service boundary (anti-corruption layer).
- Frontend state: React Query (server state) + React Hook Form (large forms). Add Zustand only if wizard complexity forces it.
- Routing: route-based wizard steps (`/create/photos`, `/create/details`, …) so resume and deep-linking work.

### Logical modules (bounded contexts, all in one deployable)

`Identity`, `ShopRules`, `Listings`, `Intelligence`, `EtsyIntegration`. Cross-module calls go through application services, not direct data access.

## Non-Obvious Conventions

### Test-Driven Development is mandatory
Every production change follows Red → Green → Refactor: write the failing test first, make it pass with the smallest change, then refactor. The `.claude/hooks/check-tdd.sh` PreToolUse hook **blocks** writes to production files when no matching test file exists on disk, and the `tdd-reviewer` agent catches drift at PR time. The `new-usecase`, `new-aggregate`, `new-endpoint`, and `feature-tdd` skills scaffold the failing test(s) first by design.

Tests must also be **green at end-of-turn**: the `.claude/hooks/run-affected-tests.sh` Stop hook runs `pnpm typecheck` + `vitest --changed` on touched frontend files, `playwright test` when any frontend or `tests-e2e/` file is touched, and `dotnet test` on touched backend test projects. Blocks the turn from ending if any fail. Set `LISTFORGE_SKIP_STOP_TESTS=1` to bypass for doc-only or planning sessions.

Test projects live under `/tests/ListForge.{Domain,Application,Infrastructure,API}.Tests`. Frontend component tests are co-located as `ComponentName.test.tsx`. End-to-end Playwright specs live under `tests-e2e/` and run in real Chromium (the Playwright config auto-starts the Vite dev server and the .NET API). Each user-facing **page** under `frontend/src/pages/` is required by `check-tdd.sh` to have both a sibling Vitest test and a matching `tests-e2e/<name>.spec.ts`. Frontend test infrastructure (custom `render`, jest-dom setup) lives under `frontend/src/test/`; canonical patterns are in `docs/testing.md`. Locked framework choices: xUnit + FluentAssertions + NSubstitute for backend, Vitest + React Testing Library for frontend components, Playwright for end-to-end. See `docs/architecture.md §Testing Strategy` for the full contract (test types per layer, Testcontainers for repos, no vendor-SDK mocking, coverage expectations, naming).

The repo is a pnpm workspace (`pnpm-workspace.yaml` lists `frontend` as the only child package; the repo root is the workspace root). Run `pnpm install` from the repo root — it installs both root and `frontend/` deps into a single `.pnpm` content-addressable store at `node_modules/.pnpm/`. `@playwright/test` and `@axe-core/playwright` are declared in **both** the root `package.json` (so they resolve from `tests-e2e/*.spec.ts`, which lives outside `frontend/`) and `frontend/package.json` (so the Playwright runner and VS Code Playwright Test extension can resolve them from `frontend/playwright.config.ts`). The two versions MUST stay byte-identical and exact-pinned (no caret) — pnpm only dedupes to a single on-disk install and a single module instance when the specifiers match exactly. Bumping one side without the other produces two `@playwright/test` instances and Playwright fails fast with `Requiring @playwright/test second time`.

### Live verification with the Playwright MCP
The repo ships an `.mcp.json` that registers the official `@playwright/mcp` server. After you approve it on first use (`claude mcp list`), the assistant can drive a real Chromium browser during a task — navigate routes, click controls, take screenshots, inspect the DOM. Use it to iterate on a feature until it visibly works, not just until tests pass. The dev server can be started in the background with `pnpm --dir frontend dev` and torn down at end-of-task.

### Vendor abstraction is load-bearing
Every external provider (Claude, Etsy) and every infrastructure-shaped concern (persistence, auth, file storage) must be hidden behind a Domain-level interface with the implementation in Infrastructure. Do not pass provider SDK clients through application logic, and do not let raw provider payloads reach domain state — normalize into application DTOs first. Switching providers — for example, swapping `LocalFileStorage` for an S3/R2-backed implementation — should only touch Infrastructure.

### Synchronous by default
Start with synchronous image analysis + listing generation. Do not introduce job queues, polling, SignalR, or background workers unless AI latency forces it. If that day comes, add a `GenerationJob` abstraction rather than restructuring.

### No versioning, no domain events (v1)
Drafts and Shop Rules have no history/versioning. Don't add domain events, workflow engines, or rule-expression parsers. Shop Rules are simple structured fields plus freeform text — not a rules engine.

### Drafts are first-class
`ListingDraft` is the aggregate root for the create-listing flow and persists across the whole wizard (current step, images, selected Shop Rules, prompt, generated fields, user edits, publish status). Don't infer draft state from partial listing data.

### Repositories are per-aggregate
One repository per aggregate root (`IListingDraftRepository`, `IShopRuleProfileRepository`, `IEtsyConnectionRepository`). No generic repositories. Read-heavy list screens may use simple query services in the Application layer.

### User-scoped authorization everywhere
Every list/read/update/delete must be scoped to the current user. Enforce in application logic *and* reinforce in persistence queries. Use an `ICurrentUserAccessor` abstraction — no provider-specific token claims in handlers.

### Draft image lifecycle
Delete uploaded images after a successful publish. Retain them if publish fails so the user can retry. Centralize this in an application service (`IDraftImageService`), not controllers.

### Etsy publish failure
Never discard a draft on publish failure. Persist an error state, preserve assets and content, and make retry possible.

### UI copy rules (checked at review time)
The product is aimed at non-technical sellers. Use "Shop Rules" (never "Guardrail Profiles"), "Create Listing" (never "Generate Listing"), "Saved Drafts", "Describe your item". Don't expose confidence scores, taxonomy IDs, or internal AI/analysis details in user-facing copy. When AI is uncertain, leave the field blank with soft helper text — don't guess.

### AI-generated fields stay editable
All listing fields are always editable (no hidden edit modes). AI-generated fields get a small "AI" badge. Regenerate-field and regenerate-all must warn before overwriting manual edits.

### Publish confirmation is mandatory
Publishing requires an explicit confirmation modal that mentions Etsy listing fees may apply and links to Etsy's fee page in a new tab.

### Accessibility is enforced (WCAG 2.1 AA)
Every PR is gated on AA conformance across four layers: `eslint-plugin-jsx-a11y` at `error` severity in `pnpm lint`; `vitest-axe` (`expect(await axe(container)).toHaveNoViolations()`) in component tests, with the configured wrapper at `frontend/src/test/axe.ts`; `@axe-core/playwright` in `tests-e2e/a11y.spec.ts` (helper at `tests-e2e/utils/a11y.ts`) — call `checkA11y(page)` after meaningful state changes in feature specs; and the `a11y-reviewer` agent on frontend PRs. Allowed text/background colour pairs and the full normative rule set live in `docs/spec-ui.md §Accessibility`. Adding a new colour token requires re-verifying contrast against the documented pairings.

**Always invoke the `a11y-reviewer` agent before declaring any frontend feature done.** This is non-negotiable, not "if it looks risky". The automated layers catch ~⅓ of WCAG; the agent reasons about the rest (color-only signaling, focus management, modal contracts, live regions, suppression justifications). Run it on the diff after the feature's tests are green and before reporting completion to the user. Skip only for backend-only or doc-only changes.

### .gitignore stays current
When you add a new dependency, tool, or feature that produces artifacts (build outputs, caches, logs, generated dirs) or accepts secrets via files (`.env`, `*.pem`, `credentials.json`, …), update `.gitignore` in the same change. The `.claude/hooks/check-gitignore.sh` PreToolUse hook **blocks** writes to secret-shaped paths and **warns** when a write lands at an artifact-shaped path that isn't already ignored; the matching `.claude/hooks/check-untracked-ignorable.sh` Stop hook re-scans untracked files at end-of-turn. Bypass with `LISTFORGE_SKIP_GITIGNORE_HOOK=1` only for one-off exploration, and verify the working tree afterwards with `git status --ignored`. The CI `secret-scan.yml` (gitleaks) is a post-commit backstop, not a substitute for keeping `.gitignore` correct.

## Suggested Build Order

From `docs/architecture.md` §"Suggested Initial Build Order": scaffolding → config/secrets → auth boundary → Etsy connection → Shop Rules CRUD → Draft CRUD → draft images → generation → edit save → field regeneration → publish → existing-listing browse/edit → observability → cleanup.

## Commands

The solution is scaffolded. All commands run from the repo root unless noted.

### Onboarding (use the devcontainer)
The devcontainer at `.devcontainer/` is the canonical dev path. From VS Code: command palette → **Dev Containers: Reopen in Container**. `postCreateCommand` runs `.devcontainer/post-create.sh` (restores .NET, runs `pnpm install`, apt-installs Chromium runtime libs + Xvfb, runs `playwright install chromium`). When you pull a branch that changes `package.json`/`pnpm-lock.yaml`, accept the rebuild prompt — `updateContentCommand` re-runs `pnpm install` and `playwright install chromium` automatically. Inside the devcontainer there is no need to run `npx playwright install` or set `LISTFORGE_SKIP_PREPUSH_E2E`.

### Toolchain
- .NET 9 SDK (`net9.0`). The user-space install lives at `~/.dotnet`.
- Node 20 LTS via nvm (`~/.nvm`). pnpm via Corepack.
- `dotnet-ef` is pinned as a local tool in `.config/dotnet-tools.json`. Run `dotnet tool restore` after cloning so `dotnet ef ...` works for migrations.
- A sourceable env file is provided at `/tmp/listforge-env.sh`. Source it before running build/test/run commands so that `dotnet 9.0.x`, `node 20`, and `pnpm` are on PATH:
  ```
  source /tmp/listforge-env.sh
  ```

### Backend
- `dotnet build ListForge.sln` — restore + compile all 9 projects.
- `dotnet test ListForge.sln` — run all xUnit projects. `AuthControllerTests` use Testcontainers and skip cleanly when Docker isn't available.
- `dotnet run --project src/ListForge.API` — local dev server on `http://localhost:5050`. Auto-applies pending EF migrations on startup in Development. Endpoints: `GET /api/health`, `GET /api/health/db`, `GET /api/hello`, `POST /api/auth/{register,login,refresh}`.
- `dotnet ef migrations add <Name> --project src/ListForge.Infrastructure --startup-project src/ListForge.API --output-dir Persistence/Migrations` — generate a new migration after a model change.

### Frontend
- `cd frontend && pnpm install` — install dependencies.
- `pnpm test` (in `frontend/`) — Vitest single-run with React Testing Library + jsdom.
- `pnpm test:watch` — watch mode.
- `pnpm typecheck` — `tsc --noEmit`.
- `pnpm dev` — Vite dev server on `http://localhost:5173`. `/api/*` is proxied to the backend on port 5050.
- `pnpm build` — production build to `frontend/dist/`.

### Hooks
The PreToolUse hooks at `.claude/hooks/check-layer-imports.sh` and `.claude/hooks/check-tdd.sh` fire automatically on Write/Edit. They block edits that violate architectural boundaries or skip the Red test.

The PostToolUse hook at `.claude/hooks/check-lint.sh` runs after each Write/Edit and warns (non-blocking, stderr) on lint findings: ESLint for `frontend/**/*.{ts,tsx,js,jsx}`, `dotnet format whitespace --verify-no-changes` for `.cs` files under `src/` and `tests/`, and `jq empty` for `.json` files. Set `LISTFORGE_SKIP_LINT_HOOK=1` to bypass; the hook also fails open if the relevant toolchain isn't on PATH.

### Push gate (block pushes to `main` on red tests)
Two layers protect `main`:

- **Local pre-push hook** at `.githooks/pre-push`. Runs `dotnet test ListForge.sln`, `pnpm typecheck`, `pnpm lint` (jsx-a11y errors block here), `pnpm test` (includes vitest-axe), and `playwright test` (includes the axe-core e2e a11y spec) whenever the push would update `refs/heads/main`. Other branches push freely. E2E runs by default and is expected to pass inside the listforge devcontainer (Chromium libs are pre-installed via `post-create.sh`). The `LISTFORGE_SKIP_PREPUSH_E2E=1 git push` opt-out is intended for non-listforge containers / vanilla Codespaces where libglib, libnss, … aren't on the system. Enable the hook once after cloning:
  ```
  ./scripts/setup-hooks.sh
  ```
  Bypass in emergencies with `LISTFORGE_SKIP_PREPUSH=1 git push` (CI still gates).
- **GitHub Actions workflow** at `.github/workflows/main-gate.yml`. Runs the same three suites as parallel jobs (`backend`, `frontend`, `e2e`) on every push to `main` and every PR targeting `main`. Pair with a branch-protection rule requiring those checks to keep red code off `main`.
