# User Stories — Plan & Questions

## Persona Development Approach

Two personas are already established in `requirements.md`: **Property Owner** (an STR host/property manager — creates an account, manages a subscription, builds a digital property guide) and **Guest** (a traveler who views a property guide via a stay-scoped link, no account). I'll develop full persona profiles (goals, pain points, tech comfort, context) for both. One open question below (Q5) asks whether a third, internal persona is needed.

## Story Format

Standard `As a [persona], I want [goal], so that [benefit]` format with Given/When/Then acceptance criteria, following INVEST criteria. Every story gets a stable `US{group}.{seq}` ID; every acceptance criterion gets `AC{group}.{seq}.{criterion-seq}`.

## Story Prioritization

MoSCoW (Must/Should/Could/Won't Have) per story, informed by the requirements' FR/NFR priorities and the walking-skeleton decision below. This is input to Delivery Planning's MVP boundary, not the final word on it.

## Breakdown Approach Options

- A. By persona/journey (Property Owner journey, then Guest journey) — natural fit since exactly two personas already exist with distinct workflows
- B. By feature area (Account & Auth, Guide Management, Locality Content, Itinerary Chat, Lead Capture) — cuts across both personas per capability
- C. By workflow step within a single end-to-end flow (signup → onboard → publish → guest views → chat)

---

## Q1: Walking-skeleton vertical slice

Your team practices call for a walking-skeleton Bolt first (a thin end-to-end slice built before full features). Which slice should it be?

- A. Property Owner signs up, creates a minimal guide, and a Guest can access it via a working link — a genuine end-to-end path through the whole system, even with minimal content
- B. Just the guest access mechanism (link generation + expiry) with a stubbed/hardcoded guide
- C. Just Property Owner account creation and authentication, nothing guest-facing yet
- X. Other (please specify)

[Answer]: A. Property Owner signs up, creates a minimal guide, and a Guest can access it via a working link — a genuine end-to-end path through the whole system, even with minimal content

---

## Q2: Subscription actions in scope for the first pass

Requirements Analysis flagged "subscription management" (FR2.2) as lacking a testable boundary. Which specific subscription actions should get Must Have stories now?

- A. Only starting a subscription (create) — upgrade/downgrade/cancel are Won't Have for now
- B. Create and cancel — upgrade/downgrade deferred
- C. All four actions (create, upgrade, downgrade, cancel) are Must Have now
- D. Just track subscription status as a data field — no self-service actions yet; billing changes are ops-managed
- X. Other (please specify)

[Answer]: C. All four actions (create, upgrade, downgrade, cancel) are Must Have now

---

## Q3: Itinerary chat behavior for a sparse locality

What should the AI itinerary chat (FR7) do for a locality with little or no curated POI/event content yet?

- A. Chat still runs but tells the guest content is limited and gives general travel tips instead
- B. Chat is disabled/hidden until the locality has a minimum amount of curated content
- C. Chat runs using whatever is available, with no special messaging about sparse data
- X. Other (please specify)

[Answer]: A. Chat still runs but tells the guest content is limited and gives general travel tips instead

---

## Q4: Story breakdown approach

Which of the three approaches above (A/B/C, listed above) should structure `stories.md`?

- A. By persona/journey
- B. By feature area
- C. By single end-to-end workflow
- X. Other (please specify)

[Answer]: A. By persona/journey

---

## Q5: Internal admin/ops interface

FR5.1 says your team curates initial POI data, and FR6 describes a monitoring module for local events. Should this pass include user stories for an internal admin/ops interface (curate POIs, manage events, review accounts), or is that out of scope for now?

- A. Yes — include a lightweight internal admin persona and stories for this
- B. No — out of scope for now; assume direct/manual data access (e.g. database access or a separate internal tool not covered here)
- C. Partially — just enough for POI/event data entry; account review stays out of scope
- X. Other (please specify)

[Answer]: A. Yes — include a lightweight internal admin persona and stories for this

---

## Q6: Story granularity

Should stories be written at a larger, epic-like size now (further decomposed later at domain-design), or as small, implementation-ready stories already?

- A. Larger, epic-level stories now — domain-design will decompose further before code generation
- B. Small, implementation-ready stories now — more stories, each narrowly scoped
- X. Other (please specify)

[Answer]: A. Larger, epic-level stories now — domain-design will decompose further before code generation

---

## Q7: Which persona's stories come first

Should Property Owner stories be prioritized ahead of Guest stories (natural dependency — a guide needs an owner before a guest can view it), Guest-experience first (e.g. build the guest view early against seeded fixture data), or no strong preference?

- A. Property Owner first
- B. Guest-experience first
- C. No strong preference / interleave as dependencies allow
- X. Other (please specify)

[Answer]: A. Property Owner first

---

## Q8 (from mob review): Priority/dependency mismatch on the guest guide-viewing story

The developer participant flagged this: US2.2 ("View Property Guide Content") is Must Have, but its acceptance criteria depend on curated POI/event content that only exists once US1.6, US4.1, and US4.2 are built — and all three of those are Should Have. As sequenced, a team could finish every Must Have story and still not be able to show a guide with any featured content. How should this be resolved?

- A. Promote US1.6 and US4.1 to Must Have (US4.2's event-expiry logic can stay Should Have if US2.2's acceptance criteria are softened to tolerate "no events yet")
- B. Keep priorities as-is, but soften US2.2's acceptance criteria so the Must Have bar is just "the guide displays correctly with or without featured content" — richer content becomes a Should Have layer on top
- C. Something else (please specify)
- X. Other (please specify)

[Answer]: A. Promote US1.6 and US4.1 to Must Have (US4.2's event-expiry logic can stay Should Have if US2.2's acceptance criteria are softened to tolerate "no events yet")

---

## Second Round (locality branding, folded back from a Requirements Analysis revision)

Requirements Analysis was revised mid-workflow to add locality branding and multi-domain support (FR9): each locality has its own brand, a Property Owner's locality is set by the domain they sign up through (FR3.5), and both the Guest guide and Property Owner dashboard render in that locality's brand.

## Q9: Who creates/manages a locality-brand's identity itself?

FR9.1 says each locality has its own visual brand identity (name/tagline/visual styling). Someone has to create that identity before any Property Owner can sign up through it. Should this be a story for the Admin/Ops persona (already curates POIs and events), or is it considered outside this backend's scope (e.g. set up directly in a database/config by engineering, not through any in-product interface)?

- A. Yes — add an Admin/Ops story for creating/managing a locality's brand identity (name, tagline, visual styling)
- B. No — locality-brand setup is out of scope for this pass; assume it's provisioned directly (config/database), not through a product interface
- X. Other (please specify)

[Answer]: A. Yes — add an Admin/Ops story for creating/managing a locality's brand identity (name, tagline, visual styling)

---

## Consolidated Summary Confirmation

- Personas: Property Owner, Guest, and a lightweight internal Admin/Ops persona
- Walking skeleton: Property Owner signup → minimal guide → Guest views via link (full thin path)
- Subscription scope: all four actions (create/upgrade/downgrade/cancel) Must Have now
- Sparse-locality chat: runs with a "limited content" message rather than being disabled
- Breakdown: by persona/journey, Property Owner first
- Admin/ops interface: included as a lightweight persona (POI/event curation, account review)
- Story size: epic-level now, decomposed further at domain-design
- Mob review resolution (Q8): US1.6 and US4.1 promoted to Must Have so the Guest guide-viewing story's dependencies are satisfiable; US4.2 stays Should Have with its acceptance criteria softened
- New (locality branding): US1.1 (signup) now reflects domain-based locality assignment; the guide-viewing/dashboard stories reflect locality-brand rendering; Q9 resolves whether Admin gets a locality-brand-creation story
- The generated `personas.md`, `stories.md`, and `traceability.json` are being updated to reflect all of the above

- Looks correct
- Request changes

[Answer]: Looks correct
