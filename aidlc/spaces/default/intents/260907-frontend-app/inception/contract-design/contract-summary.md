# Contract Summary — GuestGuideIQ Frontend

Every boundary this frontend must honour, and the agreement across it.

## The shape of this contract set is unusual, and it matters

**This frontend exposes no public API.** Nothing outside the system codes against
it — guests and owners reach it through a browser. There is no external
specification this project provides and must keep stable.

What it has instead is the inverse: **one genuinely external contract that this
project consumes and does not own.** `u1-backend-api` belongs to another team in
another repository, and it is the most consequential agreement in the whole
design. The usual contract-design risk is "we own a spec others depend on"; here
the risk runs the other way — we depend on a spec we cannot change and, today,
cannot read in machine-readable form.

The fourteen inter-unit boundaries are all compile-time or in-process, inside one
repository that deploys as one artifact. They are real contracts, but they are
enforced by a compiler rather than negotiated across a network.

## Contracts

| # | Provider Unit | Consumer | Mechanism | Owner |
|---|---|---|---|---|
| C1 | **External: u1-backend-api** | `u1-api-contract` | HTTPS/REST, JSON | **Backend team** (not this project) |
| C2 | `u1-api-contract` | `u3-foundation` | Vendored generated types, build-time | `u1-api-contract` |
| C3 | `u3-foundation` | `u4`, `u5`, `u6`, `u7`, `u8` | In-process module interface | `u3-foundation` |
| C4 | `u2-design-system` | `u4`, `u5`, `u6`, `u7`, `u8` | In-process component interface | `u2-design-system` |
| C5 | `u4-owner-shell` | `u5`, `u6`, `u7` | In-process routing and layout interface | `u4-owner-shell` |

Five contracts, not fourteen: C3, C4 and C5 each cover a fan-out from one
provider to several consumers with the same agreement, so they are one contract
with several consumers rather than several contracts.

---

## C1 — The backend API (external, consumed)

**Owner: the backend team.** This project cannot change it, and this section is
not a specification we are entitled to write. It records what we depend on.

**Contract of record, today: `api-documentation.md` in the backend repository.**
Divergence from it is a backend defect, not a frontend adaptation. That is a
deliberate choice with a known weakness — it makes a prose document normative
when it was not written to be — and it is an interim position, not the target.

**The target remains ADR-006**: a published machine-readable contract the
frontend generates types from. This section is superseded the moment that
arrives. Nothing here reverses that decision; it fills the gap before it.

The endpoints in play, with what blocks each:

