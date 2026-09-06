# Requirements — Backend Services for GuestGuideIQ

## Sources

- Initial description: "Let's start working on and refining the spec for the backend services, based on the marketing site. Go through discovery." [desc]
- `docs/SPEC.md` — the marketing site's own spec, which explicitly scopes itself to Phase 1 and defers "the real product" (the SaaS platform) to a separate spec — this document.
- CodeKB: `business-overview.md`, `architecture.md`, `code-structure.md`, `api-documentation.md` — the current marketing site's existing lead-capture integration points (Formspree).
- `team-practices.md` — the affirmed engineering practices for this new backend (separate repo, BDD-then-unit-tests, blocking CI gate, staging + manual approval, dependency/secret scanning, walking skeleton).
- `requirements-analysis-questions.md` — 21+ answered clarifying questions across several rounds, including a scope ambiguity and a direct contradiction resolved (provider monetization: confirmed **out of scope** for phase 1 — Q15 supersedes Q4), plus a later round (Q16-Q21) that folded in a locality-branding/multi-domain requirement raised mid-Domain-Design, which triggered a formal backward revision of this stage.

## Intent Analysis

GuestGuideIQ's marketing site (Phase 1) exists to validate demand and capture leads ahead of building the real product. This intent starts specifying that real product's backend: a SaaS platform where a **Property Owner** (an STR host or vacation-rental property manager) can sign up, manage a subscription, and build a digital property guide — including an AI-assisted itinerary feature and curated local points-of-interest and events — that a **Guest** can then view during their stay via a link, without needing an account of their own.

This is a foundational build, not a full realization of every audience in the original vision. Experience-provider monetization (the site's second revenue line) and traveler-facing discovery (outside a specific guest's stay) are explicitly deferred past this phase.

The underlying goal: replace the current all-third-party lead-capture setup (Formspree) with a first-party backend, and lay down the core two-sided product (property owner ⇄ guest) that the marketing site has been building interest for.

The product is also explicitly **multi-tenant by locality**: GuestGuideIQ goes to market as a locality-specific operator brand rather than one generic brand, so the backend must serve distinct branded experiences — potentially on distinct domains — per locality, to both Guests and Property Owners (FR9). Confirmed correct by the human at the final re-confirmation after the redo.

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
- FR3.5: A Property Owner's locality-brand (FR9.6) shall be determined by the domain/subdomain they used to sign up (FR2.1) — signing up through a given locality's domain implicitly assigns that locality to their account and property. No separate locality-selection step is required in the wizard. [Revision: R-06 resolution, Q22: A]

### FR4 — Digital Property Guide Management

