# ListForge Architecture Guide

## Purpose

This document provides implementation guidance for building ListForge as a simple, maintainable v1 application. It is optimized for use by Claude Code during implementation. It should be treated as the default architectural source of truth unless a newer architecture decision explicitly replaces part of it.

The goal is to build a clean modular monolith with strong boundaries, low operational complexity, and enough internal structure to support future refactoring without prematurely building a distributed system.

## Architectural Goals

- Keep v1 as simple as possible.
- Use a modular monolith, not microservices.
- Prefer clarity and delivery speed over abstraction depth.
- Preserve future portability.
- Hide all external vendors behind interfaces and dependency injection.
- Use REST and standard HTTP best practices.
- Keep frontend concerns independent from infrastructure implementation choices.
- Favor straightforward synchronous request flows unless there is a clear need for background processing.
- Avoid unnecessary domain-event or workflow-engine complexity in v1.

## Non-Goals for v1

- No microservice deployment.
- No event-driven architecture.
- No workflow orchestration platform.
- No frontend coupling to Supabase, Etsy SDKs, or AI providers.
- No version-history system for drafts, Shop Rules, or generated content.
- No generic framework-heavy abstractions that reduce clarity.

## Recommended System Shape

ListForge should be implemented as a backend REST API plus a separate React frontend. The backend owns business logic, persistence orchestration, authentication verification, AI provider access, file-storage access, and Etsy integration.

The frontend should only communicate with the ListForge backend API.

### High-level flow

```text
React Frontend
    ↓
ListForge REST API (ASP.NET Core)
    ↓
Application + Domain + Infrastructure
    ├── Postgres persistence
    ├── File storage
    ├── Auth provider
    ├── AI provider
    └── Etsy API integration
```

## Deployment Strategy

For v1, deployment should be simple.

Recommended approach:
- Deploy the ASP.NET Core API as a single service.
- Deploy the React frontend separately as a static web app or simple frontend host.
- Use managed Postgres and object storage through the current infrastructure provider.
- Do not require Kubernetes for v1.

Portability requirement:
- Infrastructure implementations must be swappable through interfaces.
- Deployment choices should not leak into the application or domain layers.

## Solution Structure

Recommended solution structure:

```text
/src
  /ListForge.API
  /ListForge.Application
  /ListForge.Domain
  /ListForge.Infrastructure
  /ListForge.Contracts
/frontend
  /src
```

### Responsibility by project

#### ListForge.API
- ASP.NET Core entry point.
- Routing.
- Authentication middleware.
- DI composition root.
- Exception handling.
- HTTP concerns only.
- Mapping between HTTP layer and application layer.

#### ListForge.Application
- Use cases.
- Command/query handlers.
- Validation.
- Transaction coordination.
- Orchestration across repositories and infrastructure-facing interfaces.
- DTO mapping where needed.

#### ListForge.Domain
- Aggregates.
- Entities.
- Value objects.
- Domain services if truly needed.
- Repository contracts.
- Service contracts for external dependencies required by application/domain boundaries.
- Business rules that should not live in controllers or infrastructure.

#### ListForge.Infrastructure
- Database persistence.
- File storage.
- Auth provider implementation.
- AI provider implementation.
- Etsy API implementation.
- Encryption and secrets-adjacent service implementations.
- Logging/tracing adapters if needed.

#### ListForge.Contracts
- HTTP request/response contracts.
- Shared DTOs crossing API boundaries.
- Keep these separate from domain entities.

## Modular Monolith Boundaries

Bounded contexts should exist as logical modules inside the monolith.

Recommended logical modules:
- Identity
- ShopRules
- Listings
- Intelligence
- EtsyIntegration

These are organizational boundaries, not separate deployables.

### Boundary guidance
- Modules may call each other through application services/interfaces, not through random cross-project data access.
- Avoid direct infrastructure leakage across module boundaries.
- Keep database schemas simple in v1; physical schema separation is optional.
- Optimize for understandable code, not theoretical purity.

## Architectural Style Recommendations

### API style
Use REST only for v1.

REST guidance:
- Resource-oriented routes.
- Correct HTTP verbs.
- Proper status codes.
- Idempotent semantics where appropriate.
- Clear validation errors.
- Pagination for list endpoints.
- Avoid RPC-style endpoint naming when a resource-oriented route works.

