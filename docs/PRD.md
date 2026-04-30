# ListForge — Product Requirements Document

## What It Is

ListForge is a web application for Etsy sellers that uses AI to create and manage fully formed, SEO-optimized Etsy listings from images and a short prompt. Users can define persistent shop-specific guidance profiles that the AI applies automatically so sellers do not have to repeat core business context every time they create or improve a listing.

The v1 experience is designed to feel simple, guided, and approachable for non-technical users, with a strong focus on independent handmade-goods sellers, especially jewelry makers.

## Who It's For

Independent Etsy sellers who create handmade physical goods and want to reduce the time spent writing listings without losing accuracy or brand consistency.

Initial target users:
- Solo Etsy sellers.
- Handmade physical goods sellers.
- Jewelry makers as the initial wedge.
- Users who may not be highly technical and need a guided UX.

## Product Principles

- Simple before powerful.
- Guided over complex.
- Editable over opaque.
- Friendly language over technical language.
- AI-assisted, not AI-autonomous.
- Accuracy and consistency matter more than novelty.
- Users remain responsible for reviewing listing details before publish.

## What It Does Not Do (v1)

- No bulk listing import or migration.
- No pricing recommendations.
- No A/B testing or listing analytics.
- No multi-shop support.
- No scheduling or draft queuing beyond what Etsy's API provides.
- No support for digital goods or non-physical listings.
- No autonomous publishing without user review.

