# ListForge UI Spec

## Purpose

This document defines the product UI behavior, screen inventory, layout rules, interaction patterns, content tone, and responsive guidance for ListForge. It is intended to help design and implementation agents create a consistent, approachable, production-ready interface for Etsy sellers who are not highly technical.

ListForge should feel warm, calm, and trustworthy. It should reduce friction, reduce decision fatigue, and make AI assistance feel helpful rather than opaque or intimidating.

## Product Tone

### Product personality
- Warm and approachable.
- Calm, steady, and trustworthy.
- Practical rather than flashy.
- Friendly to non-technical users.
- Creative-business oriented, not enterprise SaaS.

### Brand attributes
- Handmade.
- Thoughtful.
- Clear.
- Organized.
- Helpful.

### UX principles
- Keep the user moving forward.
- Prefer guided flows over open-ended dashboards.
- Use plain language instead of technical language.
- Default to editable forms rather than hidden edit modes.
- Show only the information needed for the current step.
- Use soft reassurance when AI is uncertain.
- Make Etsy-related consequences explicit before publish.

## Brand Direction

### Color direction
Use a warm, earthy palette inspired by handmade goods, jewelry workbenches, natural materials, kraft packaging, and soft studio light.

Suggested palette direction:
- Background: warm cream or soft oat.
- Surface: ivory, sand, clay-tinted neutrals.
- Primary accent: muted terracotta, copper, or warm olive.
- Secondary accent: deep sage or bronze.
- Text: deep espresso or charcoal-brown, never pure black.
- Success: muted moss green.
- Warning: warm amber.
- Error: softened brick, not aggressive red.

The overall UI should feel light, welcoming, and tactile. Avoid neon, cold blue-purple gradients, or hyper-modern startup styling.

### Typography direction
Use a clean, readable sans-serif for body text and UI controls. Pair it with a subtle, tasteful display font only for major brand moments if needed. Readability is more important than stylization.

Recommended approach:
- Body/UI font: a modern, friendly sans-serif with excellent readability.
- Display/brand font: optional soft serif or characterful display face for headings and logo lockups only.

### Logo direction
Create a simple, warm logo for ListForge.

Logo goals:
- Should feel handcrafted but modern.
- Should suggest creation, shaping, or forging without feeling industrial.
- Should be simple enough to work in a navbar and favicon.
- Should not feel overly masculine, mechanical, or harsh.

Recommended concept directions:
- A minimal anvil-inspired abstract mark softened into a rounded geometric icon.
- A spark or starburst combined with a list/document shape.
- A subtle hammer/forge metaphor abstracted into a polished, friendly symbol.
- A monogram using "L" and "F" with a warm craft aesthetic.

Avoid:
- Aggressive flames.
- Heavy blacksmith imagery.
- Cartoon mascots.
- Generic AI sparkle logos.

## Information Architecture

### Primary app structure
The app should feel minimal and focused. Navigation should be lightweight and easy to understand.

Recommended primary navigation for desktop:
- Top bar with brand, current workspace context, and Etsy connection status.
- Optional small secondary nav or tabs for key areas.
- Main content area optimized around guided flows and forms.

Recommended primary navigation for mobile:
- Compact top bar.
- Simple menu sheet or bottom action pattern when necessary.
- Keep primary user actions visible and obvious.

### Main product areas
- Get Started / Onboarding
- Create Listing
- Edit Existing Listing
- Drafts
- Shop Rules
- Settings / Etsy Connection

Use friendly labels in UI copy:
- "Shop Rules" instead of "Guardrail Profiles" in primary UI.
- "Create Listing" instead of "Generate Listing" for the main action.
- "Edit Existing Listing" for F7.
- "Saved Drafts" for unfinished listing work.

Technical/domain terminology can appear in admin/help text, but the main experience should prefer plain language.

## Core Navigation Model

### Primary entry points
The app should present two clear primary paths after onboarding:
- Create a new listing.
- Edit an existing Etsy listing.

