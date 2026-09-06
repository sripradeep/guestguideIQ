# Requirements — Backend Services for GuestGuideIQ

## Sources

- Initial description: "Let's start working on and refining the spec for the backend services, based on the marketing site. Go through discovery." [desc]
- `docs/SPEC.md` — the marketing site's own spec, which explicitly scopes itself to Phase 1 and defers "the real product" (the SaaS platform) to a separate spec — this document.
- CodeKB: `business-overview.md`, `architecture.md`, `code-structure.md`, `api-documentation.md` — the current marketing site's existing lead-capture integration points (Formspree).
- `team-practices.md` — the affirmed engineering practices for this new backend (separate repo, BDD-then-unit-tests, blocking CI gate, staging + manual approval, dependency/secret scanning, walking skeleton).
- `requirements-analysis-questions.md` — 15 answered clarifying questions (Q1-Q15), including two follow-up rounds that resolved a scope ambiguity and a direct contradiction (provider monetization: confirmed **out of scope** for phase 1 — Q15 supersedes Q4).

## Intent Analysis

GuestGuideIQ's marketing site (Phase 1) exists to validate demand and capture leads ahead of building the real product. This intent starts specifying that real product's backend: a SaaS platform where a **Property Owner** (an STR host or vacation-rental property manager) can sign up, manage a subscription, and build a digital property guide — including an AI-assisted itinerary feature and curated local points-of-interest and events — that a **Guest** can then view during their stay via a link, without needing an account of their own.

This is a foundational build, not a full realization of every audience in the original vision. Experience-provider monetization (the site's second revenue line) and traveler-facing discovery (outside a specific guest's stay) are explicitly deferred past this phase.

The underlying goal: replace the current all-third-party lead-capture setup (Formspree) with a first-party backend, and lay down the core two-sided product (property owner ⇄ guest) that the marketing site has been building interest for.

## Functional Requirements

### FR1 — Lead Capture (Formspree Replacement)

The three existing marketing-site lead forms (waitlist, partner interest, investor/press) must be served by the new backend instead of Formspree.

- FR1.1: The backend shall accept and persist submissions from all three existing form types (waitlist email capture; partner interest — name, company, role, organization type, email, message; investor/press — name, org, email, message), preserving the field sets documented in the current site's `api-documentation.md`.
- FR1.2: Formspree shall be fully retired as the system of record — the backend owns this data directly. [Q2: A]
- FR1.3: The marketing site's existing forms shall be repointed to the new backend's endpoints without changing their user-facing behavior (the current AJAX-with-fallback submission pattern should be preserved or an equivalent decided at contract-design).
- FR1.4: On a submission failure (validation error or backend unavailability), the visitor shall see an error message and the form shall remain filled in with their entered data — equivalent to the current Formspree-era `[data-form-error]` behavior — rather than losing their input or failing silently. [Revision: R-02 resolution]

### FR2 — Property Owner Account & Authentication

