# Security Design — `u1-api-contract`

How this unit's security requirements are actually met.

**The design surface is a pipeline, not a running system.** This unit has no
authentication flow to architect, no encryption in transit to configure, no
input validation to place — it executes nothing at run time. What it has is a
supply chain: a document fetched from a repository this frontend does not
control, a generator that runs in the build, and an artifact committed here as
source. Everything below designs that.

## The pipeline

```
  contract source (external repo, pinned)
        │
        │  ① fetch at pinned version
        ▼
   fetched document ──② compare against committed checksum
        │                    │
        │                    └── mismatch → FAIL, generate nothing
        ▼
  ③ generate (least privilege, no deploy credentials)
        │
        ▼
  ④ write to the vendored path + update the recorded checksum
        │
        ▼
  ⑤ commit → pull request → human review of the diff
```

Five steps, and **step 5 is the one that actually catches a compromise.** Steps 1
through 4 prove provenance — that what arrived is what the pin named. They cannot
prove correctness: a pinned, checksum-verified contract from a compromised source
reproduces the compromised shapes faithfully. Only a human reading the diff sees
that the shapes changed in a way nobody asked for.

The design is arranged so that step 5 is unavoidable rather than diligent.

## Design decisions

### D1 — The checksum is committed with the output and written by the refresh

*Implements U1-SEC-2 (recorded as NFR7.2 in the requirements file — see the
labelling note at the end).*

The refresh script fetches the contract, records the digest of exactly what it
received, generates from it, and writes both the generated types and the digest
in the same run. Both land in the same pull request.

**What this catches:** an unexpected change to the contract between one refresh
and the next. The committed digest is the claim "last time, the contract was
this"; a later run producing a different digest surfaces as a changed line next
to changed types.

**What this does not catch, stated plainly:** a substitution *during* a run. The
script records whatever it receives, so a compromised fetch produces a
self-consistent digest. This is the accepted cost of the alternative being worse
— a human-maintained manifest creates friction, and friction produces reflexive
updates, and a checksum bumped without thought verifies nothing at all.

**What makes it work anyway:** the pairing. A reviewer seeing a checksum move
with no corresponding type change, or type changes with no checksum move, is
looking at something wrong. Neither line is meaningful alone; together they are a
consistency check a human can actually perform.

### D2 — Drift opens a pull request, not an alert

*Implements U1-SEC-7 (recorded as NFR7.6).*

The scheduled job regenerates the types and compares. On a difference it **opens
a pull request containing the regenerated diff**, rather than failing and
notifying.

**Why this shape.** A failing scheduled job produces a notification; a pull
request produces a decision. The drift arrives in the place the team already
works, showing precisely which shapes moved, and someone either merges it or asks
why the API changed. A red scheduled job that blocks nothing is the thing teams
learn to scroll past — which is exactly how the drift this check exists to catch
would survive it.

**Design details:**

- The pull request body carries the **shape diff**, not just a file diff, so the
  reader sees "`GuestGuideView.notYetPublished` removed" rather than a wall of
  generated output.
- It is opened **once per distinct drift**, updated in place rather than
  reopened, so a persistent difference does not produce a daily stream.
- The job has **write access scoped to opening pull requests** and nothing
  further. It cannot merge, and it cannot touch any other branch.
- If no contract source exists yet — the situation today — the job **reports
  that and exits successfully** rather than failing. A job that is red for a
  reason nobody can fix teaches people to ignore it before it has ever done
  anything useful.

### D3 — Least privilege for the generator

*Implements U1-SEC-4 (recorded as NFR7.4).*

The generator runs with the ability to read one document and write to one
directory. It gets no deploy credentials, no publish credentials, no registry
tokens, and no access to the repository's secrets beyond what the fetch needs.