### Navigation style
Use a minimal, guided navigation model:
- Top-level actions should be obvious and few.
- Wizard-based flows should reduce cognitive load.
- Avoid overwhelming left-nav dashboards unless future product scope requires it.

Recommended persistent navigation items:
- Create Listing
- Edit Existing Listing
- Saved Drafts
- Shop Rules
- Settings

## Onboarding

### Goal
Help first-time users connect Etsy, understand what ListForge does, and begin their first listing with minimal setup.

### First-run flow
Recommended onboarding sequence:
1. Welcome screen.
2. Etsy connection step.
3. Optional Shop Rules introduction.
4. Start first listing.

### Etsy connection requirement
Etsy connection is required before the user can create or edit listings. If the user is not connected:
- Block listing creation and listing editing.
- Show a clear explanation that Etsy must be connected first.
- Provide a single primary CTA to connect Etsy.
- Settings should always allow reconnect/disconnect management.

### Shop Rules introduction
Users may skip Shop Rules setup during onboarding.

If skipped:
- Show a short note that using Shop Rules helps make results more consistent and accurate.
- Explain softly that skipping them may make output less predictable and may increase the chance of incorrect listing details.
- Do not use technical or alarming language.

Suggested tone:
"You can skip this for now, but adding Shop Rules usually makes your listing details more consistent and more accurate."

## Main Wizard: Create Listing

### Flow overview
Use a multi-step wizard with autosave and explicit draft-saving.

Recommended steps:
1. Upload photos
2. Add details
3. Review AI suggestions
4. Edit listing
5. Publish or save draft

### Wizard behavior
- Show progress clearly.
- Allow back/next movement without losing work.
- Autosave throughout the flow.
- Show a lightweight save state such as "Saved just now".
- Allow the user to leave and return later from Saved Drafts.
- Save draft manually and automatically.

### Step 1: Upload photos
Purpose:
- Help the user add product images quickly and confidently.

Requirements:
- Support 1 to 10 images.
- Show uploaded image thumbnails.
- Allow reorder and removal.
- Provide clear guidance on image count and recommended image quality.
- Primary CTA: "Continue".
- Secondary CTA: "Save draft".

Helpful copy can suggest that clear photos improve suggestions, but should stay brief.

### Step 2: Add details
Purpose:
- Gather lightweight input needed before generation.

Fields:
- Shop Rules selector, optional.
- Short prompt input.

Behavior:
- If no Shop Rules exist, allow user to continue without them.
- Offer a small link or secondary action to create Shop Rules.
- If skipped, show the soft warning about predictability and accuracy.

Friendly labels:
- "Shop Rules"
- "Describe your item"

Prompt helper example:
"Example: crescent moon pendant, gift for her"

### Step 3: Review AI suggestions
Purpose:
- Give the user a lightweight checkpoint before the full edit form.

This step should stay simple and non-technical.
- Do not expose raw confidence scores.
- Do not surface internal image-analysis details unless needed.
- Summarize that ListForge used the photos and details to prepare the listing.
- Let the user continue into the editable form.

This can also be combined visually with the loading-to-edit transition if that feels more natural, but the flow should still preserve the concept of a review checkpoint.

### Step 4: Edit listing
Purpose:
- Provide a fully editable form for reviewing and refining the generated listing.

This is the primary work surface of the product.

Design direction:
- Form-first layout.
- Simple, readable sections.
- Clear labels and helper text.
- All fields always editable.
- Avoid hidden edit states.

Sections may include:
- Basic details
- Description
- Tags
- Materials
- Category and section
- Variations
- Pricing and inventory
- Etsy-required attributes

### Step 5: Publish or save draft
Purpose:
- Help the user choose whether to send the listing to Etsy now or keep working later.

Actions:
- Publish to Etsy
- Save as draft
- Return to edit

## Listing Edit Form Behavior

### Field treatment
All listing fields should remain editable at all times.

