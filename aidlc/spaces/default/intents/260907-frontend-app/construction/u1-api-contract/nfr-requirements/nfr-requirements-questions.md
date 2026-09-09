# NFR Requirements — `u1-api-contract`

Two questions. Most NFR categories do not apply to this unit at all, which is
worth stating before the questions rather than leaving as an absence.

**Why this file is short.** `u1-api-contract` is a `spec` unit: types and the
step that produces them. It has **no runtime** — it makes no requests, holds no
state, and executes nothing when the app runs. Performance, scalability,
reliability and observability requirements are therefore not applicable to it,
and the stage's own `produces_kinds` excludes those four artifacts for a `spec`
unit rather than inviting empty ones.

What remains genuinely applies:

- **Security** — not of the types, which cannot execute, but of **the pipeline
  that produces them**. A generation script is code that runs in the build, and
  a vendored artifact is third-party content committed into this repository.
- **Tech stack** — this unit cannot choose the framework (OQ4 belongs to
  `infrastructure-design`), but it does place constraints on that choice.

Both questions below are about the pipeline, because that is where this unit's
only real risk lives.

---

## Q1 — When does the refresh run?

The types are vendored: committed to this repository, refreshed by a script
(Contract Design Q5). Its known weakness, recorded there, is that **nothing
detects a stale artifact** — if nobody runs the refresh, the types stay plausible
and wrong indefinitely.

When the refresh runs decides whether that weakness stays theoretical.

- **A. On demand only.** A developer runs it when they know the contract changed.
  Simplest, and exactly the weakness as recorded: staleness is invisible and
  depends on somebody remembering.
- **B. On demand, plus a scheduled CI check that fails when the vendored output
  differs from a fresh generation.** The refresh stays deliberate, but drift
  becomes a build failure on a known cadence rather than a discovery at
  integration. Costs a scheduled job and a reachable contract source — neither of
  which exists yet.
- **C. Every CI run.** Regenerate and compare on every build. Drift is caught the
  moment it appears. Costs a contract fetch on every build, and couples every
  build to the availability of a source that does not exist today.
- **X. Other (please specify)**

[Answer]: B

---

## Q2 — Is the vendored artifact verified, or trusted?

The contract arrives from a repository this team does not own, and its output is
committed here as source. Types themselves cannot execute — but **the generation
step does**, and a generator is code that runs with the developer's privileges.

- **A. Pin and verify.** The contract source is pinned to an exact version or
  commit, and the refresh verifies it against a recorded checksum before
  generating. Any change to the source is a deliberate, reviewable act. Costs a
  pin to maintain.
- **B. Pin only.** Pin the version so a change cannot arrive silently, without a
  separate checksum step. Most of the benefit; the pin itself is the integrity
  claim.
- **C. Trust the source.** Both repositories belong to the same team and the same
  organisation. Adds nothing to maintain, and accepts that a compromise of the
  backend repository reaches this build.
- **X. Other (please specify)**

[Answer]: A

---

## Consolidated Summary Confirmation

- **Q1 = B** — Refresh on demand, plus a **scheduled CI check** that fails when
  the vendored output differs from a fresh generation.
- **Q2 = A** — **Pin and verify**: the contract source is pinned to an exact
  version or commit and checked against a recorded checksum before generating.

**Both answers depend on something that does not exist yet, and both degrade
sensibly until it does.** There is no published contract to fetch, pin or
regenerate from — ADR-006 asked for one and it has no owner. Until it arrives:

- The scheduled check has nothing to compare against, so it is **specified now
  and wired when the contract lands**. It is recorded as a requirement rather
  than deferred silently, so it is not rediscovered later as a gap.
- The pin-and-verify requirement applies to the **prose document** in the
  interim: `api-documentation.md` is the contract of record, and the transcribed
  types record which revision of it they were transcribed from. That is a weaker
  guarantee than a checksum over a machine-readable artifact, and it is the
  strongest one available today.

**Q1 = B directly addresses the weakness Contract Design recorded and could not
fix.** Vendoring's cost was that a stale artifact is invisible. A scheduled
comparison converts that from "discovered at integration" to "a build failure on
a known cadence" — which is the difference between finding the drift and being
surprised by it.

**Q2 = A is proportionate rather than ceremonial.** The types cannot execute, so
the risk is not the artifact — it is the **generator**, which runs in the build
with a developer's privileges, against a source in a repository this frontend
does not control.

[Answer]: Looks correct
