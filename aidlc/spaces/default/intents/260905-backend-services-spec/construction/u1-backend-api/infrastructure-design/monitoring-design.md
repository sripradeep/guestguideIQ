# Monitoring Design — u1-backend-api

Platform-specific implementation of `nfr-design/observability-design.md`'s strategy, on CloudWatch via an ADOT collector (Q7).

## Metrics & KPIs

| Metric | Source | Threshold | Why it matters |
|---|---|---|---|
| API error rate | ADOT → CloudWatch custom metric, per route | > 1% over 5 min | Directly backs the NFR2.2 SLO |
| API latency (p95) | ADOT → CloudWatch custom metric, per route | > 500ms sustained | NFR1.2 budget breach |
| Chat latency (p95) | ADOT → CloudWatch custom metric | > 3s sustained | NFR1.3 budget breach |
| ECS CPU/memory utilization | CloudWatch Container Insights | > 70% sustained | Triggers auto-scaling (`infrastructure-specification.md`) |
| RDS connection count | CloudWatch RDS metrics | > 90% of max connections | Precedes connection-pool exhaustion (NFR2.9) |
| Chat failure rate | ADOT → CloudWatch custom metric | > 5% over 10 min | LLM adapter health (NFR2.9) |

## Alerts

| Alert | Condition | Severity | Routes to |
|---|---|---|---|
| API error-rate spike | Error rate metric > 1% for 5 min | Page | On-call (CloudWatch Alarm → SNS → PagerDuty/equivalent) |
| SLO burn-rate | Projected 30-day error budget exhaustion | Ticket | Engineering backlog |
| Chat failure rate | > 5% failures for 10 min | Ticket | Investigate LLM adapter/provider |
| RDS connection exhaustion | > 90% pool utilization for 2 min | Page | On-call — precedes a full outage |
| ECS task health | Unhealthy target count > 0 for 2 min | Page | On-call — ALB is already routing around it, but signals a real problem |

## SLIs / SLOs

| SLI | SLO target | Measurement window |
|---|---|---|
| API request success rate | 99% | 30-day rolling |
| API latency p95 | < 500ms | 30-day rolling |
| Chat latency p95 | < 3s | 30-day rolling |

## Logs & Tracing

- **Log aggregation**: ECS task `stdout`/`stderr` (structured JSON from `pino`, per `observability-design.md`) ship to CloudWatch Logs automatically via the ECS Fargate log driver; log groups retain ERROR/WARN 90/30 days and INFO/DEBUG per the tiers already designed, enforced via CloudWatch Logs retention policies set in the CDK stack.
- **Tracing**: the ADOT collector runs as a sidecar container in each ECS task, exporting traces to AWS X-Ray — satisfies the W3C Trace Context propagation design (`observability-design.md`) while using a native AWS backend rather than a self-hosted Jaeger/Zipkin.
- **Dashboards**: two CloudWatch dashboards per `observability-design.md`'s specification — a Critical-Path dashboard (signup/guide-read/stay-resolution RED metrics + SLO burn-down) and a Chat dashboard (isolated chat metrics) — both defined as CDK constructs so they deploy alongside the infrastructure rather than being hand-clicked in the console.

## Traceability

See `traceability.json`.
