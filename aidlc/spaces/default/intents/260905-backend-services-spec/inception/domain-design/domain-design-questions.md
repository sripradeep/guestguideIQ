# Domain Design — Clarifying Questions

This stage identifies the logical components (code you write) and entity ownership for the backend — not tech stack or deployment topology (those come later). Questions below cover genuine boundary trade-offs from `requirements.md` and `stories.md`.

---

## Q1: POI and Event content — one component or two?

Points-of-interest (curated by ops, per US4.1) and local events (continuously ingested by an automated monitoring module, per US4.2) are both "locality content" a Property Owner browses and favorites (US1.6). But they're produced very differently — POIs by manual curation, events by an automated ingestion pipeline with its own lifecycle/expiry logic (already flagged in `stories.md` as having different risk profiles).

- **Option A — One `LocalityContent` component** owning both POI and Event entities: simpler for Property Owner/Guest-facing reads (one place to ask "what's featured for this locality"), but forces one component to also own the automated-ingestion complexity, which changes for different reasons than curation does.
- **Option B — Two components** (`PointOfInterest` and `LocalEvent`): matches the DDD heuristic that concepts changing for different reasons belong in different contexts; keeps the ingestion pipeline's complexity/risk isolated from simple curation, at the cost of two components a reader (or the guide/chat components) must query instead of one.

- A. Option A — one `LocalityContent` component
- B. Option B — two components, `PointOfInterest` and `LocalEvent`
- X. Other (please specify)

[Answer]: B. Option B — two components, `PointOfInterest` and `LocalEvent`

---

## Q2: Onboarding wizard progress — its own component, or part of the guide?

The onboarding wizard (US1.3) needs to remember which step a Property Owner is on (to support resuming, per AC1.3.3). Should that progress tracking be its own component, or part of `PropertyGuideComponent` (the guide is what's ultimately being created)?

- A. Separate `Onboarding` component — owns wizard progress as its own concern, independent of the guide's own lifecycle (a guide can be edited long after onboarding is done; keeping onboarding-specific state out of the guide's own entity keeps that entity simpler)
- B. Fold onboarding progress into `PropertyGuideComponent` — one less component, but the guide entity now carries onboarding-specific fields that are meaningless after onboarding completes
- X. Other (please specify)

[Answer]: A. Separate `Onboarding` component

---

## Q3: Itinerary chat session — its own component, or part of guest access?

The itinerary chat (US2.3) needs to track a conversation (message history) for a Guest's session. Should that be its own `ItineraryChat` component, or folded into `GuestAccess` (which already tracks the stay-scoped link)?

