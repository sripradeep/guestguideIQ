# Observability Design — u1-backend-api

Concrete architecture satisfying `nfr-requirements/observability-requirements.md`'s metrics/logging/tracing/alerting requirements (NFR2.6-NFR2.9).

## Metrics Collection Architecture (NFR2.6)

An OpenTelemetry Metrics SDK instrumented at three layers:
- **Route-level RED metrics**: request rate, error rate, duration histogram, tagged by route and status code — auto-instrumented via a Fastify OTel plugin so no route handler needs manual instrumentation.
- **Business metrics**: emitted explicitly at the point of the business event (signup completed, subscription started, lead submitted, chat session started) — these are counters incremented inline in the relevant workflow code, not derived from HTTP metrics.
- **Infrastructure (USE) metrics**: deferred to whatever the compute platform natively exposes (CPU/memory/connections) once `infrastructure-design` picks the platform — this design only fixes that the app-level SDK does not attempt to duplicate what the platform already provides.

## Structured Logging Design (NFR2.7)

`pino`, configured with:
```
{ level, time, service: "backend-api", traceId, spanId, correlationId, msg, ...context }
```
- **Correlation ID propagation**: generated at the edge (load balancer or first Fastify hook) if absent, threaded through every downstream log line and the outbound call to the LLM adapter or Stripe, so one guest's chat session or one Property Owner's signup attempt is greppable end-to-end from a single ID.
- **Redaction**: a `pino` redaction config strips `password`, `passwordHash`, `authorization` header, and `stayToken` fields from any log line automatically, as a structural safeguard against the "never log credentials" rule (`security-requirements.md`) rather than relying on every call site remembering not to log them.

## Distributed Tracing Architecture (NFR2.8)

```
Guest chat request
  └─ span: POST /stays/{token}/chat
       └─ span: DB read (Stay, GuideContent context)
       └─ span: ChatProvider.reply()  ← the one cross-process/external span
```
W3C Trace Context propagates across the one real inter-service boundary (`admin-api` → `backend-api`, Contract 1) so an ops action started in `admin-api` and completed here shows as one trace. Sampling: 100% error traces, 10% baseline — matching `nfr-requirements`'s stated default, revisited once real traffic volume exists.

## Alerting and Escalation (NFR2.9)

| Alert | Trigger | Severity | Escalation |
|---|---|---|---|
| API error-rate spike | > 1% error rate, 5 min window | Page | On-call, immediate |
| SLO burn-rate | Error-budget consumption pace implies a 30-day breach | Ticket | Next business day review |
| Chat failure rate | > 5% chat failures, 10 min window | Ticket | Investigate LLM adapter/provider health |
| DB pool exhaustion | > 90% pool utilization, 2 min window | Page | On-call, immediate — likely precedes a full outage |

Every alert carries a runbook link (populated at `deployment-execution`/`observability-setup` once the concrete platform exists) per the alerting-requirements template.

## Dashboard Specifications

One primary dashboard per priority tier (`reliability-design.md`): a Critical-Path dashboard (signup/guide-read/stay-resolution RED metrics + SLO burn-down) and a Chat dashboard (chat-specific latency/failure metrics, isolated so a chat degradation doesn't visually mask a critical-path problem on a shared view).

## SLI/SLO Tracking

The NFR2.2 SLO (99% availability, 30-day window) is computed directly from the route-level RED metrics above — `successful_requests / total_requests` across all routes, with the itinerary-chat route's contribution visible separately (per its own looser latency budget, NFR1.3) so a chat-only degradation doesn't get conflated with a critical-path incident in the top-line SLO number.

## Traceability

See `traceability.json`.
