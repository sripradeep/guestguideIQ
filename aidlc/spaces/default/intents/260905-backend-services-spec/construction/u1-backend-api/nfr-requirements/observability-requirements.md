# Observability Requirements — u1-backend-api

`requirements.md` has no dedicated top-level Observability NFR — observability exists to measure and enforce the Availability SLO (`reliability-requirements.md` NFR2.2), so its detailed requirements below continue that same inception-NFR family (NFR2.6-NFR2.9) rather than inventing an unanchored category.

Per Q9, this stage fixes the *approach* (idiomatic structured logging + OpenTelemetry-compatible tracing); the concrete hosted aggregation platform (CloudWatch, Datadog, etc.) is deferred to `infrastructure-design`, once the hosting target itself is chosen (`requirements.md` C3).

## Metrics (NFR2.6)

| Category | Examples |
|---|---|
| Business | Signups/day, active subscriptions, lead submissions by form type, chat sessions started |
| Application (RED) | Request rate, error rate, and latency per endpoint — directly backs the NFR2.2 SLI |
| Infrastructure (USE) | CPU, memory, connection-pool utilization, deferred to whatever compute platform `infrastructure-design` selects |

Retention: 1-minute granularity for 7 days, 5-minute for 30 days, 1-hour for 1 year — the standard tiering from `nfr-reliability-guide.md`, adequate for a pre-launch product with no long-horizon capacity-trend analysis need yet.

## Logging (NFR2.7)

Structured JSON logs, one event per significant action (signup, login, subscription change, admin-initiated write per `security-requirements.md` NFR3.13, chat message, lead submission).

| Level | Use | Retention |
|---|---|---|
| ERROR | Unrecoverable failures (DB unreachable, unhandled exception) | 90 days |
| WARN | Recoverable/degraded (LLM timeout triggering BR7.3's fallback, payment failure BR2.3) | 30 days |
| INFO | Business events (signup, publish, subscription change) | 30 days |
| DEBUG | Diagnostic detail | 7 days |

**Never logged** (per `security-requirements.md`'s data-protection tiers): password hashes, JWT tokens, Stripe payment details, full guest stay tokens (log a truncated/hashed reference instead so a log leak can't itself grant guest access).

## Tracing (NFR2.8)

Distributed tracing via an OpenTelemetry-compatible SDK, with W3C Trace Context propagation across the one real inter-service boundary this system has (`admin-api` → `backend-api`, Contract 1). Sampling: 100% for errors, 10% for normal traffic — standard baseline, revisit once real traffic volume exists.

## Alerting (NFR2.9)

| Alert | SLI | Threshold | Severity |
|---|---|---|---|
| API error-rate spike | Request success rate | > 1% error rate for 5 minutes | Page |
| SLO burn-rate | 30-day availability | Error budget consumption pace implies breach within the window | Ticket |
| Itinerary chat failure rate | Chat request success rate | > 5% failures for 10 minutes (LLM provider degradation) | Ticket |
| Database connection pool exhaustion | Pool utilization | > 90% for 2 minutes | Page |

Alerting on symptoms (error rate, SLO burn) rather than raw causes (CPU%) per the observability anti-patterns list — a cause-based alert on CPU alone would fire on benign spikes that never affect users.

## Traceability

See `traceability.json`. Upstream: `NFR2` (Availability) — observability is the measurement mechanism for the Reliability requirements' SLO, not a separate inception-level NFR category.
