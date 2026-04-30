## Summary

<!-- One or two sentences. The "why", not the "what" — the diff already shows the what. -->

## Test plan

<!-- Bulleted checklist. Include automated runs and any manual verification you did. -->

- [ ] `dotnet test ListForge.sln`
- [ ] `pnpm --dir frontend typecheck`
- [ ] `pnpm --dir frontend lint`
- [ ] `pnpm --dir frontend test`
- [ ] `pnpm --dir frontend e2e` (if frontend or `tests-e2e/` changed)

## Accessibility self-check (frontend changes only)

WCAG 2.1 AA is gated. Tooling catches some of it; this checklist is the rest.
Mark N/A for items that don't apply to this change.

- [ ] Walked every changed flow with **keyboard only** — Tab, Shift+Tab, Enter, Space, Esc all do what they should.
- [ ] Focus order matches visual order. No `tabIndex > 0`.
- [ ] Every new interactive element has an accessible name (label, `aria-label`, or visible text).
- [ ] Every new modal/dialog traps focus, closes on `Esc`, returns focus to its opener.
- [ ] No information conveyed by colour alone. Errors carry text or an icon, not just red.
- [ ] New colour combinations verified against `docs/spec-ui.md §Accessibility` (or added to the allowed-pairs table with computed ratio).
- [ ] If the change introduces a new top-level route: added to `tests-e2e/a11y.spec.ts`.
- [ ] If the change introduces a modal/dialog: e2e test opens it and calls `checkA11y(page)`.
- [ ] Screen-reader spot-check on the most complex new surface (VoiceOver / NVDA / TalkBack).
- [ ] Suppressed an axe or `jsx-a11y` rule? Justification is in a comment immediately above the suppression.

## Notes

<!-- Anything reviewers should know but the diff doesn't say. Migrations, follow-ups, deferred work. -->
