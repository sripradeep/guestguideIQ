# Requirements — GuestGuideIQ Frontend (Property Owner + Guest)

> **Lead**: `aidlc-product-agent`. Sources: the authoritative project
> description; the backend CodeKB (`aidlc/spaces/default/codekb/guestguideiq-app/`,
> current as of `main` @ `76d190d`); the prior intent's reviewed-READY
> `stories.md`, `mockups.md` and `interaction-spec.md` (read in full;
> `accessibility-checklist.md` and `design-system-mapping.md` are referenced
> second-hand through those three and were not read directly at this stage);
> this intent's affirmed `team-practices.md`;
> and the human's answers in `requirements-analysis-questions.md` (Q1–Q10).
>
> Story and acceptance-criterion IDs (`US1.1`, `AC1.1.4`) and backend
> requirement IDs (`FR9.2`, `BR9.2`) are quoted from the prior intent and are
> **not** renumbered. This document's own `FR{n}` / `NFR{n}` IDs are new,
> permanent traceability keys for the frontend.

## Intent Analysis

**What the user is trying to achieve.** GuestGuideIQ's backend is built,
deployed, and reviewed. Its value is currently unreachable: there is no
interface through which a Property Owner can create a guide or a Guest can read
one. This intent builds that interface — the two customer-facing surfaces —
against an API that already exists and is frozen except for one scoped
follow-up.

**What this is not.** It is not a design exercise. The screens, states,
component behaviours, accessibility rules and locality-theming model were
designed and reviewed READY in the prior intent. It is also not a backend
intent: where the API cannot support a designed screen, that is recorded here as
a prerequisite or a workaround, not solved here.

**Goals, not features:**

- **G1** — A Property Owner can go from signup to a guide their guest can read,
  without assistance.
- **G2** — A Guest can open a link and get useful information about their stay
  without an account, on a phone, on a hotel connection.
- **G3** — Every screen renders in its locality's brand, and degrades cleanly
  when that brand is only half-configured.
- **G4** — The frontend is honest about backend limits: where the API cannot do
  something, the user sees a clear state, never a raw error or a hang.

**Success is measurable as**: an Owner completes signup → onboarding →
guide edit → publish → link generation unaided; a Guest opens that link and sees
the published guide with the property's trust cue; both surfaces meet the
quality targets in NFR1–NFR8.

---

## Scope

### In scope

Property Owner surfaces (PO-0 through PO-6) and Guest surfaces (G-1 through
G-3), per `mockups.md`. First release covers these stories:

| Story | Title | Priority |
|---|---|---|
| US1.1 | Create Account | Must |
| US1.2 | Reset Forgotten Password | Must |
| US1.3 | Complete Onboarding Wizard | Must |
| US1.5 | Create and Edit Digital Property Guide | Must |
| US1.6 | Curate Favorite Locality Content | Must |
| US1.7 | Start a Subscription | Must |
| US1.8 | Manage an Existing Subscription | Must |
| US2.1 | Access Property Guide via Stay-Scoped Link | Must |
| US2.2 | View Property Guide Content | Must |
| US2.3 | Get a Customized Itinerary via Chat | Should — included (Q2) |

### Out of scope (this intent)

- **US1.4 — PDF import** (Q2). The backend's
  `POST /v1/onboarding/content-source/pdf` accepts `{ succeeded, sections }`,
  meaning client-side extraction; deferred to a later release. Onboarding's
  manual path (`AC1.3.2`, `POST /v1/onboarding/content-source/scratch`) covers
  the first release.
- **All Admin/Ops screens — AD-1, AD-2, AD-3** (Q1 as superseded by Q9).
  Locality-brands are seeded by ops another way: script, direct internal-API
  call, or database.
- **US3.1, US3.2 — marketing-site lead capture.** Already delivered; the
  marketing site now posts to the backend lead-capture API.
