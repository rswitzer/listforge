# Testing Reference

Canonical patterns for ListForge tests. The non-negotiables (TDD, locked
frameworks, layer-specific contracts, no vendor-SDK mocks) live in
[`architecture.md` §Testing Strategy](./architecture.md). This doc shows the
shapes — copy-paste-friendly examples only.

## Frontend (Vitest + RTL)

### Where things live

```
frontend/src/
├── components/Foo.tsx
├── components/Foo.test.tsx        # sibling test, required by check-tdd hook
└── test/
    ├── setup.ts                   # jest-dom matchers
    └── render.tsx                 # custom render with TestProviders + userEvent
```

### Import shape

```ts
import { render, screen, waitFor } from '@/test/render';
import { vi } from 'vitest';
```

The `@/` alias resolves to `frontend/src/`. Always import from `@/test/render`,
never from `@testing-library/react` directly — the custom render returns a
pre-bound `userEvent` instance and wraps in `<TestProviders>` (where React
Query / Router will be added later).

### Query priority

Role first, then label, then text. Avoid `getByTestId`, never assert on class
names or CSS.

```ts
screen.getByRole('button', { name: /publish to etsy/i });
screen.getByLabelText(/describe your item/i);
screen.getByText(/saved drafts/i);
```

### Interactions

Use `user`, never `fireEvent`. The custom `render()` returns it pre-bound.

```ts
const { user } = render(<Wizard />);
await user.click(screen.getByRole('button', { name: /next/i }));
await user.type(screen.getByLabelText(/title/i), 'Brass earrings');
```

### API mocking

Use `vi.stubGlobal('fetch', ...)` to mock responses per-test.

```ts
import { vi } from 'vitest';

it('loads data', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    ),
  );

  render(<MyComponent />);
  await waitFor(() => expect(screen.getByText(/loaded/i)).toBeInTheDocument());
});

// Error case
vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('network'))));
```

Be explicit in each test about what you're mocking — avoid global defaults so
tests are self-documenting.

## AI surface assertions (per `spec-ui.md`)

These behaviors are non-negotiable for any screen that touches AI output.

### AI badge on generated fields

```ts
const titleField = screen.getByRole('textbox', { name: /title/i });
expect(within(titleField.closest('div')!).getByLabelText(/ai/i))
  .toBeInTheDocument();
```

### Regenerate warns before overwriting manual edits

```ts
const { user } = render(<EditListing draft={draftWithEdits} />);

await user.click(screen.getByRole('button', { name: /regenerate/i }));

expect(
  screen.getByRole('dialog', { name: /overwrite your edits/i }),
).toBeInTheDocument();
```

### Soft helper text on uncertain fields (no confidence scores)

```ts
expect(screen.getByText(/we couldn't confidently fill this in/i))
  .toBeInTheDocument();
expect(screen.queryByText(/confidence/i)).not.toBeInTheDocument();
```

### Publish modal links to Etsy fees

```ts
const link = screen.getByRole('link', { name: /etsy.*fees/i });
expect(link).toHaveAttribute('target', '_blank');
expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
```

### Wizard back-nav preserves prior-step state

```ts
const { user } = render(<CreateListingWizard />);

await user.type(screen.getByLabelText(/title/i), 'Brass earrings');
await user.click(screen.getByRole('button', { name: /next/i }));
await user.click(screen.getByRole('button', { name: /back/i }));

expect(screen.getByLabelText(/title/i)).toHaveValue('Brass earrings');
```

## Copy assertion rule

Expected strings in tests must use **canonical ListForge vocabulary** only.
Banned in test expectations:

- "Guardrail", "Guardrail Profiles" — say "Shop Rules"
- "Generate Listing" — say "Create Listing"
- "Inference Results", "Confidence Output", "Taxonomy Mapping",
  "Structured Attributes" — these don't appear in user-facing copy at all

If a test fails because the expected string doesn't match, fix the test, not
the copy — the copy is the spec. (See `spec-ui.md` §UX Copy Style.)

## Playwright (`tests-e2e/`)

End-to-end specs run in real Chromium against the running app. They live at the
repo root under `tests-e2e/<screen>.spec.ts`. The Playwright config
(`frontend/playwright.config.ts`) auto-starts both servers via its `webServer`
block — the Vite dev server on `:5173` and the .NET API on `:5050`. You don't
need either running before invoking `pnpm e2e`; if they're already up, the
config reuses them.

### Where things live

