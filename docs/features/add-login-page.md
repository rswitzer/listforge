# Add login page

## Goal

Let an existing ListForge user sign in with email + password, restore their
session by storing fresh tokens, and land on the onboarding screen where they
can connect their Etsy shop. Same warm, plain-language tone as signup. No
forgot-password, no remember-me, no social login in this slice.

## User flow

**Happy path**

1. User lands on `/login` (linked from the landing-page header, the secondary
   link below the landing-page CTA, and the signup-page footer).
2. Fills `email`, `password`. Submits.
3. Frontend validates client-side. If clean, it calls `POST /api/auth/login`.
4. Backend returns 200 with access + refresh tokens.
5. Frontend stores both tokens via `lib/auth.ts` and navigates to
   `/onboarding/welcome` (the same destination as signup, which is the "Connect
   your Etsy shop" placeholder).

**Error paths**

- `401 Unauthorized` — unknown email **or** wrong password. The backend
  intentionally returns the same status for both to avoid email enumeration;
  the UI mirrors that. Form shows a single alert: "That email or password
  didn't match. Try again." The alert receives focus on submit. Neither field
  is individually marked `aria-invalid`.
- Network / 5xx — form shows: "We couldn't reach the server. Check your
  connection and try again." Submit button re-enables. Tokens are not stored.

## Screens

### `/login`

**Layout.** Mirrors `SignupPage.tsx`: `<main>` wrapper, centered card on
cream/sand background, single `<h1>`, form below, footer link.

**Heading.** "Welcome back"

**Subhead.** "Sign in to keep working on your listings."

**Fields.**

| Field | Type | Required | Notes |
|---|---|---|---|
| Email | `<input type="email" autocomplete="email">` | yes | Trim before submit. |
| Password | `<input type="password" autocomplete="current-password">` | yes | No client-side minimum length — the backend is the source of truth via 401. |

**Validation rules (client-side, before submit).**

- Email: not empty, contains `@` and a `.` after it. Same loose check as
  signup; backend is authoritative.
- Password: not empty.

If a field fails, show inline error below it, mark `aria-invalid="true"`,
link via `aria-describedby="<field-id>-error"`, move focus to the first
invalid field. Don't run the network call.

**Submit button.** "Sign in" → "Signing in…" while pending, with
`aria-busy="true"` and `disabled` until the call resolves.

**Form-level alert.** A `<div role="alert" tabIndex={-1}>` directly below the
submit button. Receives focus when the submit fails (401 or network).
Same pattern as `SignupPage.tsx`.

**Footer.** `<p>Don't have an account? <Link to="/signup">Create one</Link></p>`.
No forgot-password link in this slice.

### `/` (landing page rearrangement)

- Add a top-of-page `<header>` landmark above the hero card. Header contains
  the ListForge wordmark on the left and a `Log in` text link on the right
  (text-link styling, not a button — the primary signup CTA must stay
  visually dominant).
- Inside the hero card, immediately below the existing "Create your account"
  button, add `<p>Already have an account? <Link to="/login">Log in</Link></p>`.
- The hero copy and the "How it works" section are unchanged.

### `/signup` (footer link wired up)

Replace the existing "Already have an account? Sign in is coming soon."
placeholder with `<p>Already have an account? <Link to="/login">Log in</Link></p>`.

## Out of scope

- Forgot password / password reset (deferred per PRD).
- "Remember me" — token lifecycle handles this.
- Social / OAuth login. Etsy OAuth is a different feature (shop connection).
- Building the real Etsy-connect flow — `/onboarding/welcome` stays the
  existing placeholder.

## Acceptance criteria

- A new `/login` route renders the LoginPage.
- The landing page exposes login from two places: the header top-right link
  and a secondary link below the signup CTA.
- The signup page footer links to `/login` (no more "coming soon" copy).
- A successful login stores both tokens in `localStorage['listforge.auth']`
  and redirects to `/onboarding/welcome`.
- A failed login (401) shows the unified "email or password didn't match"
  alert, focus moves to the alert, and the user stays on `/login`.
- A network failure shows the network-error alert and the user stays on
  `/login`.
- Page is keyboard-navigable, has exactly one `<h1>`, and passes axe at both
  the component layer (`vitest-axe`) and the e2e layer
  (`@axe-core/playwright`).
