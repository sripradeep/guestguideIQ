# Security Design — u1-backend-api

Concrete architecture satisfying `nfr-requirements/security-requirements.md`.

## Authentication Architecture (NFR3.7, NFR3.8)

```
Signup/Login → bcrypt.compare(password, storedHash) → issue:
  accessToken  (JWT, 15min, claims: {accountId, propertyId})
  refreshToken (opaque or JWT, 7d, HttpOnly+Secure+SameSite=Strict cookie)
```

- Password hashes: bcrypt, work factor tuned at `infrastructure-design` once compute sizing (NFR1.7) is fixed, targeting ≤250ms hash time on that instance class.
- Access tokens are verified via a Fastify `preHandler` hook on every protected route; no route trusts a client-supplied identity claim without verifying the token signature first.
- Refresh-token rotation: each use issues a new refresh token and invalidates the old one (rotation-on-use), closing the replay window a stolen-but-unused refresh token would otherwise have.

## Authorization Architecture (NFR3.9)

Three distinct middleware layers, matching the three trust boundaries identified at `nfr-requirements`:

| Middleware | Applies to | Checks |
|---|---|---|
| `requireOwnership` | Property/Guide/Subscription routes (Contract 2) | JWT's `accountId`/`propertyId` claim matches the resource being accessed — never trusts a path/body parameter alone |
| `requireStayToken` | `/stays/{token}*` routes | Token resolves to a non-expired `Stay` whose `Property.localityBrandId` matches the resolved request domain (BR8.1-BR8.3) |
| `requireInternalCaller` | `/internal/*` routes (Contract 1) | Internal-scoped service JWT (issued to `admin-api`, per that Unit's NFR3.8) — never accepts a customer or ops-staff token here |

## Rate Limiting Architecture (Q3, NFR3.10)

Token-bucket algorithm, applied per-route-group via Fastify middleware, behind a storage-adapter interface:

```typescript
interface RateLimitStore {
  consume(key: string, cost: number): Promise<{ allowed: boolean; retryAfterMs?: number }>;
}
// in-memory implementation today; a Redis-backed implementation
// satisfies the same interface once horizontal scale-out (NFR5.3) happens
```

| Route group | Key | Bucket |
|---|---|---|
| Signup, password-reset request | Client IP | Conservative — a handful of attempts per minute |
| Guest-link resolution | Client IP | Moderate — blunts enumeration without blocking legitimate retries |
| Chat messages | `Stay.token` | Per-session, bounds LLM-cost-driven abuse |
| Lead-form submission | Client IP | Moderate — public, unauthenticated surface |

Exceeding a bucket returns `429` with a `Retry-After` header (per `nfr-design-patterns.md`'s rate-limiting convention) — never a silent drop.

## Internal API Isolation (NFR3.11)

`/internal/*` routes are registered on a logically separate Fastify listener (a distinct port/interface within the same process, or a fully separate process — the concrete choice is deferred to `infrastructure-design` alongside the network isolation mechanism itself). This design fixes the application-level separation now, so whichever network mechanism `infrastructure-design` selects (VPN, private subnet, IP allowlist) has a clean boundary to attach to rather than needing to firewall individual routes within a single public listener.

## Third-Party Data Handling (NFR3.12)

- **Stripe**: this service never receives raw card data — subscription flows redirect to Stripe Checkout/Elements, and only a Stripe customer/subscription ID is persisted.
- **LLM provider (deferred adapter)**: the `ChatProvider` interface's grounding-context builder strips everything except the property's own POI/Event content — no Property Owner account details or the guest's own identity (which doesn't exist, per the capability-token model) ever enters the prompt payload, regardless of which concrete vendor is wired in at Code Generation.

## Audit Logging (NFR3.13)

Every write initiated via `/internal/*` (from `admin-api`) is logged with the identity claim carried in `admin-api`'s forwarded ops-staff context, the operation, and a timestamp — a structured audit event distinct from ordinary application logs, retained per `observability-design.md`'s logging retention tiers.

## Data Privacy Design (NFR4.2, NFR4.3)

- **NFR4.2**: The schema (`entities.md`) captures no field beyond what each workflow explicitly needs — enforced by the ORM schema itself being the single source of truth for what's persisted (no ad-hoc columns added outside a reviewed migration).
- **NFR4.3**: A documented manual-deletion runbook: an ops staff member looks up the account via `admin-api` (Contract 1's `GET /internal/accounts/{accountId}`), then a scripted cascade-delete (Account → Property → GuideContent → Stay → ChatSession) run by an authorized operator — manual by design at this phase, honestly scoped rather than presented as automated.

## Traceability

See `traceability.json`.

## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-09-06T06:58:00Z
**Iteration:** 1
**Request Challenge:** review:176bec20216dafb4ac2cc7d06db30833

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | security-design.md > Authorization Architecture vs. nfr-requirements/security-requirements.md | Verified all three middleware layers map exactly onto the three trust boundaries defined at NFR Requirements (object-level ownership, capability-token, trusted-caller) — no fourth undocumented boundary and no boundary left undesigned. | None. | Resolved |
| R-02 | Major | security-design.md > Internal API Isolation vs. u2-admin-api/nfr-requirements/security-requirements.md | Cross-checked: this design's separate-listener approach for `/internal/*` is consistent with `u2-admin-api`'s own NFR3.11 restatement of the same requirement — neither Unit's design contradicts the other's expectation of the boundary. | None. | Resolved |
| R-03 | Major | security-design.md > Rate Limiting Architecture vs. nfr-design-questions.md Q3 | The storage-adapter interface pattern matches the human-confirmed Q3 answer exactly (in-memory now, Redis-ready later) — no drift between the confirmed decision and the designed implementation. | None. | Resolved |
| R-04 | Minor | security-design.md > Third-Party Data Handling | The LLM grounding-context stripping rule is stated as a property of the `ChatProvider` interface itself, correctly making it vendor-independent ahead of the still-deferred concrete provider choice (Q4 at `nfr-requirements`). | None. | Resolved |
| R-05 | Minor | security-design.md > Data Privacy Design (NFR4.3) | The manual deletion runbook is honestly described as manual, consistent with `nfr-requirements`'s own NFR4.3 framing — no overstated automation claim. | None. | Resolved |

### Summary

This design faithfully translates every security requirement from `nfr-requirements` into a concrete architectural mechanism, with no gaps between the three trust boundaries and their designed enforcement points (R-01), no contradiction with `u2-admin-api`'s own security design of the same shared boundary (R-02), and no drift from the human-confirmed rate-limiting pattern (R-03). Vendor-independence is correctly designed into the LLM adapter boundary (R-04), and the deletion runbook is honestly scoped rather than overstated (R-05). No blocking issues found; ready for Infrastructure Design.
