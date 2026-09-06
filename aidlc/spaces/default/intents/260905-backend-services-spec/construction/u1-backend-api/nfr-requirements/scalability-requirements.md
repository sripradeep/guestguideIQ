# Scalability Requirements — u1-backend-api

Concretizes `requirements.md` NFR5 ("should not preclude scaling later") and NFR6 (multi-tenancy/domain routing) with the capacity target confirmed at Q6.

## Capacity Planning

| Dimension | Year-One Target | Scaling Mechanism |
|---|---|---|
| Localities (tenants) | ~25-50 | `LocalityEntity` rows are cheap and independent — no architectural ceiling exists below this range |
| Properties | Low hundreds | Standard relational scaling (indexed foreign keys on `localityBrandId`) |
| Concurrent guest sessions | Low hundreds | Stateless app tier + connection-pooled database access |
| Requests per second (combined) | ≥ 50 (NFR1.6) | Horizontal scale-out of stateless app instances behind a load balancer |

## Requirements

| ID | Requirement |
|---|---|
| NFR5.2 | The system supports the year-one capacity target above without requiring an architectural rewrite — this is the concrete floor that NFR5.1's "avoid a rewrite when adding a second locality" translates to. |
| NFR5.3 | The application tier is stateless (JWT-based auth per `security-requirements.md` NFR3.8, no server-side session store) so horizontal scale-out is a matter of adding instances behind a load balancer, not a redesign. This directly enables NFR1.7's resource-footprint target and is a prerequisite the security requirements were chosen to support. |
| NFR5.4 | The database (PostgreSQL, per `tech-stack-decisions.md`) is sized with a connection pool matching the year-one concurrency target (formula: RPS × avg. request duration × 1.5 buffer, per `nfr-design-patterns.md`); a read-replica path exists as a future scaling lever without requiring a schema change, since the domain model has no write-heavy hot spots beyond `Stay`/`ChatSession` inserts. |
| NFR5.5 | Under load beyond the year-one target, the itinerary chat (the most expensive path per-request, due to the LLM call) degrades first — via request queuing/backpressure on that endpoint specifically — before any other endpoint's latency budget is affected. This follows the priority-tiering principle in `nfr-design-patterns.md` (critical path: signup/guest-guide-read; important, degrade-first: itinerary chat). |

## Domain Routing Scale Note (NFR6)

| ID | Requirement |
|---|---|
| NFR6.3 | Domain-to-locality resolution (BR9.1) adds < 10ms to the request path at the year-one domain-mapping count (~25-50) — trivially achievable via an in-memory or fast key-value cache in front of `LocalityEntity.domains`, well inside the NFR1.2 API-latency budget it sits within. |
| NFR6.4 | The domain-to-locality mapping is written only through `admin-api` (BR9.2, BR9.3) — this scalability requirement confirms that write path stays a low-volume, ops-gated operation and is never a contended hot path even as the read-side lookup (NFR6.3) scales with request volume. |

## Out of Scope for This Revision

Concrete numbers beyond year one (6-month/12-month capacity-planning columns from the standard template) are not set — `requirements.md` OQ5 confirmed no target exists yet beyond the year-one figure Q6 supplied. Revisit this artifact once real production traffic data exists, per the same reasoning applied in `performance-requirements.md`.

## Traceability

See `traceability.json`. Upstream: `NFR5` (Scalability), `NFR6` (Multi-Tenancy/Domain Routing).
