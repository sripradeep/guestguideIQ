# NFR Design — `u1-api-contract`

Two questions. As at NFR Requirements, only **security design** applies to this
unit — it is a `spec` unit with no runtime, so there is no performance,
scalability, reliability or observability behaviour to design, and the stage's
`produces_kinds` excludes those artifacts rather than inviting empty ones.

The requirements are settled. What is not settled is **how two of them actually
work**, and both have a consequence that outlives the decision.

---

## Q1 — Where does the checksum live, and who updates it?

The requirement is that the refresh verifies the fetched contract against a
recorded checksum before generating anything, and fails on a mismatch. That
implies a recorded value — and a recorded value implies somebody updating it when
the contract legitimately changes.

The risk in every option is the same one: a verification step that is annoying to
update gets updated reflexively, and a reflexively updated checksum verifies
nothing.

- **A. Committed alongside the vendored output, updated by the refresh script
  itself.** The script fetches, records what it got, and generates. The value
  appears in the same pull request as the type changes it corresponds to, so a
  reviewer sees the checksum move and the types move together. The weakness: the
  script updating its own expectation means the check catches an *unexpected*
  change between runs, not a malicious one during a run.
- **B. A separate pinned manifest, updated deliberately by a human.** Updating
  the pin is its own act, distinct from running the refresh. Stronger, and it
  fails closed when someone runs a refresh without intending a contract change.
  The weakness: friction, and friction is what produces reflexive updates.
- **C. No recorded checksum; rely on the version pin alone.** Simplest. This is
  effectively option B of the previous stage's Q2, which was not chosen.
- **X. Other (please specify)**

[Answer]: A

---

## Q2 — What does the scheduled drift check do when it finds drift?

The requirement is a scheduled CI check that regenerates the types and fails when
the result differs from the committed output. "Fails" is doing a lot of work in
that sentence.

- **A. Fail the scheduled job and notify.** Conventional. The signal exists —
  and a red scheduled job that blocks nothing is the kind of thing a team learns
  to ignore, which is exactly how the drift this check exists to catch would
  survive it.
- **B. Open a pull request containing the regenerated diff.** The drift arrives
  as reviewable work rather than as a notification: someone sees precisely what
  changed in the API and decides what to do about it. Harder to ignore, because
  it sits in the same place as everything else the team acts on. Costs write
  access for the job and a pull request nobody asked for when the change is
  trivial.
- **C. Fail the next ordinary build too, until resolved.** Strongest signal —
  drift becomes blocking rather than advisory. Also means an unrelated change is
  blocked by an API drift somebody else needs to resolve.
- **X. Other (please specify)**

[Answer]: B

---

## Consolidated Summary Confirmation

- **Q1 = A** — The checksum is committed alongside the vendored output and
  updated by the refresh script itself, so it moves in the same pull request as
  the types it corresponds to.
- **Q2 = B** — On drift, the scheduled check **opens a pull request containing
  the regenerated diff** rather than only failing and notifying.

**Q2 = B changes what the check is for, and that is the point.** A failing
scheduled job produces a notification; a pull request produces a decision. The
drift arrives where the team already works, showing exactly what changed in the
API, and someone either merges it or investigates why the API moved. A red job
that blocks nothing is the thing teams learn to scroll past — which is precisely
how the drift this check exists to catch would survive it.

**Q1 = A accepts a real limitation knowingly.** A script that records what it
fetched detects an *unexpected change between runs*; it cannot detect a
substitution *during* a run, because the value it records is whatever it just
received. The stronger option was a human-updated manifest, and it was not chosen
because friction produces reflexive updates — a checksum bumped without thought
verifies nothing at all. What makes option A work is the pairing: the checksum
moves in the same diff as the types, so a reviewer sees an unexplained checksum
change next to unexplained type changes.

**Together they close the loop the previous stage left open.** The requirement
said drift must become visible on a cadence; these two answers say the visible
thing is a reviewable diff, and that the integrity claim travels with it.

[Answer]: Looks correct
