# Delivery Planning — Plan & Questions

This stage sequences the two Units (`u1-backend-api`, `u2-admin-api`) into **Bolts** — a Bolt is one build pass over a slice of the work, ending in something that runs. `units-generation` already fixed the dependency DAG (`u2-admin-api` depends on `u1-backend-api`); this stage chooses the economic path through it — which Bolt ships first, and why — which the DAG alone cannot answer.

Per-Bolt details (which Units/stories each Bolt bundles, its Definition of Done, its confidence hypothesis, and its owning mob) are answered directly in `bolt-plan.md` rather than as a separate Q&A round — only the project-wide strategic questions below need your input.

---

## Q1: Walking-skeleton scope

`team-practices.md` already commits to a walking-skeleton-first Bolt (confirmed at practices-discovery). The wrinkle: `unit-of-work-story-map.md` flagged that even the walking-skeleton path — Property Owner signs up, creates a minimal guide, a Guest accesses it — has US1.1 (`u1-backend-api`) depending on US4.4 (`u2-admin-api`, create a locality-brand), since a locality-brand must exist before anyone can sign up through its domain. Should the walking skeleton include a minimal slice of `admin-api` (just enough to create one locality-brand) to make the skeleton genuinely end-to-end, or should Bolt 1 stay `u1-backend-api`-only with a locality-brand seeded directly (e.g. a database fixture, not built through `admin-api`'s own API)?

- A. Include a minimal `admin-api` slice in the walking skeleton (create-locality-brand only, per US4.4) alongside signup/guide/guest-access — this exercises the one real inter-unit contract (`admin-api` → `backend-api`) as part of proving the architecture, which is exactly what a walking skeleton is for.
- B. Seed the locality-brand directly (fixture/migration, not through a real API) and keep Bolt 1 scoped to `u1-backend-api` only — simpler first Bolt, but defers proving the cross-unit contract to a later Bolt.
- X. Other (please specify)

[Answer]: A. Include a minimal `admin-api` slice in the walking skeleton (create-locality-brand only, per US4.4) alongside signup/guide/guest-access — this exercises the one real inter-unit contract (`admin-api` → `backend-api`) as part of proving the architecture, which is exactly what a walking skeleton is for.

---

## Q2: Formal scoring model, or informal reasoning?

- A. Informal reasoning — walking-skeleton-first for Bolt 1 (already decided), then value/risk judgment per Bolt, explained in plain terms in `risk-and-sequencing-rationale.md`. Matches the project's scale (2 Units, 17 stories, single AI-only executor per Q4 below) — a formal WSJF model's precision isn't warranted at this size.
- B. Formal WSJF scoring (value + urgency ÷ size) for every Bolt.
- X. Other (please specify)

[Answer]: A. Informal reasoning — walking-skeleton-first for Bolt 1 (already decided), then value/risk judgment per Bolt, explained in plain terms in `risk-and-sequencing-rationale.md`. Matches the project's scale (2 Units, 17 stories, single AI-only executor per Q4 below) — a formal WSJF model's precision isn't warranted at this size.

---

## Q3: Bolt size

- A. Bundle related stories into feature-area Bolts (e.g. "onboarding & guide authoring," "locality content pipeline") — a handful of Bolts, each shipping a coherent, demoable slice. Matches the team's small-batch preference (`delivery-agent`'s own principle) without going so fine-grained that per-Bolt overhead dominates.
- B. One story per Bolt — maximum granularity, fastest individual feedback, but 17 Bolts of overhead for a 2-Unit, single-executor project.
- C. One Bolt per Unit — just 2 Bolts, coarsest possible, but delays most of the product's value to the very end of a single giant Bolt per Unit.
- X. Other (please specify)

[Answer]: A. Bundle related stories into feature-area Bolts (e.g. "onboarding & guide authoring," "locality content pipeline") — a handful of Bolts, each shipping a coherent, demoable slice. Matches the team's small-batch preference (`delivery-agent`'s own principle) without going so fine-grained that per-Bolt overhead dominates.

---

## Q4: Parallel Bolts?

