# ListForge

A web app that helps independent Etsy sellers (initial wedge: jewelry makers) generate SEO-optimized listings from photos plus a short prompt. Reusable per-shop guidance profiles ("Shop Rules") are applied at generation time. Target user is non-technical; flows are wizard-driven and copy stays plain-language.

> **Status:** project scaffolding only. The five backend projects, four test projects, and the Vite + React frontend are wired and produce a working hello-world page. v1 features (F1–F8) are not implemented yet.

## Source of truth

- [`docs/PRD.md`](./docs/PRD.md) — product requirements and feature list.
- [`docs/architecture.md`](./docs/architecture.md) — implementation guidance, testing strategy, decision log.
- [`docs/spec-ui.md`](./docs/spec-ui.md) — screens, flows, tone, copy, responsive rules.
- [`CLAUDE.md`](./CLAUDE.md) — repo-level guidance for working with Claude Code in this codebase.

If a feature isn't covered in those docs, stop and ask before inventing product behavior.

## Tech stack

| Layer | Tech |
| --- | --- |
| Backend | ASP.NET Core 9 (`net9.0`), MediatR (later), EF Core (later) |
| Frontend | React 18 + Vite + TypeScript + Tailwind |
| Tests | xUnit + FluentAssertions + NSubstitute (backend); Vitest + React Testing Library (frontend components); Playwright (end-to-end, Chromium) |
| Auth / DB / Storage | Supabase, abstracted behind interfaces in `Domain` |
| AI | Claude (Anthropic), behind `IImageAnalysisService` / `IListingGenerationService` |
| Etsy | Etsy API v3, behind a dedicated integration boundary |

External vendor SDKs only ever live in `ListForge.Infrastructure`. The frontend never talks to Supabase, Anthropic, or Etsy directly.

## Project structure

```
src/
  ListForge.API             ASP.NET Core entry point, controllers, DI
  ListForge.Application     Use cases, MediatR handlers, validation
  ListForge.Domain          Aggregates, value objects, repository contracts
  ListForge.Infrastructure  Vendor implementations (Supabase, Claude, Etsy)
  ListForge.Contracts       API request/response DTOs
tests/
  ListForge.Domain.Tests
  ListForge.Application.Tests
  ListForge.Infrastructure.Tests
  ListForge.API.Tests       (HelloEndpointTests is the canary)
frontend/
  src/components/HelloPanel.tsx + HelloPanel.test.tsx (TDD canary)
  src/App.tsx, src/main.tsx
.claude/
  agents/                   PR-time review agents
  hooks/                    PreToolUse/PostToolUse blockers
```

## Quick start — Dev Container (recommended)

The repo ships with a devcontainer that includes .NET 9, Node 20, and pnpm. No host-machine installs required beyond Docker.

### Option A — VS Code