```yaml
# Consumed surface — transcribed path-for-path from api-documentation.md's
# route tables (§A.2 auth, §A.3 onboarding, §A.4 guides, §A.5 locality content,
# §A.6 subscriptions, §A.7 guest). Paths are verbatim; do not paraphrase them.
#
# Status legend:
#   live      = documented AND deployed
#   documented_but_absent = present in api-documentation.md, NOT in the running
#               service. These are the sharpest edge of Q1's choice — see below.
#   absent    = named in AC4.1.x, documented nowhere
openapi_subset:

  live_auth_and_account:
    - POST   /v1/accounts                    # signup                       (US1.1)
    - POST   /v1/auth/login                  # identical 401 for unknown user
                                             # and wrong password           (US1.3)
    - POST   /v1/auth/refresh                # rotating refresh            (US1.10)
    - POST   /v1/auth/reset/request          # ALWAYS 202, never reveals
                                             # whether the account exists   (US1.4)
    - POST   /v1/auth/reset/confirm          # 410 LINK_INVALID when expired,
                                             # unknown or already used      (US1.4)

  live_onboarding:                           # five DISTINCT named endpoints.
                                             # There is no :step parameter.
    - GET    /v1/onboarding                  # returns { currentStep, completed } ONLY
    - POST   /v1/onboarding/property-basics  # { name }                     (US1.5)
    - POST   /v1/onboarding/content-source/scratch   # no body              (US1.6)
    - POST   /v1/onboarding/content-source/pdf       # deferred this release
    - POST   /v1/onboarding/content-review/confirm
    - POST   /v1/onboarding/finish

  live_guide:
    - GET    /v1/guides/:propertyId          # CREATES an empty draft guide on
                                             # first read — a GET with a side effect
    - PATCH  /v1/guides/:propertyId          # FULL REPLACE of the sections array.
                                             # Missing/misspelled `sections` returns
                                             # 200 with every section deleted (US1.7)
    - POST   /v1/guides/:propertyId/publish                                # (US1.8)
    - POST   /v1/guides/:propertyId/unpublish                              # (US1.8)
    - POST   /v1/guides/:propertyId/favorites        # { itemType, itemId }.
                                             # Missing body -> 500, not 400: the one
                                             # handler with no `?? {}` fallback (US1.12)
    - DELETE /v1/guides/:propertyId/favorites/:itemType/:itemId            # (US1.12)

  live_locality_content:
    - GET    /v1/pois                        # owner-auth, unpaginated, no query params
    - GET    /v1/events                      # owner-auth, unpaginated, no query params
                                             # both return isEmptyLocality + emptyMessage

  live_subscription:
    - POST   /v1/subscriptions               # start                       (US1.13)
    - PATCH  /v1/subscriptions               # { action: upgrade|downgrade|cancel }.
                                             # Final `else` CANCELS on anything
                                             # unrecognised; body read as
                                             # request.body?.action        (US1.14)

  live_guest:
    - GET    /v1/stays/:token                # 410 LINK_INVALID collapses four
                                             # failure modes deliberately  (US2.1)
    - POST   /v1/stays/:token/chat           # stay-scoped, rate-limited on the TOKEN
                                             # not the IP. CHAT_PROVIDER=null in the
                                             # deployed config -> 504       (US2.4)

  documented_but_absent:
    - POST   /v1/stays                       # AC4.1.1 — documented; no route
                                             # registration exists          (US1.9)
    - GET    /v1/subscriptions               # AC4.1.2 — api-documentation.md itself
                                             # marks this "Missing"        (US1.14)
    - GET    /v1/accounts/me                 # AC4.1.4 — documented, not deployed (US1.3)

  absent:
    - <logout / refresh-token revocation>    # AC4.1.5                     (US1.11)
    - <chat history read>                    # AC4.1.6                      (US2.4)
    - <locality brand read>                  # AC4.1.7 — locality data leaves the
                                             # system only via the guest stay payload
                                             # and internal 127.0.0.1 routes (US1.1, US2.1)
    - <guest-resolvable POI/event>           # AC4.1.9 — the guest receives bare ids
                                             # and both list endpoints are owner-auth (US2.3)

  cross_cutting_blockers:
    - AC4.1.3  # CORS — production allows exactly ['https://guestguideiq.com'];
               # no frontend origin, no staging, no localhost. BLOCKS EVERY REQUEST.
    - AC4.1.8  # Host-header tenancy. Scoped: blocks guest routes (requireStayToken)
               # and signup's locality resolution. Owner-authenticated routes
               # resolve identity from JWT claims and never read Host.
    - AC4.1.10 # no response shapes documented for the endpoints above that
               # do not yet exist
```

**`documented_but_absent` is the sharpest edge of Q1's choice, and it is worth
naming.** Three endpoints appear in `api-documentation.md` but are not in the
running service — `api-documentation.md` even marks `GET /v1/subscriptions` as
"Missing" in its own gaps table. Making that document normative means the
contract of record describes routes that do not answer. Anything built against
those three rows will compile and fail at runtime. They are separated out here
rather than mixed into `live` precisely so nobody reads the list as a
callable set.

**Error envelope — the one part of C1 that is stable and well-specified:**

```yaml
error_envelope:
  shape: '{ error: { code: string, message: string, details?: object } }'
  applied: uniformly across all three backend contracts
  codes: 11 catalogued in api-documentation.md
  frontend_obligation:
    - exactly one module parses this into a union keyed on error.code
    - a non-envelope response (raw 500, or 502/504 from infrastructure) has a
      defined fallback
    - an unrecognised future code resolves to a defined default, never a crash
  notable_codes:
    LINK_INVALID:   'guest app central navigational state, not an error toast'
    PAYMENT_FAILED: 'routes to billing recovery, not a generic message'
```

