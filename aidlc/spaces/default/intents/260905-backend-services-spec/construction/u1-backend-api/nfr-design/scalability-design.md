# Scalability Design — u1-backend-api

Concrete architecture satisfying `nfr-requirements/scalability-requirements.md`.

## Horizontal Scaling Architecture (NFR5.2, NFR5.3)

```
                    ┌─────────────┐
  Requests ──────▶  │ Load Balancer│
                    └──────┬──────┘
                ┌──────────┼──────────┐
           ┌────▼───┐ ┌────▼───┐ ┌────▼───┐
           │ App #1 │ │ App #2 │ │ App #N │   (stateless Fastify instances)
           └────┬───┘ └────┬───┘ └────┬───┘
                └──────────┼──────────┘
                     ┌──────▼──────┐
                     │ PostgreSQL  │  (connection-pooled, one primary)
                     └─────────────┘
```

- No instance holds session state — JWT verification is stateless (NFR3.8), so any instance can serve any request. This is what makes "add another instance" a complete scale-out story with zero code change.
- The rate-limiting storage adapter (`security-design.md`) is the one component that must move from in-memory to a shared store (Redis) the moment a second instance is added — flagged explicitly here as the trigger condition for that migration, rather than left implicit.

## Data Partitioning

No partitioning/sharding is designed at this phase — the year-one data volume (`nfr-requirements` NFR5.2: ~25-50 localities, low-hundreds of properties) fits comfortably in a single PostgreSQL instance. `Property.localityBrandId` and `POI.localityIds` are natural future shard keys (high cardinality, query-local) if partitioning is ever needed, but implementing it now would be premature per `architecture-patterns.md`'s general guidance against speculative complexity.

## Database Scaling Headroom (NFR5.4)

- Connection pool sized per `performance-design.md`'s formula.
- A read-replica is the first lever to pull if read load grows disproportionately (e.g. the guide-content read path, NFR1.4) — no schema change is required to add one, since no write path in this design assumes single-node consistency beyond what PostgreSQL's own replication already provides.

## Load-Based Degradation (NFR5.5, Q4)

The itinerary-chat bulkhead (see `logical-components.md`) is the load-shedding boundary: under load beyond the year-one target, the chat capability's own connection/concurrency limit is reached first, producing a BR7.3-style "try again" response — while the signup, guide-read, and lead-capture paths continue operating at full capacity because they share no resource pool with chat's LLM-call concurrency.

## Domain-Routing Scale Design (NFR6.3, NFR6.4)

The in-process LRU cache (`performance-design.md`) scales trivially with the year-one domain count and requires no redesign even at 10x that count — cache size remains negligible. The write path (cache invalidation on `admin-api`-initiated domain changes) stays low-volume by construction (NFR6.4: ops-gated, not a customer-facing operation), so it never contends with the read-side cache under any realistic load.

## Traceability

See `traceability.json`.
