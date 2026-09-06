# Rollback Runbook

Conversation language: English

Formalizes the 3-step rollback procedure both Units' `infrastructure-design/cicd-pipeline.md` already specified (identical for both), as an actionable runbook with explicit triggers, commands, and roles — not a restatement, an operationalization.

## When to roll back

| Trigger | Detection | Applies to |
|---|---|---|
| Deployment fails health checks during rollout | ECS deployment circuit breaker (automatic) | Both units |
| A smoke test fails immediately post-deploy | CI/CD pipeline's Smoke Test stage (not yet implemented — see `ci-config.md` Known gaps; this trigger activates once it is) | Both units |
| An alert fires shortly after a deploy completes | `monitoring-design.md`'s four symptom-based alerts (error-rate, SLO burn, chat failure rate, DB pool exhaustion) — Observability Setup (4.4) not yet run, so these alerts don't exist yet either | u1 primarily; u2 shares the incident-response process |
| A human notices a regression through normal use, outside automated detection | Manual report | Both units |

## Procedure

### 1. Automatic — during rollout (no human action needed)

ECS's native deployment circuit breaker detects failing health checks (`/health`, `/health/ready`) during the rolling update and automatically reverts to the previous task definition. This is already the default ECS behavior for both Units' services once deployed — no additional configuration beyond what `infrastructure-specification.md` already specifies (health-check-driven routing).

### 2. Manual — issue discovered after rollout completes

1. Identify the last known-good commit SHA (the previous production deploy's tag).
2. Confirm the corresponding ECR image tag exists (images are commit-SHA-tagged, per `cicd-pipeline.md` § Package — never overwritten, never `latest`).
3. Run `cdk deploy` against the production stack using that prior commit's already-built image tag — both the ECR image and the CDK stack definition are immutable and commit-addressed, so this redeploys a known-good, already-tested artifact rather than building anything new under incident pressure.
4. Verify the rollback via the same smoke checks used post-deploy (signup endpoint reachable for u1, an ops-facing health check for u2).
5. If AppConfig feature flags are involved (once adopted — see `deployment-strategy.md`) and the regression is flag-gated rather than a full code rollback, prefer disabling the flag over a full redeploy — faster, and AppConfig's own deployment strategy provides its own rollback for a bad config push.

### 3. Database considerations (u1-backend-api only)

- Prisma migrations are written backward-compatible by convention (additive-first, per `deployment-strategies.md`'s expand-contract pattern) — an application rollback should never require a corresponding schema rollback.
- If a migration itself is the problem: do NOT run a destructive down-migration under incident pressure. Roll back the application code first (step 2); a broken migration that has already run against production data needs deliberate, reviewed remediation, not an automated reverse migration.
- `u2-admin-api` holds no database of its own (ADR-004) — its rollback story is strictly the application-code redeploy in step 2, nothing else.

## Roles

| Role | Responsibility |
|---|---|
| On-call engineer | Executes steps 2-4; decides whether a flag-disable (step 2.5) is sufficient or a full rollback is needed |
| Tech lead / product owner | Approves the original production deploy (per the Mandated manual-approval gate) — the same approver is the natural point of contact if a rollback decision needs a second opinion |

## Post-rollback

Conduct a brief post-incident review per `deployment-strategies.md`'s guidance: what triggered it, why the circuit breaker or smoke test didn't catch it earlier if it should have, and whether the CI pipeline's own gates (`quality-gates.md`) need a new check to catch this class of regression before merge next time. This feeds `incident-response` (Operation phase) once that stage runs, rather than being a one-off, undocumented fix.

## Traceability

Implements the Rollback Procedure section of both Units' `infrastructure-design/cicd-pipeline.md` (READY-reviewed) as an actionable runbook.