**Failure behaviour at this boundary.** Timeouts and retries follow C3's policy.
Two rules are absolute and come from backend behaviour rather than preference:
no request is ever sent without a complete body, and no non-idempotent request is
retried automatically.

**SLA.** None is offered or agreed. The backend runs 2–6 tasks with an in-memory
per-process rate limiter, so rate-limit behaviour is not deterministic across
instances and `Retry-After` is unreadable cross-origin — no `exposedHeaders` is
configured. The frontend's rate-limited state therefore says "shortly" rather
than counting down.

---

## C2 — Generated types (`u1-api-contract` → `u3-foundation`)

**Mechanism: vendored, committed, refreshed by a script.**

```yaml
delivery:
  mode: vendored
  location: a single directory in this repository, committed
  refresh: by script, reviewed as a normal diff
  rationale: >
    The two repositories are separate and this team has no publishing
    infrastructure. Vendoring needs none, and the diff is visible in review.
  known_weakness: >
    It goes stale silently the moment someone forgets to run the refresh.
    Nothing detects that automatically today.
provenance_migration:
  now: >
    Hand-written types transcribed from api-documentation.md, committed at the
    vendored location. There is nothing machine-readable to generate from yet.
  after_ADR_006: >
    Generated output replaces them at the SAME path. The file changes
    provenance without moving, and every importer is unaffected.
  invariant: >
    Nothing outside this unit ever hand-edits a type at that path once
    generation begins. A hand-edited generated type is exactly the drift this
    unit exists to prevent.
```

This pairing — a prose contract of record plus vendored delivery — defines a
migration rather than a contradiction, and the shared path is what makes the
migration cheap.

---

## C3 — The foundation's interface (`u3-foundation` → five consumers)

The most-depended-on contract in the system. Five units consume it; none of them
may reach past it to the network, a raw HTTP status, a token, or an unparsed
`visualStyling` blob.

```yaml
provides:
  session:
    shape: resolved session object
    guarantees:
      - no consumer ever sees a raw token
      - concurrent 401s collapse into exactly ONE in-flight refresh; all other
        waiters resolve against its result
      - a 401 from the refresh call itself ENDS the session rather than
        refreshing again (without this the client loops)
      - on session end, local session state is cleared but caller state is not
  errors:
    shape: discriminated union keyed on error.code
    guarantees:
      - every non-2xx response arrives already parsed
      - non-envelope responses have a defined fallback
      - unrecognised codes resolve to a defined default
      - field-level details stay attached to their named field
  theme:
    shape: typed design tokens with defaults
    guarantees:
      - visualStyling is parsed here and nowhere else
      - minimal-brand and no-brand fallbacks are total and cannot throw
      - serves the guest invalid-link path as well as the valid one
  requests:
    shape: typed methods per endpoint
    guarantees:
      - every request carries a complete body
      - PATCH /v1/subscriptions action comes from a fixed typed set
      - refetch-on-focus and prefetch are disabled as configuration

retry_and_timeout_policy:
  ownership: this unit owns the DEFAULT; callers may override per call
  default:
    idempotent_reads: bounded retry with exponential backoff and jitter
    non_idempotent_writes: NO automatic retry
  why_the_default_points_this_way: >
    The dangerous direction must require an explicit, reviewable opt-in.
    AC1.14.5 forbids retrying an indeterminate subscription change because a
    retry is a silent billing event — the endpoint cancels on anything
    unrecognised and a missing body reaches that branch. A caller that wants a
    retry on a write must say so at the call site, where the reason is visible
    to a reviewer.
  override: per call, at the call site, with the domain reason stated
```

**Versioning: none.** See "Ownership rules" below.

---

## C4 — Design-system primitives (`u2-design-system` → five consumers)

**The component contract is specified at `functional-design`, not here.** The
framework is unchosen (OQ4), so a props specification written now would be in a
notation that will not survive the choice.

What this stage fixes is the boundary's *scope*, which does not depend on the
framework:

```yaml
covers:
  - the primitive set: inputs, buttons, banners, dialogs, tabs, navigation,
    date fields, copyable values
  - each primitive's states, keyboard behaviour, focus management and
    live-region announcements
excludes:
  - domain state of any kind
  - network access of any kind
  - brand resolution — this unit CONSUMES theme tokens and never resolves them
obligations_on_this_unit:
  - WCAG 2.1 AA lives here. Meeting it is a property of the primitives, not a
    per-screen effort by each consumer.
  - excluded from the 80% coverage floor (ADR-007), and still exercised by the
    scenario tests that mount it
deferred_to: functional-design, per unit
```

---

## C5 — Shell routing and layout (`u4-owner-shell` → three consumers)

The thinnest contract in the set. Three Owner feature units render inside a frame
this unit provides.

```yaml
provides:
  - the route table and route guards, guarding on the resolved session object
    rather than on a token
  - the persistent navigation frame the feature screens render inside
  - the header user menu, including the logout control (AC1.11.3)
  - presentation of the session-expired state OVER whichever screen is open
obligation_on_consumers:
  - every feature unit must tolerate being interrupted by the session-expired
    state at any moment, with its own in-progress state preserved behind it
excludes:
  - any feature's business rules
note: >
  This unit also owns the unauthenticated entry screens (signup, login,
  password reset) and the account screen, but those are its own stories rather
  than part of what it provides to consumers.
```

---

## Ownership rules

**C1 is owned externally and this project cannot change it.** Divergence from
`api-documentation.md` is a backend defect. Someone has to actually check for
divergence, though — nothing does automatically today, which is the whole reason
ADR-006 asked for a machine-readable contract. Until it exists, the thin
live-backend suite is the only detector, and it covers only the paths it
exercises.

**C2 is owned by `u1-api-contract`**, and the ownership is really a discipline:
nothing outside that unit hand-edits a type at the vendored path.

**C3, C4 and C5 are owned by their provider units and carry no version
numbers.** All five units compile together and deploy as one artifact, so no
consumer can be running an old version of a provider. **The compiler is the
contract check**: a breaking change is a compile error in the same pull request
that caused it, which is faster feedback than any deprecation policy would give.

Consequences accepted with that choice:

- A breaking change to `u3-foundation`'s surface touches five units in one pull
  request. That is intended — it makes the blast radius visible at the moment
  of change rather than deferring it.
- No deprecation path exists. If units are ever split into separately published
  packages, this decision needs revisiting, and C3 is the one that would need a
  version first.

**Additive changes stay safe by the usual rule**: consumers ignore fields they do
not recognise. This matters most at C1, where the frontend must tolerate a
backend adding a response field without redeploying.

## Open questions

| Contract | Question | Blocks |
|---|---|---|
| C1 | Who checks for divergence between `api-documentation.md` and the deployed API, and how often? Nothing does today. | Every unit consuming the backend — the whole system rests on a contract nobody verifies |
| C1 | When does the machine-readable contract (ADR-006) actually arrive? It has no owner and no schedule. | `u1-api-contract`'s transition from transcribed to generated |
| C2 | What detects a stale vendored artifact? A forgotten refresh is silent. | `u3-foundation`, and every unit downstream of it |
| C1 | **CORS (AC4.1.3)** — production allows exactly `https://guestguideiq.com`; no frontend origin, no staging, no localhost, no wildcard. When is a frontend origin added? | **Every request from this frontend.** Nothing can be exercised at all until this lands — including local development |
| C1 | How does tenancy resolve for a cross-origin frontend (AC4.1.8) — same-origin proxy, tenant header, or path/body parameter? | The **entire Guest surface** (`requireStayToken` resolves the brand from `Host`), plus signup's locality resolution (AC1.1.2). **Not** the Owner-authenticated routes, which resolve identity from JWT claims and never read `Host` |
| C3 | Where do tokens physically live (OQ3)? Bounds whether cross-tab session races are in scope. | `u3-foundation`'s session guarantees |
| C4 | The component specification itself. | Deferred to `functional-design` by decision, not by omission |

**The CORS row is the one that gates everything.** Until a frontend origin is on
the allowlist, no request from this frontend reaches the API at all — not in
production, not in CI, not on a developer's machine. It is a one-line
configuration change in the backend and it blocks the entire project.