### AI badges
AI-generated fields should be visually marked with a small badge.

Badge guidance:
- Use a small badge near the field label or field container.
- Suggested label: "AI".
- Optional icon: a small robot or spark-style assistant icon, kept subtle.
- Badge should feel helpful, not promotional.

When a user edits a field:
- The field may retain a subtle provenance state such as "AI draft" or "Edited" if useful.
- Do not create clutter.
- The most important function is to signal which content started from AI.

### Regeneration controls
Every AI-supported field should support regeneration.

Provide:
- Regenerate field
- Regenerate full listing

Regeneration UX guidelines:
- Field-level regenerate should be accessible near each field or section.
- Full regenerate should be visible but secondary to manual editing.
- Always warn the user that regeneration may replace current suggestions.
- If the user has edited a field manually, prompt before overwriting it.

Suggested options:
- "Regenerate this field"
- "Regenerate section"
- "Regenerate full listing"

### Uncertainty handling
If AI is uncertain:
- Use soft language.
- Leave the field blank or lightly prompted rather than forcing a guess.
- Highlight the field gently with helper text.

Suggested helper text:
- "Please double-check this field."
- "We couldn't confidently fill this in from the photos."
- "Review this detail before publishing."

Do not show raw confidence scores or technical explanations.

## Existing Listing Editing

### Entry point
Edit Existing Listing should be a separate main entry point from Create Listing.

### Listing discovery
Support multiple ways to find listings:
- Search by title.
- Browse recent listings.
- Filter by shop section.
- Filter by status.

### Existing listing workflow
Recommended flow:
1. Find listing.
2. Open editable form.
3. Make manual changes and/or run AI enhancement.
4. Review changes.
5. Save updates to Etsy.

### AI enhancement behavior
When enhancing an existing listing:
- Keep the experience similar to the main edit form.
- Make it obvious that the current Etsy listing is the starting point.
- Allow field-level and full regeneration as in the main listing flow.

## Shop Rules

### Naming
In the UI, use "Shop Rules" as the primary label.

Optional supporting description:
"Save your materials, tone, and shop preferences so your listings stay consistent."

### UX goal
Shop Rules should feel simple, friendly, and optional.

### Editor format
Use a dedicated full page rather than a cramped slide-over.

Rationale:
- Easier for non-technical users.
- Better for repeatable inputs and explanation.
- Less intimidating than dense modal content.
- Better on mobile and desktop.

### Structure
Keep the editor simple with straightforward sections:
- Name
- Materials to use or avoid
- Shop tone
- Default tags
- Shipping notes
- Extra notes

Use plain labels and short helper text.
Avoid exposing implementation language like rules engines, precedence, or structured logic.

### Empty state
If the user has no Shop Rules:
- Encourage but do not force setup.
- Explain benefit in simple terms.
- Provide a prominent CTA to create one.

## Saved Drafts

### Purpose
Allow users to leave a workflow and return later without losing work.

### Behavior
- Drafts should save across the creation wizard.
- Drafts should include timestamps.
- Drafts should show progress stage when helpful.
- Users should be able to resume, rename, or delete drafts.

Suggested draft card/list fields:
- Thumbnail
- Draft name or item name
- Last updated time
- Current step
- Shop Rules used, if any

## Settings

### Purpose
Provide account-level controls without making the app feel technical.

### Sections
- Etsy connection status
- Reconnect / disconnect Etsy
- Basic account settings
- AI help/disclaimer text

### Etsy connection UI
Always show:
- Connection status
- Connected shop name
- Reconnect action
- Disconnect action

If disconnected:
- Surface the impact clearly.
- Explain that listing creation and editing are unavailable until Etsy is connected.

## Publishing UX

### Publish action
Publishing should require confirmation.

### Confirmation modal requirements
Before publish, show a confirmation modal that explains:
- The listing will be published to Etsy.
- Etsy listing fees may apply once published.
- The user should review details carefully before continuing.

