# NFR Design — Plan & Questions — u2-admin-api

Most of `u1-backend-api`'s NFR Design patterns transfer here by the same reasoning `nfr-requirements` used (shared stack, no domain logic of its own). Two design decisions are genuinely specific to `admin-api`'s own role as the caller into `backend-api`'s internal API.

---

## Q1: Retry policy for `admin-api`'s calls into `backend-api`'s internal API?

`contract-summary.md` already flags that `POST /internal/pois` and `POST /internal/localities` are **not** automatically retried per the resilience baseline, since they're non-idempotent — this question is whether `admin-api`'s own design honors that distinction consistently across all four capabilities.

- A. No automatic retry on any non-idempotent write (`createPOI`, `createLocalityBrand`, `addLocalityDomain`) — a failure surfaces immediately to the ops caller for a manual retry decision; `GET` operations (`listEvents`, `lookupAccount`) may retry once with backoff, per the contract's existing idempotent-operation allowance — Recommended. Automatically retrying a POST here risks creating a duplicate POI or locality-brand — a correctness bug, not a resilience improvement.
- B. Retry all calls automatically regardless of idempotency, accepting the duplicate-creation risk for simpler code
- X. Other (please specify)

[Answer]: A. No automatic retry on any non-idempotent write (`createPOI`, `createLocalityBrand`, `addLocalityDomain`) — a failure surfaces immediately to the ops caller for a manual retry decision; `GET` operations (`listEvents`, `lookupAccount`) may retry once with backoff, per the contract's existing idempotent-operation allowance — Recommended. Automatically retrying a POST here risks creating a duplicate POI or locality-brand — a correctness bug, not a resilience improvement.

---

## Q2: Should internal-service-JWT issuance/attachment be its own module?

Feeds `logical-components.md`.

- A. A small, dedicated `InternalCallerModule` wraps every outbound call to `backend-api`'s internal API — attaches the internal-scoped service JWT (`nfr-requirements` Q3), the ops-staff identity for audit logging (NFR3.12/NFR3.13), and applies the retry policy from Q1 in exactly one place — Recommended. Mirrors `u1-backend-api`'s own `InternalAdminAPI` listener being a distinct logical component on the receiving side; keeping the sending side equally distinct avoids each of the four workflow handlers reimplementing credential-attachment and retry logic separately.
- B. Each workflow handler (W1-W4) makes its own outbound call inline, without a shared module
- X. Other (please specify)

[Answer]: A. A small, dedicated `InternalCallerModule` wraps every outbound call to `backend-api`'s internal API — attaches the internal-scoped service JWT (`nfr-requirements` Q3), the ops-staff identity for audit logging (NFR3.12/NFR3.13), and applies the retry policy from Q1 in exactly one place — Recommended. Mirrors `u1-backend-api`'s own `InternalAdminAPI` listener being a distinct logical component on the receiving side; keeping the sending side equally distinct avoids each of the four workflow handlers reimplementing credential-attachment and retry logic separately.

---

## Consolidated Summary Confirmation

- Non-idempotent internal writes (POI/locality creation) are never automatically retried; idempotent reads may retry once (Q1) — directly honors `contract-summary.md`'s existing idempotency note.
- A dedicated `InternalCallerModule` centralizes credential attachment, audit-identity forwarding, and the Q1 retry policy for every outbound call to `backend-api` (Q2).
- All other NFR Design categories (caching, rate limiting, observability, reliability) inherit `u1-backend-api`'s patterns by reference — this Unit's low, ops-only traffic volume doesn't justify a divergent design.
- `performance-design.md`, `security-design.md`, `scalability-design.md`, `reliability-design.md`, `observability-design.md`, `logical-components.md`, and `traceability.json` will be generated reflecting all of the above.

- Looks correct
- Request changes

[Answer]: Looks correct
