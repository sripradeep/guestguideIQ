# Performance Requirements — u2-admin-api

`admin-api` serves only ops staff (a handful of internal users, per `domain-design`'s `Admin` component) — its performance profile is dominated by the pass-through call into `u1-backend-api`'s internal API, not by independent load.

## Requirements

| ID | Requirement | Target | Percentile | Load Condition | Measurement Method |
|---|---|---|---|---|---|
| NFR1.2 | End-to-end response time for any `admin-api` operation (its own relay overhead plus the delegated `backend-api` call) | < 600ms | p95 | Low-single-digit concurrent ops-staff sessions | Server-side metric spanning request receipt to relayed response, per workflow (W1-W4 in `functional-spec.md`) |
| NFR1.3 | `admin-api`'s own relay overhead (excluding the delegated call) | < 50ms | p95 | Same load condition | Isolates this Unit's own contribution from `backend-api`'s (already budgeted at `u1-backend-api/nfr-requirements/performance-requirements.md` NFR1.2, < 500ms) |

No throughput target beyond a nominal few requests/second is set — ops-staff traffic volume is negligible next to the public-facing traffic `u1-backend-api` serves, and no story implies otherwise.

## Traceability

See `traceability.json`. Upstream: `NFR1` (Performance).
