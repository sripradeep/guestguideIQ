# Units of Work — Backend Services for GuestGuideIQ

Two deployable service units, per the Q1/Q2 decisions in `units-generation-questions.md`: a trust-boundary split between the public-facing product surface and the internal-only ops surface, with no further sub-splitting within either service.

| Unit ID | Directory | Kind | Deployment Model | Complexity |
|---|---|---|---|---|
| U1 | `u1-backend-api` | service | Standalone | XL |
| U2 | `u2-admin-api` | service | Standalone | M |

## U1 — `backend-api`

**Description**: The public-facing backend serving Property Owner accounts, onboarding, subscriptions, and digital guide content; curated locality POI/event browsing and favoriting; the AI-powered itinerary chat; Guest stay-scoped access; marketing-site lead capture; and locality-brand identity/domain resolution for both Property Owner and Guest traffic.

**Responsibilities** (hosts these `domain-design/components.md` components as internal modules):
- `Identity` — account creation, authentication, password reset, property record
- `Subscription` — subscription lifecycle (create/upgrade/downgrade/cancel)
- `Onboarding` — onboarding wizard progress, PDF-import/manual-entry coordination
- `PropertyGuide` — guide content authoring, publish state, featured-content selection
- `PointOfInterest` — curated POI content (read paths for Property Owner/Guest; write paths reachable only from `U2`)
- `LocalEvent` — ingested local events with lifecycle management (read paths for Property Owner/Guest; write/lifecycle paths reachable only from `U2`)
- `ItineraryChat` — AI/LLM-powered conversational itinerary assistant
- `GuestAccess` — stay-scoped guest access links and validity
- `LeadCapture` — marketing-site lead-form submissions (Formspree replacement)
- `Locality` — locality brand identity, domains, and domain-to-brand resolution (read/resolve paths for all traffic; brand/domain-management write paths reachable only from `U2`)

**Deployment model**: Standalone — deploys independently.

**Complexity**: XL — hosts 10 of the 11 domain-design components and carries the walking-skeleton path (Property Owner signup → minimal guide → Guest access).

**Kind**: `service` — a deployed executable.