- **US4.1, US4.2, US4.3, US4.4 — Admin/Ops stories.** Their UI is out of scope
  per above; their data is a precondition this intent consumes, not produces.
- **Backend implementation of the follow-up endpoints** (FR9). This intent
  consumes them; it does not build them.

---

## Functional Requirements

### FR1 — Account and session

- **FR1.1** — The Owner app shall provide signup (`POST /v1/accounts`) with
  username and password, rendering the resolved locality-brand's logo, name and
  accent (`AC1.1.4`), with no locality-selection control anywhere on the form.
- **FR1.2** — When the signup domain resolves to no locality-brand
  (`404 LOCALITY_NOT_RESOLVED`), the app shall render **PO-0**: a neutral,
  unbranded "Signups aren't available at this address" page with no form
  (`AC1.1.5`) — not a themed shell with an inline banner.
- **FR1.3** — The app shall surface `409 CONFLICT` as an inline duplicate-username
  error on the username field, and `400 VALIDATION_ERROR` `details[{field,reason}]`
  as per-field inline errors (`AC1.1.2`, `AC1.1.3`), validating on blur.
- **FR1.4** — The app shall provide login (`POST /v1/auth/login`) and shall
  present the backend's deliberately identical `401` for unknown-user and
  wrong-password as one non-disclosing message.
- **FR1.5** — The app shall provide password-reset request
  (`POST /v1/auth/reset/request`) and confirm (`POST /v1/auth/reset/confirm`),
  rendering the always-`202` request response as "check your email" without
  revealing account existence, and `410 LINK_INVALID` as the expired-link screen
  with a request-a-new-link action (`AC1.2.1`, `AC1.2.2`).
- **FR1.6** — The app shall hold `accessToken` and `refreshToken` from the
  auth response and refresh via `POST /v1/auth/refresh` on expiry.
- **FR1.7** — The app shall collapse concurrent `401`s into a single in-flight
  refresh, with all other waiters retrying against its result. *(Required
  because the backend's refresh-token store is per-process across 2–6 tasks, so
  parallel refreshes race; affirmed in `team-practices.md` § Code Style.)*
- **FR1.8** — The app shall restore session identity after a page reload via
  `GET /v1/accounts/me` (FR9.3), rather than depending on ids that arrive only
  in a login response.
- **FR1.9** — The app shall provide logout, calling the revocation endpoint
  (FR9.4) and clearing local session state.

### FR2 — Onboarding

- **FR2.1** — The app shall render the onboarding wizard (PO-3) as a
  multi-step form with a visible "Step X of Y" indicator and labels, driven by
  `GET /v1/onboarding`'s `currentStep`.
- **FR2.2** — The app shall resume an incomplete wizard at the last completed
  step with prior entries intact (`AC1.3.3`), and shall route an account whose
  `completed` is true straight to the guide editor (`AC1.3.4`).
- **FR2.3** — The app shall support backward navigation without data loss and
  shall show a saved indication on each step transition.
- **FR2.4** — The app shall offer only the manual content path
  (`POST /v1/onboarding/content-source/scratch`) in the first release; the PDF
  upload control is not rendered. *(Consequence of US1.4 being out of scope.)*
- **FR2.5** — The wizard shall render in the account's resolved locality-brand
  (`AC1.5.3` read to include onboarding, per `mockups.md` PO-3).

### FR3 — Guide authoring

- **FR3.1** — The app shall load the owner's guide via
  `GET /v1/guides/:propertyId`. *(Note: this GET creates an empty draft on first
  read — a side-effecting GET. The app must not call it speculatively, e.g. from
  a prefetch or a retry-on-focus.)*
- **FR3.2** — The app shall save edits via `PATCH /v1/guides/:propertyId`,
  sending the **complete** sections array. *(The endpoint is a full replace, not
  a merge or JSON Patch; a partial send silently deletes sections.)*
- **FR3.3** — The app shall provide publish and unpublish actions
  (`POST .../publish`, `POST .../unpublish`) and shall reflect `publishStatus`
  in the editor.
