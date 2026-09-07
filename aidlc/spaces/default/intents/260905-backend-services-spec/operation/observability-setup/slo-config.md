# Observability Setup — SLO Configuration

Conversation language: English

## Design targets (from `nfr-design/observability-design.md`, `monitoring-design.md`)

| SLI | SLO target | Measurement window |
|---|---|---|
| API request success rate | 99% | 30-day rolling |
| API latency p95 | < 500ms | 30-day rolling |
| Chat latency p95 | < 3s | 30-day rolling |

## Current implementation status: not built (Q1 — minimal slice)

No SLI computation pipeline exists. Computing these SLOs correctly requires
the route-level RED metrics the full design calls for
(`observability-design.md`'s OpenTelemetry Metrics SDK instrumentation),
which was explicitly deferred this pass. The CloudWatch Alarms in
`alarms.md` monitor infrastructure-level signals (CPU, memory, connections,
unhealthy hosts, raw 5xx count) as a practical proxy, but none of them
compute an actual SLI ratio or track an error budget.

## What implementing this later requires

1. Instrument the Fastify app with OpenTelemetry Metrics (route-level
   request/error/duration histograms) — an application code change, not
   an infrastructure one, per `observability-design.md`
2. Export those metrics to CloudWatch (either via ADOT sidecar or the AWS
   CloudWatch EMF exporter)
3. Build a CloudWatch Metrics Math expression for `successful_requests /
   total_requests * 100` and a burn-rate alarm per `slo-sli-patterns.md`'s
   multi-window, multi-burn-rate approach
4. Establish a 2-4 week baseline measurement period before locking in the
   final SLO number (per the same guide's SLO Target Setting process) —
   not meaningful yet with zero real production traffic

This is real, not-yet-scheduled follow-up work, not a design decision this
stage is walking back.
