# Deployment Execution — Deployment Log

Conversation language: English

Records the production deployment for `u1-backend-api` that reached
`CREATE_COMPLETE` this session (Q1: documented, not re-triggered), plus the
follow-up deployment that re-enabled RDS deletion protection.

## Deployment 1 — Initial production stand-up

| Field | Value |
|---|---|
| Stack | `GuestGuideIQ-BackendApi-production` |
| Trigger | Merge to `main` (GitHub Actions `deploy-production` job) |
| Deployment mechanism | `cdk deploy` with `--no-rollback --force` (see `guestguideiq-app` PR #11 for why `--force` was needed) |
| Migration | One-off ECS RunTask, `npx prisma migrate deploy`, invoked via `aws ecs run-task` after `cdk deploy` completed |
| Result | `CREATE_COMPLETE` |
| Duration | ~10-15 minutes (VPC/RDS/ECS/ALB/ACM full stand-up) |

This attempt followed several earlier failed attempts in this same session,
each with a real root cause found and fixed (not retried blindly) — see
`environment-provisioning/validation-report.md`'s "Real defects found and
fixed" section for the complete list (missing JWT secrets, wrong Docker
build target, wrong `dist/` path, missing Dockerfile COPY, missing IAM
permission for the migration task).

## Deployment 2 — RDS deletion protection re-enabled

| Field | Value |
|---|---|
| Trigger | Merge of `guestguideiq-app` PR #16 to `main` |
| Change | `deletionProtection: isProd` (was temporarily `false` during bring-up) |
| Deployment mechanism | Ordinary `cdk deploy` — an in-place property update on the existing RDS instance, not a replacement |
| Result | Success — verified `DeletionProtection: True` live via `aws rds describe-db-instances` after the deploy completed |
| Downtime | None — property-only update on a running database |

## Rollback validation (Q2)

No deliberate rollback drill was run against the current healthy version.
However, the ECS deployment circuit breaker's automatic rollback mechanism
was genuinely exercised multiple times during this session's earlier failed
attempts — each time a crash-looping container was correctly detected and
the deployment automatically rolled back without manual intervention. Per
Q2, this real trigger history is accepted as rollback validation rather than
requiring a separate synthetic drill.

## Deployment window (Q3)

No deployment window or freeze period is currently defined. Per Q3, this is
accepted as-is for now given the team's small size — revisit once the team
grows or deploy frequency increases.

## Scope (Q4)

This log covers `u1-backend-api` only. `u2-admin-api` has no live environment
(Environment Provisioning Q6) and so has no deployment to record here.

## Traceability

See `deployment-execution-questions.md` for the full Q&A record. Upstream:
`cd-config.md`, `deployment-strategy.md`, `environment-inventory.md`,
`build-and-test/test-results.md`.