- **FR3.4** — When no content is published, the guest-facing guide shall render
  one deterministic placeholder — "this guide isn't published yet" — and the
  editor shall show the owner that exact message (`AC1.5.2`).
- **FR3.5** — The app shall render the guide editor inside the persistent
  SideNav dashboard shell (Guide, Locality Content, Subscription, Account).

### FR4 — Locality content curation

- **FR4.1** — The app shall list the property's locality POIs (`GET /v1/pois`)
  and events (`GET /v1/events`) on PO-6.
- **FR4.2** — The app shall favourite (`POST /v1/guides/:propertyId/favorites`)
  and unfavourite (`DELETE /v1/guides/:propertyId/favorites/:itemType/:itemId`)
  with an optimistic toggle and no confirmation dialog, reverting the toggle with
  an inline notice on failure (`AC1.6.1`–`AC1.6.3`).
- **FR4.3** — The favourite request shall always send a body. *(The endpoint
  returns `500`, not `400`, on a missing body — it lacks the `?? {}` fallback
  every other handler has.)*
- **FR4.4** — When `isEmptyLocality` is true, the app shall render the backend's
  `emptyMessage` as the empty state rather than a competing hardcoded string, and
  never a blank grid (`AC1.6.4`).
- **FR4.5** — The app shall surface `400 VALIDATION_ERROR` from a favourite of
  an out-of-locality item as an inline error.

### FR5 — Subscription

- **FR5.1** — The app shall display current plan and status on PO-4, read via
  `GET /v1/subscriptions` (FR9.2).
- **FR5.2** — The app shall start a subscription (`POST /v1/subscriptions`) and
  render `402 PAYMENT_FAILED` as an inline banner stating no changes were made
  (`AC1.7.2`).
- **FR5.3** — The app shall upgrade, downgrade and cancel via
  `PATCH /v1/subscriptions`, sending `action` as a **typed union value, never an
  unvalidated string**. *(The endpoint's final `else` branch cancels the
  subscription on any unrecognised action — a typo or a speculative retry is a
  silent, billing-affecting cancellation.)*
- **FR5.4** — The app shall not retry a `PATCH /v1/subscriptions` request whose
  outcome is unknown (timeout, network failure), given FR5.3's cancel-on-anything
  behaviour; it shall re-read state and ask the user instead.
- **FR5.5** — With no active subscription, Upgrade/Downgrade/Cancel shall be
  disabled with a "Start a subscription first" tooltip, and only Start
  Subscription active (`AC1.8.3`); `409 CONFLICT` shall render as a clear
  nothing-to-modify message.
- **FR5.6** — Cancellation shall present a confirmation dialog stating plainly
  that guide content stays intact and resubscribing restores access
  (`AC1.8.2`).

### FR6 — Guest link generation *(new — no mockup exists)*

- **FR6.1** — The Owner dashboard shall provide a control to generate a
  stay-scoped guest link, calling the follow-up's `POST /v1/stays` (FR9.1).
- **FR6.2** — The generated link shall be presented for manual copying, with a
  copy-to-clipboard affordance and confirmation (Q4). No email send, no QR code,
  no booking-system integration in this intent.
- **FR6.3** — The link shall be rendered on the property's own locality-brand
  domain, consistent with `AC2.1.4`.
- **FR6.4** — This screen requires a design pass at `refined-mockups` or
  `functional-design`: `mockups.md` has no screen for it.

### FR7 — Guest guide

- **FR7.1** — The Guest app shall resolve a stay via `GET /v1/stays/:token`
  and render G-2, mobile-first, with Overview / POIs / Events tabs.
- **FR7.2** — The app shall show the property photo and name **immediately on
  open, before content loads**, as the trust cue (`AC2.1.1`). This cue is
  anchored to property-specific content and shall never be weakened into "the
  domain or theme looks official".
