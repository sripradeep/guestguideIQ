# Team Allocation — GuestGuideIQ Frontend

Who builds each Bolt. A **Bolt** is one build pass over a piece of the work that
ends in something that runs; a **mob** is the group that works on one together.

## Allocation

**Every Bolt is built by `aidlc-developer-agent` — AI, in this session, one Bolt
at a time.**

| Bolt | Units | Owner |
|---|---|---|
| B1 — Owner core | `u1-api-contract`, `u2-design-system`, `u3-foundation`, `u4-owner-shell`, `u5-owner-guide` | `aidlc-developer-agent` |
| B2 — Owner completion | `u6-owner-locality-billing` | `aidlc-developer-agent` |
| B3 — The link | `u7-guest-links` | `aidlc-developer-agent` |
| B4 — Guest app | `u8-guest-app` | `aidlc-developer-agent` |

**There is no Program Board here** — the board a multi-team programme uses to
coordinate work across mobs. One builder means nothing needs coordinating between
teams, so the artifact that would do it is genuinely absent rather than omitted.

## Why there are no named teams

The `classic` scope skips team formation, so no stage assessed skill sets,
composed mobs, or identified skill gaps. That is the correct default for this
project's shape — but it is worth being explicit that the allocation above
reflects **an absent stage rather than a decision that one builder is right**.

If human developers join, this file is where their allocation belongs, and the
dependency topology already supports splitting the work: once B1 is approved, the
Owner and Guest branches are fully independent, and B2, B3 and B4 have no
dependency on each other.

## The parallelism the plan permits but does not staff

The plan permits concurrent Bolts wherever the dependency graph allows (Q3 = B).
With one builder, nothing actually runs concurrently.

This is recorded as permitted rather than planned, deliberately. The topology is
the durable fact — B2, B3 and B4 are genuinely independent — and it stays true
whoever builds them. The staffing is the changeable one. Writing the plan this
way means adding a second builder is a staffing change rather than a re-plan.

**The natural split, if it ever becomes relevant:** the Guest branch
(`u8-guest-app`, and `u7-guest-links` which feeds it) against the remaining Owner
work (`u6-owner-locality-billing`). They share only the foundation and the design
system, both of which B1 completes before either starts.

## Unit ownership

**Solo.** Every unit is built in this session with approval as we go, rather than
handed to independent teams who approve their own work.

This is not only the default — it is **the only option available to this intent**.
Team ownership requires the workspace root itself to be the source repository,
and this intent has a recorded sibling repository (`guestguideiq-app`), so it must
remain solo regardless of preference.

## Review and approval

- **B1 is gated on explicit human approval** before B2, B3 or B4 begin. That
  comes from the affirmed walking-skeleton practice and survives intact even
  though B1's thin-slice property does not — see `bolt-plan.md`.
- Every Bolt merges through a pull request with a green build, lint, type-check,
  test and coverage check. No exceptions; the practice is stamped as a `NEVER`
  rule in `project.md`.
- Each Bolt is one squash-merged commit on `main`, named by its slug.
- Staging deploy first; production requires manual approval.

## The reviewer this plan assumes

Reviewing B1 is a real ask: five complete units, roughly half the frontend, in
one approval. `risk-and-sequencing-rationale.md` records this as a Medium risk
with the mitigation of demoing the skeleton path partway through, before the Bolt
widens — giving two review points rather than one.

Whoever approves B1 should be given that intermediate demo. Approving five units
on a single end-of-Bolt walkthrough is the kind of review that passes because it
is too large to fail usefully.
