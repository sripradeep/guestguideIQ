# Security Requirements — u2-admin-api

`admin-api` is where the highest-privilege capability in the whole system lives (`rules.md` BR1.1: "only authenticated ops staff may call any admin-api operation") — this is the substantive concern for this Unit's NFR pass, consistent with its own Units Generation rationale (isolating this trust boundary from the public-facing `u1-backend-api`).

## Authentication (NFR3.7)

```
NFR-AUTH: Ops-Staff Authentication (Q2)
Method: JWT, reusing u1-backend-api's auth infrastructure, with a distinct `ops` role claim
Token lifetime: access 15 minutes, refresh 7 days (same policy as u1-backend-api's Property Owner tokens, different issuance path/claims)
MFA requirement: none confirmed for this phase — a candidate hardening item once ops headcount grows beyond a handful of trusted individuals
Session management: same HttpOnly/Secure/SameSite=Strict refresh-token handling as u1-backend-api
```

A Property-Owner- or Guest-issued JWT (from `u1-backend-api`) MUST be rejected by `admin-api` even though it shares the same signing infrastructure — the `ops` role claim is the sole authorization signal, never token possession alone (BR1.1's "reject before it reaches any delegated call").

## Machine-to-Machine Authentication (NFR3.8)

`admin-api`'s own calls into `backend-api`'s internal API (Contract 1) use a separate, short-lived, internal-only-scoped service JWT (Q3) — distinct from both the ops-staff token above and any customer-facing token. This is a genuinely third credential type in the system:

| Credential | Issued to | Scope | Used for |
|---|---|---|---|
| Property Owner / Guest JWT | End users | Customer-facing operations only | `u1-backend-api` Contract 2/3 |
| Ops-staff JWT (`ops` role) | Human ops staff | `admin-api` operations only | `admin-api`'s own public surface |
| Internal service JWT | `admin-api` itself (service identity) | `/internal/*` only | `admin-api` → `backend-api` Contract 1 |

## Threat Model (STRIDE)

| Threat | Assessment |
|---|---|
| Spoofing | The internal service JWT (NFR3.8) prevents any caller other than `admin-api` from reaching Contract 1 even if network isolation (NFR3.11, deferred to `infrastructure-design`) is somehow bypassed — a second layer, not a substitute for it |
| Tampering | All requests to `admin-api` and onward to `backend-api` use TLS; no client-supplied field is trusted for authorization (BR1.1 enforced server-side) |
| Repudiation | Every `admin-api`-initiated write is logged with the ops-staff identity (NFR3.13, cross-referenced from `u1-backend-api/nfr-requirements/security-requirements.md`) — `admin-api` itself must attach that identity to the internal call, not just log it locally |
| Information Disclosure | `admin-api` relays `backend-api`'s error responses unchanged (BR1.6) — this Unit must not add its own verbose error detail that could leak internal state beyond what `backend-api` already discloses |
| Denial of Service | Low-traffic, small-user-base surface — the primary DoS concern is a compromised ops credential being used to flood `backend-api`'s internal API; rate limiting at the internal-API side (`u1-backend-api`'s NFR3.10) is the relevant control, not a separate one here |
| Elevation of Privilege | This is the entire reason `Admin` is its own Unit (Units Generation Q1) — a compromise of `u1-backend-api`'s public surface must not, by itself, grant `admin-api`'s privileges, since the two use entirely distinct credential types (table above) issued through distinct paths |

## Requirements

| ID | Requirement |
|---|---|
| NFR3.7 | Ops-staff authenticate via a role-scoped JWT (`ops` claim) reusing `u1-backend-api`'s JWT infrastructure but never accepting a customer-facing token, per the Authentication section above. |
| NFR3.8 | `admin-api` authenticates to `backend-api`'s internal API via a short-lived, internal-only-scoped service JWT distinct from both ops-staff and customer tokens (Q3). |
| NFR3.9 | `admin-api` never adds its own authorization logic beyond BR1.1's entry-point check — every delegated call's actual authorization (e.g. the duplicate-POI check, domain-uniqueness check) is `backend-api`'s own concern per `u2-admin-api/rules.md`'s explicit non-duplication design. |
| NFR3.10 | Error responses are relayed unchanged from `backend-api` (BR1.6) — `admin-api` must not wrap, translate, or add detail to them, preventing an information-disclosure regression at this layer. |
| NFR3.11 | Network isolation for `admin-api` ↔ `backend-api`'s internal listener follows the same outcome-only requirement stated in `u1-backend-api/nfr-requirements/security-requirements.md` NFR3.11 — this Unit does not restate the mechanism, only confirms it depends on the same `infrastructure-design` decision. |
| NFR3.12 | Ops-staff audit logging (who did what, when) is `admin-api`'s own responsibility to attach the authenticated identity to every outbound internal call, feeding `u1-backend-api`'s NFR3.13 audit requirement rather than duplicating a separate log. |