Team Formation (1.5) did not run for this `classic`-scope intent, so per this stage's own rule, all Bolts default to a single AI-only executor (`aidlc-developer-agent`) rather than multiple mobs. With one executor, Bolts build serially regardless of what the dependency DAG would otherwise allow in parallel.

- A. Confirm serial execution — one executor, one Bolt at a time, in the sequence `bolt-plan.md` lists. `unit-of-work-dependency.md`'s parallel-development note (that `admin-api` could be built against a stubbed `backend-api` internal API) remains available as a future option if a second executor/mob joins later, but isn't planned now.
- X. Other (please specify — e.g. you have additional people/mobs to allocate)

[Answer]: A. Confirm serial execution — one executor, one Bolt at a time, in the sequence `bolt-plan.md` lists. `unit-of-work-dependency.md`'s parallel-development note (that `admin-api` could be built against a stubbed `backend-api` internal API) remains available as a future option if a second executor/mob joins later, but isn't planned now.

---

## Q5: External dependencies

Four decisions remain open from earlier stages that could gate specific Bolts once reached: the events data source (`requirements.md` OQ2, gates the ingestion half of US4.2 — not its lifecycle/expiry half, which is self-contained), the LLM provider for itinerary chat (OQ3, gates US2.3), the billing provider (OQ1, gates US1.7/US1.8's actual payment processing, though the capability/status-tracking half doesn't need it), and the internal-API network isolation mechanism between `admin-api` and `backend-api` (`contract-summary.md`'s open question, gates nothing structurally but should be resolved before Bolt 1 ships to production). None of these are external-team hand-offs — they're internal decisions still pending. Should `external-dependency-map.md` track them as gating items anyway?

- A. Yes — track all four as gating items against the specific Bolt(s) each affects, with "owner: this team/session, no external party" and a fallback (proceed with the capability/state-tracking half now, wire the real integration once the decision lands) — even an internally-owned open decision can block a Bolt's *full* completion, and naming it now prevents it from being rediscovered mid-Bolt.
- X. Other (please specify)

[Answer]: A. Yes — track all four as gating items against the specific Bolt(s) each affects, with "owner: this team/session, no external party" and a fallback (proceed with the capability/state-tracking half now, wire the real integration once the decision lands) — even an internally-owned open decision can block a Bolt's *full* completion, and naming it now prevents it from being rediscovered mid-Bolt.

---

## Q6: What worries you most about this build?

This is a genuinely open question for your own judgment — it decides what gets tackled early rather than left to chance.

- A. The cross-unit contract itself (Bolt 1 exercises it, but the network/auth isolation between `admin-api` and `backend-api` is still undecided — a security/deployment risk if underestimated).
- B. The itinerary chat (US2.3) — LLM cost, latency, and moderation are all open (OQ3, R-05) and it's the most technically novel piece.
- C. Something else (please specify).
- X. No particular worry — sequence by value/risk as already reasoned above.

[Answer]: A. The cross-unit contract itself — the network/auth isolation between `admin-api` and `backend-api` is still undecided and should be tackled early, not left implicit until `infrastructure-design`.

---

## Consolidated Summary Confirmation

- Walking skeleton (Bolt 1) includes a minimal `admin-api` slice (create-locality-brand, US4.4) alongside `backend-api`'s signup/minimal-guide/guest-access (US1.1, US1.5-minimal, US2.1) — proving the one real inter-unit contract end-to-end (Q1)
- Sequencing reasoning is informal (value/risk/walking-skeleton judgment explained in plain terms), not a formal WSJF score (Q2)
- Bolts are bundled by feature area, not one-story-per-Bolt or one-Unit-per-Bolt (Q3)
- Single AI-only executor, Bolts run serially (Q4)
- Four internally-owned open decisions (events source, LLM provider, billing provider, internal-API network isolation) are tracked in `external-dependency-map.md` against the Bolts they gate (Q5)
- `bolt-plan.md`, `team-allocation.md`, `risk-and-sequencing-rationale.md`, and `external-dependency-map.md` will be generated reflecting all of the above, plus your Q6 answer

- Looks correct
- Request changes

[Answer]: Looks correct