Modal actions:
- Primary: "Publish to Etsy"
- Secondary: "Cancel"

Include a link to Etsy's listing fee information.
Requirements for the link:
- Open in a new browser tab or window.
- Be clearly labeled.
- Sit within supporting text, not as the primary action.

Suggested supporting copy:
"Publishing this listing will send it to Etsy. Etsy listing fees may apply once it is published. Please review everything carefully before continuing."

## AI Disclosure Guidance

### Goal
Build trust without scaring users.

### Placement
Include a gentle AI guidance note in places where generated content is reviewed or published.

Recommended placements:
- Near the top of the edit form.
- In publish confirmation.
- In help text or settings.

### Recommended copy direction
Use language like:
"ListForge can help you draft listing details quickly, but it's still important to review everything for accuracy before publishing."

Alternative:
"AI can save time, but it may occasionally miss details. Please check your title, materials, variations, and other listing information before publishing."

Avoid:
- Harsh legal tone.
- Fear-based language.
- Overly technical AI explanations.

## Responsive Design

### General approach
The UI must work well on both desktop and mobile. The experience should stay responsive, readable, and focused.

### Desktop behavior
- Use comfortable content widths.
- Keep the wizard visually clear.
- Present forms in grouped sections.
- Keep primary actions visible.

### Mobile behavior
- Stack content vertically.
- Keep the wizard progress compact.
- Use sticky bottom action bars when helpful for Next, Back, Save Draft, or Publish.
- Avoid dense side-by-side layouts.
- Ensure all form controls are easy to tap.

### Responsive form guidance
- One column by default on mobile.
- Two-column layouts only when fields are short and benefit from pairing on larger screens.
- Long text fields should always have enough height to edit comfortably.

## Screen Inventory

### Core screens
1. Welcome / Get Started
2. Connect Etsy
3. Create Listing Wizard
4. Saved Drafts
5. Edit Listing Form
6. Edit Existing Listing Search/Browse
7. Shop Rules List
8. Shop Rules Editor
9. Settings
10. Publish Confirmation Modal

### States that must be designed
For each major screen, include:
- Empty state
- Loading state
- Error state
- Success state where relevant

Critical states to design:
- No Etsy connection
- No Shop Rules yet
- No drafts yet
- AI-generated listing ready
- AI uncertainty on individual fields
- Publish success
- Etsy connection expired or broken

## Component Guidance

### Buttons
Button hierarchy:
- Primary for the next best action.
- Secondary for alternative actions.
- Ghost/text for low-priority actions.

Primary actions should be singular and obvious on each screen.

### Badges
Use badges sparingly for:
- AI-generated fields
- Draft status
- Connected/disconnected Etsy state

### Form fields
- Labels always visible.
- Helper text concise.
- Errors written in plain language.
- Avoid advanced controls unless clearly beneficial.

### Cards/lists
Use simple cards or rows for:
- Drafts
- Shop Rules
- Existing listings

Each row/card should surface the next likely action clearly.

### Progress indicator
The listing creation wizard should show:
- Current step
- Remaining steps
- Ability to move backward

Do not make the stepper overly technical or crowded.

## UX Copy Style

### Voice
- Friendly.
- Plainspoken.
- Reassuring.
- Brief.
- Never jargon-heavy.

### Preferred phrasing
Use approachable labels such as:
- Shop Rules
- Create Listing
- Saved Drafts
- Review Details
- Publish to Etsy
- Describe your item

Avoid labels like:
- Guardrail Profiles
- Inference Results
- Confidence Output
- Taxonomy Mapping
- Structured Attributes

## Accessibility

### Target

ListForge conforms to **WCAG 2.1 Level AA**. This is normative, not aspirational — every PR is gated on it.

### Enforcement