## Data Privacy (NFR4) and Multi-Tenancy (NFR6) — Not Applicable

`admin-api` owns no entities (ADR-004) and therefore holds no PII of its own to protect beyond the ops-staff identities already covered under Authentication above — `NFR4`'s data-minimization and deletion concerns apply to the data itself, which lives entirely in `u1-backend-api`'s database (see that Unit's `security-requirements.md` NFR4.2/NFR4.3). Similarly, `admin-api` performs no request-domain resolution and renders no locality-branded surface (`functional-spec.md`'s W1-W4 are all ops-tool workflows, never guest- or Property-Owner-facing) — `NFR6`'s multi-tenancy/domain-routing concern does not apply to this Unit at all.

## Traceability

See `traceability.json`. Upstream: `NFR3` (Security), `NFR4` (Data Privacy — N/A), `NFR6` (Multi-Tenancy/Domain Routing — N/A).

## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-09-06T06:44:31Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | traceability.json vs. all five artifacts | Verified programmatically: every derived `NFRx.y` id appearing in `performance-requirements.md`, `security-requirements.md`, `scalability-requirements.md`, `reliability-requirements.md`, and `observability-requirements.md` appears exactly once as a `traceability.json` coverage target, with zero unlisted or dangling ids; the sub-numbering for each NFR category (e.g. `NFR2.5`-`NFR2.7` for observability, continuing past `NFR2.2`-`NFR2.4`'s reliability items) has no internal collision. | None. | Resolved |
| R-02 | Major | security-requirements.md > three-credential-type model | Cross-checked against `u1-backend-api/nfr-requirements/security-requirements.md`: the ops-staff JWT (`ops` role) and the internal-service JWT are correctly kept distinct from `u1-backend-api`'s own Property-Owner/Guest JWT — no token type is reused across a trust boundary, which is the entire point of `u2-admin-api` being a separate Unit (Units Generation Q1). | None. | Resolved |
| R-03 | Major | NFR4/NFR6 coverage vs. domain-design/decisions.md ADR-004 | The `N/A` status for Data Privacy and Multi-Tenancy is correctly justified against `Admin` owning zero entities (ADR-004) and performing no domain-branded rendering (`functional-spec.md`'s W1-W4 are all ops-tool-only) — this is a genuine inapplicability, not a silently dropped requirement. | None. | Resolved |
| R-04 | Minor | scalability-requirements.md > NFR5.2 | Correctly scoped as a minimal, load-independent requirement (stateless app tier) rather than forcing a customer-facing capacity number (`u1-backend-api`'s NFR5.2) onto a Unit whose load is driven by ops headcount, not customer growth. | None. | Resolved |
| R-05 | Minor | reliability-requirements.md > NFR2.2 vs. u1-backend-api's SLO | The deliberately looser 95% SLO (vs. `u1-backend-api`'s 99%) is explicitly justified by this Unit's lack of customer-facing dependency — a defensible, stated departure rather than an unexplained inconsistency between the two Units' reliability postures. | None. | Resolved |

### Summary

This is a well-formed, appropriately lightweight NFR Requirements pass for a Unit whose entire purpose is delegation. Traceability is complete with no dangling ids and correct sub-numbering continuity (R-01). The three-credential-type security model correctly preserves the trust-boundary isolation this Unit exists for, with no token reuse across the boundary (R-02). The two `N/A` categories (Data Privacy, Multi-Tenancy) are genuinely justified against this Unit's zero-entity, ops-tool-only nature rather than silently skipped (R-03), and the lighter scalability/reliability targets are explicitly and defensibly scoped to this Unit's actual (minimal) load profile rather than inheriting `u1-backend-api`'s numbers by default (R-04, R-05). No blocking issues found; ready for NFR Design.