**Implementation notes and constraints**:
- Exposes a public HTTP API. Two distinct consumer groups: (1) a not-yet-chosen Property Owner/Guest-facing frontend (tech stack deferred to `infrastructure-design`, per `refined-mockups.md`'s screens), and (2) the *existing* marketing-site repository's three lead-capture forms, which will be repointed from Formspree to this Unit's `LeadCapture` endpoints (FR1.3) — that repointing is a small change in the *other* repository, not modeled as a Unit here.
- `PointOfInterest`, `LocalEvent`, `Identity`, and `Locality` each expose an additional internal-only write/management surface callable ONLY by `U2` (`admin-api`) — POI curation, event lifecycle management, account lookup, and locality-brand management, respectively. This surface must not be reachable from the public HTTP API's own auth realm (see `U2`'s implementation notes and ADR-004 in `domain-design/decisions.md`).
- Three components carry known internal-decomposition complexity flagged by earlier stages and should be budgeted accordingly at `functional-design`/`build-and-test`, despite this Unit's own epic-level sizing: `Onboarding`'s PDF-import path (`stories.md` US1.4 note — extraction, mapping, review-before-publish, loading state), `ItineraryChat` (session-state handling and output moderation are explicit sub-scope, not implied by "chat" — `stories.md` US2.3 note), and `LocalEvent` (ingestion vs. lifecycle/expiry are operationally distinct and should decompose into separate implementation units so lifecycle isn't held hostage to the still-open sourcing decision, OQ2).
- Tech stack, database, and hosting platform are not yet chosen (C3/C4 in `requirements.md`) — deferred to `infrastructure-design`.

## U2 — `admin-api`

**Description**: The internal-only ops interface — POI curation, event lifecycle management and audit, Property Owner account lookup/support, and locality-brand identity/domain management. Never reachable from the Property Owner- or Guest-facing network path.

**Responsibilities** (hosts this `domain-design/components.md` component):
- `Admin` — a thin orchestration boundary with no data of its own (per ADR-004 in `domain-design/decisions.md`); every operation it exposes calls into one of `U1`'s modules.

**Deployment model**: Standalone — deploys independently from `U1`, with its trust boundary enforced at the deployment/network layer (internal-only) rather than only at the application layer, per the Q1 decision to split it out specifically for this reason.

**Complexity**: M — a single, data-less component whose complexity is almost entirely in correctly restricting its own reachability and in the internal API contract it consumes from `U1`, not in original business logic.

**Kind**: `service` — a deployed executable, kept genuinely separate from `U1` so its access boundary is a deployment fact, not just a routing convention.

**Implementation notes and constraints**:
- Depends entirely on `U1` (see `unit-of-work-dependency.md`) — every one of `Admin`'s four capabilities (POI curation, event management, account lookup, locality-brand management) is implemented by calling `U1`'s internal-only write surface for `PointOfInterest`, `LocalEvent`, `Identity`, and `Locality` respectively. `U2` owns no persistent data of its own.
- Exact network/auth isolation mechanism (VPN, private subnet, separate IdP realm, IP allowlist) is deferred to `infrastructure-design`/`nfr-requirements` — this stage only establishes that isolation is a hard requirement of the Unit split itself, not an optional hardening step.
- `U2` depends on `U1` at the Unit level (see `unit-of-work-dependency.md`). A separate, narrower fact worth flagging for `delivery-planning` (2.9): at the *story* level, `U1`'s own US1.1 (Property Owner signup) depends on `U2`'s US4.4 (locality-brand creation), since a locality-brand must exist before anyone can sign up through its domain — see `unit-of-work-story-map.md`'s cross-cutting note. This stage states both facts; which Bolt ships first, and how that story-level dependency is sequenced against the Unit-level one, is 2.9's economic-sequencing decision, not this stage's.

## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-09-06T04:44:33Z
**Iteration:** 2
**Request Challenge:** review:622a75790c214a4d77bfd93fd2a8aa45

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | unit-of-work.md vs. domain-design/components.md | Verified every one of the 11 components from `components.md` is assigned to exactly one Unit: `U1` hosts 10 (Identity, Subscription, Onboarding, PropertyGuide, PointOfInterest, LocalEvent, ItineraryChat, GuestAccess, LeadCapture, Locality), `U2` hosts 1 (Admin) — no component missing, none double-assigned. `U2`'s split matches `domain-design/decisions.md`'s ADR-004 rationale (Admin's distinct trust boundary) exactly. | None. | Resolved |
| R-02 | Major | unit-of-work-dependency.md > machine-readable edge block | Verified programmatically: both unit names are unique, well-formed lowercase path-segment identifiers; every `depends_on` entry resolves to a declared unit; no unit depends on itself; the graph is acyclic (single edge, `u2-admin-api` → `u1-backend-api`). Both declared `kind: service` values are valid. | None. | Resolved |
| R-03 | Major | unit-of-work-dependency.md vs. domain-design/components.md > Admin.depends_on | The stated integration point (`admin-api` calls `backend-api`'s `PointOfInterest`/`LocalEvent`/`Identity`/`Locality` internal write surface) exactly matches `Admin`'s four `depends_on` entries in `components.md` — no invented dependency, no dropped one. The stage correctly stops at naming the integration point and defers its contract shape to `contract-design`, per Q4. | None. | Resolved |
| R-04 | Major | unit-of-work-story-map.md and traceability.json vs. user-stories/stories.md | Verified all 17 stories (US1.1-US1.8, US2.1-US2.3, US3.1-US3.2, US4.1-US4.4 — corrected count; a prior stage's review prose miscounted this as 16) are assigned to exactly one primary Unit with no `GAP` status, and every target in `traceability.json` names a real, declared Unit (`U1` or `U2`). The intra-unit story ordering is derived strictly from each story's own `Dependencies` field in `stories.md` (a topological fact), not from value/risk/walking-skeleton judgment — correctly respecting this stage's prohibition on economic sequencing. | None. | Resolved |
| R-05 | Minor | unit-of-work-story-map.md > Cross-Cutting Concerns (US1.1) | Genuinely useful catch, not a defect: the story-level dependency US1.1 → US4.4 runs in the *opposite* direction from the Unit-level DAG edge (`U2` → `U1`). The artifact explicitly calls this out rather than letting a reader assume the two dependency directions must agree — this is exactly the kind of cross-cutting nuance `delivery-planning` (2.9) needs surfaced, not smoothed over. | None — this is the artifact working as intended. | Resolved |

### Summary

This is a well-formed, internally consistent Units decomposition (re-verified after a Status-token formatting fix; the underlying content is unchanged from the first pass). The trust-boundary split decided in Q1 (public-facing `backend-api` vs. internal-only `admin-api`) is carried through faithfully: `components.md`'s component set maps to Units with no gaps or double-assignment (R-01), the dependency edge block is structurally valid and acyclic (R-02), and the one real integration point between the two services is named accurately against `Admin`'s actual declared dependencies without overreaching into contract detail that belongs to `contract-design` (R-03). Traceability is complete across all 17 stories (R-04, correcting a miscount carried in a prior stage's review prose — the underlying data was always correct). The story map's explicit flag that US1.1's story-level dependency on US4.4 runs opposite to the Unit-level DAG direction (R-05) is a valuable, non-obvious fact for Delivery Planning rather than an inconsistency, using a clean single-token Status value this time. The stage's own prohibition on recommending implementation order or a critical path is respected throughout — no artifact asserts an economic sequencing judgment. Ready for Contract Design.
