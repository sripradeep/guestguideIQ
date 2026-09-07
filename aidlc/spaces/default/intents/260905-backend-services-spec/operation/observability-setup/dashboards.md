# Observability Setup — Dashboards

Conversation language: English

One real CloudWatch Dashboard (`BackendApiDashboard`, named
`GuestGuideIQ-BackendApi-production`), defined as a CDK construct so it
deploys alongside the infrastructure rather than being hand-clicked in the
console — matching `monitoring-design.md`'s stated intent, though scoped to
one combined dashboard rather than the two (Critical-Path + Chat) the full
design specifies (Q1: minimal slice; no chat capability is wired in yet to
have its own dashboard).

## Layout

| Row | Widget | Metrics |
|---|---|---|
| 1 | ECS CPU / Memory Utilization | `publicService.service.metricCpuUtilization()`, `metricMemoryUtilization()` |
| 1 | RDS CPU / Connections | `database.metricCPUUtilization()` (left axis), `metricDatabaseConnections()` (right axis) |
| 2 | ALB Request Count / Target Response Time | `targetGroup.metricRequestCount()` (left axis), `metricTargetResponseTime()` (right axis) |
| 2 | ALB 5xx / Unhealthy Hosts | `targetGroup.metricHttpCodeTarget(TARGET_5XX_COUNT)` (left axis), `metricUnhealthyHostCount()` (right axis) |

## Deferred (Q1)

- A dedicated Chat dashboard (isolated latency/failure metrics) — no
  chat provider is wired in yet
- SLO burn-down visualization — no SLI computation pipeline exists yet
  (see `slo-config.md`)
- Business-metric widgets (signups, subscriptions started, leads
  submitted) — requires the custom OTel instrumentation the full design
  calls for, not built this pass