- FR4.1: A Property Owner shall be able to create and edit a digital property guide (their property's content) after onboarding. [Q1, Q3]
- FR4.2: A property guide shall be able to reference curated locality content (POIs, events — see FR5, FR6) that the Property Owner can select as favorites to feature in their guide. [Q10]
- FR4.3: A property guide shall be presentable to a Guest via the stay-scoped access link described in FR8.

### FR5 — Locality Content & POI Curation

- FR5.1: GuestGuideIQ's own team shall curate an initial dataset of points-of-interest (POIs) for each locality a property belongs to. [Q10]
- FR5.2: A Property Owner shall be able to browse the curated POIs for their property's locality and mark selected ones as favorites to include in their guide. [Q10, FR4.2]
- FR5.3: The data model shall support locality-scoped POI content that can grow over time as more localities are onboarded.
- FR5.4: A single POI may be associated with more than one locality (e.g. a boundary-adjacent or widely-known attraction relevant to multiple nearby locality-brands) — the POI-to-locality relationship is many-to-many, not one-to-one. [Q21]

### FR9 — Locality Branding & Multi-Domain Support

Each locality is its own operator brand — GuestGuideIQ approaches Property Owners as a locality-specific operator, not under one single generic brand, and this identity carries through the product. [Raised mid-Domain-Design; folded back into requirements per the human's explicit direction]

- FR9.1: Each locality shall have its own visual brand identity (at minimum a name/tagline and visual styling — exact attributes such as logo and color scheme are detailed at domain-design/functional-design).
- FR9.2: The Guest-facing property guide shall render using the property's locality's brand.
- FR9.3: The Property Owner's own dashboard shall also render using their property's locality's brand (not a single generic GuestGuideIQ look). [Q19: B]
- FR9.4: The backend shall support serving the correct locality-brand experience from more than one domain — some localities may use a fully custom domain, others a subdomain of a shared GuestGuideIQ domain. [Q17: C]
- FR9.5: Domain registration and configuration for locality-brands shall be managed centrally by GuestGuideIQ, not delegated to Property Owners or third parties. [Q18: A]
- FR9.6: Each property shall belong to exactly one locality-brand (a flat, non-nested relationship). [Q20: A]
- FR9.7: A Property Owner account's locality-brand is set at signup per FR3.5 and is not expected to change after account creation (re-assigning a property to a different locality-brand is out of scope for this spec unless raised again). Confirmed correct by the human at the Consolidated Summary Confirmation checkpoint.

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
- FR8.6: A guest access link resolves through its property's locality-brand domain/subdomain (per FR9.4/NFR6.1) — the Guest never sees a separate, unbranded central domain. [Revision: R-07 resolution]
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

### NFR6 — Multi-Tenancy / Domain Routing

- NFR6.1: The system shall correctly resolve which locality-brand applies to an incoming request based on its domain (custom domain or subdomain), for both Guest-facing and Property Owner-facing traffic.
- NFR6.2: TLS/certificate provisioning for an arbitrary number of custom domains is a real operational concern; specific mechanics (e.g. automated certificate issuance per onboarded domain) are deferred to `infrastructure-design`, but the requirement to support it is established here.

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
- **OQ6**: What is the exact mechanism for provisioning a new custom domain for a locality-brand (DNS ownership verification, automated vs. manual certificate issuance)? Deferred to `infrastructure-design`.
- **OQ7**: What specific branding attributes does a locality need beyond name/tagline (logo image, color palette, custom copy/voice)? Deferred to `domain-design`/`functional-design`.

## Review

**Verdict:** READY
**Reviewer:** aidlc-product-lead-agent
**Date:** 2026-09-06T02:46:04Z
**Iteration:** 1
**Request Challenge:** review:deba9e43e2ee8628204d8646bcfaa118

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | requirements.md > FR2.3, Assumptions > A1 | Password-reset scope was previously unresolved. FR2.3 now explicitly puts an email-based reset flow in scope, and A1 records that email verification at signup remains a separate, unconfirmed assumption rather than conflating the two. | None — verified present and coherent. | Resolved |
| R-02 | Major | requirements.md > FR1.4, FR3.4, FR8.5 | Error-scenario coverage was previously missing for form-submission failure, guide-import failure, and expired/invalid guest links. All three now have explicit, testable behavior (retain input on error; fall back to manual entry; show a clear invalid-link message). | None — verified present and coherent. | Resolved |
| R-03 | Minor | requirements.md > Intent Analysis / Out of Scope | No measurable success metrics are stated for this backend build (e.g. adoption, conversion, or usage targets). | Human previously accepted this as open risk at the gate; no new action required unless the human wants metrics added at a later stage. | Accepted risk |
| R-04 | Minor | requirements.md > FR2.2, A2, Out of Scope | The subscription-management boundary (capability vs. commercial/billing terms) is stated but plan tiers, pricing, and billing provider remain open (OQ1). | Human previously accepted this as open risk; billing specifics remain correctly deferred to domain-design/contract-design. | Accepted risk |
| R-05 | Minor | requirements.md > FR7 | FR7 does not specify a fallback behavior when a locality has sparse or no curated POI/event content for the AI itinerary chat to draw on. | Human previously accepted this as open risk; the gap is not addressed by any new FR in the current text. | Accepted risk |
| R-06 | Major | requirements.md > FR3.5, FR9.7 | Locality-brand assignment mechanism and timing were previously unresolved. FR3.5 now ties assignment to the signup domain/subdomain (no separate wizard step), and FR9.7 confirms the assignment is fixed after account creation, with re-assignment explicitly out of scope. | None — verified present and coherent. | Resolved |
| R-07 | Minor | requirements.md > FR8.6 | Guest-link domain resolution was previously unaddressed. FR8.6 now states a guest link resolves through the property's own locality-brand domain/subdomain, never a central unbranded domain. | None — verified present and coherent. | Resolved |

### Summary

This is a redo of a previously reviewed artifact with no substantive content change. All four Major findings from prior iterations (R-01, R-02, R-06, R-07) remain resolved with clear, testable requirement language (FR2.3, FR1.4/FR3.4/FR8.5, FR3.5/FR9.7, FR8.6 respectively), and the three Minor findings (R-03, R-04, R-05) remain correctly recorded as accepted risk rather than blocking gaps. Requirements are testable, traceable to sources, and scope boundaries (Out of Scope, Constraints, Open Questions) are explicit. No new Critical or Major issues were found on this verification pass — the artifact remains READY for engineering to proceed.