| Layer | Tool | Where |
|---|---|---|
| Lint | `eslint-plugin-jsx-a11y` (recommended preset, `error` severity) | `frontend/eslint.config.js`, runs in `pnpm lint`, gated in pre-push and CI |
| Component test | `vitest-axe` (`expect(await axe(container)).toHaveNoViolations()`) | Required in every component test that renders DOM. Helper at `frontend/src/test/axe.ts` |
| End-to-end | `@axe-core/playwright` (WCAG 2.1 AA tags) | `tests-e2e/a11y.spec.ts` walks every top-level route. Helper at `tests-e2e/utils/a11y.ts`. Per-feature specs may also call `checkA11y(page)` after meaningful state changes |
| Review | `.claude/agents/a11y-reviewer` | Run on frontend PRs alongside `ui-copy-linter` |
| Manual | PR template self-check | `.github/PULL_REQUEST_TEMPLATE.md` |

### Normative rules

These are all testable and required.

#### Structure
- Exactly one `<h1>` per page; heading levels descend without skipping.
- Every page has a single `<main>` landmark; navigation, complementary, and contentinfo regions use the corresponding semantic elements or roles.
- Every interactive control is reachable in tab order and operable with `Enter`/`Space` (or arrow keys for composite widgets).

#### Labels and names
- Every form control has a programmatically associated `<label>` (or `aria-label` / `aria-labelledby` when a visible label is impossible).
- Every icon-only button has an `aria-label`. The "AI" badge on generated fields is a labelled element, not a bare icon.
- Every link's accessible name conveys destination ("Etsy fees page", not "click here").
- Images have an `alt` attribute. Decorative images use `alt=""`.

#### Focus and modals
- Focus indicators are always visible — never `outline: none` without a replacement.
- Dialogs (publish confirmation, regenerate-overwrite warning, any modal) trap focus, close on `Esc`, and return focus to the element that opened them. Use a Radix dialog primitive or equivalent — do not roll your own.
- Tab order matches reading order; `tabIndex > 0` is forbidden.

#### State and live regions
- Wizard step transitions either move focus to the new step's heading or announce the change via a polite live region.
- Validation errors are announced (live region or `aria-describedby` on the offending field) and survive screen-reader review — not just colour.
- Loading/processing states have an accessible name ("Generating listing…", not just a spinner).

