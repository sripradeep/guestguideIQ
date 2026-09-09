# Observability Setup — Alarms

Conversation language: English

Real CDK-managed CloudWatch Alarms, `u1-backend-api` production only (Q1: minimal slice, Q3: u1 only). See `guestguideiq-app` PR #17.

| Alarm | Metric | Threshold | Evaluation | Severity | Notifies |
|---|---|---|---|---|---|
| `EcsCpuHighAlarm` | ECS service CPU utilization | > 70% | 3 of 5 datapoints (5min period) | Warning | SNS → email |
| `EcsMemoryHighAlarm` | ECS service memory utilization | > 70% | 3 of 5 datapoints (5min period) | Warning | SNS → email |
| `RdsCpuHighAlarm` | RDS CPU utilization | > 80% | 3 of 5 datapoints (5min period) | Warning | SNS → email |
| `RdsConnectionsHighAlarm` | RDS database connections | > 100 | 2 of 3 datapoints (5min period) | Warning — precedes pool exhaustion | SNS → email |
| `AlbUnhealthyHostAlarm` | ALB target group unhealthy host count | > 0 | 2 consecutive minutes | Critical — ALB already routing around it, but signals a real problem | SNS → email |
| `Alb5xxHighAlarm` | ALB target 5xx response count | > 10 | 1 datapoint (5min window) | Critical — approximates error-rate spike | SNS → email |

All alarms use `treatMissingData: NOT_BREACHING` (a gap in data doesn't
falsely trigger an alarm) and route to one shared SNS topic
(`ObservabilityAlarmTopic`) subscribed by the same two email addresses
already confirmed for AWS Budget/Cost Anomaly Detection this session (Q2).

## Deferred (Q1 — full design, not built this pass)

- SLO burn-rate alerting (requires the SLI computation infrastructure in
  `slo-config.md`'s "not yet implemented" section)
- Chat failure rate alarm (requires custom OTel business metrics — no
  chat provider is even wired in yet, `CHAT_PROVIDER=null`)
- PagerDuty/on-call paging distinction between "Page" and "Ticket"
  severities — everything above routes to the same email topic for now,
  since there's no on-call rotation or paging system to route to
  differently