```
frontend/
└── playwright.config.ts          # webServer config, base URL, Chromium project
tests-e2e/
└── <screen-name>.spec.ts         # one spec per user-facing screen
```

### Running

```bash
pnpm --dir frontend e2e            # headless, single run
pnpm --dir frontend e2e:ui         # interactive UI
pnpm --dir frontend exec playwright test tests-e2e/signuppage.spec.ts   # one file
```

Failing runs save traces and screenshots under `frontend/test-results/`. An
HTML report is in `frontend/playwright-report/` (gitignored).

### Canonical pattern

```ts
import { test, expect } from '@playwright/test';

test.describe('Saved Drafts', () => {
  test('lists drafts the current user owns', async ({ page }) => {
    await page.goto('/drafts');

    await expect(
      page.getByRole('heading', { name: /saved drafts/i }),
    ).toBeVisible();
  });
});
```

Same query priority as Vitest: role first, then label, then text. Same canonical
vocabulary rule — never `Guardrail`, never `Generate Listing`, never confidence
scores.

### Accessibility assertions

WCAG 2.1 AA is enforced at every test layer (see `spec-ui.md §Accessibility`
for the full rule set). The mechanics:

**Component tests (Vitest)** — every component test asserts no axe
violations on the final rendered DOM. Use the configured wrapper from
`@/test/axe`, not `vitest-axe` directly — the wrapper disables axe-core's
`color-contrast` rule (jsdom has no `<canvas>` 2D context, so the rule is
unreliable; contrast is verified in real Chromium via the Playwright spec).

```ts
import { axe } from '@/test/axe';

it('has no axe-detectable accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  await waitFor(() => expect(screen.getByRole('heading')).toBeInTheDocument());
  expect(await axe(container)).toHaveNoViolations();
});
```

The matcher is wired globally in `frontend/src/test/setup.ts`.

**End-to-end (Playwright)** — the `tests-e2e/a11y.spec.ts` floor-coverage
spec walks every top-level route. Per-feature specs may also call the helper
after meaningful state changes (modal open, wizard step advance, error path):

```ts
import { checkA11y } from './utils/a11y';

await page.goto('/create/photos');
await checkA11y(page);

await page.getByRole('button', { name: /next/i }).click();
await checkA11y(page);   // re-check after the state change
```

`checkA11y(page, { include?, exclude?, disableRules? })` runs `AxeBuilder`
filtered to `wcag2a, wcag2aa, wcag21a, wcag21aa` and asserts zero violations
with a readable failure message.

**Lint** — `eslint-plugin-jsx-a11y` is active in `pnpm lint` at `error`
severity. Lint failures block both the pre-push hook and CI.

### When to use Vitest vs Playwright

- **Vitest**: deterministic component-level behavior — state transitions,
  validation messages, AI badge rendering, regenerate-warn dialogs, soft helper
  text on uncertain fields. Fast, runs in jsdom, no real network.
- **Playwright**: integrated user flows — navigation, form submission, wizard
  step transitions hitting real `/api/*` endpoints, draft autosave, publish
  confirmation. Slower but verifies the app actually works in a browser.

Don't duplicate assertions across both layers. Pick the layer that catches the
bug class you're worried about.

## Backend

The xUnit + FluentAssertions + NSubstitute contract per layer
(Domain pure, Application handler-level with fakes, Infrastructure with
Testcontainers Postgres, API via `WebApplicationFactory<Program>`),
the required cases per handler/endpoint (happy path, 401, 404, 422), the
test-naming convention, and the no-vendor-SDK-mocks rule all live in
[`architecture.md` §Testing Strategy](./architecture.md). That section is
authoritative — don't duplicate it here.

## Enforcement

Two hooks make this real, not aspirational:

- **`.claude/hooks/check-tdd.sh`** (PreToolUse, blocking) — refuses writes to
  production files without a matching test on disk. Pages under
  `frontend/src/pages/` require **both** a sibling Vitest test **and** a
  matching `tests-e2e/<name>.spec.ts`. Forces the Red step at both layers.
- **`.claude/hooks/run-affected-tests.sh`** (Stop, blocking) — at end of turn,
  runs typecheck + Vitest on touched frontend files, Playwright when frontend
  or `tests-e2e/` was touched, and `dotnet test` on touched backend test
  projects. Refuses to let the turn end on red.

Bypass the Stop hook for doc-only sessions: `LISTFORGE_SKIP_STOP_TESTS=1`.
