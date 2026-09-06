# Performance Design — u1-backend-api

Concrete patterns satisfying `nfr-requirements/performance-requirements.md`'s targets.

## Caching Architecture (Q1)

Domain-to-locality resolution (NFR6.3, <10ms) is the one path with a hard sub-request-budget dependency on a lookup that would otherwise cost a database round-trip on every single incoming request. An in-process LRU cache sits in front of `LocalityEntity.domains`:

```
GET request → Host header → LRU cache lookup (domain → localityId)
  hit  → proceed with resolved localityId (< 1ms)
  miss → Postgres lookup, populate cache, proceed
```

- **Size**: bounded to the year-one domain count (~25-50 entries, per `scalability-requirements.md` NFR5.2) — effectively "cache everything," no eviction pressure expected.
- **Invalidation**: write-through — `admin-api`'s locality-brand/domain-write path (Contract 1, NFR6.4) explicitly invalidates the affected entry after a successful write, rather than relying on a TTL that would otherwise let a stale mapping serve for up to that TTL window.
- **No broader caching tier** for `GuideContent`, `POI`, or `Event` reads (Q1) — deliberate, per the pre-launch traffic posture; each of those paths already meets its own latency budget (NFR1.4) via a single indexed query.

## Query Optimization

- Every read path in `functional-spec.md`'s workflows resolves via an indexed foreign key (`Property.localityBrandId`, `Stay.propertyId`, `GuideContent.propertyId`) — no full-table scans on any hot path.
- `POI.localityIds` (a many-to-many array/join, per FR5.4) is queried via a GIN index (PostgreSQL) or an equivalent join-table index, so the "curated content for a locality" read (W5) stays sub-linear in total POI count.

## Connection Pooling

Sized per the formula in `scalability-requirements.md` NFR5.4: `pool size = RPS × avg. request duration × 1.5`. At the year-one throughput target (NFR1.6, ≥50 RPS) and a ≤500ms average request duration, this yields a starting pool of roughly 25-40 connections per app instance — tuned down at `infrastructure-design` once the actual compute sizing (NFR1.7) is fixed.

## Async / Non-Blocking Patterns

- The itinerary-chat path (NFR1.3) is the only genuinely slow operation in the system; it never blocks the Fastify event loop — the LLM adapter call is fully async, and the chat capability's isolation (see `logical-components.md`) means a slow chat request never starves connection-pool capacity needed by signup/guide-read traffic.
- PDF extraction during onboarding (W3, BR3.4) is a one-shot async operation with a bounded timeout and the documented fallback to manual entry on failure — no synchronous blocking wait beyond a UX-appropriate loading state.

## Performance Budget Summary

| Path | Budget | Design Mechanism |
|---|---|---|
| API (general), NFR1.2 | p95 < 500ms | Indexed queries, connection pooling, no synchronous external calls |
| Itinerary chat, NFR1.3 | p95 < 3s | Isolated bulkhead, async LLM adapter call, timeout+retry (no blocking) |
| Guest guide read, NFR1.4 | p95 < 300ms | Single indexed read, no LLM/external dependency |
| Lead-form submission, NFR1.5 | p95 < 300ms | Simple validate+insert, no external dependency |
| Domain resolution (NFR6.3) | < 10ms | In-process LRU cache |

## Traceability

See `traceability.json`.
