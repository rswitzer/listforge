# Sign up

## Goal

Let a new ListForge user create an account with email + password, get logged in immediately, and land on the onboarding flow so they can start connecting their Etsy shop. Plain language, low friction, no email-verification roundtrip in v1.

## User flow

**Happy path**

1. User lands on `/signup` (linked from the home page or directly).
2. Fills `email`, `password`, `confirm password`. Submits.
3. Frontend validates client-side. If the form is clean, it calls `POST /api/auth/register`.
4. Backend returns 201 with access + refresh tokens.
5. Frontend stores both tokens via `lib/auth.ts` and navigates to `/onboarding/welcome`.

**Error paths**

- `409 Conflict` — email already registered. Form shows: "That email is already registered. Try signing in instead." Email field is marked `aria-invalid`. Focus moves to the email field.
- `422 Unprocessable Entity` — server-side validation failure (unlikely if client validation already passed, but the contract allows it). Form shows the server-supplied messages, mapped to the relevant field where possible.
- Network / 5xx — form shows: "We couldn't reach the server. Check your connection and try again." Submit button re-enables. Tokens are not stored.

## Screens

### `/signup`

**Layout.** Mirrors the existing page shell from `frontend/src/pages/HealthPage.tsx`: `<main>` wrapper, centered card on cream/sand background, single `<h1>`, form below.

**Heading.** "Create your account"

**Subhead.** "Plain emails and a password. Nothing else, for now."

**Fields.**

| Field | Type | Required | Notes |
|---|---|---|---|
| Email | `<input type="email" autocomplete="email">` | yes | Trim before submit. |
| Password | `<input type="password" autocomplete="new-password">` | yes | Min 8 chars (matches backend Identity config in `PersistenceServiceCollectionExtensions.cs`). |
| Confirm password | `<input type="password" autocomplete="new-password">` | yes | Must match password. |

**Validation rules (client-side, before submit).**

- Email: not empty, contains `@` and a `.` after it. We don't run an RFC-grade regex; the backend is the source of truth.
- Password: not empty, ≥ 8 characters.
- Confirm password: equals password (case-sensitive).

If any rule fails on submit, show inline error text below the offending field, mark `aria-invalid="true"`, mark `aria-describedby="<field-id>-error"`, and move focus to the first invalid field. Don't run the network call.

**Submit button.**

- Label: "Create account"
- While the request is in flight: button text becomes "Creating…", `aria-busy="true"`, `disabled` (acceptable here because the user has nothing else to do; once the request resolves, focus returns to the email field on error or the page navigates away on success).
- 44 × 44 minimum target size (matches the rule on `HealthPage.tsx`).

**Footer link.**

- "Already have an account? **Sign in**" — placeholder anchor that visually looks like a link but does not navigate yet (`role="link"` button styled as text, `aria-disabled="true"`, helper text "Sign in coming soon"). Wires up when the `/login` feature lands.

**Form-level error region.**

A single `role="alert"` element above the submit button shows the form-wide message ("That email is already registered…", "We couldn't reach the server…"). Per-field messages live below their inputs and don't double-announce.

### `/onboarding/welcome`

A v1 stub. Will be replaced when the real onboarding feature lands, but it has to exist so signup has somewhere to redirect.

**Heading.** "You're in. Let's connect your Etsy shop."

**Body.** "ListForge needs your Etsy connection before it can build listings for you. We'll walk you through it next."

**Primary CTA.** "Connect Etsy" — `<button>` styled like the espresso submit button, but `disabled` with `aria-describedby` pointing at helper text "Coming soon — this lands with the Etsy connection feature." When F1 (Etsy connection) ships, this button gets a real `onClick` and the helper text goes away.

## Backend contract

This feature does not change the backend.

**Endpoint.** `POST /api/auth/register`

**Request body.** `{ "email": string, "password": string }` — `RegisterRequest` in `src/ListForge.Contracts/Auth/RegisterRequest.cs`.

**Responses.**

| Status | Body | Frontend interpretation |
|---|---|---|
| 201 Created | `{ accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt }` | Auto-login: store tokens, navigate to `/onboarding/welcome`. |
| 409 Conflict | (empty) | "That email is already registered. Try signing in instead." Field-level on email. |
| 422 Unprocessable Entity | `{ errors: string[] }` (Identity descriptions) when password is too weak; empty when email/password is missing | Show server messages near password (best effort). Falls back to "Please check your details and try again." |
| Network / 5xx | — | "We couldn't reach the server. Check your connection and try again." |

The backend's password policy is **min 8 chars, no complexity rules**. If we tighten it later, the spec changes here, and the validation message updates accordingly.

## Auth state

Lives in `frontend/src/lib/auth.ts`. Exports:

- `setTokens(tokens)` — persist both tokens.
- `getTokens()` — `{ accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt } | null`.
- `clearTokens()` — remove both.
- `isAuthenticated()` — boolean: are tokens present and not past expiration.

**Storage.** `localStorage`, both tokens, v1-acceptable.