- **FR7.3** — `410 LINK_INVALID` shall render G-1's single "This link is no
  longer valid" screen for every invalid case — expired stay, unknown token,
  malformed token — never a raw 404 or an error page (`AC2.1.2`, `AC2.1.3`).
- **FR7.4** — Tabs shall render whatever content exists; an empty tab shows
  "More local recommendations are being added" rather than a blank tab
  (`AC2.2.2`).
- **FR7.5** — The app shall render the guest's favourited POIs and non-expired
  events from the stay payload, and shall degrade gracefully when the locality
  has no events (`AC2.2.1`).
- **FR7.6** — The app shall render POI and event content from the stay payload
  alone; there is no guest-facing detail lookup (Q3 — not in the follow-up), so
  the app shall not offer a detail view for an id it cannot resolve.

### FR8 — Itinerary chat

- **FR8.1** — The app shall render a persistent chat widget (G-3), reachable
  from every guide tab, collapsed to a bubble by default.
- **FR8.2** — The app shall send messages via `POST /v1/stays/:token/chat` and
  render the returned `messages` transcript.
- **FR8.3** — The app shall show a typing indicator while awaiting a reply,
  escalating to an explicit "still working…" note past roughly five seconds.
- **FR8.4** — On `504 CHAT_PROVIDER_TIMEOUT` or any failure, the app shall
  preserve chat history and offer a Retry that re-sends the last message
  (`AC2.3.3`), never a silent hang.
- **FR8.5** — The app shall render a `sparse: true` reply as an ordinary
  assistant message, not a distinct UI state (`AC2.3.2`).
- **FR8.6** — The app shall restore chat history on reopening the widget, via
  the follow-up's chat-history read (FR9.5).
- **FR8.7** — The assistant `reply` string is untrusted, attacker-influenceable
  content and shall never reach a raw-HTML sink. *(The guest's own message
  round-trips through a model.)*

### FR9 — Backend follow-up (prerequisite, consumed not built)

Scoped at Practices Discovery (Q8 there) and extended by Q3 here. Each item
blocks the frontend requirement named beside it.

- **FR9.1** — `POST /v1/stays` (owner-authenticated), returning the token or the
  full link. Blocks FR6.1 and the entire Guest surface. *(Nothing creates a
  `Stay` today; `createStayService` exists but is wired to no route.)*
- **FR9.2** — `GET /v1/subscriptions`. Blocks FR5.1.
- **FR9.3** — `GET /v1/accounts/me`. Blocks FR1.8.
- **FR9.4** — Logout / refresh-token revocation. Blocks FR1.9.
- **FR9.5** — Chat history read. Blocks FR8.6.
- **FR9.6** — CORS/origin configuration admitting the frontend's development,
  CI and staging origins, plus `ALLOWED_ORIGINS` added to the backend's
  `.env.example`. Blocks **all** local and CI integration testing. *(Production
  currently allows `https://guestguideiq.com` only; `dev` and `staging` have no
  entry, so `origin: false`. A developer following the documented setup silently
  gets no allowed origins at all.)*
- **FR9.7** — This follow-up lands **before** frontend Construction begins
  (affirmed at Practices Discovery).

### FR10 — Locality branding

- **FR10.1** — The app shall apply the resolved locality-brand as a **themed
  accent layer** — logo, name/tagline, and a small brand-colour palette — over
  identical layout, typography, spacing and component behaviour. BrandTheme
  substitutes token values only, never structure.
- **FR10.2** — The app shall apply BrandTheme to the onboarding wizard, the
  Owner dashboard shell, and the Guest guide.
- **FR10.3** — When a locality-brand has only name/tagline saved, the app shall
  render the clean functional default plus that name/tagline — never a
  half-styled or broken page (`AC1.5.4`, `AC2.2.4`).
- **FR10.4** — When no locality resolves (PO-0 only), no BrandTheme is applied
  at all, not even the functional default's accent (`AC1.1.5`).