**AC4.1.8 is narrower than it first appears, and the distinction matters for
sequencing.** Owner-authenticated routes — login, guides, POIs, events,
subscriptions, account — resolve identity and property scope entirely from JWT
claims and never read the `Host` header. Only `requireStayToken`, which guards
the two guest routes, resolves tenancy from `Host`; signup's locality resolution
is the one Owner-side criterion affected (AC1.1.2).

So the **Owner walking-skeleton path is gated by CORS, not by host tenancy**.
Conflating the two would make the skeleton look like it waits on an
architectural decision — same-origin proxy versus tenant header — when it waits
on a configuration change. The Guest surface genuinely does wait on the
architectural one.

*This paragraph was corrected during revision: the first version claimed AC4.1.8
blocked every request in the system, which overstated its scope and would have
made Bolt 1 look more blocked than it is.*

## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-09-08T03:19:22Z
**Iteration:** 2

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Critical | contract-summary.md > C1 `openapi_subset` (`live_*` groups) | The prior pass found favourites, chat, and onboarding transcribed with the wrong paths/shape. Re-verified path-for-path and verb-for-verb against `api-documentation.md` §A.2–A.7 in this revision: every entry in `live_auth_and_account`, `live_onboarding` (five distinct named steps, no `:step` param), `live_guide` (including `POST /v1/guides/:propertyId/favorites` and the `DELETE .../favorites/:itemType/:itemId`), `live_locality_content`, `live_subscription`, and `live_guest` now matches the route tables exactly, verb and path both. | None — re-transcription verified correct. | Resolved |
| R-02 | Major | contract-summary.md > "Open questions" table (AC4.1.8 row) and closing paragraphs | The claim that AC4.1.8 blocks "every request in the system" was unsupported. Re-checked against `stories.md` (AC4.1.8 definition at line ~591, and the dependency map at line ~618: "AC4.1.8 (host tenancy) → US1.1, US2.1, US2.2, US2.3, US2.4 [blocks all Guest work]"). The revised text — Guest surface (`requireStayToken`) plus AC1.1.2 (signup's locality resolution), and explicitly *not* the JWT-scoped Owner routes — matches `stories.md`'s own scoping, and the "CORS blocks everything" attribution is correctly assigned to AC4.1.3 instead. | None — narrowed claim verified accurate. | Resolved |
| R-03 | Minor | contract-summary.md > `documented_but_absent` block and its explanatory paragraph (lines ~117–150) | The category is described as "present in api-documentation.md, NOT in the running service," but the three rows are not uniform on that description. `GET /v1/subscriptions` genuinely fits: `api-documentation.md` §A.6 explicitly states "There is no `GET /v1/subscriptions`" and its own A.10 gap table marks it "Missing." `POST /v1/stays` and `GET /v1/accounts/me`, however, are not presented anywhere in the doc as documented routes with a request/response shape — `POST /v1/stays` appears only in a prose recommendation sentence in §A.9 ("An owner-authenticated `POST /v1/stays`... is a **prerequisite backend change**"), and its exact path is this document's own suggested name for a backend follow-up that `stories.md`'s AC4.1.1 also demands, not a path api-documentation.md asserts already exists in some form. Grouping it identically with the `GET /v1/subscriptions` row risks a reader assuming all three carry the same documented weight. | Add one clause distinguishing "explicitly documented as missing, with the doc naming its own gap" (`GET /v1/subscriptions`) from "named only as a recommended/required addition, not asserted anywhere as an existing or specified route" (`POST /v1/stays`, `GET /v1/accounts/me`). | New |

### Validation Tool Results

No automated validation tooling was specified for this stage; verification was performed by direct diff against `api-documentation.md`'s route tables and `stories.md`'s AC4.1.x definitions.

### Summary

Both prior findings are genuinely closed: the endpoint inventory now matches `api-documentation.md` path-for-path and verb-for-verb across every `live_*` group, and the AC4.1.8 claim is correctly narrowed to the Guest surface plus AC1.1.2, with CORS correctly identified as the blocker of every request. One new Minor finding (R-03) notes that the new `documented_but_absent` category conflates a genuinely doc-acknowledged gap with two endpoint names that are only recommendations in prose — worth a one-clause fix but not blocking.
