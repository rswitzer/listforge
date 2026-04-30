# Security policy

## Reporting a vulnerability

If you believe you've found a security vulnerability in ListForge, please report
it privately rather than opening a public issue.

Preferred channel: **GitHub private vulnerability reporting** — open this repo's
**Security** tab and choose **Report a vulnerability**. That keeps the report
private until a fix is ready.

If you can't use GitHub's flow, email **rachelswitzer@gmail.com** with:

- A description of the issue and its impact.
- Steps to reproduce, or a proof-of-concept if you have one.
- Your assessment of the affected component (Etsy integration, AI provider,
  Supabase boundary, frontend, etc.).

You'll get an acknowledgement within 72 hours. We'll work with you on a
disclosure timeline; coordinated disclosure is the default.

## Supported versions

ListForge is pre-1.0. Only the `main` branch is supported during this period —
fixes ship from `main` and are not backported.

| Version | Supported          |
| ------- | ------------------ |
| `main`  | :white_check_mark: |
| < 1.0   | :x:                |

## Scope

In scope:

- The ASP.NET Core backend under `src/`.
- The React frontend under `frontend/`.
- The Etsy integration and OAuth token handling.
- The Claude (Anthropic) and Supabase boundaries.
- Infrastructure-as-code in `.github/workflows/`.

Out of scope:

- Vulnerabilities in third-party services we depend on (Etsy, Anthropic,
  Supabase) — please report those upstream.
- Issues that require local code execution on a developer's machine without
  a realistic attack vector.
