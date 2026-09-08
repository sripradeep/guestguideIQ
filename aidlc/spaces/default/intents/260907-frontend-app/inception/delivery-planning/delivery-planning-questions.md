# Delivery Planning — Questions

Six decisions about the order this gets built in.

Everything below is about **Bolts** — a Bolt being one build pass over a piece of
the work that ends in something that runs. The dependency graph from Units
Generation says what *can* be built before what; it cannot say what *should* be
built first. That is the judgment this stage needs from you.

**Already settled, not re-asked:**

- **The walking skeleton is on** — a thin end-to-end slice that proves the whole
  thing hangs together before features are added. It is the Owner path: sign up,
  log in, onboard, author a guide, publish it (US1.1 → US1.3 → US1.5 → US1.6 →
  US1.7 → US1.8). Bolt 1 is built alone and you approve it before anything else
  runs.
- Short-lived branches off `main`, squash-merged back. Staging first, manual
  approval before production.
- No separate team-formation stage ran, so every Bolt is built here in this
  session rather than handed to a named team.

**The uncomfortable fact this plan has to be built around.** Seven of the eight
units are blocked on backend work that has **no owner and no schedule**. One
blocker is worse than the rest: production CORS allows exactly
`https://guestguideiq.com` — no frontend origin, no staging origin, not even
`localhost`. Until a frontend origin is added, **no request from this frontend
reaches the API at all, including on a developer's own machine.** It is a
one-line configuration change in a repository this team does not own.

That shapes Q1 and Q4 in particular.

---

## Q1 — What goes in the walking skeleton?

The affirmed skeleton path crosses **five of the eight units**: the design system
and the API-contract package underneath, the foundation (session, transport,
errors), the shell that owns the signup and login screens, and the guide unit
that owns onboarding and authoring.

That is a lot for something called thin — and the developer review at User
Stories said so, arguing ten stories is most of the Owner app rather than a
slice. The tension is real, and how you resolve it decides what Bolt 1 actually
costs.

- **A. One Bolt, five units, but only the skeleton's stories.** Build the narrow
  vertical path through all five units and nothing else: no account screen, no
  password reset, no session-expiry handling, no locality content, no
  subscription. This is the true walking-skeleton reading — every layer proven,
  nothing widened. The unit directories exist but are deliberately incomplete.
- **B. Split it in two.** Bolt 1 builds the three foundation units (contract,
  design system, foundation) to completion; Bolt 2 is the skeleton path through
  the shell and guide units. Each Bolt is smaller and the first one has no UI to
  demo — which is also the point at which "does the architecture hang together"
  is answered.
- **C. One Bolt, five units, built to completion.** Everything in those five
  units, not just the skeleton stories. Largest first Bolt by far, and it stops
  being a skeleton — but there is no second pass over the same units later.
- **X. Other (please specify)**

[Answer]: C

---

## Q2 — How big should the Bolts after the skeleton be?

Three units remain untouched by the skeleton path — locality content and
subscription, guest links, and the guest app — plus whatever the skeleton
deliberately left incomplete.

- **A. One Bolt per remaining unit.** Small, independently demoable, easy to
  reorder if a blocker moves. More Bolts to sequence and approve.
- **B. Bundle by surface.** One Bolt finishes the Owner app, one builds the whole
  Guest app. Two large Bolts; fewer approvals; a blocker inside one stalls
  everything in it.
- **C. Bundle by what unblocks together.** Group units by which backend
  acceptance criterion releases them, so a Bolt becomes startable the moment its
  blocker clears. Follows reality rather than the product structure; the groups
  will look arbitrary to anyone reading the plan without the blocker map.
- **X. Other (please specify)**

[Answer]: C

---

## Q3 — Can Bolts run at the same time?

The dependency graph permits genuine parallelism: once the foundation exists, the
Owner and Guest branches are independent, and the three Owner feature units are
independent of each other.

- **A. Serial.** One Bolt at a time, each approved before the next starts.
  Matches a single build session; nothing is half-finished when something needs
  rethinking.
- **B. Allow parallel where the graph allows it.** Faster in principle, and it
  only pays off if there is genuinely more than one builder. Otherwise it adds
  coordination for no throughput.
- **X. Other (please specify)**

[Answer]: B

---

## Q4 — Do we build while blocked, or wait?

This is the biggest planning decision here. Nothing this frontend builds can
currently talk to the backend, and the fix is not in this team's hands.

- **A. Build against an intercepted network, integrate when unblocked.** Work
  proceeds now: every unit is built and tested against a mocked network, and the
  live-backend suite is wired but not runnable until the origins are allowed.
  Risk: fixtures are hand-written against a prose document, so what is built may
  not match what the API actually returns — the drift ADR-006 exists to prevent,
  landing all at once at integration time.
- **B. Wait for the CORS fix, then build.** It is a one-line change; if it can be
  had in days, waiting removes the entire drift risk from the plan. Risk: it has
  no owner, and "days" is an assumption about someone else's queue.
- **C. Split the difference.** Build the two units that need no backend at all —
  the design system, and the parts of the foundation that do not require a live
  call — while pressing for the CORS fix. Nothing is blocked on the fix, and
  nothing is built on unverified fixtures either.
- **X. Other (please specify)**

[Answer]: A

---

## Q5 — Do we score and rank the work formally?

A scoring model like WSJF ranks work by value and urgency divided by size, so
small high-value items float to the top.

- **A. No formal scoring.** Eight units, one builder, and a skeleton-first
  sequence that is already affirmed. The ordering is mostly determined by the
  dependency graph and the blockers; a scoring model would be arithmetic dressed
  as a decision.
- **B. Score the post-skeleton Bolts.** The skeleton is fixed, but the order of
  what follows is genuinely open, and scoring makes the value trade-offs
  explicit rather than implicit.
- **X. Other (please specify)**

[Answer]: B

---

## Q6 — What worries you most, so we tackle it early?

Candidates, each with a reason to be first:

- **The backend follow-up never lands.** It has no owner and no schedule, has
  grown three times during Inception, and seven of eight units wait on it. This
  is the risk that makes every other risk moot.
- **Fixture drift.** Hand-written types against a prose document, with no
  machine-readable contract and no automated divergence check. Discovered all at
  once at integration.
- **The guide's destructive save.** A mis-keyed request returns success while
  deleting every section. It is guarded in the design; the guard has to actually
  be built and tested.
- **The subscription endpoint.** Any unrecognised action cancels the
  subscription, and a missing body reaches that branch. A billing event, silent.
- **Nothing built yet proves anything to a guest.** Two of three guest tabs are
  empty by construction, curation reaches nobody, and the chat provider is not
  configured. The Guest app can be built and still demo as hollow.
- **Something else you have in mind.**

[Answer]: Nothing built yet proves anything to a guest

---

## Consolidated Summary Confirmation

Answers recorded:

- **Q1 = C** — Bolt 1 builds all five skeleton-path units to completion, not just
  the skeleton's stories.
- **Q2 = C** — Bolts after the first are bundled by which backend blocker
  releases them.
- **Q3 = B** — The plan permits parallel Bolts wherever the dependency graph
  allows.
- **Q4 = A** — Build now against an intercepted network; integrate when the
  origins are allowed.
- **Q5 = B** — Score the post-skeleton Bolts with a value-and-urgency-over-size
  model.
- **Q6** — The worry to tackle early: nothing built yet proves anything to a
  guest.

**One answer conflicts with an affirmed mandate, and it needs to be a deliberate
override rather than an accident.**

`project.md` carries a stamped rule: *"ALWAYS run the walking-skeleton Bolt first
for the frontend — a thin end-to-end slice proving the Owner path (signup through
to a published guide), solo and gated, approved by the user before remaining
Bolts run (Q2). (affirmed 2026-09-07)"*. `org.md` defines the same practice as a
minimal end-to-end slice that proves the architecture before features are added.

Q1 = C explicitly builds those five units **complete**, including the account
screen, password reset, session-expiry handling and every non-skeleton story in
them. That is not a thin slice. Two halves of the mandate survive — Bolt 1 is
still solo and still gated on your approval before anything else runs — but the
thin-slice half does not.

Choosing it is entirely yours to make. What it costs is the specific thing the
practice buys: with a thin slice, an architecture that does not hang together is
discovered after the smallest possible investment. Building five units complete
first means that discovery, if it comes, comes later and against more code —
and it comes while every one of those units is built on hand-written fixtures
that have never met the real API (Q4 = A).

I will record this in the plan as a deliberate, human-made override of the
affirmed practice, with the practice quoted, rather than quietly planning around
it. **If that was not what you intended by Q1 = C, choose Request changes and we
will pick a different option** — option A is the thin-slice reading and keeps the
mandate intact.

Two smaller consequences, noted rather than escalated:

1. **Q3 = B permits parallelism there is currently no second builder for.** No
   team-formation stage ran, so every Bolt is built in this session. The topology
   will record where parallelism is legitimate; nothing will actually run
   concurrently unless staffing changes.
2. **Q4 = A and Q6 point at the same hazard from opposite ends.** Building the
   Guest app against mocks makes it look complete in a demo while the real one is
   hollow — two of three tabs are empty by construction until AC4.1.9, and the
   chat provider is unconfigured. The plan will make the Guest Bolt's definition
   of done depend on real content resolving, not on the mocked version rendering.

[Answer]: Looks correct