- A. Separate `ItineraryChat` component — chat/session-state complexity (message history, LLM grounding) is a distinct concern from link validation/expiry, and each can evolve independently (e.g. swapping LLM providers doesn't touch link logic at all)
- B. Fold into `GuestAccess` — one less component, since both are guest-session-scoped
- X. Other (please specify)

[Answer]: A. Separate `ItineraryChat` component

---

## Q4: Admin/ops actions — new component, or existing component capability?

US4.1 (curate POIs), US4.2 (manage events), and US4.3 (review a Property Owner account) are all internal ops actions. Should these be modeled as a separate `Admin` component, or as privileged operations already belonging to the components that own that data (`PointOfInterest`/`LocalEvent` own curation and lifecycle; `Identity` owns account lookup)?

- A. No separate Admin component — these are just privileged operations on the components that already own the data (recommended: avoids a component with no data of its own, which is a design smell per `architecture-guide.md`)
- B. Separate `Admin` component — centralizes all ops-facing operations behind one boundary, at the cost of that component depending on nearly everything else
- X. Other (please specify)

[Answer]: B. Separate `Admin` component — reversed from the original A during the locality-branding redo (see Second Round below): centralizes all ops-facing operations — POI curation (US4.1), event management (US4.2), account lookup (US4.3), and locality-brand management (US4.4) — behind one boundary. `Admin` owns no entities of its own (it is a thin orchestration/application-service layer, not a data owner); it depends on `PointOfInterest`, `LocalEvent`, `Identity`, and `Locality` for their respective mutation operations. This is a deliberate trade-off, not a reversal of the underlying design-smell concern — see ADR in `decisions.md` for the accepted coupling.

---

## Round 1 Summary Confirmation (historical — superseded by the Consolidated Summary Confirmation below)

- POI and events: two separate components (PointOfInterest, LocalEvent)
- Onboarding: its own component, tracking wizard progress separately from the guide
- Itinerary chat: its own component, separate from guest link/access
- Admin/ops actions: **reversed during the locality-branding redo** — a separate `Admin` component now centralizes POI curation, event management, account lookup, and locality-brand management (US4.1-US4.4) behind one boundary; see Second Round below
- Resulting component set: Identity, Subscription, Onboarding, PropertyGuide, PointOfInterest, LocalEvent, ItineraryChat, GuestAccess, LeadCapture, Admin, Locality (11 components)

- Looks correct
- Request changes

[Answer]: Looks correct (Admin reversal folded in during the Second Round re-confirmation below)

---

## Second Round (locality branding, folded back from a Requirements Analysis revision)

Requirements Analysis, User Stories, and Refined Mockups were all revised mid-workflow to add locality branding & multi-domain support (FR9, FR3.5, FR5.4, FR8.6, NFR6): each locality has its own visual brand identity and domain(s); a Property Owner's locality is set by the signup domain; a POI can belong to more than one locality; both the Guest guide and Property Owner dashboard render in the resolved locality's brand.

## Q5: Locality and Locality-Brand — one component, or two?

FR9 introduces two related but distinct concerns: **Locality** (the geographic/content-scoping concept — what `PointOfInterest`/`LocalEvent`/`PropertyGuide` already reference implicitly today) and **Locality-Brand** (the visual identity + domain(s) layered on top, per FR9.1/FR9.4/FR9.5, managed via US4.4). Should these be one component, or two?

- A. One `Locality` component owning both the locality identity itself and its brand/domain data (name, tagline, visual styling, domain list) — a locality *is* its brand in this product; there's no case where a locality exists without one, per FR9.1 ("each locality shall have its own visual brand identity"). Simpler: one place `PointOfInterest`, `LocalEvent`, `PropertyGuide`, and onboarding/signup all reference.
- B. Two components — `Locality` (the plain geographic/content-scoping concept POI/Event/PropertyGuide reference) and `LocalityBrand` (identity + domains, referencing back to `Locality`) — separates "what content belongs to this place" from "how this place presents itself," which could evolve independently (e.g. if a locality's content existed before it had a brand, or a rebrand shouldn't touch content).
- X. Other (please specify)

[Answer]: A. One `Locality` component owning both the locality identity itself and its brand/domain data (name, tagline, visual styling, domain list) — a locality *is* its brand in this product; there's no case where a locality exists without one, per FR9.1 ("each locality shall have its own visual brand identity"). Simpler: one place `PointOfInterest`, `LocalEvent`, `PropertyGuide`, and onboarding/signup all reference.

---

## Q6: Which component owns domain-to-locality resolution (NFR6.1)?

Every incoming request (Property Owner signup/dashboard, Guest guide view) needs its domain/subdomain resolved to the correct locality-brand before anything else can render. Should this resolution logic be its own component, or a capability of the `Locality` component itself?

- A. A capability of `Locality` — domain resolution is just a lookup against data `Locality` already owns (its domain list); a dedicated component for this would be a component with no data of its own (per Q4's precedent — the same reasoning that ruled out a separate `Admin` component applies here).
- B. A separate `DomainResolution` component — centralizes request-routing concerns (including future TLS/certificate provisioning, per NFR6.2) behind its own boundary, separate from `Locality`'s content-ownership concerns.
- X. Other (please specify)

[Answer]: A. A capability of `Locality` — domain resolution is just a lookup against data `Locality` already owns (its domain list); a dedicated component for this would be a component with no data of its own (per Q4's precedent — the same reasoning that ruled out a separate `Admin` component applies here).

---

## Consolidated Summary Confirmation

- Q1-Q4 recap re-confirmed, **with one reversal**: Admin/ops actions now get a separate `Admin` component (reversing the original Q4 answer) covering POI curation, event management, account lookup, and locality-brand management (US4.1-US4.4) — `Admin` owns no entities of its own and depends on `PointOfInterest`, `LocalEvent`, `Identity`, and `Locality` for their mutation operations; the underlying design-smell trade-off is documented as an ADR, not silently accepted.
- Locality and Locality-Brand: one `Locality` component owns both identity/brand and domain list (Q5)
- Domain resolution: a capability of `Locality`, not a separate component (Q6, consistent with the general "no component without its own data" principle — which `Admin` deliberately departs from, per the ADR)
- Resulting component set: Identity, Subscription, Onboarding, PropertyGuide, PointOfInterest, LocalEvent, ItineraryChat, GuestAccess, LeadCapture, **Admin**, **Locality** (11 components)
- `Locality` becomes a new dependency of: `Identity`/`PropertyGuide`/`Onboarding` (signup/dashboard domain resolution + property-locality assignment), `PointOfInterest` (many-to-many per FR5.4), `LocalEvent`, `GuestAccess` (guest-link domain resolution), and `Admin` (locality-brand management)
- `components.md`, `decisions.md`, and `traceability.json` will be generated fresh (never yet produced for this stage) reflecting all 11 components, informed by the Q1-Q6 decisions above

- Looks correct
- Request changes

[Answer]: Looks correct
