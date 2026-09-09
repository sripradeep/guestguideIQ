# Phase Boundary Check — Inception → Construction

**Verdict: PASS, with one disclosed and gate-approved exception.**

Run at Delivery Planning, the capstone Inception stage, before Construction
begins. Consolidates the element-level traceability produced by every Inception
stage that ran.

## Results

| Stage | Upstream IDs | Findings | Verdict |
|---|---|---|---|
| `user-stories` | 21 stories against 75 `FR`/`NFR` IDs | 0 | **Pass** |
| `domain-design` | 21 stories against 14 components | 0 | **Pass** |
| `units-generation` | 21 stories against 8 units | 1 — `US4.1` | **Pass with exception** |

`contract-design` produces no `traceability.json` by design — it owns formal
contracts, not requirement coverage — so it does not contribute to this check.

`refined-mockups` produces none either; its coverage is asserted through the
stories it realises, which `user-stories` already traces.

## The one finding, and why it does not stop the transition

```
units-generation: { "pass": false, "gaps": ["US4.1"], "findings_count": 1 }
```

**`US4.1` is the backend follow-up.** It is a story in this intent's backlog, but
the work belongs to a different team in a different repository. Nobody in this
frontend's unit list can estimate it, build it or complete it.

The human decided at the Units Generation gate (Q5) that it is recorded as an
**external prerequisite rather than a unit** — putting another team's work inside
this frontend's unit list would create a unit nobody here can close.

The traceability sensor has no representation for that state. Every story it
enumerates must map to a declared unit; both `N/A` and `Deferred` still register
as a gap. The most accurate available classification was used — `Deferred`, with
`delivery-planning` named as the downstream owner, since this stage is where the
work must be sequenced around.

**This is a limitation of the check's model, not a coverage gap in the work.**
Every frontend story maps to a unit. The finding was disclosed at the Units
Generation gate, reviewed, and approved with the exception recorded.

Stopping the transition here would mean either mapping another team's work to a
frontend unit — contradicting an explicit human decision — or blocking
Construction on a finding the human has already seen and accepted.

## Chain integrity

The traceability chain holds end to end:

```
75 FR/NFR requirements
  → 21 user stories        (user-stories: every requirement covered)
    → 14 components         (domain-design: every story realised)
      → 8 units             (units-generation: every story assigned)
        → 4 Bolts           (delivery-planning: every unit scheduled)
```

Spot-checked at each boundary:

- **No orphans.** No component, unit or Bolt exists without an upstream reason.
  The four structural entries in `domain-design` that realise no story
  individually — the API client, the error catalogue, the shell and the design
  system — are declared as `N/A` in the reverse map with justification, not left
  unexplained.
- **No invalid targets.** Every `OK` target names a real component, unit or
  directory that exists in its stage's own source of truth.
- **Every unit is scheduled.** All eight appear in `bolt-plan.md`; none is
  orphaned by the Bolt grouping.

## Carried into Construction

These are open by decision, not by omission. Each has a named owner stage.

| Item | Owner | Note |
|---|---|---|
| Framework, language and hosting target (OQ4) | `infrastructure-design` | Must not foreclose the same-origin-proxy option |
| Token storage (OQ3) | `nfr-design` | Bounds whether cross-tab session races are in scope |
| Session expiry: block-and-preserve vs re-authenticate-and-replay | `functional-design` | This design commits to block-and-preserve, marked revisitable |
| Design-system component contracts | `functional-design` | Deferred by decision (Contract Design Q4), not omission |
| Coverage `include`/`exclude` globs | `functional-design` | The category boundary is fixed by ADR-007; the globs need the framework |
| Screen-reader treatment of long generated itineraries | `functional-design` | Genuinely open |
| Per-locality contrast enforcement point | `functional-design` | Lost its home when the Admin screen went out of scope |

## The one thing this check cannot verify

Every artifact in this phase is internally consistent and fully traced. **None of
it has been verified against a running backend**, because no frontend origin is
permitted to call the API — production CORS allows exactly one origin, and it is
not this frontend's.

Seven of eight units are blocked on backend work with no owner and no schedule.
The traceability chain being sound says the *plan* is coherent. It does not say
the plan is executable, and this check should not be read as saying so.

See `external-dependency-map.md`.