This is the requirement that treats the generator as what it is: **code from
outside this repository, executing in the build, with whatever privileges the
job hands it.** A malicious contract produces wrong types, which review catches.
A malicious generator does whatever the job's credentials allow, which review
does not catch, because the damage is done before the diff exists.

### D4 — The generator and its job are inside the team's existing controls

*Implements U1-SEC-6 (recorded as NFR7.4's rationale, added at review).*

Whatever generator is chosen is a dependency like any other and is covered by
the team's mandated dependency-vulnerability scanning. Any third-party CI action
in the refresh job is SHA-pinned, with per-job least-privilege permissions,
matching the practice already affirmed for the backend.

This exists because the previous stage's threat notes named the generator as the
realistic supply-chain threat. Naming it as the threat and then exempting it from
the controls the team applies to everything else would be inconsistent.

### D5 — Type-level guards are design decisions, not conventions

*Implements U1-SEC-9 through U1-SEC-13 (recorded as NFR7.8–NFR7.12).*

Three backend endpoints respond to a malformed request by succeeding
destructively. For those, there is no error to handle and no response to check —
by the time a result arrives, the guide is deleted or the subscription is
cancelled.

The design decision is that the **type is the control**, and it is the only one:

| Guard | Design |
|---|---|
| Guide update | `sections` is non-optional at the type level, so a save omitting it does not compile |
| Subscription action | A closed enumeration, so no other value is expressible at any call site |
| Request bodies | Non-optional wherever the endpoint reads one, so a bodyless request cannot be constructed |
| `visualStyling` | Typed opaque, so no component can read it without going through the one module that parses it |
| Chat replies | Marked untrusted, so a call reaching a raw-HTML sink is visible in review |
| Property image | No field exists, so no placeholder can be rendered |

**The design intent is negative.** Every one of these is about what becomes
impossible to write, not about what the code does. A runtime check placed in a
consuming unit would be forgotten at one call site eventually; a type that will
not compile is forgotten nowhere.

### D6 — Tokens are named here and handled nowhere

*Implements NFR7.1 and NFR7.2 — the two requirements genuinely derived from
inception NFR7.*

`AuthResult` carries the access and refresh tokens, so this unit is where token
material first has a name. It is typed as an opaque credential rather than a
string, and this unit defines **no** logging, serialisation or display behaviour
for any shape.

Both follow from NFR7's actual requirement — no component reads the token store
directly, all consume a resolved session object. A convenience helper here would
be the first thing to print a refresh token, and would hand components a way to
reach token material without going through the resolved session that NFR7
mandates. Where tokens are *stored* is `u3-foundation`'s design and OQ3's
decision.

## Not designed here

| Category | Why | Owner |
|---|---|---|
| Authentication and authorization flows | This unit performs neither | `u3-foundation`, `u4-owner-shell` |
| Transport security | It makes no requests | `u3-foundation`; the backend owns TLS |
| Input validation | No inputs. Its types constrain what *other* units can construct | The `ui` units |
| Secrets management | Holds no secrets; the fetch's credential is a CI concern | `ci-pipeline` |
| Security headers, CSP | No rendered output | `infrastructure-design` |
| Audit logging | No runtime | `observability-setup` |

## A labelling note

The NFR requirements file for this unit labels all fourteen requirements
`NFR7.1`–`NFR7.14`. Review found that only two of them genuinely derive from
inception NFR7 (session security); the other twelve are **originated by this
unit** and have no inception parent, because nothing in `requirements.md`
anticipated a vendored type package fetched from another repository.

That finding is recorded in that file's own `## Review` section and could not be
corrected in place — the review-freeze applies once a review is terminal, and
neither unlock path was proportionate for a labelling fix. **This document uses
the corrected `U1-SEC-n` identifiers with the original `NFR7.x` labels noted
alongside**, and units 2 through 8 will use the unit-original prefix from the
start so the pattern does not spread.

## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-09-08T05:01:58Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | `security-design.md` § "The pipeline" and D1, cross-checked against `traceability.json` row for `NFR7.3` and `nfr-requirements/security-requirements.md` § Supply chain, NFR7.3 | `traceability.json` marks NFR7.3 ("until a machine-readable contract exists, the transcribed types record the revision of `api-documentation.md` they were transcribed from") as `OK`, attributed to D1. But D1's actual text, and the pipeline diagram it sits under, describe only the future state — an external contract repo fetched and checksummed — and never once mention `api-documentation.md`, a "revision", or "transcribed from" (confirmed by search: zero occurrences of any of those terms in this file). NFR7.3 is explicitly the *interim* requirement that applies to today's actual mechanism (hand-transcription from `api-documentation.md`, per `team.md`'s "no OpenAPI document... anywhere in the backend today"), not to the pipeline this document designs. The traceability claim therefore asserts coverage the design text does not provide: a reader relying on this document alone would have no idea how — or whether — today's transcribed types record what revision they came from. | Add a design decision (or an explicit clause under D1) stating how the currently-transcribed types record the `api-documentation.md` revision they were transcribed from — e.g. a comment or a companion file carrying the doc's git blob hash or last-modified marker — distinct from the future checksum-of-fetched-source mechanism D1 describes. Until that exists, traceability should mark NFR7.3 as a gap rather than `OK`. | New |
| R-02 | Minor | `security-design.md` D1, cross-checked against `nfr-requirements/security-requirements.md` NFR7.2 and `nfr-design-questions.md` Q1 | NFR7.2's own wording states a mismatch "fails the refresh; it does not warn and continue." D1 as designed (and as the human explicitly chose at Q1=A, with the trade-off disclosed) never fails a refresh — it always fetches, generates, and writes both output and checksum, deferring entirely to human review of the resulting diff. This is a reasonable, knowingly-accepted design (the disclosure in D1's "What this does not catch" is honest and the trade-off analysis in Q1 is sound), but `security-requirements.md`'s NFR7.2 text still reads as a hard-fail gate, and nothing in either document flags that the requirement's literal wording was superseded by the Q1 decision. A reader of `security-requirements.md` in isolation would expect a build-time failure that this design does not implement. | Add a short cross-reference note to NFR7.2 in `security-requirements.md` (or a clause in D1) stating that the "fails the refresh" language is superseded by the Q1=A decision — the control is human review of a self-recorded diff, not a build-time gate — so the two documents do not silently disagree. | New |

