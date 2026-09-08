# Risk and Sequencing Rationale — GuestGuideIQ Frontend

Why the four Bolts are ordered the way they are. A **Bolt** is one build pass
over a piece of the work that ends in something that runs.

The dependency graph from Units Generation constrains what *can* come before
what. It cannot say what *should*. This document records the judgment that
chose one path through it, and the two places that judgment departs from what
the framework or the affirmed practices would otherwise have produced.

## The heuristic actually used

**Blocker-grouped, with a scored ordering of what remains** — the human's
answers at this stage's gate (Q2 = C, Q5 = B).

The conventional heuristics did not fit cleanly, and it is worth saying why
rather than claiming one:

- **Walking-skeleton-first** (Cockburn, *Crystal Clear*) — a minimal end-to-end
  slice that proves the architecture before features are added. This is the
  affirmed practice and it *is* first, but B1 was widened past thin at the gate.
  See "The override" below.
- **Risk-first** (Boehm) — sequence the highest-uncertainty work early. Applied
  partially: the highest uncertainty in this project is not in any Bolt, it is in
  a backend team's queue, and no ordering of frontend work reduces it.
- **WSJF / Cost of Delay ÷ Duration** (Reinertsen; SAFe) — value and urgency
  divided by size. Applied to the three post-skeleton Bolts only, below.
- **Value-first** — rejected: value cannot be delivered by this frontend alone
  for any Bolt except B1, because everything else needs backend work that does
  not exist.

## Scoring the post-skeleton Bolts

B1's position is fixed by the affirmed practice. B2, B3 and B4 are genuinely
open, so they are scored on value, time criticality and risk reduction against
size, higher shipping first.

| Bolt | User/business value | Time criticality | Risk reduction | Sum | Size | Score |
|---|---|---|---|---|---|---|
| **B4 — Guest app** | 9 | 5 | 8 | 22 | 8 | **2.75** |
| **B3 — The link** | 7 | 8 | 6 | 21 | 5 | **4.20** |
| **B2 — Owner completion** | 4 | 3 | 5 | 12 | 5 | **2.40** |

Scores are relative, on a 1–10 scale, and the reasoning matters more than the
arithmetic:

- **B4 value 9** — it is the entire guest-facing product. Everything else exists
  to make it possible.
- **B4 risk reduction 8** — it answers the question the human named as their
  biggest worry: whether anything built proves anything to a guest. Building it
  is the only way to find out how hollow it currently is.
- **B3 time criticality 8** — highest of the three, because B3 is blocked on an
  endpoint that does not exist, and that endpoint is also the supply side for
  B4's demo. Every week AC4.1.1 slips is a week B4 cannot be demonstrated with a
  real link, regardless of whether B4 itself is built.
- **B3 size 5, value 7** — one unit, one screen, but it is the bridge between the
  Owner and Guest surfaces; without it the Guest app has no way in.
- **B2 across the board low** — its two screens work, but neither delivers what
  the owner expects. Curated favourites reach no guest until AC4.1.9, and nothing
  in the API gates any feature on subscription status, so cancelling costs
  nothing functionally. It is the least valuable Bolt in the plan by a distance,
  and the scoring says so plainly.

**Score order is B3 → B4 → B2.** The plan does not follow it, and the reason is
the next section.

## Where the plan deviates from its own scoring, and why

**B3 scores highest and cannot start.** `POST /v1/stays` does not exist in any
form — not a stub, not an internal route reachable from outside. No sequencing
decision changes that; it is the one Bolt in the plan with a hard external gate
rather than a soft one.

So the **listed** order is B1 → B2 → B3 → B4 by Bolt number, but the plan
explicitly permits B2, B3 and B4 to run in any order or concurrently once B1 is
approved (Q3 = B). The number is an identifier, not a queue position. **When
AC4.1.1 lands, B3 should be taken up ahead of B2** on the scoring above, and
B4 ahead of B2 regardless.

That B2 sits numerically before the two Bolts that should precede it is a
consequence of grouping by blocker rather than by score. It is recorded here so
nobody reads the numbering as a recommendation.

