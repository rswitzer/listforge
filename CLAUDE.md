# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Status

This repo currently contains only planning documents — no code, no build tooling, no tests yet. Treat the three spec files as the source of truth until they are superseded by code or newer decisions:

- `PRD.md` — product requirements, feature list (F1–F8), decisions already made.
- `architecture.md` — implementation guidance; explicitly the "default architectural source of truth" for v1.
- `spec-ui.md` — screens, flows, tone, copy, responsive behavior.

When implementing, read the relevant spec section first. If a decision is marked "open" or missing, stop and ask rather than inventing product behavior (this is called out explicitly in `architecture.md`).

## What ListForge Is

A web app that helps independent Etsy sellers (initial wedge: jewelry makers) generate SEO-optimized listings from photos plus a short prompt, using AI. Reusable per-shop guidance profiles ("Shop Rules") are applied at generation time. Target user is non-technical — flows are wizard-driven and copy stays plain-language.

## Intended Architecture (v1)

Modular monolith, not microservices. Backend REST API + separate React SPA. The frontend must never talk directly to Supabase, Etsy, or any AI provider — only to the ListForge backend.

### Solution layout

```
/src
  /ListForge.API              ASP.NET Core entry point, controllers, DI composition root
  /ListForge.Application      Use cases, MediatR command/query handlers, validation
  /ListForge.Domain           Aggregates, value objects, repository + service contracts
  /ListForge.Infrastructure   Supabase, Claude, Etsy, storage, auth implementations
  /ListForge.Contracts        API request/response DTOs (kept separate from domain)
/frontend
  /src                        React + Vite + Tailwind + shadcn/ui
```

### Tech stack

- Backend: ASP.NET Core (C#), EF Core (code-first migrations), MediatR for CQRS.
- Data/storage/auth: Supabase (Postgres, Storage, Auth) — all behind interfaces in Domain.
- AI: Claude (Anthropic) — behind `IImageAnalysisService` / `IListingGenerationService`.
- Etsy: API v3 — behind a dedicated integration service boundary (anti-corruption layer).
- Frontend state: React Query (server state) + React Hook Form (large forms). Add Zustand only if wizard complexity forces it.
- Routing: route-based wizard steps (`/create/photos`, `/create/details`, …) so resume and deep-linking work.

### Logical modules (bounded contexts, all in one deployable)

`Identity`, `ShopRules`, `Listings`, `Intelligence`, `EtsyIntegration`. Cross-module calls go through application services, not direct data access.

## Non-Obvious Conventions

### Vendor abstraction is load-bearing
Every external provider (Supabase, Claude, Etsy) must be hidden behind a Domain-level interface with the implementation in Infrastructure. Do not pass provider SDK clients through application logic, and do not let raw provider payloads reach domain state — normalize into application DTOs first. Switching providers should only touch Infrastructure.

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

## Suggested Build Order

From `architecture.md` §"Suggested Initial Build Order": scaffolding → config/secrets → auth boundary → Etsy connection → Shop Rules CRUD → Draft CRUD → draft images → generation → edit save → field regeneration → publish → existing-listing browse/edit → observability → cleanup.

## Commands

No build, lint, or test commands exist yet — the solution hasn't been scaffolded. Update this section once `/src` and `/frontend` are created.