### Request processing style
Use synchronous request/response processing by default.

Recommendation for v1:
- Start with synchronous image analysis and listing generation if the end-to-end user experience is acceptable.
- If AI latency becomes too high, evolve to an asynchronous job pattern later without redesigning the entire domain model.

Reasoning:
- This keeps v1 much simpler.
- The UX is wizard-driven and can tolerate brief generation steps.
- Avoid introducing job orchestration, queue workers, polling, or SignalR until operationally necessary.

If future async support is needed, add a `GenerationJob` abstraction later without restructuring the entire solution.

## Authentication and Authorization

### Core rule
The frontend must never talk directly to Supabase or any underlying auth implementation.

### Recommended model
- The frontend authenticates only against the ListForge backend.
- The backend owns auth verification and session/token validation.
- Any concrete auth provider is hidden behind interfaces in Infrastructure.

### Guidance
- Do not expose Supabase-specific concepts to the frontend.
- Do not build frontend logic that depends on provider-specific token claims beyond what the backend contract exposes.
- Controllers and application handlers should work with an application-level current-user abstraction.

Recommended interface examples:
- `ICurrentUserAccessor`
- `IAuthService`
- `IUserRepository`

### Authorization rules for v1
- Every user can only access their own drafts, Shop Rules, Etsy connection, and listings.
- All list/read/update/delete operations must be user-scoped.
- Authorization checks should be explicit in application logic and reinforced in persistence queries.

## Persistence Model

### Recommendation
Store drafts as first-class application records in the app database.

Reasoning:
- Drafts are central to the wizard UX.
- Users need to leave and return later.
- Drafts should not be inferred indirectly from partial listing state.

### Core persistence entities for v1
Recommended records/entities:
- User
- EtsyConnection
- ShopRuleProfile
- ListingDraft
- ListingDraftImage
- PublishedListingReference

Optional supporting entities if needed:
- ListingRegenerationRecord (only if needed for debugging later, not required now)

### Draft model recommendation
Use `ListingDraft` as the main aggregate root for the create-listing flow.

It should own or reference:
- User ownership.
- Current wizard step.
- Uploaded images.
- Selected Shop Rules profile.
- User prompt.
- Generated field values.
- User-edited field values.
- Publish status.
- Draft metadata such as last saved timestamp.

This is the simplest model for v1 because it matches the product experience directly.

### State model
For v1, keep lifecycle states minimal.

Recommended draft states:
- Draft
- Publishing
- Published
- PublishFailed

Published Etsy listings edited through the app do not need full local historical copies beyond what is operationally required.

### Versioning
Do not implement versioning/history in v1.

A record is either:
- a draft/work-in-progress
- or published/synced state with operational metadata

## File and Image Storage

### Recommendation
Store uploaded images during draft creation and delete them after successful publish.

Behavior:
- Associate draft images to a `ListingDraft`.
- Retain while draft exists.
- Delete when publish succeeds.
- If publish fails, retain images while the draft remains recoverable.

Implementation note:
- Centralize image lifecycle rules in an application service, not controllers.

Recommended interface examples:
- `IFileStorageService`
- `IDraftImageService`

## Domain Modeling Guidance

### Simplicity first
Use simple domain modeling for v1.

Do:
- Model clear aggregates and invariants.
- Use value objects where they improve correctness.
- Keep business rules near the domain/application boundary.

Do not:
- Build a formal rules engine for Shop Rules.
- Over-model every field into deep type hierarchies.
- Introduce domain events unless a concrete need appears.

### Recommended aggregate roots
- `ListingDraft`
- `ShopRuleProfile`
- `EtsyConnection`

Potential supporting entities/value objects:
- `DraftImage`
- `ListingContent`
- `MaterialRule`
- `ListingStatus`
- `EtsyShopInfo`

### Shop Rules model
For v1, use simple structured fields plus freeform text.

Do not implement:
- expression parsers
- advanced rule composition
- user-defined condition trees

A simple shape is enough:
- name
- material rules
- excluded materials
- brand voice
- default tags
- shipping policy
- custom notes

## Repository Pattern Guidance

### Recommendation
Use repositories per aggregate root. Avoid generic repositories.

