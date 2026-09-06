# Functional Specification — u2-admin-api

`u2-admin-api` has no entities and no lifecycle state machines of its own (see `entities.md`) — its four workflows are all thin delegations into `u1-backend-api`'s internal API (Contract 1 in `contract-summary.md`). Each workflow below is intentionally short; the substantive behavior each one triggers is specified in `u1-backend-api`'s own `functional-spec.md`.

## Workflows

### W1 — Curate a POI (US4.1)

1. Ops staff (authenticated, BR1.1) submits a POI (name, description, category, localityIds).
2. `admin-api` forwards the request to `backend-api`'s internal POI-write endpoint (BR1.2).
3. `backend-api` applies its own `PointOfInterest` rules (duplicate-within-locality check, BR5.1 in `u1-backend-api/rules.md`) and returns success or a validation error.
4. `admin-api` relays the result unchanged (BR1.6).

### W2 — Manage the Event Lifecycle (US4.2)

1. Ops staff requests the event list/audit view for a locality.
2. `admin-api` forwards the request to `backend-api`'s internal Event-read endpoint (BR1.3).
3. `backend-api` returns events annotated with `expiryStatus` (active/expired) per its own `LocalEvent` lifecycle rules (BR6.1-BR6.3 in `u1-backend-api/rules.md`).
4. `admin-api` presents the result as an audit trail — expired and duplicate-prevented events remain visible here even though they're excluded from Guest-facing reads (that exclusion is `u1-backend-api`'s BR6.3, not this unit's concern).

### W3 — Review a Property Owner Account (US4.3)

1. Ops staff submits an account identifier.
2. `admin-api` forwards it to `backend-api`'s internal Account-read endpoint (BR1.4).
3. `backend-api` returns the account + subscription status, or a not-found result.
4. `admin-api` relays the result unchanged — a not-found result is a normal, valid outcome, not a rejection (AC4.3.2).

### W4 — Create/Manage a Locality-Brand Identity (US4.4)

1. Ops staff (authenticated, BR1.1) submits a locality-brand's identity (name, optional tagline/visualStyling) and at least one domain, or a domain addition to an existing locality-brand.
2. `admin-api` forwards the request to `backend-api`'s internal Locality-write endpoint (BR1.5).
3. `backend-api` applies its own `LocalityEntity` rules — domain uniqueness (BR9.2) and minimum-identity validation (BR9.4) in `u1-backend-api/rules.md` — and returns success or a validation/conflict error.
4. `admin-api` relays the result unchanged (BR1.6).

## Lifecycle State Machines

None. `Admin` owns no stateful entities (see `entities.md`); every state transition a Property Owner, Guest, or ops action ultimately causes lives in `u1-backend-api`'s state machines (`SubscriptionRecord.status`, `GuideContent.publishStatus`, `Event.expiryStatus`, `OnboardingProgress.currentStep`) — none of which `Admin` itself owns or transitions directly.

## Derived View: Entity-Relationship Diagram

None. With zero entities in this unit, there is no ER diagram to derive — see `u1-backend-api/functional-spec.md`'s ER diagram for the entities every one of this unit's four workflows ultimately reads or writes.

## Derived View: Rules Summary

| Group | Rules | Categories Present |
|---|---|---|
| BR1 — Admin | BR1.1-BR1.6 | authorization, policy |

## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-09-06T06:06:09Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | entities.md, rules.md > fenced yaml blocks | Verified programmatically: `entities.md` correctly declares an empty `entities: []` array rather than omitting the source-of-truth block entirely, and `rules.md` parses as valid YAML with 6 rules. This is internally consistent with `domain-design/components.md`'s declaration that `Admin` owns no entities (ADR-004). | None. | Resolved |
| R-02 | Major | traceability.json vs. rules.md | Verified programmatically: all 12 acceptance criteria (US4.1-US4.4) map to a real, declared rule; every rule is either targeted by a coverage row or justified in `reverse` (BR1.6, a cross-cutting policy with no distinct AC) — zero unexplained orphans. | None. | Resolved |
| R-03 | Major | rules.md vs. u1-backend-api/rules.md | Cross-checked every delegation rule (BR1.2-BR1.5) against the actual `u1-backend-api` rule it names: BR1.2→BR5.1/BR5.2, BR1.3→BR6.1-BR6.3, BR1.5→BR9.2/BR9.4 all resolve to real, existing rules in the other unit's `rules.md` — no dangling cross-unit reference. This correctly avoids duplicating `u1-backend-api`'s validation logic rather than risking drift between two copies. | None. | Resolved |
| R-04 | Minor | traceability.json > AC4.4.3 mapping | AC4.4.3 (non-ops caller rejected) is mapped to BR1.1 (this unit's own entry-point authorization) rather than BR1.5 (delegation) — the more precise choice, since `u2-admin-api` never even exposes a reachable operation to a non-ops caller in the first place; `u1-backend-api`'s own BR9.3 (enforced by omission) is the complementary half of this same authorization boundary from the other unit's side. | None. | Resolved |
| R-05 | Minor | functional-spec.md > absent ER diagram and state machines | The explicit "None" statements for the ER diagram and lifecycle state machines, with a pointer to where the real diagrams live (`u1-backend-api/functional-spec.md`), are the correct treatment for a zero-entity unit — an empty or fabricated diagram would be worse than stating the absence plainly. | None. | Resolved |

### Summary

This is a well-formed functional design for a genuinely unusual unit: one with no entities and no business logic of its own, only orchestration. That absence is documented explicitly and consistently rather than papered over (R-01, R-05), traceability is complete with no orphans (R-02), and — most importantly for a delegation-only unit — every cross-reference to `u1-backend-api`'s actual enforcement rules resolves to a real rule that exists there, so the two units' rule sets stay correctly separated rather than drifting (R-03). The one AC requiring judgment (AC4.4.3's authorization boundary) is mapped to the more precise of two plausible targets (R-04). No blocking issues found; ready for NFR Requirements.
