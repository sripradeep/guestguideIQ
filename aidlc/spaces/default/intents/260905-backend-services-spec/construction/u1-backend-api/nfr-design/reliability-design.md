# Reliability Design — u1-backend-api

Concrete architecture satisfying `nfr-requirements/reliability-requirements.md`'s 99% SLO (NFR2.2).

## Health Checks and Auto-Restart (NFR2.2)

Each app instance exposes a shallow `/health` endpoint (TCP/HTTP 200, per `infrastructure-guide.md`'s health-check pattern) for load-balancer routing, and a deeper `/health/ready` endpoint that verifies the database connection pool is actually serviceable — an instance that can accept TCP connections but can't reach PostgreSQL is pulled from rotation rather than serving guaranteed-failing requests.

## Resilience Pattern: Itinerary Chat (Q2, NFR2.4)

Per the human's explicit choice, no circuit breaker wraps the `ChatProvider` adapter at this stage — a simpler timeout + retry-with-backoff (BR7.3) is the whole resilience story for this dependency:

```
Chat request → call ChatProvider.reply(context), timeout 10s
  success → append reply, done
  timeout/error → retry once (backoff ~1s) → still failing →
    surface BR7.3's retry-able waiting state, preserve message history
```

This is a deliberate simplification: without a circuit breaker, a sustained LLM-provider outage means every chat request individually times out and retries (rather than failing fast after the first few), which costs more wasted latency/resources under a real outage than a circuit breaker would. The isolation bulkhead (`logical-components.md`) contains the blast radius of that cost to the chat capability alone — it does not, by itself, prevent the cost. Revisit if the LLM dependency proves unreliable in practice, per the human's own stated reasoning.

## Backup and Recovery (NFR2.3, NFR2.5)

- Automated daily PostgreSQL backups (point-in-time recovery enabled), retained 30 days.
- Restore procedure tested at least once before the production launch gate — a concrete, scheduled action item for `build-and-test`/`deployment-execution`, not an assumed-working backup.
- RTO ≤ 4 hours, RPO ≤ 1 hour: achievable with standard automated snapshotting plus PostgreSQL's write-ahead-log-based point-in-time recovery, requiring no custom replication infrastructure at this SLO tier.

## Failure Mode Handling by Priority Tier

| Tier | Paths | Behavior Under Dependency Failure |
|---|---|---|
| Critical (must always work) | Signup, guest guide read, stay-link resolution | No soft external dependency — a failure here means the database itself is down, which is a full-service incident, not a partial degradation |
| Important (degrades first) | Itinerary chat | Timeout + retry, bulkhead-isolated so it never consumes capacity the critical tier needs |
| Fail-clean (no partial state) | Subscription payment (Stripe) | BR2.3's no-partial-state guarantee — a failed payment attempt leaves `SubscriptionRecord` byte-for-byte unchanged, never retried automatically (payment retries carry correctness risk) |

## Graceful Degradation for Sparse Content

BR7.2/BR6.4's "limited content" and "empty state renders correctly" behaviors are treated as first-class reliability requirements here, not just UX polish — a locality with zero curated POIs/Events is a valid, tested state, not an error path that happens to also need a nice message.

## Traceability

See `traceability.json`.
