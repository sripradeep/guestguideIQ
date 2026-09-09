# Feedback & Optimization — SLO Compliance Report

Conversation language: English

## Status: not measurable (Q3)


Per `observability-setup/slo-config.md`, no SLI computation pipeline exists
— the CloudWatch Alarms in `alarms.md` monitor infrastructure-level
signals (CPU, memory, connections, unhealthy hosts, raw 5xx count), none
of which compute an actual SLI ratio (`successful_requests /
total_requests`) or track an error budget.

| SLI | Design target | Current status |
|---|---|---|
| API request success rate | 99% (30-day rolling) | **Not measurable** — no instrumentation |
| API latency p95 | < 500ms (30-day rolling) | **Not measurable against real traffic** — `performance-validation/test-results.md`'s p95 figures are from a synthetic health-check load test, not real SLI computation, and cover a 15-minute window rather than a 30-day rolling one |
| Chat latency p95 | < 3s (30-day rolling) | **Not measurable** — `CHAT_PROVIDER=null`, no chat provider wired in yet |

This is an honest "not yet built" status, not a failing SLO — there is
insufficient production traffic (pre-launch) and no instrumentation to
compute a real SLI either way.

## What would need to happen to make this measurable

Per `slo-sli-patterns.md`, unchanged from `slo-config.md`'s original
assessment:

1. Instrument the Fastify app with OpenTelemetry Metrics (route-level
   request/error/duration histograms) — an application-code change.
2. Export those metrics to CloudWatch (ADOT sidecar or CloudWatch EMF
   exporter).
3. Build a CloudWatch Metrics Math expression for the success-rate SLI and
   a multi-window, multi-burn-rate alarm.
4. Run a 2-4 week baseline measurement period before locking in a final
   SLO number — not meaningful with zero real production traffic today.

## Decision (Q3)

Document current status as "not measurable" and carry the pipeline
build-out forward as a `feedback-loop.md` follow-up, rather than building
a minimal SLI pipeline in this stage — consistent with this session's
established pattern of not over-building past what the actual traffic and
team size justify.

## Traceability

See `feedback-optimization-questions.md` for the full Q&A record. Upstream:
`observability-setup/slo-config.md`, `performance-validation/test-results.md`.