- **FR10.5** — `locality.visualStyling` is an unschematised
  `Record<string, unknown> | null` and untrusted. Exactly one module shall parse
  it into typed design tokens with defaults before any component reads it; no
  component shall read the raw blob or spread it into a style object.
- **FR10.6** — Whether G-1 (invalid link, reached through a **resolvable**
  locality domain) renders branded or neutral is undecided — carried from
  `mockups.md` R-06 as an open question for `domain-design`.

### FR11 — Error handling and API boundary

- **FR11.1** — Exactly one API-client module shall make every backend request.
  No component, page, route or view calls `fetch` directly, and imports flow
  downward only. *(Affirmed in `team-practices.md`; this is what keeps the
  deferred proxy/auth-transport decision cheap to reverse.)*
- **FR11.2** — Exactly one module shall parse the backend's `{ code, message,
  details? }` envelope into a discriminated union keyed on `error.code`, and
  define a fallback for non-envelope responses (a raw `500`, a `502`/`504` from
  infrastructure) and for an unrecognised future code.
- **FR11.3** — Nothing above that module shall read a raw HTTP status or an
  unparsed response body.
- **FR11.4** — The app shall render `429 RATE_LIMITED` as its own "too many
  requests, try again shortly" state, not a generic error (Q8). *(The stay
  endpoint allows 20/min per client IP; a shared hotel NAT can trip it for
  several guests at once.)*
- **FR11.5** — Every error state shall pair an icon with text — never colour
  alone — via the shared StatusBanner component.
- **FR11.6** — A correlation identifier, if adopted, must travel in the response
  envelope body rather than a header: the backend's CORS sets no
  `exposedHeaders`, so a response header is unreadable cross-origin.

---

## Non-Functional Requirements

- **NFR1 — Accessibility.** Every Owner and Guest surface meets **WCAG 2.1 AA**:
  keyboard navigability, screen-reader support, and non-colour-dependent status
  indicators. Component-level ARIA roles, focus management and `aria-live`
  behaviour follow `interaction-spec.md`.
- **NFR2 — Accessibility enforcement.** An automated accessibility check runs in
  CI and **reports without blocking** a merge, with a recorded intent to make it
  blocking once the baseline is clean (Q7, Q10). *This is a deliberate,
  time-boxed exception to the team's enforcement-discipline principle — see
  Assumptions.*
- **NFR3 — Per-locality contrast.** Each locality's accent colour must
  independently meet 4.5:1 (text) and 3:1 (UI component) against the base
  tokens. This is a per-brand validation, not a one-time check of a single global
  token. Because brand colours are set after deploy, verification cannot be a
  build-time-only check.
- **NFR4 — Responsive behaviour.** Guest guide is mobile-first. SideNav
  collapses to a hamburger overlay below 768px, to an icons-only rail at
  768–1023px, and is persistent and expanded at 1024px and above. TabNav is a
  horizontally scrollable bar on mobile.
- **NFR5 — Perceived responsiveness.** Interactive feedback within roughly
  300ms; longer waits use skeleton or pulse states rather than spinner-only
  screens; the chat widget escalates to an explicit note past roughly five
  seconds.
- **NFR6 — Degraded connectivity.** Standard loading and retry states, plus the
  explicit `429` state of FR11.4. No offline caching and no installable offline
  mode in this release (Q8).
- **NFR7 — Session security.** No component, route guard or page reads the token
  store directly; all consume a resolved session object. *Where tokens are
  stored is deferred to `nfr-design`/`infrastructure-design`; see Constraints.*
- **NFR8 — Test coverage.** 80% line-coverage floor, with the `include`/`exclude`
  set declared explicitly at `domain-design` and enforced in the test runner's
  own configuration rather than only in CI. Tests substitute at the **network**
  boundary, never by mocking child components.
- **NFR9 — Browser support.** Current evergreen browsers (Chrome, Edge, Firefox,
  Safari) on desktop, and current mobile Safari and Chrome on Android.
  *Assumption — see below.*

---

## Constraints

- **C1** — The backend API is fixed except for the FR9 follow-up. The frontend
  adapts to it; it does not request changes beyond FR9.
- **C2** — Frontend framework, language and hosting are not chosen. Decided at
  `domain-design` / `infrastructure-design`.
- **C3** — **The hosting choice must not foreclose the same-origin-proxy
  option.** Affirmed at Practices Discovery. A static-only host with no
  server-side routing would silently decide the deferred token-storage question,
  whose alternative is a 7-day, non-revocable bearer token in browser-reachable
  storage. Q6's client-rendered-SPA answer does **not** relax this — it is a
  rendering decision, not a hosting decision.
- **C4** — Cookie-based auth is unavailable: the backend's CORS registration
  sets `origin` only, so `credentials` is never enabled and
  `Access-Control-Allow-Credentials` is never emitted. Bearer-token transport is
  the only option unless a same-origin proxy is adopted.
- **C5** — Tenancy resolves from the request `Host` header. A shared API host
  cannot serve every locality-brand: `BR9.2` returns `409` on a domain already
  bound elsewhere. Per-locality routing is a design constraint on hosting.
- **C6** — The frontend lives in its own new repository (affirmed). A shared
  frontend/backend API-types package is therefore not free: it needs publishing
  or a git dependency. There is no OpenAPI document, JSON Schema export or
  generated client, so near-term types are hand-written against
  `api-documentation.md`.
- **C7** — Every value reachable from frontend code is public once the page
  loads, including build-time public-prefix injections. No value that
  authenticates or authorizes may use that mechanism.
- **C8** — Chat is non-functional in the deployed configuration
  (`CHAT_PROVIDER=null` → `504` unless the locality has fewer than three curated
  items). US2.3's UI is buildable but not demonstrable end-to-end until a
  provider is configured.
- **C9** — `u2-admin-api` requires an ops-role JWT that **nothing in the system
  issues**; a Property Owner token is explicitly rejected with `403`. Locality
  endpoints are create-only — no `GET /v1/localities`, no `PATCH`. This is why
  AD-3 is out of scope (Q9).

---

## Assumptions

- **A1** — Locality-brands and their domains exist before an Owner signs up.
  Since no Admin/Ops UI is built here, ops seeds them by script, direct
  internal-API call, or database. *Owner: ops. Unvalidated — if no seeding path
  is arranged, signup cannot be exercised at all.*
- **A2** — The FR9 follow-up lands before frontend Construction. Affirmed as a
  practice; **not yet scheduled or owned.** *Owner: unassigned. This is the
  largest schedule risk in this document.*
- **A3** — NFR9's browser support floor was not asked and is inferred from the
  mobile-first Guest and desktop-primary Owner contexts in `personas.md`.
  *Owner: product. Confirm at `domain-design`.*
- **A4** — Guide content remains intact on subscription cancellation, so
  resubscribing restores it. Carried from `AC1.8.2` as an assumption there;
  still unconfirmed against backend behaviour.
- **A5** — NFR2's advisory accessibility check is a deliberate, time-boxed
  exception to the team's enforcement-discipline principle ("a tool that exists
  but never blocks a merge provides no real protection"). It does not violate the
  affirmed `## Forbidden` rule, which names only security scanners and the
  linter. *The recorded intent to make it blocking has no trigger date; without
  one, "for now" tends to become permanent.*
