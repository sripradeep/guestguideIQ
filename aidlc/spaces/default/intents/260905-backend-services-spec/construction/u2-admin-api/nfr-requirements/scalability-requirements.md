# Scalability Requirements — u2-admin-api

`requirements.md`'s NFR5 (Scalability) is written against the product's customer-facing growth (localities, properties, guests) — none of which `admin-api` scales with directly, since its load is bounded by ops headcount, not customer volume.

## Assessment

| Dimension | Status |
|---|---|
| Ops-staff concurrency | Negligible — a handful of internal users at most through year one; no scaling mechanism beyond a single small instance is justified |
| Growth driver | Ops headcount, not `u1-backend-api`'s customer-facing capacity target (`u1-backend-api/nfr-requirements/scalability-requirements.md` NFR5.2) — the two scale independently |
| Data volume | N/A — `admin-api` owns no entities (ADR-004); it holds no state that grows |

## Requirement

| ID | Requirement |
|---|---|
| NFR5.2 | `admin-api`'s application tier is stateless (same JWT-based auth pattern as `u1-backend-api`, NFR3.7/NFR3.8 above), so it can scale horizontally in the unlikely event ops headcount grows meaningfully — but no specific capacity target beyond "trivially satisfied by a single small instance" is set, since nothing in this Unit's scope drives load. |

## Traceability

See `traceability.json`. Upstream: `NFR5` (Scalability) — covered by NFR5.2 above, a deliberately minimal requirement since this Unit's load does not scale with the customer-facing dimensions NFR5 was originally written for.
