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

[Answer]: A. No separate Admin component

---

## Consolidated Summary Confirmation

- POI and events: two separate components (PointOfInterest, LocalEvent)
- Onboarding: its own component, tracking wizard progress separately from the guide
- Itinerary chat: its own component, separate from guest link/access
- Admin/ops actions: no separate component — privileged operations on the components that already own the data
- Resulting component set: Identity, Subscription, Onboarding, PropertyGuide, PointOfInterest, LocalEvent, ItineraryChat, GuestAccess, LeadCapture (9 components)

- Looks correct
- Request changes

[Answer]:
