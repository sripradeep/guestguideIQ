# Contract Design — Questions

Five decisions about the formal agreements across this frontend's boundaries.

**What the boundary set actually looks like here.** Unusually for this stage,
**the frontend exposes no public API at all**. Nothing outside the system
consumes it — guests and owners use it through a browser, not through an
interface another team codes against. So there is no external API this project
provides and must pin.

What there is instead:

- **Fourteen inter-unit edges**, all inside one repository that deploys as one
  artifact. They are compile-time and in-process boundaries, not network ones.
- **One genuinely external contract — and this project is its consumer, not its
  provider.** `u1-backend-api` is owned by another team in another repository,
  and it is the single most consequential contract in the whole design.

That inversion shapes every question below. The usual contract-design worry is
"we own a spec and consumers will depend on it". Here the worry is the reverse:
we depend on a spec we do not own, cannot change, and — today — cannot even read
in machine-readable form.

**Already settled by earlier stages, not re-asked:**

- Exactly one module reaches the network; exactly one parses the error envelope
  into a union keyed on `error.code`; no component reads the token store.
- No automatic retry on an indeterminate subscription change — re-read state and
  ask the owner. Concurrent `401`s collapse into one in-flight refresh.
- Every request carries a complete body; `PATCH /v1/subscriptions`' action comes
  from a fixed typed set.

---

## Q1 — How do we pin a contract we don't own?

ADR-006 decided the backend will publish a machine-readable contract and this
frontend will generate types from it. That decision is made; what is not decided
is what this stage writes down **now**, while that contract does not yet exist.

- **A. Record the frontend's expected shape as a consumer-driven contract.**
  Write what this frontend needs from each endpoint — fields, types, error codes
  — as an OpenAPI fragment in this artifact. It becomes the specification the
  backend's eventual contract is checked against, and a concrete brief for the
  team doing that work rather than an abstract ask. It also gives the frontend
  something to generate provisional types from immediately.
- **B. Record only the dependency, and wait.** State that the contract is owned
  externally, name the endpoints in play, and leave the shape to the backend's
  publication. Nothing here can go stale or contradict what eventually arrives.
- **C. Transcribe the current `api-documentation.md`** as the contract of record
  and treat divergence as a backend defect. Fastest, but it makes a prose
  document normative when it was never written to be.
- **X. Other (please specify)**

[Answer]: C

---

## Q2 — Do internal unit contracts get versioned?

The fourteen inter-unit edges live in one repository, compile together and deploy
as one artifact. Nothing consumes them independently and nothing can be running
an old version of one.

- **A. No versioning; the compiler is the contract check.** Internal boundaries
  are enforced by types at build time. A breaking change is a compile error in
  the same pull request that caused it, which is the fastest possible feedback.
  Record the boundaries and their shapes, but no version numbers or deprecation
  policy.
- **B. Version the foundation's public surface.** `u3-foundation` is depended on
  by five units, so treat its exported surface as a versioned contract with a
  deprecation path even inside one repo. More ceremony; useful mainly if units
  are ever split into separate packages.
- **X. Other (please specify)**

[Answer]: A

---

## Q3 — Where does retry and timeout policy live?

`u3-foundation` owns transport, so it *can* own retry and timeout policy
entirely. But some of this product's retry rules are domain decisions, not
transport ones — the rule that a subscription change is never retried
automatically exists because a retry is a silent billing event, which the
transport layer has no way to know.

- **A. The foundation owns a default policy; callers may override per call.**
  Sensible retry and timeout defaults live in one place, and a unit with a reason
  to differ — subscription changes, which must never auto-retry — states it at
  the call site where the reason is visible.
- **B. The foundation owns it entirely**, with the no-retry rule encoded as a
  per-endpoint policy inside it. Callers cannot get it wrong because they cannot
  reach it; the reason for the rule then sits far from the code that motivates
  it.
- **C. Callers own it entirely.** Maximum explicitness, and it guarantees the
  rule is eventually forgotten at one of the call sites.
- **X. Other (please specify)**

[Answer]: A

---

## Q4 — How formal is the design system's contract?

`u2-design-system` is depended on by all five `ui` units, which makes its
component surface a real contract. But the framework is not chosen (OQ4), so a
props specification written now cannot use the language it will eventually be
written in.

- **A. Specify component contracts at `functional-design`, per unit.** Record
  here only that the boundary exists and what it covers. Avoids writing a spec in
  a notation that will not survive the framework choice.
- **B. Specify them now, framework-neutrally** — each primitive's inputs, states
  and events as a table. Gives the units something to build against before the
  framework lands, at the cost of a translation step once it does.
- **X. Other (please specify)**

[Answer]: A

---

## Q5 — How does the generated contract physically arrive?

ADR-006 left this open: the two repositories are separate, so the published
contract is "a published package or a git dependency, not a shared folder." That
choice affects who can break whom and how fast a fix propagates.

- **A. A published package, version-pinned.** The frontend upgrades deliberately.
  A backend change cannot break the frontend build until someone bumps the
  version, which is also the mechanism by which the frontend can fall behind
  without noticing.
- **B. A git dependency pinned to a commit.** No publishing infrastructure
  needed, which matters for a team that has none today. Pinning is still
  deliberate; the cost is a less conventional dependency and no package registry
  to inspect.
- **C. Vendored — the generated output is committed into this repository** and
  refreshed by a script. Simplest to start and the diff is visible in review; it
  goes stale silently the moment someone forgets to run the refresh.
- **X. Other (please specify)**

[Answer]: C

---

## Consolidated Summary Confirmation

Answers recorded:

- **Q1 = C** — Transcribe `api-documentation.md` as the contract of record;
  divergence from it is a backend defect.
- **Q2 = A** — No versioning on internal unit contracts. The compiler is the
  contract check: a breaking change is a compile error in the pull request that
  caused it.
- **Q3 = A** — `u3-foundation` owns a default retry and timeout policy; callers
  may override per call where they have a domain reason to.
- **Q4 = A** — The design system's component contracts are specified at
  `functional-design`, not here. This artifact records that the boundary exists
  and what it covers.
- **Q5 = C** — The contract arrives vendored: its output is committed into this
  repository and refreshed by a script.

Three consequences I will carry into the artifact, stated here so they are not
silent:

1. **Q1 does not reverse ADR-006 — it fills the gap before it.** ADR-006's
   decision stands: the target is a machine-readable contract the frontend
   generates from. Q1 answers a different question — what is normative *today*,
   while that contract does not exist. `api-documentation.md` becomes the
   contract of record in the interim. The artifact will state both, and state
   that the transcription is superseded the moment a published contract arrives.
2. **Q1 and Q5 together define a migration, not a contradiction.** Vendoring
   commits generated output into this repository, but there is nothing to
   generate from yet. So the vendored artifact starts as **hand-written types
   transcribed from the prose document**, in the exact location the generated
   output will later occupy — the file changes provenance without moving. That is
   a genuine benefit of this pairing and worth being deliberate about rather than
   discovering later.
3. **Q3's override needs a safe default direction.** Caller override means a
   caller could in principle enable a retry that must never happen —
   AC1.14.5 forbids retrying an indeterminate subscription change because a retry
   is a silent billing event. The default will therefore be **no automatic retry
   for any non-idempotent request**, so the dangerous direction requires an
   explicit, reviewable opt-in rather than being available by omission.

[Answer]: Looks correct
