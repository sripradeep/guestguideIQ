# Business Overview — `guestguideiq-app`

**Repo**: `guestguideiq-app` (sibling of `aidlc/` at the workspace root)
**Derived from**: the developer full-repo scan of 2026-09-07, re-run over current HEAD (branch `main`, HEAD `76d190d`; the earlier pass ran at `40c8aed`). See `reverse-engineering-timestamp.md` for exact scope and verification depth.

---

## Business Domain

GuestGuideIQ is a **white-label digital guest-guide SaaS for short-term rental property owners**. A Property Owner signs up, onboards a single Property, curates a guide of sections and favourited local attractions, publishes it, and shares a stay-scoped link with a guest. The Guest opens the link without an account and sees the published guide plus an itinerary chat assistant.

The system is **multi-tenant by locality-brand**. A "locality brand" is a geographic/branding tenant (a town, a resort area, a destination marketing organisation) that owns curated local content — Points of Interest and Events — and supplies visual styling for the guest-facing experience. Every Property belongs to exactly one locality brand, and the tenant is resolved **from the HTTP request's own `Host` header**, not from a body field or path segment. That single design decision is the dominant business/architectural constraint on any browser frontend built against this backend (see `architecture.md` § Cross-Cutting Constraints and `api-documentation.md` § Tenancy).

## Actors

| Actor | Authenticates with | Reaches |
|---|---|---|
| **Property Owner** | Username + password → bearer access token (15 min) + rotating refresh token (7 days) | u1 public API, all owner routes |
| **Guest** | No account. An opaque **stay token** in the URL path, plus a matching `Host` header | `GET /v1/stays/:token`, `POST /v1/stays/:token/chat` only |
| **Marketing-site visitor** | None | `POST /v1/leads/*` (waitlist, partner, investor) |
| **Ops operator** | An ops-role JWT (`role === "ops"`) | u2 admin API only — **not issued anywhere in this repo** |
| **u2 admin API (as a service)** | Internal-scoped service JWT (5 min TTL) | u1 internal API on loopback |

## Key Functionality

1. **Account creation and authentication** — self-service signup that atomically creates an Account and its single Property, login, password-reset request/confirm, refresh-token rotation.
2. **Onboarding** — a strictly ordered four-step state machine: `property_basics` → `content_source` → `content_review` → `confirm` → completed. Content can be started from scratch or seeded from **already-extracted** PDF sections supplied by the caller.
3. **Property guide authoring** — a guide of `{title, body}` sections with draft/published status, plus favourites drawn from the locality's curated POIs and Events. Section updates are a **full replace**, not a merge.
4. **Curated local content browse** — read-only, locality-scoped lists of POIs and Events, with an explicit "empty locality" signal and a canned message so the UI can render a graceful empty state.
5. **Subscription management** — a single `standard` plan with `upgrade` / `downgrade` / `cancel` actions, backed by a Stripe adapter.
6. **Guest stay experience** — token-scoped read of the property, locality branding, and published guide; plus a chat assistant with a curated-content-sparse fallback.
7. **Lead capture** — three unauthenticated marketing intake endpoints already consumed by the existing marketing site.
8. **Ops back office** — a separate internal-only service for creating POIs, auditing events, looking up accounts, and registering locality brands and their domains.

## Business Rules Visible in the Code

- **BR8.3** — a guest stay link is only honoured when the request's resolved locality brand equals the linked Property's `localityBrandId`. Every failure mode (unknown token, expired stay, missing property, host mismatch) returns the **same** `410 LINK_INVALID` so the failure reason is never leaked.
- **BR9.2** — one domain maps to **at most one** locality brand; registering a domain already bound elsewhere returns `409 CONFLICT`.
- **BR9.6** — the guest UI themes from `locality.visualStyling` and must degrade gracefully when it is `null`.
- Username uniqueness is **case-insensitive** (`409 CONFLICT`).
- Login returns an identical `401 UNAUTHORIZED` for an unknown username and a wrong password.
- Password-reset request **always** returns `202`, never revealing whether the account exists.
- Expired events are excluded from the public `GET /v1/events` list but retained for the ops audit view.

## Business Capabilities That Are Specified but Not Operational

These are recorded here because they change what a frontend can promise a user. Detail and evidence live in `api-documentation.md` and `code-quality-assessment.md`; they are named once here so the business picture is honest.

| Capability | Status |
|---|---|
| Issuing a guest stay link | **Absent.** No endpoint anywhere creates a `Stay`; the service method exists but is never wired. The whole Guest experience has no supply side. |
| Itinerary chat | **Non-functional.** No LLM vendor is configured in any environment; the only success path is a canned reply for content-sparse localities. |
| Password reset completion | **Non-functional.** The reset token is generated and discarded — there is no mailer, queue, or SES construct. |
| PDF import | **Server does not parse PDFs.** Extraction is the caller's responsibility. |
| Reading subscription state | **Absent.** There is no `GET /v1/subscriptions`; plan/status can only be observed by mutating. |

## Value Proposition Implied by the Design

The product's differentiator is the **locality-brand layer**: curated, professionally maintained local content that individual owners inherit for free, wrapped in the destination's own branding. The owner's authoring burden is deliberately small — a handful of sections plus favourites — because the locality supplies the depth. The guest never installs an app or creates an account.