***

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React + Vite + Tailwind + shadcn/ui | SPA, separate service |
| Backend | ASP.NET Core (C#) | REST API |
| ORM | Entity Framework Core | Code-first migrations |
| CQRS | Simple CQRS + MediatR | Commands/queries, pipeline behaviors |
| Database | Supabase (Postgres) | Abstracted via repository pattern |
| File Storage | Supabase Storage | Abstracted via storage interface |
| Auth | Supabase Auth | Abstracted via auth interface |
| AI | Claude (Anthropic) | Abstracted via AI service interface |
| Etsy | Etsy API v3 | Abstracted via anti-corruption layer |

All external vendors are hidden behind interfaces in the Domain/Application layers. Infrastructure implementations are swappable.

***

## Architecture

### Approach
Start as a **modular monolith** using Domain-Driven Design. Bounded contexts are designed from day one to be extractable as microservices. Kubernetes deployment target.

### Project Structure

```text
/src
  /ListForge.API              - ASP.NET Core entry point, controllers, middleware
  /ListForge.Application      - Use cases, commands, queries (CQRS via MediatR)
  /ListForge.Domain           - Aggregates, value objects, domain events, interfaces
  /ListForge.Infrastructure   - Supabase, Claude, Etsy API implementations
  /ListForge.Contracts        - DTOs, API request/response models
/frontend
  /src                        - React application (Vite)
```

### Bounded Contexts (future microservice boundaries)

| Context | Responsibility |
|---------|---------------|
| **Identity** | User accounts, Etsy OAuth token storage |
| **ShopRules** | Profiles, material rules, business tone, reusable seller preferences |
| **Listings** | Listing lifecycle: draft, review, publish, edit |
| **Intelligence** | Vision agent, listing generation agent |
| **EtsyIntegration** | Anti-corruption layer for Etsy API v3 |

### Vendor Abstraction Pattern
Repository interfaces and service interfaces live in `Domain`. Implementations live in `Infrastructure`. Switching providers should require infrastructure changes only.

***

## Core Concepts

### Shop Rules

Internally these are reusable guidance profiles. In the user interface, they should be labeled **Shop Rules** rather than guardrails to keep the experience friendlier and easier to understand.

Multiple profiles per user are supported, for example one for rings and another for necklaces. A profile can be selected at listing creation time, but use of a profile is optional.

If a user skips Shop Rules:
- Listing generation is still allowed.
- The user should be informed that results may be less consistent and may be more likely to contain incorrect details.
- The warning should be soft, short, and non-technical.

Example fields:

| Field | Type | Example |
|-------|------|---------|
| `name` | string | "Sterling Silver Collection" |
| `material_rules` | list of rules | "If silver → sterling silver 925" |
| `excluded_materials` | string list | ["nickel", "lead"] |
| `brand_voice` | string | "Warm, minimal, nature-inspired" |
| `default_tags` | string list | ["handmade jewelry", "sterling silver"] |
| `shipping_policy` | string | "Ships in 3–5 business days" |
| `custom_rules` | freeform text | Additional shop-specific constraints |

Shop Rules are applied at generation time and are not stored in the Etsy listing itself.

### Listing Schema

Maps to Etsy Listing API v3 fields.

| Field | Etsy API field | Source |
|-------|---------------|--------|
| Title | `title` | AI, user editable |
| Description | `description` | AI, user editable |
| Tags | `tags` | AI, user editable |
| Materials | `materials` | AI + Shop Rules, user editable |
| Category | `taxonomy_id` | AI suggests, user can override |
| Variations | `variations` | AI suggests, user confirms/edits |
| Section | `shop_section_id` | User selects |
| Price | `price` | User-provided/editable |
| Quantity | `quantity` | User-provided/editable |
| Who made it | `who_made` | Defaults to `i_did` |
| When made | `when_made` | User selects |
| Is supply | `is_supply` | Defaults to false |

All fields shown in the review/edit experience should remain editable at all times.

### Drafts

Drafts are a first-class concept in v1.

Users should be able to:
- Save work in progress at any point in the create-listing wizard.
- Leave the app and return later.
- Resume work from the last completed step.
- See last updated time and current step.

Autosave should also run throughout the wizard.

***

## Features

### F1 — Etsy Account Connection
OAuth 2.0 connection to the user's Etsy shop. Scopes: read listings, write listings, read shop.

Requirements:
- Display connected shop name.
- Allow disconnect and reconnect.
- Make Etsy connection status visible in Settings and relevant entry points.
- Block creation and editing flows until Etsy is connected.
- Provide onboarding guidance for first-time setup.

### F2 — Shop Rules Management
Users can create, edit, and delete named Shop Rules profiles. Multiple profiles per user are supported.

Requirements:
- Profiles are optional.
- Profile can be selected during listing creation.
- The UX should remain simple and non-technical.
- The editor should focus on friendly inputs rather than advanced rule-builder patterns.

### F3 — Image Analysis
User uploads one or more photos, up to Etsy's 10-image limit. Vision AI analyzes each image and extracts inputs used to prefill listing fields.

Examples of detected information:
- Materials such as metal type, stone type, texture, or finish.
- Style descriptors.
- Dominant colors.
- Suggested variations.

Behavioral requirements:
- Material rules in the selected Shop Rules profile take precedence over raw image detections.
- Low-confidence or undetected fields should be left blank rather than guessed.
- Internal image-analysis details should generally remain behind the scenes.
- The primary user-facing outcome is field auto-population in the listing form.

Example:
- If the system confidently identifies a silver ring, it should populate the materials field appropriately for Etsy rather than forcing the user to interpret detection output.

### F4 — Listing Generation
User selects an optional Shop Rules profile and provides a short prompt. AI generates a complete listing draft using the listing schema, including category suggestion and variation suggestions.

Requirements:
- Generation should work with or without Shop Rules.
- If Shop Rules are skipped, show a soft warning that output may be less predictable or less accurate.
- Generated content should be optimized for Etsy listing creation, but still require user review.

### F5 — Listing Review, Edit, and Regeneration
Generated listing is displayed in an editable form. Users can modify any field immediately without entering a separate edit mode.

Requirements:
- All fields always editable.
- AI-generated fields visually distinguished using a small badge.
- Users can regenerate the full listing.
- Users can regenerate individual fields.
- If a user has manually edited a field, regeneration should warn before overwriting it.
- Low-confidence fields should use soft helper text rather than technical confidence indicators.
- The UI should include a lightweight AI guidance note reminding the user to verify details before publish.

### F6 — Publish or Draft to Etsy
Submits the reviewed listing to Etsy as published or draft.

Requirements:
- User can save as draft at the app level during the wizard.
- User can publish to Etsy after review.
- Publishing requires a confirmation step.
- Publish confirmation must mention that Etsy listing fees may apply once published.
- Publish confirmation should include a link to Etsy listing fee information that opens in a new browser tab/window.
- Successful publish returns a link to the Etsy listing.

### F7 — Edit Existing Listings
User can load an existing Etsy listing into the review/edit screen. They can manually edit fields or trigger AI enhancement using the current listing content plus optional Shop Rules as context.

Requirements:
- Separate entry point from Create Listing.
- Discovery methods should include search by title, browse recent listings, and filters such as section or status.
- The editing experience should feel consistent with the create-listing review form.
- Changes are pushed back to Etsy via API.

### F8 — Saved Drafts
Users can view and resume app-level drafts created during the new listing flow.

Requirements:
- Show draft thumbnail if available.
- Show title or working name.
- Show last updated timestamp.
- Show current wizard step.
- Support resume and delete.

***

## AI Architecture

```text
[Image Upload (1–10 photos)]
        ↓
[Vision Agent] — extracts signals used to prefill listing data
        ↓
[Shop Rules Merge] — applies reusable seller preferences and overrides
        ↓
[Listing Agent] — generates listing fields and suggestions
        ↓
[User Review / Edit / Regenerate]
        ↓
[Publish or Draft → Etsy API]
```

Both agents receive full Shop Rules context when a profile is selected. Neither stores conversational state between sessions; persistent seller context lives in Shop Rules and draft/listing data.

For F7, the Listing Agent receives current listing fields as additional context instead of starting from scratch.

## UX Requirements

### Experience model
The primary listing-creation experience should use a multi-step wizard.

Recommended steps:
1. Upload photos.
2. Add details.
3. Review AI suggestions.
4. Edit listing.
5. Publish or save draft.

### Wizard behavior
- Show progress clearly.
- Allow backward navigation without losing changes.
- Support autosave.
- Surface a lightweight save state such as "Saved just now".
- Allow manual save draft.
- Allow return later from Saved Drafts.

### Responsive design
The application should be responsive for desktop and mobile.

Requirements:
- Desktop-first productivity with simple grouped forms.
- Mobile layouts should stack vertically.
- Primary actions should remain easy to reach on mobile.
- Forms should remain readable and easy to edit on smaller screens.

### Friendly language
The UI should prefer plain-language labels.

Examples:
- Use **Shop Rules** in the UI instead of Guardrail Profiles.
- Use **Create Listing** instead of Generate Listing.
- Avoid technical AI or data-model terminology in user-facing flows.

### AI disclosure
The product should include a gentle AI reminder in key review and publish moments.

Recommended tone:
"ListForge can help you draft listing details quickly, but it's still important to review everything for accuracy before publishing."

***

## Decisions Made

| Question | Decision |
|----------|----------|
| Auth system | Supabase Auth (abstracted) |
| Shop Rules storage | Supabase Postgres (abstracted via repository) |
| Low-confidence materials | Leave blank, user fills in |
| Re-generation | Included in v1, both full listing and field-level |
| Shop Rules profiles | Multiple per user |
| Shop Rules requirement | Optional, with soft warning if skipped |
| Image upload | Up to 10 images per listing session |
| Variations | In v1 scope |
| Existing listing editing | In v1 scope |
| Listing review form | All fields always editable |
| Listing creation UX | Multi-step wizard |
| Drafts | User can save and return later; autosave included |
| Existing listing discovery | Search, browse recent, and filters |
| Etsy connection | Required before create/edit flows |
| Publish confirmation | Required before publish |
| Etsy fees note | Included in publish confirmation with external link |
| Architecture | Modular monolith → Kubernetes/microservices |
| CQRS | Yes, via MediatR |

## Open Questions

These decisions are still worth validating later, but are not blockers for initial design work:
- Pricing and packaging model.
- Exact onboarding copy and education depth.
- Final brand palette and logo execution.
- Whether Step 3 and Step 4 in the wizard remain separate in implementation or collapse into a smoother single-screen transition.
- Whether draft naming is manual, automatic, or both.