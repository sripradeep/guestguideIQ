# Security Design — u2-admin-api

Concrete design for `nfr-requirements/security-requirements.md`'s ops-staff and internal-caller security posture.

## Authentication Design (NFR3.7)

Same JWT verification middleware pattern as `u1-backend-api`, configured to require the `ops` role claim specifically — any token lacking that claim (including a valid `u1-backend-api` Property Owner token, since it shares signing infrastructure) is rejected at the `preHandler` hook, before any route logic runs (BR1.1).

## InternalCallerModule Design (NFR3.8, Q1, Q2)

```typescript
interface InternalCallerModule {
  call<T>(op: InternalOp, payload: unknown, opsIdentity: string): Promise<T>;
}
// op examples: createPOI, listEvents, lookupAccount, createLocalityBrand, addLocalityDomain
```

- **Credential attachment**: every call attaches the internal-scoped service JWT (distinct from the `ops`-role JWT ops staff authenticate with) — one issuance point, not reimplemented per handler.
- **Audit-identity forwarding**: the authenticated ops-staff identity (from the inbound `ops` JWT) is attached to the outbound call so `backend-api`'s audit log (NFR3.13 there) can attribute the write to the actual human, not just to "admin-api" as an anonymous service.
- **Retry policy** (Q1): `createPOI`, `createLocalityBrand`, `addLocalityDomain` — no automatic retry; the module surfaces the failure to the route handler, which relays it unchanged (BR1.6) for the ops caller to decide whether to resubmit. `listEvents`, `lookupAccount` — one retry with backoff on `502`/`503`/`504`/timeout, per the idempotent-operation allowance already established in `contract-summary.md`.

## Authorization Design (NFR3.9)

`admin-api` performs no independent authorization beyond the `ops`-role check above — every capability-specific rule (duplicate-POI check, domain-uniqueness check) is `backend-api`'s own enforcement, reached only through `InternalCallerModule`. This design deliberately avoids re-implementing any of `u1-backend-api`'s validation logic, consistent with `u2-admin-api/rules.md`'s stated non-duplication design.

## Error Relay Design (NFR3.10)

`backend-api`'s `ErrorResponse` is passed through the route handler unchanged (BR1.6) — no additional error-detail is added, and no internal exception detail (stack traces, `InternalCallerModule`'s own retry-attempt counts) ever reaches the ops-caller response body, per the information-disclosure boundary this Unit's own threat model identified.

## Network Isolation (NFR3.11)

No design-level change from `u1-backend-api`'s stated position: `admin-api` is the trusted caller on the other side of the same internal-only listener boundary — the concrete network mechanism remains deferred to `infrastructure-design` for both Units simultaneously (they share one boundary, not two).

## Traceability

See `traceability.json`.

## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-09-06T07:15:00Z
**Iteration:** 1
**Request Challenge:** review:2d25f55d515327e9cca5bdce32af0588

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | security-design.md > InternalCallerModule vs. contract-summary.md idempotency note | Verified the retry policy in `InternalCallerModule`'s design exactly matches `contract-summary.md`'s existing idempotency note (no auto-retry on `createPOI`/`createLocalityBrand`/`addLocalityDomain`; retry-once on `listEvents`/`lookupAccount`) — no drift and no operation misclassified. | None. | Resolved |
| R-02 | Major | security-design.md > Authorization Design vs. u2-admin-api/rules.md | Confirmed this design adds no authorization logic beyond the `ops`-role check, consistent with `rules.md`'s explicit statement that BR1.2-BR1.5 point to `backend-api`'s real enforcement rather than duplicating them — the design doesn't quietly reintroduce duplicated logic that the functional design deliberately avoided. | None. | Resolved |
| R-03 | Minor | security-design.md > Audit-identity forwarding vs. u1-backend-api/nfr-design/security-design.md NFR3.13 | Cross-checked: `u1-backend-api`'s audit-logging design expects an ops identity attached to inbound `/internal/*` calls, and this Unit's `InternalCallerModule` is exactly what attaches it — the two designs' expectations of each other line up with no gap. | None. | Resolved |
| R-04 | Minor | security-design.md > Network Isolation | Correctly avoids re-describing the isolation mechanism as if it were this Unit's own separate decision — states plainly that both Units share one boundary, deferred once to `infrastructure-design`, rather than risking two divergent descriptions of the same boundary. | None. | Resolved |

### Summary

This design correctly threads the one genuinely Unit-specific security decision — the non-idempotent-write retry policy — through to an exact match with the contract's own idempotency note (R-01), and avoids the two failure modes a thin delegation layer's security design could fall into: re-implementing authorization logic that isn't its job (R-02) or describing a shared boundary as if it were independently decided twice (R-04). The audit-identity handshake with `u1-backend-api`'s own design is consistent in both directions (R-03). No blocking issues found; ready for Infrastructure Design.