## The override: B1 is not thin

This is the most significant deviation in the plan and it is deliberate.

`project.md` carries a stamped mandate:

> *"ALWAYS run the walking-skeleton Bolt first for the frontend — a thin
> end-to-end slice proving the Owner path (signup through to a published guide),
> solo and gated, approved by the user before remaining Bolts run (Q2).
> (affirmed 2026-09-07)"*

B1 preserves **first**, **solo** and **gated**. It does not preserve **thin**: it
builds all five skeleton-path units to completion, including the account screen,
password reset, session-expiry handling and every non-skeleton story those units
own.

**Chosen by the human at this stage's gate (Q1 = C), with the conflict stated
before the choice was recorded.**

### What the override costs

A thin slice exists to make an architectural mistake cheap to discover. Deferring
completion until after the end-to-end path runs means that if the layering is
wrong — if the `ApiClient`/`SessionManager` cycle does not resolve cleanly, if
the single-error-parse boundary leaks, if the token confinement does not hold —
it is found against the smallest possible investment.

B1 defers that discovery until five complete units exist. And because everything
in B1 is built against hand-written fixtures that have never met the real API
(Q4 = A), there are two unverified assumptions compounding rather than one:
*does the architecture hold* and *does the contract match*. Both are answered
late, together, against more code than necessary.

### The mitigation inside the choice

B1's internal build order puts the skeleton path first and demos it before
widening. The end-to-end question is therefore still answerable early even though
the Bolt does not stop there. This does not restore the practice — the
investment at risk is still five complete units — but it is the most that can be
recovered without changing the human's decision.

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **The backend follow-up never lands.** No owner, no schedule; grew three times during Inception. Seven of eight units wait on it. | High | Critical | None available to this team. `external-dependency-map.md` names each item and the Bolt it gates. This is escalation material, not a mitigation. |
| **CORS is not fixed.** Production allows exactly one origin; no frontend origin, no staging, no localhost. | High | Critical | A one-line configuration change. Everything in the plan is buildable against mocks without it and **nothing is verifiable** with it missing. Highest ratio of impact to effort in the whole project. |
| **Fixture drift.** Hand-written types against a prose document, no machine-readable contract, no automated divergence check. | High | High | The live-backend suite is wired from B1, skipped until CORS lands, and run at the first opportunity. ADR-006 is the real fix and is not in hand. |
| **A hollow Guest app passes as complete.** Mocked content makes B4 demo fully while the real payload carries unresolvable ids. | Medium | High | B4's definition of done requires **live** content resolving, not the mocked version rendering. Written into `bolt-plan.md` deliberately. |
| **The destructive guide save reaches production.** A mis-keyed request returns `200` having deleted every section. | Low | Critical | The shrink guard is a B1 done-criterion, and its test requires a full-replace network double rather than a fixture — against a naive fixture the test passes with the defect present. |
| **A silent subscription cancellation.** Any unrecognised action cancels; a missing body reaches that branch. | Low | High | B2 done-criteria: typed action set, mandatory body, no automatic retry on an indeterminate outcome, each with a test. |
| **B1 is too large to review meaningfully.** Five units in one gated Bolt. | Medium | Medium | Demo the skeleton path partway through, before widening, so there are two review points rather than one. |
| **Parallelism is planned but unstaffed.** The plan permits concurrent Bolts; one builder exists. | Medium | Low | Recorded as permitted rather than planned. No coordination cost is incurred unless staffing changes. |

## What would change this plan

- **AC4.1.3 (CORS) landing** — the single highest-leverage event available. It
  makes every Bolt verifiable rather than merely buildable, and converts the
  fixture-drift risk from "discovered at integration" to "discovered
  continuously".
- **AC4.1.1 landing** — unblocks B3 and makes B4's demo real.
- **AC4.1.9 landing** — the difference between a Guest app that renders and one
  that is worth opening.
- **A second builder** — would make the permitted parallelism worth planning
  around rather than merely recording.