- **A6** — Owners will successfully deliver a manually copied link to their
  guests. No delivery mechanism is built (Q4), so this is untested product
  behaviour, not a system guarantee.

---

## Out of Scope

Listed under **Scope → Out of scope** above: US1.4 (PDF import), all Admin/Ops
screens (AD-1, AD-2, AD-3), US3.x (already delivered), US4.x UI, and the backend
implementation of FR9.

Additionally out of scope: offline support and installability (NFR6); guest
POI/event detail views (FR7.6); email or QR guest-link delivery (FR6.2);
pagination, filtering or sorting on any list (the backend returns whole-locality
lists and offers no pagination).

---

## Open Questions

- **OQ1** — Pre-check-in access: what does a guest see opening a link before
  their stay's check-in date? Carried unresolved from `US2.1`. → `domain-design`.
- **OQ2** — Does G-1 (invalid link on a **resolvable** locality domain) render
  branded or neutral? Carried from `mockups.md` R-06. → `domain-design`.
- **OQ3** — Where do tokens live: in-memory, browser storage, or `HttpOnly`
  cookies behind a same-origin proxy? Deferred at Practices Discovery, bound by
  C3. → `nfr-design` / `infrastructure-design`.
- **OQ4** — What frontend framework, language and hosting target? → `domain-design`
  / `infrastructure-design`.