- FR2.1: A Property Owner shall be able to create an account and authenticate using a username and password. [Q5]
- FR2.2: A Property Owner account shall support subscription management (the specific plan/billing model is an open question — see Open Questions). [Q3: C]
- FR2.3: A Property Owner shall be able to reset a forgotten password via an email-based recovery flow (e.g. a time-limited reset link sent to the account's registered email). Confirmed in scope for this spec. [Revision: R-01 resolution]

### FR3 — Property Owner Onboarding Wizard

- FR3.1: A new Property Owner shall be guided through an onboarding wizard after account creation. [Q1]
- FR3.2: The wizard shall support importing an existing digital guide from a PDF document, to seed the new property guide's content rather than starting from a blank page. [Q11: A]
- FR3.3: The wizard shall also support manual entry/creation of guide content for a Property Owner with no existing guide to import.
- FR3.4: If an uploaded file fails to import (unsupported format, corrupted file, or unreadable content), the wizard shall show a clear error message and fall back to the manual-entry path (FR3.3) rather than blocking the Property Owner from completing onboarding. [Revision: R-02 resolution]

### FR4 — Digital Property Guide Management

- FR4.1: A Property Owner shall be able to create and edit a digital property guide (their property's content) after onboarding. [Q1, Q3]
- FR4.2: A property guide shall be able to reference curated locality content (POIs, events — see FR5, FR6) that the Property Owner can select as favorites to feature in their guide. [Q10]
- FR4.3: A property guide shall be presentable to a Guest via the stay-scoped access link described in FR8.

### FR5 — Locality Content & POI Curation

- FR5.1: GuestGuideIQ's own team shall curate an initial dataset of points-of-interest (POIs) for each locality a property belongs to. [Q10]
- FR5.2: A Property Owner shall be able to browse the curated POIs for their property's locality and mark selected ones as favorites to include in their guide. [Q10, FR4.2]
- FR5.3: The data model shall support locality-scoped POI content that can grow over time as more localities are onboarded.

### FR6 — Local Events Monitoring & Lifecycle Management

- FR6.1: The backend shall include a module that continuously monitors for local events in each active locality and ingests newly discovered events into the system. [Q10, Q14]
- FR6.2: An ingested event shall be associated with the locality (and, where relevant, surfaced to Property Owners in that locality the same way POIs are). [Q14]
- FR6.3: The system shall manage the full lifecycle of an event record — from ingestion through to expiry/removal once the event has passed — so stale events do not persist indefinitely in guest-facing content. [Q14]
- FR6.4: The specific source(s) for event discovery (a third-party events API, web monitoring, manual feed, or a combination) is an open question deferred to domain-design (see Open Questions).

### FR7 — AI-Powered Itinerary Chat (Guest-Facing)

- FR7.1: A Guest viewing a property guide shall have access to a conversational, AI/LLM-powered chat feature that generates a customized itinerary based on their input (e.g. interests, available time, party composition). [Q9: A]
- FR7.2: The itinerary chat shall be able to draw on the property's curated POIs and locality events (FR5, FR6) as source material for its suggestions.
- FR7.3: The specific LLM provider/model and prompt-grounding approach are open questions deferred to domain-design and NFR requirements (cost, latency, and data-handling implications).

### FR8 — Guest Access via Stay-Scoped Links

- FR8.1: A Guest shall access their property's guide without creating an account, using a link. [Q5]
- FR8.2: A guest access link shall be scoped to a single stay and shall be generated with defined check-in/check-out dates. [Q13: B]
- FR8.3: A guest access link shall expire automatically after the associated checkout date, after which it shall no longer grant access to the guide. [Q13: B]
- FR8.5: A Guest who follows an expired or invalid link shall see a clear "this link is no longer valid" message rather than an error page or the guide content itself. [Revision: R-02 resolution]
- FR8.4: The mechanism for creating a stay (and thus its link) — e.g. entered manually by the Property Owner, or synced from an external booking calendar — is an open question deferred to domain-design.

## Non-Functional Requirements

### NFR1 — Performance

No concrete traffic/response-time targets exist yet; this is a pre-launch product transitioning from a lead-capture site. [Q7: B]

- NFR1.1: The backend shall be designed for low initial traffic volumes (consistent with a pre-launch product), with response-time and throughput targets to be set concretely once real usage data exists (at `nfr-requirements`).

### NFR2 — Availability

- NFR2.1: No specific uptime SLA is committed to at this stage; standard availability expectations for an early-stage product apply, to be quantified at `nfr-requirements`. [Q7: B]

### NFR3 — Security

Per the affirmed team practices (`team-practices.md`, promoted into `project.md` Mandated/Forbidden rules):

- NFR3.1: The backend repository shall be separate from the marketing-site repository. [team-practices: Way of Working]
- NFR3.2: Every pull request shall pass a blocking CI gate (build, lint, test, coverage) before merge. [team-practices: Testing Posture / Deployment]
- NFR3.3: Deployments shall go through a staging environment with manual approval before production. [team-practices: Deployment]
- NFR3.4: Dependency-vulnerability scanning and secret scanning shall be active from day one, wired as blocking CI checks. [team-practices: Security Tooling]
- NFR3.5: All secrets (Property Owner credentials — hashed, never in plaintext — database connection strings, any third-party API keys for the LLM or events sources) shall be stored in a secrets manager, never in code or checked-in configuration. [team-practices: Deployment — Secrets handling; org.md Security guardrail]
- NFR3.6: Property Owner authentication credentials shall be stored using an industry-standard password hashing algorithm (specific algorithm choice deferred to domain-design/infrastructure-design).

### NFR4 — Data Privacy

- NFR4.1: No specific compliance regime (GDPR, CCPA, etc.) is confirmed as applicable yet; the system shall be designed as generically privacy-conscious (minimizing collected personal data, honoring data-subject deletion requests where technically feasible) until a specific requirement is identified. [Q8: B]

### NFR5 — Scalability

- NFR5.1: The initial architecture is not required to support high concurrent scale; it should not, however, preclude scaling later (e.g. avoid architectural choices that would require a full rewrite to add a second Property Owner locality or a modest increase in Guests per stay).

## Constraints

- **C1**: The new backend lives in its own separate repository, not inside the existing marketing-site repo. [team-practices, affirmed]
- **C2**: Engineering process constraints from `team-practices.md` apply: feature-branch + PR review workflow, a walking-skeleton Bolt first, BDD-then-unit-tests methodology, blocking CI gate, staging + manual-approval deployment, enforced linting/formatting, and day-one dependency + secret scanning.
- **C3**: Hosting/runtime platform is explicitly left open at this stage — not committed to AWS despite the original site spec naming it as the eventual likely choice. [Q6: B]
- **C4**: Backend language/framework/database are not yet chosen; deferred to `domain-design`/`infrastructure-design`.
- **C5**: Experience-provider paid placement (the site's second revenue line) is explicitly out of scope for this phase. [Q15]

## Assumptions

- **A1**: Password-reset/account-recovery is confirmed in scope (FR2.3, resolved at the Requirements Analysis gate). Email verification at signup is not separately confirmed and is assumed unnecessary for the initial build unless raised again at a later stage.
- **A2**: "Manage a subscription" (FR2.2) implies the Property Owner-facing product will eventually be a paid subscription, but the specific plan tiers, pricing, and billing provider are not yet decided — this requirement covers the capability to manage a subscription, not its commercial terms.
- **A3**: The events-monitoring module (FR6) is assumed to need some external data source or feed; the specific source is deferred rather than assumed, per FR6.4.
- **A4**: "Full SaaS application" (Q1) is interpreted as the two-persona (Property Owner, Guest) core described across Q1-Q15, not literally every capability described in the original marketing-site vision (e.g. experience-provider marketplace, traveler-facing discovery outside a specific stay) — those remain out of scope per Q15 and `docs/SPEC.md`'s own Phase 1/Phase 2 split.

## Out of Scope

- Experience-provider self-service accounts, listings, or paid placement/advertising. [Q15 — explicit]
- Live booking or real-time experience inventory (carried forward from `docs/SPEC.md`'s Phase 1 non-goals — nothing in this discovery reopened it).
- Hotels/resorts as a supported property type (carried forward from `docs/SPEC.md` — STR/vacation-rental only).
- A blog/content-marketing engine (carried forward from `docs/SPEC.md`).
- Traveler-facing discovery/browsing outside the context of a specific guest stay (e.g. a public experience marketplace) — the current site's "Sample Experiences" page remains a static marketing page, not backed by this backend.
- Payment/billing implementation details (provider selection, specific plan tiers) — the capability to manage a subscription is in scope (FR2.2); the commercial/billing mechanics are deferred.

## Open Questions

- **OQ1**: Which billing provider and subscription plan structure will Property Owner subscriptions use? (Deferred to `domain-design`/`contract-design`.)
- **OQ2**: What is the specific source (or combination of sources) for the local events-monitoring module (FR6) — a third-party events API, web scraping, manual curation feed, or a mix? (Deferred to `domain-design`.)
- **OQ3**: Which LLM provider/model will power the itinerary chat (FR7), and what data (POIs, events, property details) will be included in its prompt context? What are the cost and latency implications? (Deferred to `domain-design`/`nfr-requirements`.)
- **OQ4**: How is a "stay" (and therefore a guest access link, FR8) created — manual entry by the Property Owner, or a sync from an external booking-platform calendar (e.g. Airbnb, VRBO)? (Deferred to `domain-design`.)
- **OQ5**: Does GuestGuideIQ have a target for how many localities/properties this backend should support at initial launch? This would inform NFR1/NFR5 targets once set concretely at `nfr-requirements`.

## Review

**Verdict:** READY
**Reviewer:** aidlc-product-lead-agent
**Date:** 2026-09-05T20:44:40Z
**Iteration:** 2
**Request Challenge:** review:5b638a0b2508d50f6c8576328e151090

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | requirements.md > FR2.3 vs. Assumptions (A1) vs. Open Questions (OQ5) | FR2.3 stated password reset/account recovery "are... included" as an actual functional requirement, while A1 and OQ5 simultaneously framed the same capability as an unresolved assumption pointing to a nonexistent "Assumption Confirmation" section — a dangling, unresolved contradiction. | Either resolve the assumption with the user and update FR2.3/remove OQ5, or demote FR2.3 to an open question — not both. | Resolved |
| R-02 | Major | requirements.md > FR1, FR3.2, FR8.2–FR8.3 | No error/edge-case scenarios were specified for lead-form submission failure, corrupted/unsupported PDF upload during onboarding, or an expired/invalid guest-link access attempt. | Add explicit error-scenario requirements for these three flows. | Resolved |
| R-03 | Minor | requirements.md > (no Business Context section) | No success metrics or business KPIs are defined for the core product. | Add concrete success metrics or an explicit open question deferring them. | Unresolved |
| R-04 | Minor | requirements.md > FR2.2 | "Subscription management" (FR2.2) has no testable pass/fail scope boundary. | Narrow FR2.2 to specific in-scope actions, or state only placeholder capability is in scope pending OQ1. | Unresolved |
| R-05 | Minor | requirements.md > FR7 | The AI itinerary chat (FR7) has no requirement for the no-data/sparse-locality case or basic moderation/guardrails. | Add a requirement or open question addressing sparse-content behavior and moderation. | Unresolved |

### Summary

Both Major findings from iteration 1 are verified resolved: FR2.3 now firmly commits to email-based password recovery with the dangling "Assumption Confirmation" cross-reference removed from FR2.3 and A1, and old OQ5 deleted; and FR1.4, FR3.4, and FR8.5 now give explicit, testable error-handling requirements for lead-form failure, corrupted PDF import, and expired/invalid guest links respectively. With zero Critical and zero remaining Major findings, the artifact is READY — the three Minor findings (R-03 success metrics, R-04 subscription-management scope boundary, R-05 itinerary-chat sparse-data/moderation) remain open but do not block progression.
