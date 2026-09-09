# Observability Setup — Log Queries

Conversation language: English

`u1-backend-api` ships structured JSON logs via `pino` (per
`observability-design.md`) to CloudWatch Logs automatically through the ECS
Fargate log driver, into the log group created in `backend-api-stack.ts`
(`BackendApiLogGroup`, `RETAIN` removal policy in production per
Environment Provisioning's earlier fix). No CloudWatch Logs Insights saved
queries exist yet in the CDK stack (the AWS Console/CLI supports ad-hoc
queries against this log group today without any additional provisioning).

The following are the practical starting queries for this log group, ready
to run ad-hoc via the CloudWatch Logs Insights console or
`aws logs start-query`; none are yet saved as named queries or CDK
resources, since CDK has no first-class "saved query" construct that
composes cleanly with the rest of this stack.

## Error rate over time

```
filter level = "error"
| stats count() as errors by bin(5m)
```

## Slowest requests (if request duration is logged)

```
filter @message like /duration/
| sort @timestamp desc
| limit 50
```

## Requests by correlation ID (end-to-end trace for one request)

```
filter correlationId = "<paste correlation ID>"
| sort @timestamp asc
```

## Prisma/database errors

```
filter @message like /Prisma/ or @message like /database/
| filter level = "error"
| sort @timestamp desc
| limit 50
```

## Deferred (Q1)

Saving these as named CloudWatch Logs Insights queries (or a Logs Insights
dashboard) as an actual CDK-managed resource — low priority pre-launch with
near-zero real log volume to query against yet.
