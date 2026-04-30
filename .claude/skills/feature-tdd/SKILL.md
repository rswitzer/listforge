---
name: feature-tdd
description: Scaffold a new user-facing screen for ListForge — Playwright e2e spec + Vitest page test + page stub — then iterate Red→Green→Refactor until both layers pass. Use when the user asks for a new screen, page, route, or feature in the create-listing wizard or any other top-level UI surface (e.g., "add a Saved Drafts page", "scaffold the Connect Etsy screen", "new feature: shop rules editor").
---

# feature-tdd

Use this skill when adding a new **user-facing screen** — a top-level routed surface (per `docs/spec-ui.md` §Screen Inventory). Examples: Welcome, Connect Etsy, Create Listing wizard steps, Saved Drafts, Edit Listing, Shop Rules List, Shop Rules Editor, Settings, Publish Confirmation.

Reusable components and hooks **don't** use this skill — they go through the standard sibling-test pattern. This skill is specifically for **pages** that need real-browser verification.

## Inputs

- `<ScreenName>` — PascalCase, used for the page component and its test (e.g., `SavedDrafts`, `ConnectEtsy`).
- `<feature description>` — one or two sentences from the user describing what the screen does. This drives the spec assertions.

## What to scaffold (in this order)

The order matters — the e2e spec is the outermost Red. It describes the user-visible behavior in real Chromium and must fail before any production code exists.

### 1. Playwright spec — `tests-e2e/<ScreenName>.spec.ts`

```ts
import { test, expect } from '@playwright/test';

test.describe('<ScreenName>', () => {
  test('<the primary user-facing behavior, in plain English>', async ({ page }) => {
    await page.goto('/<route>');

    // Assert role-first observable behavior (per docs/spec-ui.md §Frontend Testing):
    await expect(page.getByRole('heading', { name: /<canonical heading>/i })).toBeVisible();
    // … one or two more assertions for the happy path …
  });
});
```

Use **canonical ListForge vocabulary** in expected strings — `Shop Rules`, `Create Listing`, `Saved Drafts`, never the banned terms (`Guardrail`, `Generate Listing`, `Inference Results`, etc. — see `docs/spec-ui.md` §UX Copy Style).

### 2. Vitest test — `frontend/src/pages/<ScreenName>.test.tsx`

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@/test/render';
import <ScreenName> from './<ScreenName>';

describe('<ScreenName>', () => {
  it('<a component-level behavior the e2e spec doesn't easily reach>', () => {
    render(<<ScreenName> />);
    expect(screen.getByRole('heading', { name: /<canonical heading>/i })).toBeInTheDocument();
  });
});
```

Vitest covers **deterministic component-level** behavior (state transitions, validation messages, AI badge rendering, regenerate-warn dialogs). Playwright covers the **integrated user flow** in a real browser. Don't duplicate assertions across both layers — pick the layer that catches the bug class you're worried about.

### 3. Page stub — `frontend/src/pages/<ScreenName>.tsx`

The smallest thing that compiles and lets the test runners report an honest failure. Don't over-build.

```tsx
export default function <ScreenName>() {
  return (
    <main>
      <h1>{/* canonical heading */}</h1>
    </main>
  );
}
```

## Iteration loop

After scaffolding, **run both layers and iterate until both are green**:

```bash
# Component layer
pnpm --dir frontend test -- <ScreenName>

# E2E layer (auto-starts dev server + .NET API)
pnpm --dir frontend e2e -- <ScreenName>
```

Rules during iteration:

1. **Don't declare done while either layer is red.** The Stop hook (`.claude/hooks/run-affected-tests.sh`) enforces this at end-of-turn anyway.
2. **If the e2e is red but Vitest is green**, the bug is in routing, the dev server, the API contract, or in how the component is mounted in the app — not in the component itself.
3. **If Vitest is red**, fix the component first; e2e will catch up.
4. **Use the Playwright MCP** (browser_* tools) to drive Chromium yourself when stuck. Take a screenshot, inspect the page, then write a tighter assertion.

## Coupling to existing rules

- The `check-tdd.sh` PreToolUse hook will **block** a write to `frontend/src/pages/<ScreenName>.tsx` if either the Vitest test or the Playwright spec is missing on disk. Scaffold the tests first.
- The Stop hook runs Playwright when frontend or `tests-e2e/` files were touched in the turn. Plan your iteration loop around that — every turn ends with both layers green or the model can't stop.
- Routing changes (adding `<ScreenName>` to the router) require updating the corresponding Vitest test that exercises the App-level routing, not just the page test.

## When NOT to use this skill

- For reusable components, hooks, or utilities — those use the plain sibling-test pattern.
- For backend changes — those use `new-usecase`, `new-aggregate`, or `new-endpoint`.
- For one-line copy fixes or dependency bumps.

## Reference

- `docs/architecture.md` §Testing Strategy — the locked frameworks and the per-layer contract.
- `docs/spec-ui.md` §Frontend Testing — what Playwright should assert (roles, AI badges, regenerate warnings, publish modal Etsy-fees link, wizard back-nav state).
- `docs/testing.md` — canonical test patterns and copy assertion rule.