Why:
- Aggregate-specific repositories are easier to understand.
- They allow clearer intent in application code.
- Generic repositories often hide domain meaning and encourage anemic patterns.

Recommended repository contracts:
- `IListingDraftRepository`
- `IShopRuleProfileRepository`
- `IEtsyConnectionRepository`
- `IUserRepository` if needed

Repository responsibilities:
- Load aggregate roots.
- Persist aggregate roots.
- Provide aggregate-specific query methods needed by use cases.
- Avoid becoming a dumping ground for arbitrary reporting queries.

For read-heavy list screens, it is acceptable to use simple query services/read repositories in the application layer rather than forcing everything through domain repositories.

## Application Layer Guidance

### CQRS style
Use simple, pragmatic CQRS with MediatR.

Recommended approach:
- Separate commands from queries.
- Use one handler per use case.
- Keep handlers small and readable.
- Add validation where useful.
- Use minimal pipeline behaviors only when they add obvious value.

Do not build a ceremonious enterprise CQRS stack in v1.

### Recommended application services/use cases
Listings:
- Create draft
- Save draft progress
- Upload draft images
- Remove draft image
- Reorder draft images
- Generate listing from draft
- Regenerate field
- Regenerate full listing
- Publish draft to Etsy
- Load existing Etsy listing for edit
- Save existing listing changes to Etsy
- List user drafts
- Delete draft

Shop Rules:
- Create Shop Rule profile
- Update Shop Rule profile
- Delete Shop Rule profile
- List Shop Rule profiles

Etsy connection:
- Start Etsy OAuth flow
- Complete Etsy OAuth flow
- Get Etsy connection status
- Disconnect Etsy

### Transaction guidance
Use application-layer transaction boundaries around write use cases where appropriate.

Example:
- Save draft updates and draft metadata together.
- Publish flow should update local state consistently around Etsy calls and failure handling.

## AI Integration Guidance

The user chose to leave detailed AI orchestration decisions open for now. Therefore, the architecture should support AI integration cleanly without locking in premature complexity.

### Recommendation
Use application-facing interfaces with a simple provider implementation.

Recommended interfaces:
- `IImageAnalysisService`
- `IListingGenerationService`

Behavior guidance:
- Application handlers call these interfaces.
- Infrastructure implements them using the current AI provider.
- Keep provider-specific prompt or payload logic out of controllers and domain entities.

### Output handling
Even though structured-output requirements are not finalized, application code should be written as if provider output must be normalized into application DTOs before entering domain state.

Do not allow raw provider payloads to leak into core business logic.

## Etsy Integration Guidance

### Core rule
All Etsy communication must go through a dedicated integration service boundary.

Recommended interface examples:
- `IEtsyOAuthService`
- `IEtsyListingService`
- `IEtsyShopService`

### Token storage
For v1, storing Etsy OAuth tokens in the database is acceptable.

Requirements:
- Store securely.
- Keep encryption and secret-handling concerns in Infrastructure.
- Never expose raw tokens outside the required infrastructure/application paths.

### Publish semantics
Publishing and updating Etsy listings should always pass through a dedicated integration service with idempotency-aware behavior where possible.

Guidance:
- Avoid duplicating publish logic across handlers.
- Centralize Etsy request mapping and response handling.
- Treat Etsy as an external system boundary with retries, failures, and translation concerns.

### Failure handling
If Etsy publish fails:
- Do not discard the draft.
- Persist an error state.
- Allow the user to retry.
- Preserve uploaded assets and listing content while the draft remains unpublished.

## Frontend Architecture Guidance

### Core principle
The frontend should be simple and focused on UX composition, not infrastructure knowledge.

### Recommendation
Use:
- React Router for route-based screens.
- React Query for server state.
- React Hook Form for large forms.
- Local component state for small transient interactions.
- Add Zustand only if wizard complexity clearly outgrows simpler patterns.

Reasoning:
- React Query handles API-backed state well.
- React Hook Form fits large editable forms and validation needs.
- Route-based navigation makes wizard recovery and deep-linking easier.
- Avoid adding a global store unless it becomes necessary.

### Wizard routing recommendation
Use route-based wizard steps.