### Validation Tool Results

No stage-listed validation tool applies beyond the sensors that fire on write (claim-sources, traceability); neither is directly invocable in this pass. Findings above are grounded in direct cross-reference against `traceability.json`, `nfr-requirements/security-requirements.md`, `nfr-design-questions.md`, and `functional-design/rules.md`.

### Summary

D5's central claim — that the type is the *only* available control for the three destructive-on-malformed-request endpoints — is verified accurate against `functional-design/rules.md` (BR2.1–BR2.3 are each independently marked "Enforced by: **The type**" in that document's own rules summary, with no other control listed). D2's pull-request-on-drift design is sound: the scoped write access, update-in-place behaviour, and the exit-0-with-no-source-today case are all deliberate and disclosed, not an unacknowledged fail-open. D1's headline limitation (cannot catch same-run substitution) is stated honestly and is correctly bounded by the pairing argument. The document stays at the design level throughout, with no implementation leakage, and the frozen-`NFR7.x`-with-corrected-`U1-SEC-n`-label handling is a reasonable way to work around the review-freeze. The one substantive gap is that NFR7.3 — the one requirement meant to apply to today's actual, non-machine-readable interim state — has no design behind it at all despite being marked covered; that is Major but not disqualifying on its own, and the NFR7.2 wording tension is a minor documentation-consistency issue. Neither rises past the ≤2-Major READY threshold, and this is an advisory pass regardless, so the verdict is READY with these two findings for the human to weigh at the gate.
