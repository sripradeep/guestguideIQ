# Security Requirements — `u1-api-contract`

**The types cannot execute. The pipeline that produces them can.** That
distinction is the whole of this unit's security surface, and every requirement
below follows from it.

A vendored type package is third-party content committed into this repository,
produced by a generator that runs in the build with a developer's privileges,
from a source in a repository this frontend does not control. None of the risk is
in the artifact; all of it is in how the artifact gets here.

Requirement IDs inherit their inception NFR and append a sub-number.

## Supply chain

| ID | Requirement | Rationale |
|---|---|---|
| **NFR7.1** | The contract source is **pinned to an exact version or commit**. A change to it can never arrive implicitly. | Q2 = A. An unpinned source means the build's inputs can change without anyone deciding they should. |
| **NFR7.2** | The refresh **verifies the fetched source against a recorded checksum** before generating anything. A mismatch fails the refresh; it does not warn and continue. | Q2 = A. The pin says which version; the checksum says it is that version and not something wearing its name. |
| **NFR7.3** | Until a machine-readable contract exists, the transcribed types **record the revision of `api-documentation.md` they were transcribed from**. | The pin-and-verify requirement has to apply to whatever the contract of record actually is. A revision reference is a weaker guarantee than a checksum and it is the strongest one available today. |
| **NFR7.4** | The generation step runs with **no credentials it does not need**, and never with deploy or publish credentials. | A generator is code from outside this repository executing in the build. Its blast radius should be reading a document and writing files. |
| **NFR7.5** | Generated output is **committed and reviewed as a normal diff**. It is never applied to a build without appearing in a pull request. | This is the one place a human sees what actually arrived. It is the compensating control for everything the automation cannot check. |

## Freshness

| ID | Requirement | Rationale |
|---|---|---|
| **NFR7.6** | A **scheduled CI check** regenerates the types and fails when the result differs from the committed output. | Q1 = B. Vendoring's recorded weakness is that a stale artifact is invisible. This converts silent drift into a build failure on a known cadence. |
| **NFR7.7** | The scheduled check is **specified now and wired when a contract exists to compare against**, and its absence is recorded rather than assumed. | There is nothing to regenerate from yet. A requirement quietly deferred becomes a gap rediscovered later; this one is written down as owed. |

## What the types must make impossible

These are security requirements that happen to be expressed as types. Each guards
a backend behaviour where a malformed request is not rejected — it succeeds
destructively, or returns something attacker-influenceable.

| ID | Requirement | Rationale |
|---|---|---|
| **NFR7.8** | A guide update **cannot be constructed without a complete section set** (BR2.1). | A missing or misspelled `sections` key returns `200` having deleted every section. There is no error to handle; the type is the only enforcement point. |
| **NFR7.9** | A subscription action **cannot be constructed from a value outside the closed set**, and no request can be constructed without a body (BR2.2, BR2.3). | The endpoint's final `else` cancels on any unrecognised action, and a missing body reaches it. A typo is a silent billing event. |
| **NFR7.10** | `visualStyling` is typed as an **opaque map** and is never given a structure (BR3.1). | It is unschematised and attacker-influenceable. A fabricated structure would licence a component to read it directly, which the design forbids. |
| **NFR7.11** | Model-generated reply text is **marked untrusted at the boundary** (BR3.3). | The guest's own message round-trips through a model. Untyped, a reply is indistinguishable from any other string at the point where someone reaches for a raw-HTML sink. |
| **NFR7.12** | No field is typed that the API does not return — in particular **no property image field** (BR3.4). | An optional field for something that does not exist licences a placeholder. For the guest trust cue, a generic placeholder is worse than none. |

## Tokens

| ID | Requirement | Rationale |
|---|---|---|
| **NFR7.13** | `AuthResult`'s token fields are typed as **opaque credentials**, not as ordinary strings, so that a value reaching a log or a URL is visible in review. | This unit is where tokens first have a name. Where they are *stored* is `u3-foundation`'s concern and OQ3's decision; how they are *typed* is this unit's. |
| **NFR7.14** | This unit defines **no logging, serialisation or display behaviour** for any shape. | It has no runtime. A convenience helper here would be the first thing to accidentally print a refresh token. |

## Not applicable to this unit

Recorded rather than omitted, so a reader can tell the difference between "does
not apply" and "was not considered".

| Category | Why not |
|---|---|
| Authentication and authorization | This unit performs neither. It types the shapes of auth exchanges; `u3-foundation` performs them and `u4-owner-shell` guards on the result. |
| Data protection at rest or in transit | It holds no data and makes no requests. Transport security belongs to `u3-foundation`; the backend owns TLS. |
| Input validation | No inputs. The types constrain what *other* units can construct, which is NFR7.8–NFR7.12 above. |
| Rate limiting, session handling, CSRF | All runtime concerns of units that make requests. |
| Compliance and data classification | No personal data passes through this unit. The shapes describe it; the units that fetch it handle it. |

