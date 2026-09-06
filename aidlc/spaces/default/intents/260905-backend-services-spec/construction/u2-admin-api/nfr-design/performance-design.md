# Performance Design — u2-admin-api

Concrete design for `nfr-requirements/performance-requirements.md`'s light targets (NFR1.2, NFR1.3).

## Design

`admin-api`'s own overhead (NFR1.3, < 50ms p95) is minimized by keeping every route a thin pass-through: request validation (Fastify schema, matching Contract 1's request shapes) → `InternalCallerModule` forwards to `backend-api` → relay the response unchanged (BR1.6). No business logic, no additional database round-trip, and no caching layer exists in this Unit to add latency of its own.

The end-to-end target (NFR1.2, < 600ms p95) is dominated by `backend-api`'s own budget (< 500ms, that Unit's NFR1.2) plus this Unit's ≤50ms overhead plus network transit — no further optimization is designed here beyond keeping the relay thin.

## Traceability

See `traceability.json`.
