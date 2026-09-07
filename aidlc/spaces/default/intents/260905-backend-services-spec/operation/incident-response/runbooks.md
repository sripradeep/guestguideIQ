# Incident Response — Runbooks

Conversation language: English

Manual, human-executed procedures (Q3) — one per alarm in
`observability-setup/alarms.md`. No SSM Automation documents exist yet;
every command below is run directly via the AWS CLI (`--profile ggiq-admin`
or the appropriate profile).

## `EcsCpuHighAlarm` / `EcsMemoryHighAlarm` — ECS CPU or memory > 70%

1. Check current task count and utilization:
   ```bash
   aws ecs describe-services --cluster <cluster-arn> --services <service-arn> \
     --query "services[0].[runningCount,desiredCount]"
   ```
2. If sustained and traffic-driven (not a bug/leak), manually bump desired
   count as an immediate mitigation:
   ```bash
   aws ecs update-service --cluster <cluster-arn> --service <service-arn> --desired-count <N>
   ```
3. Auto-scaling (2→6 tasks on CPU>70%) should handle this automatically —
   if it's firing anyway, check whether the auto-scaling policy itself is
   healthy (`aws application-autoscaling describe-scaling-activities`)
4. If memory-driven and NOT traffic-correlated, suspect a memory leak —
   check recent deploys, consider a rolling restart:
   ```bash
   aws ecs update-service --cluster <cluster-arn> --service <service-arn> --force-new-deployment
   ```

## `RdsCpuHighAlarm` — RDS CPU > 80%

1. Check for a specific slow query via CloudWatch Performance Insights (if
   enabled) or `pg_stat_activity` directly against the database
2. If load-driven and sustained, this is a genuine scale-up signal
   (`db.t4g.medium` → next size) — a manual `cdk deploy` after editing
   `instanceType` in `backend-api-stack.ts`, not an emergency action
3. No automated remediation exists for this alarm (Q3)

## `RdsConnectionsHighAlarm` — RDS connections > 100

1. Check for a connection leak (a code path not releasing Prisma
   connections) via recent deploys/logs
2. As an immediate mitigation, a rolling ECS restart resets the
   application's connection pool:
   ```bash
   aws ecs update-service --cluster <cluster-arn> --service <service-arn> --force-new-deployment
   ```
3. If this recurs, investigate `DATABASE_URL`'s connection pool sizing in
   `docker-entrypoint.sh`/Prisma client configuration

## `AlbUnhealthyHostAlarm` — at least 1 unhealthy target

1. Check target health directly:
   ```bash
   aws elbv2 describe-target-health --target-group-arn <target-group-arn>
   ```
2. Check the failing task's logs in CloudWatch Logs
   (`GuestGuideIQ-BackendApi-production-BackendApiLogGroup...`) for the
   actual crash/health-check failure reason
3. ECS's own deployment circuit breaker (already live,
   `circuitBreaker: { rollback: true }`) should auto-rollback a
   crash-looping deploy — if this alarm fires outside a deploy window,
   investigate as a genuine runtime issue, not a deploy regression

## `Alb5xxHighAlarm` — > 10 5xx responses in 5 minutes

1. Check CloudWatch Logs for the specific error (filter `level = "error"`,
   per `observability-setup/log-queries.md`'s error-rate query)
2. Check `/health/ready` directly — if it's failing, the issue is
   database connectivity, not application logic:
   ```bash
   curl https://api.guestguideiq.com/health/ready
   ```
3. If a recent deploy correlates, the fastest mitigation is a manual
   rollback: redeploy the previous known-good commit via
   `cdk deploy` from that commit, or revert the merge and let CI redeploy

## Traceability

See `incident-response-questions.md` for the full Q&A record backing the
manual-only scope (Q3) and lightweight-tooling scope (Q4) of these
runbooks.
