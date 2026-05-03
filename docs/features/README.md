# Feature specs

Per-feature specs live here. Each F-level feature in `docs/PRD.md` gets a single kebab-case markdown file in this folder before code lands.

## What goes in a feature spec

Feature-specific behavior, copy, flow, edge cases, and contract details — the things a single screen or workflow needs to ship correctly. Keep cross-cutting rules (architecture patterns, design tokens, accessibility floor, testing strategy) in their original homes:

- `docs/PRD.md` — product index, decisions, what each F-level feature *is*.
- `docs/architecture.md` — engineering rules and patterns.
- `docs/spec-ui.md` — design language, palette, tone, component direction.
- `docs/testing.md` — testing patterns and frameworks.

If a feature needs a new cross-cutting rule (e.g., a new color token, a new architectural pattern), update the cross-cutting doc *and* point at it from the feature spec.

## File naming

`docs/features/<feature-slug>.md`. Examples: `signup.md`, `login.md`, `etsy-connect.md`, `shop-rules.md`, `create-listing.md`. Slugs match the user-facing concept, not the implementation file.

## Index

- [`signup.md`](./signup.md) — Account creation flow.
