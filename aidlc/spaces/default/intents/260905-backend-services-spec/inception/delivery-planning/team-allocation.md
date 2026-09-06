# Team Allocation — Backend Services for GuestGuideIQ

Team Formation (Ideation stage 1.5) did not run for this `classic`-scope intent — it's a stage reserved for `enterprise`/`feature` scope, where multiple human mobs need explicit composition and a Program Board to coordinate their work. At `classic` scope, per this stage's own rule, every Bolt defaults to a single AI-only executor.

## Bolt-to-Executor Assignment

| Bolt | Owning Executor |
|---|---|
| 1 — Signup, Guide & Guest Access (Walking Skeleton) | `aidlc-developer-agent` |
| 2 — Lead Capture (Formspree Replacement) | `aidlc-developer-agent` |
| 3 — Account & Subscription Completeness | `aidlc-developer-agent` |
| 4 — Onboarding & Guide Authoring | `aidlc-developer-agent` |
| 5 — Locality Content Pipeline | `aidlc-developer-agent` |
| 6 — Admin Account Support | `aidlc-developer-agent` |
| 7 — Itinerary Chat | `aidlc-developer-agent` |

## Program Board

Not applicable — a Program Board coordinates hand-offs and dependencies *between* multiple human mobs working concurrently. With one executor building every Bolt serially (per Q4 in `delivery-planning-questions.md`), there is no cross-mob coordination surface to visualize. If a second executor or a human mob joins later, `unit-of-work-dependency.md`'s parallel-development note (building `admin-api` against a stubbed `backend-api` internal API) becomes the starting point for splitting work, and this file should be revisited.

## Staffing Note for Construction

Per this stage's Step 6, Construction for this intent runs as a single session building every Unit here, with the human approving as each Bolt completes — the "several teams, each owning a Unit" alternative does not apply, since there is only one executor across all seven Bolts.
