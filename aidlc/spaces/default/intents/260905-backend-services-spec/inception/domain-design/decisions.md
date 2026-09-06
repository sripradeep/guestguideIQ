# Architecture Decision Records — Backend Services for GuestGuideIQ (re-confirmed)

## ADR-001: Split POI and Event content into two separate components

- **Context**: Points-of-interest (curated by ops, US4.1) and local events (continuously ingested by an automated monitoring module, US4.2) are both "locality content" a Property Owner browses and favorites (US1.6), but they are produced by fundamentally different mechanisms and change for different reasons — manual curation vs. an automated ingestion pipeline with its own sourcing (OQ2), rate-limit/dedup, and lifecycle/expiry concerns.
- **Decision**: Two separate components, `PointOfInterest` and `LocalEvent` (Q1, Option B).
- **Consequences**: Positive — the automated-ingestion pipeline's complexity and risk (sourcing dependency, dedup, lifecycle state machine) stays isolated from simple POI curation; each component can evolve and be tested independently; `LocalEvent`'s ingestion/lifecycle split (flagged in `stories.md`'s mob review) is easier to decompose further at `units-generation` without touching `PointOfInterest` at all. Negative — `PropertyGuide`, `Admin`, and `ItineraryChat` each query two components instead of one for "what's featured/available in this locality."
- **Alternatives Rejected**: One `LocalityContent` component owning both POI and Event entities (Q1, Option A) — simpler for reads, but would force one component to own both simple curation and automated-ingestion complexity, which change for different reasons and carry different risk profiles.

## ADR-002: Onboarding wizard progress as its own component

- **Context**: The onboarding wizard (US1.3) needs to track which step a Property Owner is on, supporting exact-step resume (AC1.3.3). This state could live inside `PropertyGuide` (the guide is what's ultimately being created) or be tracked separately.
- **Decision**: A separate `Onboarding` component (Q2, Option A).
- **Consequences**: Positive — `GuideContent`'s entity shape stays meaningful for the guide's entire lifetime; onboarding-only fields (current step, completion state) don't linger as meaningless data once onboarding ends. Negative — one more component in the catalogue, and `Onboarding` must depend on `PropertyGuide` to actually seed content, rather than owning that write path itself.
- **Alternatives Rejected**: Folding onboarding progress into `PropertyGuideComponent` (Q2, Option B) — one fewer component, but the guide entity would carry onboarding-specific fields meaningless after onboarding completes.

## ADR-003: Itinerary chat as its own component, separate from guest access

- **Context**: The itinerary chat (US2.3) needs to track a conversation (message history) for a guest's session, distinct from `GuestAccess`'s link-validation/expiry concern.
- **Decision**: A separate `ItineraryChat` component (Q3, Option A).
- **Consequences**: Positive — chat/session-state complexity (message history, LLM grounding, moderation) evolves independently of link validation — e.g. swapping LLM providers (OQ3) touches only `ItineraryChat`. Negative — `ItineraryChat` must depend on `GuestAccess` to validate session context, and on both `PointOfInterest`/`LocalEvent` for grounding content, giving it three dependencies for what is, in the walking skeleton, a Should-Have story (per `stories.md` Q1).
- **Alternatives Rejected**: Folding chat into `GuestAccess` (Q3, Option B) — one fewer component, but conflates two concerns (link validity, conversation state) that are likely to change independently and have very different risk profiles (link validation is simple state; chat carries LLM cost/latency/moderation concerns).

## ADR-004: Add a separate `Admin` component, reversing the original decision against one

- **Context**: US4.1 (curate POIs), US4.2 (manage events), US4.3 (review a Property Owner account), and — newly, from the locality-branding revision — US4.4 (manage locality-brand identities) are all internal ops actions. The stage's own guidance (`architecture-guide.md`) treats a component with no data of its own as a design smell, and the original Q4 answer (Option A) avoided one by modeling these as privileged operations on the components that already own the data (`PointOfInterest`, `LocalEvent`, `Identity`, and now `Locality`).
- **Decision**: During the locality-branding redo's re-confirmation of Q1-Q4, the human explicitly reversed this: a separate `Admin` component now centralizes all four ops-facing operations (US4.1-US4.4) behind one boundary.
- **Consequences**: Positive — every ops-facing capability is reachable through one component boundary rather than scattered as "privileged operation" flags across four otherwise Property Owner/Guest-facing components; simpler for `units-generation` to scope an internal-only ops surface as its own deployable unit if desired; a new ops capability in the future has one obvious place to add it. Negative — `Admin` owns no entities of its own (the exact design smell the original decision avoided) and depends on four other components (`PointOfInterest`, `LocalEvent`, `Identity`, `Locality`) for everything it does, making it the single most-coupled component in the catalogue; a change to any of those four components' write APIs is more likely to also touch `Admin`.
- **Alternatives Rejected**: No separate `Admin` component (the original Q4, Option A) — avoids the no-data-of-its-own smell, but was explicitly rejected by the human in favor of centralizing ops operations behind one boundary, accepting the coupling trade-off instead.

## ADR-005: Locality and Locality-Brand as one component, not two

- **Context**: FR9 introduces both a geographic/content-scoping concept (what `PointOfInterest`/`LocalEvent`/`PropertyGuide` already reference implicitly) and a visual-identity/domain layer on top of it (FR9.1/FR9.4/FR9.5, managed via US4.4). These could be modeled as one component or split into `Locality` (plain scoping concept) and `LocalityBrand` (identity + domains, referencing back to `Locality`).
- **Decision**: One `Locality` component owns both the locality identity and its brand/domain data (Q5, Option A).
- **Consequences**: Positive — every component that needs "which locality/brand does this belong to" (`PointOfInterest`, `LocalEvent`, `Identity`, `GuestAccess`, `Admin`) queries one component instead of two; matches the product reality that a locality never exists without a brand in this spec (FR9.1 says "each locality shall have its own visual brand identity" — there's no bare-locality-without-brand case to design for). Negative — if a future requirement introduces localities that exist before they have a brand (e.g. pre-seeding content ahead of a locality's public launch), this component would need to grow an internal "unbranded" state rather than that being a structurally separate case.
- **Alternatives Rejected**: Two components, `Locality` + `LocalityBrand` (Q5, Option B) — would separate "what content belongs to this place" from "how this place presents itself," but adds a component boundary with no independent lifecycle to justify it given every locality in scope always has a brand.

## ADR-006: Domain-to-locality resolution as a `Locality` capability, not a separate component

- **Context**: Every incoming request (Property Owner signup/dashboard, Guest guide view) needs its domain/subdomain resolved to the correct locality-brand before anything else can render (NFR6.1). This resolution logic could be its own component or a capability of `Locality`.
- **Decision**: A capability of `Locality` (Q6, Option A).
- **Consequences**: Positive — consistent with the general principle (also applied, then explicitly overridden for `Admin` in ADR-004) that a component should own data of its own; domain resolution is purely a lookup against `Locality`'s own domain list, with no independent data or lifecycle to justify a separate boundary. Negative — as NFR6.2's TLS/certificate provisioning concerns become concrete at `infrastructure-design`, `Locality` may need to grow request-routing-adjacent responsibilities beyond a simple domain lookup; this is deferred rather than designed here.
- **Alternatives Rejected**: A separate `DomainResolution` component (Q6, Option B) — would centralize request-routing concerns (including future TLS/certificate provisioning) behind its own boundary, but would be a component with no data of its own, the same smell the original Q4 reasoning was built on — and unlike `Admin` (ADR-004), no one asked to accept that trade-off here.
