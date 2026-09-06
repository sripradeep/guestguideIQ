# Observability Requirements — u2-admin-api

Same approach as `u1-backend-api` (structured logging + OpenTelemetry-compatible tracing, platform deferred to `infrastructure-design`, per Q9 there) — this file scopes it to `admin-api`'s much narrower surface rather than re-litigating the tooling choice.

## Metrics (NFR2.5)

Request rate, error rate, and latency (RED method) per `admin-api` operation (W1-W4) — volumes will be small, but the same metric shape as `u1-backend-api` keeps dashboards consistent.

## Logging (NFR2.6)

Every `admin-api`-initiated write into `backend-api` (POI curation, event management, locality-brand management) is logged with the authenticated ops-staff identity, timestamp, and operation — this is the audit trail `security-requirements.md`'s NFR3.12 requires, and it is `admin-api`'s own responsibility to emit it (not something `backend-api` can reconstruct on its own, since `backend-api` only sees the internal service credential, not the human ops identity behind it, unless `admin-api` forwards it — which this requirement mandates).

| Level | Use |
|---|---|
| INFO | Every successful ops action (POI created, event curated, account looked up, locality-brand created) |
| WARN | A delegated call to `backend-api` returns a client error (validation/conflict) — relayed to the ops caller per BR1.6, but still worth a WARN-level log here for pattern detection |
| ERROR | `backend-api`'s internal API is unreachable (NFR2.4) |

**Never logged**: the ops-staff JWT, the internal service JWT (NFR3.8), any password/credential material.

## Tracing (NFR2.7)

The one real inter-service hop this Unit has — `admin-api` → `backend-api`'s internal API — is traced end-to-end using the same W3C Trace Context propagation `u1-backend-api` establishes, so a single ops action is visible as one trace spanning both services.

## Alerting

Given the low SLO (95%, NFR2.2) and small user base, no dedicated paging alert is warranted for `admin-api` alone; a ticket-level alert on sustained internal-API call failures is sufficient (feeding the same incident-response process as `u1-backend-api`'s alerts, not a separate one).

## Traceability

See `traceability.json`. Upstream: `NFR2` (Availability) — observability supports this Unit's own SLO the same way it does `u1-backend-api`'s.