## Threat notes

**The realistic threat is not an attacker — it is drift.** No adversary needs to
compromise anything for this unit to cause harm: types that quietly disagree with
the API produce code that compiles, ships, and behaves wrongly. NFR7.6 exists for
that reason, and it is the only requirement here that addresses the most likely
failure.

**The realistic supply-chain threat is the generator, not the contract.** A
malicious *contract* produces wrong types, which is a correctness problem caught
by review of the diff (NFR7.5). A malicious *generator* runs arbitrary code in
the build, which is why NFR7.4 bounds its privileges rather than trusting it.

**One risk this unit cannot mitigate.** If the backend repository is compromised,
a pinned-and-verified contract faithfully reproduces the compromised shapes. Pin
and checksum prove *provenance*, never *correctness*. The compensating control is
NFR7.5 — a human reading the diff — and it is the only one available.


## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-09-08T04:41:37Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | `traceability.json` line 8, cross-checked against `requirements.md` line 342 (NFR7 — "No component, route guard or page reads the token store directly; all consume a resolved session object") | Fourteen sub-requirements (NFR7.1–NFR7.14) are all filed as `status: OK` coverage of NFR7, but NFR7's own text is narrowly about runtime token-store access discipline. Only NFR7.13–NFR7.14 (opaque token typing, no logging behaviour) are plausibly related to that concern. The other twelve — pin-and-checksum supply-chain controls (NFR7.1–NFR7.5), scheduled-drift detection (NFR7.6–NFR7.7), and the five type-safety guards against destructive malformed requests (NFR7.8–NFR7.12) — trace to no inception NFR at all; they answer Q1/Q2 of this stage's own interview, not a requirement `requirements.md` ever stated. Filing them under NFR7 to satisfy the traceability format makes the coverage table assert a parentage that does not hold: a reader tracing NFR7 back to its origin would conclude the session-security requirement drove twelve engineering asks it never described, and conversely would never discover that this unit's real, substantial security content (supply-chain pinning, drift detection, malformed-request type guards) has no inception-level requirement backing it at all. This is precisely the shoehorning the project's own learned practice on `traceability.json` (declare group-level IDs honestly, including `N/A` where a document heading has no matching sub-requirement) was written to avoid, applied here to sub-requirements invented below a real ID rather than above one. | Split the coverage row: keep NFR7.13–NFR7.14 mapped to NFR7, and record NFR7.1–NFR7.12 as requirements with **no inception-NFR parent** — either as a new `N/A`-adjacent category (e.g. `status: NEW`, or a note under the coverage table) explaining these are stage-original security requirements arising from this unit's own risk analysis (Q1/Q2) rather than a traced NFR, or ask whether `requirements.md` should be amended with an explicit supply-chain/build-integrity NFR at the next requirements gate. | New |
| R-02 | Minor | `security-requirements.md` § Supply chain (NFR7.4) and § Threat notes ("The realistic supply-chain threat is the generator, not the contract") | The artifact correctly identifies the code-generation pipeline as the unit's primary attack surface and bounds its credentials (NFR7.4), but states no requirement that the generator dependency itself (and any CI action that runs it) be covered by the team's affirmed dependency-vulnerability scanning and SHA-pinned-CI-action controls. `team.md` mandates both "from day one," team-wide, for exactly this class of third-party code executing in the build — the omission is notable precisely because this document names the generator as the realistic threat. | Add a requirement (or an explicit cross-reference to where it is enforced, e.g. `ci-pipeline`) that the scheduled-refresh job and any generator dependency are in scope for the team's blocking dependency-vulnerability scan, and that the CI job invoking the generator uses SHA-pinned actions per the affirmed supply-chain practice. | New |

### Validation Tool Results

No stage-listed validation tool was run; none is declared for `nfr-requirements` beyond the sensors that fire on write (claim-sources, traceability), which are not directly invocable here. Findings above are grounded in direct cross-reference against `requirements.md`, `decisions.md` (ADR-006, ADR-007), and `unit-of-work.md`.

### Summary

The eight `N/A` traceability rows (NFR1–NFR6, NFR8, NFR9) are all well-justified against `requirements.md`'s own wording, and the NFR8/ADR-007 exclusion is directly confirmed by `unit-of-work.md`'s explicit statement that "`u1-api-contract` is generated code and is excluded by the same rule." `tech-stack-decisions.md` correctly stays within its lane, stating constraints (TS1–TS5) rather than choosing the framework, with a defensible hard/soft split. The one substantive concern is that this unit's real security work — largely original and largely good — is packaged as if it traces to NFR7 when most of it does not, which weakens the traceability artifact's honesty rather than the underlying requirements. Neither finding is Critical, and there is one Major and one Minor, so the artifact clears the READY bar, but R-01 should be corrected before it sets a pattern other units imitate.