1. Install [Docker](https://www.docker.com/) and [VS Code](https://code.visualstudio.com/) with the **Dev Containers** extension.
2. Open the repo folder in VS Code → command palette → **Dev Containers: Reopen in Container**.
3. Wait for `post-create.sh` to finish (`dotnet restore` + `pnpm install`).
4. In the integrated terminal: `dotnet run --project src/ListForge.API`.
5. In a second terminal: `cd frontend && pnpm dev`.
6. VS Code auto-forwards ports 5050 and 5173. Open `http://localhost:5173` in your browser.

### Option B — Devcontainers CLI (no VS Code)

```bash
# one-time install
pnpm add -g @devcontainers/cli

# from the repo root
devcontainer up --workspace-folder .
devcontainer exec --workspace-folder . dotnet test ListForge.sln
devcontainer exec --workspace-folder . bash -lc 'cd frontend && pnpm test'
```

To run the app: open two more shells and use `devcontainer exec --workspace-folder . ...` to start `dotnet run --project src/ListForge.API` and `cd frontend && pnpm dev`. The container publishes 5050 and 5173 to the host (via `appPort` in `devcontainer.json`), so `http://localhost:5173` works in your host browser.

### What's wired

- Base image: `mcr.microsoft.com/devcontainers/dotnet:1-9.0-bookworm`.
- Node 20 + pnpm via the official `ghcr.io/devcontainers/features/node` feature.
- Named volume on `frontend/node_modules` so the container's installs don't fight with the host's.
- `ASPNETCORE_URLS=http://+:5050` and `vite.config.ts` `host: true` so both servers are reachable through the published ports.
- Ports 5050 (API) and 5173 (Vite) auto-forwarded.

## Quick start — Host machine

You'll need .NET 9 SDK, Node 20+, and pnpm. The conversation that scaffolded this project installed them user-space:

- **.NET 9 SDK** — Microsoft's [`dotnet-install.sh`](https://learn.microsoft.com/dotnet/core/install/linux-scripted-manual#scripted-install) into `~/.dotnet`.
- **Node 20** via [nvm](https://github.com/nvm-sh/nvm).
- **pnpm** via `corepack enable pnpm`.

A convenience env file is at `/tmp/listforge-env.sh` (regenerate it locally if missing):

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 >/dev/null 2>&1 || true
export DOTNET_ROOT="$HOME/.dotnet"
export PATH="$HOME/.dotnet:$PATH"
```

Then:

```bash
source /tmp/listforge-env.sh
dotnet build ListForge.sln
dotnet test ListForge.sln
cd frontend && pnpm install && pnpm test
```

## Running the app locally

Two terminals:

```bash
# terminal 1 — API on :5050
dotnet run --project src/ListForge.API

# terminal 2 — Vite on :5173, /api/* proxied to :5050
cd frontend && pnpm dev
```

Open `http://localhost:5173` in a browser. You should see "Hello, ListForge!" on a cream-colored card.

## Common commands

| Command | What it does |
| --- | --- |
| `dotnet build ListForge.sln` | Restore + compile all 9 projects. |
| `dotnet test ListForge.sln` | Run xUnit tests across the four `*.Tests` projects. |
| `dotnet run --project src/ListForge.API` | Start the API on `http://localhost:5050`. |
| `cd frontend && pnpm install` | Install JS dependencies. |
| `pnpm test` (in `frontend/`) | Single-run Vitest. |
| `pnpm test:watch` | Vitest watch mode. |
| `pnpm typecheck` | `tsc --noEmit`. |
| `pnpm e2e` (in `frontend/`) | Run Playwright specs in `tests-e2e/`. Auto-starts Vite + the .NET API. |
| `pnpm e2e:ui` | Same, with the interactive Playwright runner UI. |
| `pnpm dev` | Vite dev server with `/api` proxy. |
| `pnpm build` | Production frontend build to `frontend/dist/`. |

## Guardrails

This repo enforces a handful of rules through hooks, agents, and skills. They're set up in `.claude/`:

**PreToolUse hooks (blocking):**
- `check-layer-imports.sh` — denies vendor SDKs in `Domain`/`Application`, generic `IRepository<T>`, MediatR domain events, frontend imports of provider SDKs, or hard-coded third-party URLs in the frontend.
- `check-tdd.sh` — denies writes to production `.cs` / `.tsx` / `.ts` files unless a matching test file exists. Red → Green → Refactor is non-negotiable. Exemptions cover `Program.cs`, EF configurations, DTOs in `Contracts`, frontend shells, etc.

**Stop hook (blocking):**
- `run-affected-tests.sh` — at end-of-turn, runs `pnpm typecheck` + `vitest run --changed` on touched frontend files, `playwright test` if any frontend or `tests-e2e/` file changed, and `dotnet test` on touched backend test projects. Blocks the turn if any gate fails. Set `LISTFORGE_SKIP_STOP_TESTS=1` to bypass for doc-only or planning sessions.

**PostToolUse hook (warning only):**
- `check-ui-copy.sh` — flags banned UI strings ("Guardrail Profiles", "Generate Listing", exposed confidence scores, etc.).

**Reviewer agents** (in `.claude/agents/`): `architecture-reviewer`, `claude-api-reviewer`, `etsy-boundary-reviewer`, `shop-rules-domain-check`, `tdd-reviewer`, `ui-copy-linter`. Run them before opening a PR.

**Scaffolding skills**: `new-usecase`, `new-aggregate`, `new-endpoint` create the failing test first, then the production stub. `feature-tdd` does the same for new user-facing screens — it scaffolds the Playwright spec + Vitest page test + page stub, then runs both layers until they pass.

### Live verification (Playwright MCP)
The repo ships an `.mcp.json` registering Microsoft's official Playwright MCP server. On first use, run `claude mcp list` and approve it; subsequent Claude Code sessions can drive a real Chromium browser to navigate routes, click controls, take screenshots, and verify features visually — not just via test runners. Pair it with `pnpm --dir frontend dev` started in the background to iterate on a feature until it actually works on screen.

## Conventions to know before contributing

- TDD is mandatory. Write the failing test first.
- One repository per aggregate root (`IListingDraftRepository`, never `IRepository<T>`).
- Every list/read/update/delete is user-scoped (`ICurrentUserAccessor`).
- Vendor SDKs (Supabase, Anthropic, Etsy) only inside `ListForge.Infrastructure`.
- v1 has **no** versioning, **no** domain events, **no** job queues, **no** rules engine — `docs/architecture.md §Non-Goals` is the canonical list.
- UI copy uses friendly language. "Shop Rules", not "Guardrail Profiles". "Create Listing", not "Generate Listing".
- Frontend test patterns (custom `render`, role-first queries, AI-surface assertions, copy rule) are in [`docs/testing.md`](./docs/testing.md).

See `docs/architecture.md` and `docs/spec-ui.md` for the full set.

## Endpoints (so far)

| Verb | Route | Returns |
| --- | --- | --- |
| GET | `/api/health` | `{ "status": "ok" }` |
| GET | `/api/hello` | `{ "message": "Hello, ListForge!" }` |