#### Color and contrast
- Body text and meaningful UI components meet **4.5:1** against their background. Large text (≥ 18.66px bold or ≥ 24px regular) and incidental UI may meet **3:1**.
- Information is never conveyed by colour alone. Errors carry both colour and an icon/text marker.
- The allowed text/background pairs (verified ≥ 4.5:1) are:

  | Foreground | Background | Ratio |
  |---|---|---|
  | `espresso #3A2E25` | `cream #F7F1E5` | ≈ 12:1 |
  | `espresso #3A2E25` | `sand #EFE6D2` | ≈ 11:1 |
  | `espresso/70` (≈ #736961 effective) | `cream #F7F1E5` | ≈ 4.82:1 |
  | `espresso/70` (≈ #706559 effective) | `sand #EFE6D2` | ≈ 4.68:1 |
  | `terracotta #9A4F2A` | `cream #F7F1E5` | ≈ 5.3:1 |
  | `terracotta #9A4F2A` | `sand #EFE6D2` | ≈ 4.9:1 |
  | `moss #5C6E48` | `cream #F7F1E5` | ≈ 4.95:1 |
  | `moss #5C6E48` | `sand #EFE6D2` | ≈ 4.53:1 |

  Adding a new colour pair requires re-verifying contrast; introducing a colour token without an AA-passing intended pairing is a review block.

#### Targets and motion
- Interactive targets are at least 44 × 44 CSS px (WCAG 2.5.5 AAA, but a v1 floor for the non-technical audience).
- Honour `prefers-reduced-motion`. Animations longer than 200ms degrade to no animation when reduced motion is requested.

### Special considerations
Because the product targets non-technical users:
- Helper text should reduce confusion.
- Warnings should be calm and clear.
- Every important action should be reversible or confirmed when risk is involved.

### What axe and lint don't catch

Tooling covers roughly a third of WCAG. The PR self-check is required for the rest:
- Real keyboard-only walkthrough of every changed flow.
- Screen-reader spot-check (VoiceOver on macOS, NVDA on Windows, or TalkBack on Android) when the change introduces a new interactive surface.
- Verify focus order matches visual order on changed screens.
- Verify error messages are useful when read by themselves.

### Exceptions

If a third-party widget can't be made AA-compliant, document the violation and the user-impact in `docs/a11y-exceptions.md` (create the file if it doesn't exist) and link the issue. Suppressing an axe rule or a `jsx-a11y` rule inline requires the same justification in a comment immediately above the suppression.

## Frontend Testing

### TDD applies to the frontend too
Every React component with behavior ships with a failing test first, then the component. See `architecture.md §Testing Strategy` for the overall rule; this section notes the UI-specific guidance.

### Test framework
Vitest + React Testing Library + `@testing-library/user-event`. Tests are co-located next to the component as `ComponentName.test.tsx`. No Jest, no Enzyme.

### What to test
- **Interaction** — user types, clicks, keyboard navigation, wizard step transitions. Use `userEvent`, not `fireEvent`.
- **Accessibility affordances** — roles, labels, focus order. Query by role/label first; only fall back to text queries when roles don't apply.
- **AI surface behavior** — the "AI" badge renders on generated fields, regeneration prompts before overwriting manual edits, soft helper text appears on uncertainty, publish confirmation includes the Etsy-fees link with `target="_blank"` and `rel="noopener noreferrer"`.
- **State preservation** — backward navigation through wizard steps does not discard work (per §Wizard behavior).

### What not to test
- Styling, CSS class names, or visual output (that's the design system's job).
- Internal component state, implementation details, or snapshot-only output.
- Third-party library internals.

### Copy assertions stay aligned with the linter
Any assertion on user-facing text must use the canonical ListForge vocabulary. "Guardrail" / "Guardrail Profiles" / "Generate Listing" / "Inference Results" and similar technical terms should never appear in a test-expected string — those would be false positives that lock in banned copy. See `§UX Copy Style` and the `ui-copy-linter` agent.

### Uncertainty and AI disclosure
When a field is low-confidence:
- The test should assert the field is blank or lightly prompted.
- The test should assert the soft helper text appears (e.g., "Please double-check this field").
- The test should **not** assert any numeric confidence value is rendered.

### Route-based wizard tests
Wizard-step tests navigate by route (`/create/photos`, `/create/details`, …) and assert both the step indicator and the preserved form state. Use `MemoryRouter` / `createMemoryRouter` to drive the navigation.

## Design Anti-Patterns to Avoid

- Cold enterprise dashboard styling.
- Dense admin tables as the primary interaction model.
- Technical AI terminology in core flows.
- Overwhelming settings panels.
- Overuse of modals.
- Overly decorative handmade/craft clichés.
- Dark, industrial forge visuals.
- Generic futuristic AI visuals.
- Hidden edit states.
- Forcing Shop Rules setup before users can understand the value.

## Design Priorities for Mockups

If mockups are created first, prioritize these screens in order:
1. Create Listing wizard, especially the Edit Listing step.
2. Welcome + Connect Etsy onboarding.
3. Shop Rules list and editor.
4. Saved Drafts.
5. Edit Existing Listing browse/search flow.
6. Publish confirmation modal.

## Handoff Notes for Design Agents

When using this spec to generate mockups or UI code:
- Prioritize intuitive flows over feature density.
- Keep layouts simple and form-led.
- Show warmth through palette, copy, spacing, and illustration choices, not through clutter.
- Treat AI as a helpful assistant, not the star of the interface.
- Make Etsy connection state and publish consequences obvious.
- Ensure all screens include mobile-responsive behavior.
- Prefer plain-language labels and short helper text throughout.