# Monitoring Design — u2-admin-api

Same CloudWatch/ADOT platform as `u1-backend-api`, scoped to this Unit's much smaller surface.

## Metrics & KPIs

| Metric | Source | Threshold | Why it matters |
|---|---|---|---|
| Request rate/error rate | ADOT → CloudWatch, per route | > 1% error rate | Backs the 95% SLO (`reliability-requirements.md` NFR2.2) |
| `InternalCallerModule` failure rate | ADOT → CloudWatch custom metric | Sustained failures | Signals `backend-api`'s internal API is unreachable |

## Alerts

| Alert | Condition | Severity | Routes to |
|---|---|---|---|
| Sustained `InternalCallerModule` failures | Repeated failures over 10 min | Ticket | Same incident-response process as `u1-backend-api` — no dedicated paging given the 95% SLO's ticket-level severity |

## SLIs / SLOs

| SLI | SLO target | Measurement window |
|---|---|---|
| Request success rate | 95% | 30-day rolling |

## Logs & Tracing

Same ECS Fargate log driver → CloudWatch Logs, and ADOT sidecar → X-Ray tracing, as `u1-backend-api` — every outbound `InternalCallerModule` call joins the same trace as the `backend-api` request it triggers, giving one end-to-end view of an ops action.

## Traceability

See `traceability.json`.
