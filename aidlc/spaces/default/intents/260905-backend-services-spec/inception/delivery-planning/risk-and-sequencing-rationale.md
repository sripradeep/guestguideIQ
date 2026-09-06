# Risk & Sequencing Rationale — Backend Services for GuestGuideIQ

`units-generation`'s dependency DAG (`u2-admin-api` depends on `u1-backend-api`) fixes what *can* depend on what. This document explains the economic path chosen through it — which Bolt ships first and why — using informal value/risk/walking-skeleton reasoning rather than a formal scoring model (Q2 in `delivery-planning-questions.md`; a formal WSJF model's precision isn't warranted for 2 Units and 7 Bolts).

## Heuristics Applied

Per `workflow-planning-guide.md`'s Bolt-sequencing heuristics (Cockburn, Reinertsen, Boehm):

1. **Walking skeleton first** (Cockburn) — Bolt 1 is a minimal end-to-end slice, not a feature. This is a pre-existing team commitment (`team-practices.md`, affirmed at practices-discovery), not a choice made fresh here.
2. **Risk-first** (Boehm) — surfaced twice: the walking skeleton itself de-risks the two-service architecture, and the human's own stated top concern (the `admin-api`/`backend-api` network isolation mechanism) is folded directly into Bolt 1's Definition of Done rather than left implicit until `infrastructure-design`.
3. **Value-first** — Bolt 2 (Lead Capture) ships immediately after the skeleton specifically because it is fast, fully independent (zero dependencies in `unit-of-work-dependency.md`), and retires a real third-party dependency (Formspree) with no architectural risk — a quick, low-risk win is worth taking early even though nothing else depends on it.

## Bolt-by-Bolt Rationale

**Bolt 1 (Walking Skeleton)** — Not a value or risk argument alone; it's the team's affirmed practice. Its *scope*, though, was a genuine choice (Q1): including a minimal `admin-api` slice (US4.4) rather than seeding a locality-brand as a fixture. The deciding factor is that `unit-of-work-story-map.md` already flagged a real story-level dependency running opposite to the Unit-level DAG direction (US1.1 needs US4.4, but `u1-backend-api` has no Unit-level dependency on `u2-admin-api`) — a walking skeleton that papers over this with a fixture would not actually prove the one real inter-unit contract in the whole system. Given the human's stated top concern is exactly that contract's isolation boundary (Q6), proving it in Bolt 1 rather than deferring it is the whole point of doing a walking skeleton at all.

**Bolt 2 (Lead Capture)** — Value-first, placed immediately after the skeleton rather than following DAG order strictly, because it has no dependency on anything else (`LeadCapture`'s `depends_on: []` and `dependents: []` in `domain-design/components.md`) and delivers a concrete, low-risk win (retiring Formspree) that doesn't need to wait for any other Bolt. This is a deliberate **deviation from what a strict topological walk would otherwise suggest** (there's no dependency reason it couldn't come later) — captured here per this stage's requirement to justify such deviations.

**Bolt 3 (Account & Subscription Completeness)** — Follows naturally from Bolt 1's Identity foundation; no new architectural risk, just completing a surface already proven to work.

**Bolt 4 (Onboarding & Guide Authoring)** — Sequenced after the simpler completeness work (Bolt 3) because it carries the most-flagged hidden complexity in the whole product (PDF extraction, content-to-schema mapping, review-before-publish — noted independently by both the design and developer mob reviewers at `user-stories`, and again in `unit-of-work.md`'s implementation notes). Placing it fourth, not first among the feature Bolts, means the team has already shipped two working Bolts' worth of confidence and tooling before tackling the riskiest non-chat story group.

**Bolt 5 (Locality Content Pipeline)** — Requires both `PointOfInterest`/`LocalEvent` (curation) and their consumption paths in `PropertyGuide`/`GuestAccess` to be meaningful as a demo; sequenced after guide authoring is complete (Bolt 4) since favoriting/viewing content presupposes a guide worth adding it to.

**Bolt 6 (Admin Account Support)** — The smallest, lowest-risk story in the plan (US4.3 alone). Sequenced after Bolt 5 mainly because it has no dependents and no urgency — a value-first read would also permit moving it earlier (even right after Bolt 1, since it only needs Identity), but there is no cost to leaving it late, and doing so avoids interrupting the more substantial content-pipeline work with a small, low-value detour.

**Bolt 7 (Itinerary Chat)** — This is the plan's one clear tension between the risk-first heuristic and the DAG. A pure risk-first reading would push US2.3 earlier — it is the single highest-uncertainty story in the product (LLM provider unchosen, cost/latency unknown, moderation still open per R-05 from `requirements-analysis`) and risk-first heuristics say tackle uncertainty before investing in dependent work. It is sequenced *last* here instead, because it has a genuine, non-negotiable dependency: `ItineraryChat` depends on `PointOfInterest` and `LocalEvent` (per `domain-design/components.md`) for grounding content, which does not exist in a demonstrable form until Bolt 5 ships. **This is a deliberate deviation flag**: the team should treat Bolt 7 as carrying more schedule and technical risk than its position in the sequence implies, precisely because the risk-first argument for building it early was overridden by a real dependency, not by a preference.

## Summary of Deviations from Strict Topological Order

| Deviation | From → To | Justification |
|---|---|---|
| Bolt 2 (Lead Capture) moved earlier than a pure dependency walk requires | Could ship anywhere | Value-first: independent, low-risk, retires a real third-party dependency immediately |
| Bolt 7 (Itinerary Chat) is the highest-risk story but ships last | Risk-first would suggest early | Overridden by a genuine content dependency on Bolt 5 — flagged as a residual risk, not resolved by resequencing |