Example:
- `/create`
- `/create/photos`
- `/create/details`
- `/create/review`
- `/create/edit`
- `/create/publish`

Benefits:
- Better browser navigation.
- Easier resume behavior.
- Clearer analytics and debugging.
- Cleaner mental model than deeply nested in-memory wizard state.

### Form strategy
- Use a large form for the edit screen.
- Group fields into logical sections.
- Keep fields always editable.
- Autosave using debounced save operations or explicit save triggers per step as needed.
- Treat the backend as the source of truth for persisted draft state.

## API Design Guidance

### Endpoint design
Use resource-oriented endpoints.

Illustrative examples:
- `GET /api/me`
- `GET /api/etsy/connection`
- `POST /api/etsy/connection/start`
- `POST /api/etsy/connection/callback`
- `DELETE /api/etsy/connection`
- `GET /api/shop-rules`
- `POST /api/shop-rules`
- `PUT /api/shop-rules/{id}`
- `DELETE /api/shop-rules/{id}`
- `GET /api/drafts`
- `POST /api/drafts`
- `GET /api/drafts/{id}`
- `PUT /api/drafts/{id}`
- `DELETE /api/drafts/{id}`
- `POST /api/drafts/{id}/images`
- `DELETE /api/drafts/{id}/images/{imageId}`
- `POST /api/drafts/{id}/images/reorder`
- `POST /api/drafts/{id}/generate`
- `POST /api/drafts/{id}/regenerate-field`
- `POST /api/drafts/{id}/regenerate-all`
- `POST /api/drafts/{id}/publish`
- `GET /api/etsy/listings`
- `GET /api/etsy/listings/{listingId}`
- `PUT /api/etsy/listings/{listingId}`

These are examples, not immutable contracts.

### HTTP best practices
- Use `200 OK` for successful reads and updates.
- Use `201 Created` for create operations.
- Use `204 No Content` for delete when no body is needed.
- Use `400 Bad Request` for malformed input.
- Use `401 Unauthorized` and `403 Forbidden` correctly.
- Use `404 Not Found` when the resource does not exist or is not user-accessible.
- Use `409 Conflict` for state conflicts where appropriate.
- Use `422 Unprocessable Entity` for validation failures if preferred consistently.

### Error shape
Use a consistent API error contract.

Suggested shape:
- code
- message
- fieldErrors (optional)
- correlationId

Do not leak stack traces or provider internals in API responses.

## Observability and Logging

Observability should be included from the beginning using simple best practices.

### Logging requirements
Log key events for:
- Authentication failures
- Etsy OAuth flow start/completion/failure
- AI generation start/completion/failure
- Draft create/update/delete
- Publish attempts and outcomes
- External dependency failures

### Logging guidance
- Use structured logging.
- Include user ID when safe and appropriate.
- Include draft ID/listing ID where applicable.
- Include correlation/request IDs.
- Never log secrets, raw tokens, or sensitive payloads unnecessarily.

### Metrics/tracing guidance
At minimum, capture enough to answer:
- How often generation fails.
- How often publish fails.
- Average AI generation latency.
- Etsy API failure rates.
- Draft abandonment rate by wizard step.

Distributed tracing is optional in v1, but request correlation should exist.

## Configuration and Secrets

A formal configuration model is required.

### Guidance
- Use environment-variable-backed configuration.
- Separate configuration objects by concern.
- Validate required configuration at startup.
- Keep secrets out of source control.
- Centralize configuration binding in the API/Infrastructure boundary.

Recommended configuration areas:
- Database
- Storage
- Auth
- AI provider
- Etsy integration
- Encryption
- Logging/observability
- Frontend allowed origins

### Example configuration sections
- `Database`
- `Storage`
- `Auth`
- `AI`
- `Etsy`
- `Encryption`
- `Observability`

## Dependency Injection Guidance

Use interfaces and dependency injection consistently for all infrastructure-backed services.

Do:
- Register repositories and infrastructure services through DI.
- Depend on interfaces from Application/Domain.
- Keep concrete infrastructure wiring in API/Infrastructure composition code.

Do not:
- Instantiate infrastructure classes directly in handlers/controllers.
- Pass provider-specific SDK clients through application logic.
- Build unnecessary interface layers around purely internal helper classes unless they represent a true boundary.

## Error Handling Guidance