**Track-later note.** Production needs to move the access token in-memory (closure or React Context) and the refresh token to an httpOnly, SameSite=Strict cookie set by the backend. That requires backend cookie issuance, CORS credentials, and a refresh-token rotation hook. Out of scope for v1 development; revisit before the first hosted environment.

No React Context, no `AuthProvider` yet — the next feature that reads auth state (login, or any protected screen) is the right time to add that.

## Accessibility

- Single `<h1>` ("Create your account").
- Real `<label>` for every input. `htmlFor` matches input `id`.
- `aria-invalid="true"` and `aria-describedby="<id>-error"` on fields with active errors.
- Form-level `role="alert"` summary above the submit button for server / network errors. Empty when there is no error (do not render an empty `role="alert"`).
- Submit button: real `<button>`, native focus ring (visible focus-visible terracotta outline matching `HealthPage`'s button), `aria-busy` while in-flight, 44 × 44 minimum.
- Focus management: on submit failure, move focus to the first invalid (or duplicate-email) field. On success, the redirect handles focus naturally.
- Password inputs use `autocomplete="new-password"` so password managers don't try to autofill an existing password.
- Color contrast: error tone is `text-terracotta` on `bg-cream` (already in the documented pairings — see `docs/spec-ui.md §Accessibility`).
- Tab order: email → password → confirm → submit → footer link.

## Copy (final, ready-to-paste)

- Page heading: "Create your account"
- Subhead: "Plain emails and a password. Nothing else, for now."
- Email label: "Email"
- Email error (empty): "Please enter your email."
- Email error (malformed): "That doesn't look like a valid email."
- Password label: "Password"
- Password helper: "At least 8 characters."
- Password error (empty): "Please choose a password."
- Password error (too short): "Use at least 8 characters."
- Password error (server-supplied): use server text verbatim (Identity provides plain-language descriptions).
- Confirm-password label: "Confirm password"
- Confirm-password error: "Passwords don't match."
- Submit (idle): "Create account"
- Submit (in flight): "Creating…"
- Form-level error (duplicate email): "That email is already registered. Try signing in instead."
- Form-level error (network): "We couldn't reach the server. Check your connection and try again."
- Footer link: "Already have an account? Sign in" + helper "Sign in coming soon."

## Out of scope

- `/login` page (separate feature).
- Forgot password / password reset (no SMTP wired).
- Email verification (no SMTP wired).
- Terms-of-service / privacy checkbox (no policy pages exist yet; a checkbox without working policy URLs is theatre).
- Social / Google / Apple sign-in.
- Password-strength meter, "show password" toggle, or "remember me" toggle.
- A shared `<TextField>` / `<FormError>` / shadcn/ui form library — the next feature with a form gets to decide whether to extract.
- Real `/onboarding/welcome` content beyond the stub — that lands with the Etsy connection feature.
- Token-storage hardening (httpOnly cookies, in-memory access token) — Track-later, see Auth state above.
- React Context / `AuthProvider` / protected-route guards — Track-later, lands with login.

## Test surface

Per `docs/architecture.md §Testing Strategy` and `CLAUDE.md`:

**Unit (Vitest)**

- `frontend/src/lib/auth.test.ts` — `setTokens` round-trip via `getTokens`; `clearTokens` removes; `getTokens` on empty storage returns `null`; `isAuthenticated` returns false on expired tokens.
- `frontend/src/lib/api/registerUser.test.ts` — 201 returns `{ ok: true, tokens }`; 409 returns `{ ok: false, reason: 'duplicate' }`; 422 with body returns `{ ok: false, reason: 'invalid', detail }`; network error returns `{ ok: false, reason: 'network' }`.

**Component (Vitest + RTL + vitest-axe)**

- `frontend/src/pages/SignupPage.test.tsx` — renders all three labels; validation errors on empty / malformed / mismatched submit; 409 → form-level message + email field is `aria-invalid`; 422 → server message rendered; 201 → `setTokens` called and `useNavigate` called with `/onboarding/welcome`; `expect(await axe(container)).toHaveNoViolations()`.
- `frontend/src/pages/OnboardingWelcomePage.test.tsx` — renders heading; "Connect Etsy" button is disabled with helper text; axe clean.

**End-to-end (Playwright)**

- `tests-e2e/signuppage.spec.ts` — fills happy path with mocked 201 → asserts URL becomes `/onboarding/welcome` and `localStorage` has tokens; fills 409 path with mocked 409 → asserts inline message; fills 422 path → asserts inline message. `checkA11y(page)` after each.
- `tests-e2e/onboardingwelcomepage.spec.ts` — renders + axe clean.
- `tests-e2e/a11y.spec.ts` — adds `/signup` and `/onboarding/welcome` to `ROUTES`. Adds a paired error-state spec for `/signup` (after a duplicate-email submit) so the terracotta-on-cream contrast is exercised in real Chromium.

**Backend** — no new backend tests; existing `AuthControllerTests` already cover register's happy path, duplicate, and short-password cases.