- **OQ5** — What contract-verification mechanism prevents mocked-network
  fixtures drifting from the real API, beyond the thin live-backend E2E suite? →
  `domain-design`.
- **OQ6** — When does NFR2's accessibility check become blocking, and what
  defines a "clean baseline"? → `ci-pipeline`.
- **OQ7** — Who owns and schedules the FR9 follow-up (A2)? → `delivery-planning`.
- **OQ8** — Should the ops-auth gap and the locality list/read/update endpoints
  (C9) become their own intent? → out-of-band product decision.

## Review

**Verdict:** READY
**Reviewer:** aidlc-product-lead-agent
**Date:** 2026-09-07T18:27:57Z
**Iteration:** 2
**Request Challenge:** review:d471b6d6ccd3500eaa4f8296c7f9d3b9

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | requirements.md > FR1 (Account and session) | FR1.6/FR1.7 specify how the access token is refreshed, but nothing in FR1, NFR7, or the Open Questions specifies what happens when the **refresh itself fails** — expired or revoked refresh token, or the 7-day non-revocable token (`team.md` § Deployment) simply running out. A logged-in Owner mid-edit has no defined behaviour: silent redirect to login, an interstitial "session expired" message, or something else. This is a routine, high-frequency flow (every session eventually hits it) with no acceptance criterion anywhere upstream (`stories.md` doesn't cover it either — it is a genuinely new gap, not a missed citation), so a developer has no pass/fail criterion to build or test against. | Add an FR1.x requirement stating the app's behaviour when `POST /v1/auth/refresh` itself returns a failure (e.g. render a "your session expired, please log in again" state and clear local session state, preserving no partially-saved edit silently) — or, if genuinely undecided, move it to Open Questions rather than leaving it unaddressed. | Unresolved |
| R-02 | Minor | requirements.md > FR3.5 and `mockups.md` > PO-5 | FR3.5 and PO-5's SideNav both name "Account" as one of four dashboard rail items (Guide, Locality Content, Subscription, Account), but no requirement (here or in the prior intent's stories/mockups) says what that screen contains — profile display, password change, and/or the logout control from FR1.9. FR6.4 explicitly flags its own screen as needing a design pass; this one doesn't get the same flag despite having the identical gap. | Add a line noting the Account screen's content is undefined and needs a design pass at `refined-mockups`/`functional-design` (mirroring FR6.4's treatment), or fold logout/profile display into an explicit FR1.x. | Unresolved |

### Summary

This is a stale-receipt recovery pass, not a content re-review. I verified the artifact directly: the only change since my iteration-1 pass was the status-token normalisation (`Open` → `Unresolved`) on R-01 and R-02, both now confirmed absent of any lingering `Open` token anywhere in the file. FR1 (account/session), FR3.5, and every other section I checked against my prior notes are unchanged in substance — the refresh-failure gap (R-01) and the undefined Account screen (R-02) both remain exactly as before, and per the human's prior disposition both are carried forward as accepted risk at `Unresolved` rather than softened. Verdict is unchanged from iteration 1: READY.