### General rule
Failures should be explicit, recoverable where possible, and translated into user-meaningful responses.

### Categories
- Validation errors
- Authorization/authentication errors
- External dependency failures
- Business-rule conflicts
- Unexpected system failures

### Publish/generation failure handling
- Preserve draft state on failure.
- Return a user-safe error message.
- Log technical details internally.
- Mark local state clearly enough for retry.

## Testing Strategy

### Test-Driven Development is mandatory
ListForge follows Red → Green → Refactor. For every new behavior:

1. **Red** — write a failing test that expresses the intended behavior.
2. **Green** — write the smallest production change that makes the test pass.
3. **Refactor** — clean up with the test as a safety net.

The failing test must be written before the production code. The `.claude/hooks/check-tdd.sh` PreToolUse hook blocks writes to production files that have no matching test on disk, and the `tdd-reviewer` agent catches drift at review time. The three scaffolding skills (`new-usecase`, `new-aggregate`, `new-endpoint`) produce the Red test first by design.

### Solution layout additions

```text
/tests
  /ListForge.Domain.Tests
  /ListForge.Application.Tests
  /ListForge.Infrastructure.Tests
  /ListForge.API.Tests
/frontend/src/**/*.test.tsx   (co-located with the component)
```

### Frameworks (locked)
- **Backend:** xUnit + FluentAssertions + NSubstitute.
- **Frontend (component):** Vitest + React Testing Library + `@testing-library/user-event`.
- **Frontend (end-to-end):** Playwright (Chromium-only). Specs live under `tests-e2e/`. Every user-facing feature has a Playwright spec alongside its Vitest tests; component-level behavior stays in Vitest.

Changes to these choices require an explicit addition to the Decision Log.

### Test types by layer

- **Domain.Tests** — pure unit tests on aggregates and value objects. No I/O, no DI container, no mocks. Construct objects directly and assert invariants.
- **Application.Tests** — handler-level unit tests. Use NSubstitute (or a hand-rolled fake) for repository interfaces and a test double for `ICurrentUserAccessor`. Every handler test file must cover: happy path, unauthorized user (different `UserId`), and validator failure when a validator exists.
- **Infrastructure.Tests** — integration tests against real Postgres via Testcontainers for repository and persistence code. In-process fakes for the Anthropic/Etsy client seams. Do **not** use an in-memory EF Core provider or SQLite substitute — they hide migration and query issues.
- **API.Tests** — endpoint integration tests built on `WebApplicationFactory<Program>`. Every endpoint has: a 2xx happy-path test, a 401 unauthenticated test, a 404 test for missing or other-user-owned resources, and a 422 test for invalid bodies. Register a test `ICurrentUserAccessor` in the factory's service overrides.
- **Frontend (component)** — component and interaction tests (Vitest + RTL). Assert observable behavior — user events, rendered text, role-based queries — not class names or internal state. Accessibility affordances (roles, labels, focus) are part of the behavior under test.
- **Frontend (end-to-end)** — Playwright specs in `tests-e2e/` covering full-route user flows in real Chromium. Each user-facing screen (a file under `frontend/src/pages/`) gets a sibling spec named `tests-e2e/<screen>.spec.ts`. The Playwright config auto-starts the Vite dev server and the .NET API via its `webServer` block. Assert the same kinds of observable behavior as Vitest — roles, labels, visible text, navigation, form state preservation across wizard steps.

### Fakes over mocks
Prefer a hand-rolled fake implementing the per-aggregate repository interface over NSubstitute mocks. Fakes over-specify less and read more clearly. Reserve mocks for assertions about interaction (`Received(1).Publish(...)` on the Etsy listing service, for example).

### Don't mock what the project owns
Only mock boundary interfaces — repositories, `IImageAnalysisService`, `IListingGenerationService`, the Etsy service boundary, `ICurrentUserAccessor`. Don't mock aggregates, value objects, handlers, or controllers — they're tested directly.

### AI and Etsy are always tested through the domain interface
Tests for code that depends on Claude or Etsy depend on `IImageAnalysisService`, `IListingGenerationService`, `IEtsyListingService`, etc. Tests never type-reference `Anthropic.*` or any `Etsy` SDK type. This mirrors the production rule that vendor SDKs stay contained in Infrastructure (see §AI Integration Guidance and §Etsy Integration Guidance).

### Coverage bar
No hard percentage threshold in v1. The rule is behavioral: every MediatR handler has at least one test, every public aggregate behavior has at least one test, every controller action has at least one happy-path and one failure-case test. Enforcement lives in the TDD hook and the `tdd-reviewer` agent — not in a coverage gate.

### Test naming
- **Backend:** `Method_State_Expectation` — e.g., `Handle_UserDoesNotOwnDraft_ReturnsNotFound`, `Create_MissingName_ThrowsValidationException`.
- **Frontend:** behavior sentences — e.g., `renders the AI badge on generated fields`, `warns before overwriting manual edits`.

### Arrange-Act-Assert
All backend tests follow AAA structure, with blank lines or `// Arrange` / `// Act` / `// Assert` comments separating the three phases. Keep each test focused on one behavior.

## Coding Conventions for Claude Code

### General conventions
- Prefer straightforward, readable code.
- Keep files small and purpose-specific.
- Avoid speculative abstraction.
- Add new interfaces only for real external boundaries or important internal seams.
- If a future decision is required to implement a feature correctly, stop and request clarification rather than inventing product behavior.

### Backend conventions
- Feature-first folder organization inside Application where practical.
- One command/query per use case.
- One validator per meaningful write use case when needed.
- Controllers should remain thin.
- Keep mapping code out of controllers when it becomes non-trivial.

### Frontend conventions
- Build screens around routes and feature folders.
- Keep API logic in dedicated client modules.
- Use typed request/response contracts.
- Keep presentation components separate from data-fetching hooks when practical.

## Suggested Initial Build Order

0. Test project scaffolding (`/tests/ListForge.Domain.Tests`, `Application.Tests`, `Infrastructure.Tests`, `API.Tests`) and frontend Vitest + React Testing Library configuration. This precedes real feature code so the TDD hook has somewhere to match against from day 1.
1. Project scaffolding and solution structure (includes wiring the test projects from step 0 into the solution).
2. Configuration/secrets setup.
3. Auth boundary and current-user abstraction.
4. Etsy connection flow.
5. Shop Rules CRUD.
6. Draft CRUD.
7. Draft image upload/reorder/delete.
8. Listing generation from draft.
9. Edit form save flow.
10. Field regeneration.
11. Publish to Etsy.
12. Existing Etsy listing browse/edit.
13. Observability hardening.
14. Cleanup and architectural refactoring.

## Decision Log

### Locked decisions from this session
- Use REST only for v1.
- Keep the architecture as simple as possible for v1.
- Frontend must not talk directly to Supabase or any provider implementation.
- Use interfaces and dependency injection to hide infrastructure providers.
- Store drafts as first-class records.
- No versioning/history for v1.
- Delete uploaded draft images after successful publish.
- Keep Shop Rules simple in v1.
- Use a modular monolith.
- Avoid domain-event complexity for now.
- Publish/update to Etsy through a dedicated integration service boundary.
- If publish fails, keep the draft and allow retry.
- Deployment should be simple and portable, not Kubernetes-first.
- Observability and configuration discipline are required from the start.
- If implementation requires unresolved product decisions, request clarification rather than guessing.
- Test-Driven Development is required from day 1. No production code merges without an accompanying test. The failing test is written first.
- Test frameworks are locked: xUnit + FluentAssertions + NSubstitute for backend; Vitest + React Testing Library for frontend. Changing these requires a new entry in this log.
- **2026-04-29:** Playwright is now in v1 scope (was: out of scope, see prior version of §Testing Strategy). Every user-facing feature gets a `tests-e2e/<feature>.spec.ts` alongside Vitest component tests. Triggered by manual verification of the wizard flow becoming the bottleneck and the need for autonomous live verification during agent-driven development. Stack remains Chromium-only for v1; cross-browser revisit when a real cross-browser bug appears.

### Open decisions intentionally left unresolved
These should remain open until a real feature implementation requires them:
- Exact AI prompt/template storage mechanism.
- Whether AI calls eventually move to async jobs.
- Exact structured-output contract strategy for AI providers.
- Whether additional client-side state management beyond React Query + React Hook Form becomes necessary.