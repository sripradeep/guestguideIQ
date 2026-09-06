# CI/CD Pipeline — u2-admin-api

Same pipeline shape, gates, and Mandated-rule coverage as `u1-backend-api/infrastructure-design/cicd-pipeline.md` — both Units live in the same `guestguideiq-app` repository (per `project.md`'s DECIDED entry) and share one CI/CD pipeline definition, differentiated only by which Stack/Service each build deploys.

## Pipeline Stages

Identical stage list to `u1-backend-api`'s pipeline (Source → Lint → Build → Unit Test → SAST → Dependency Scan → Secret Scan → Coverage Gate → IaC Scan → Package → Deploy to Staging → Integration Test → Approval Gate → Deploy to Production → Smoke Test → Monitor) — a monorepo-style pipeline where a change touching `admin-api`'s code path builds and deploys `admin-api`'s image/task definition, while a change touching `backend-api`'s path does the same for that service; both can be affected by the same PR if a change spans the internal API contract.

## Stage → Gate Mapping

Same mapping as `u1-backend-api`'s — one shared blocking-gate policy for both services, since they're Mandated the same way (`project.md`) regardless of which service a given change touches.

## Deployment Strategy

Rolling deployment, same as `u1-backend-api` — with the single-task sizing (Q1), a "rolling" deploy for `admin-api` is effectively replace-one-task, briefly relying on ECS's deployment circuit breaker rather than a load-balanced rolling window across multiple tasks.

## Rollback Procedure

Same commit-addressed image + CDK stack redeploy pattern as `u1-backend-api` — `admin-api` has no database migrations to reason about (it owns no data), so its rollback story is strictly simpler.

## Environment Promotion

Same dev → staging → production topology, sharing the same approval gate as `u1-backend-api` — a single production approval covers both services' changes when they ship together.

## Secrets Management in CI/CD

Same pattern as `u1-backend-api`: the CI/CD runner's IAM role is scoped to `cdk deploy` only; `admin-api`'s own secrets (the internal-scoped service JWT signing material, the ops-role JWT verification key) live in AWS Secrets Manager, provisioned out-of-band, never passed through the pipeline as values.

## Traceability

See `traceability.json`.

## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-09-06T07:16:15Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | cicd-pipeline.md vs. u1-backend-api's cicd-pipeline.md | Verified the shared-pipeline design is consistent in both directions — this document correctly states both Units share one pipeline definition in the same repository, rather than each Unit's document silently assuming a different pipeline exists. | None. | Resolved |
| R-02 | Major | infrastructure-specification.md > Shared Infrastructure vs. u1-backend-api's own Shared Infrastructure table | Cross-checked: `u2-admin-api` is correctly named as the consumer of `u1-backend-api`'s VPC, ECS Cluster, and internal-listener security-group rule — no duplicate or conflicting definition of the same shared resource across the two Units' documents. | None. | Resolved |
| R-03 | Minor | traceability.json > NFR3.7 coverage | The WAF IP-allowlist decision (Q2) is folded into NFR3.7's coverage as a network-layer complement rather than left untracked or forced into an unrelated id — a defensible traceability choice for a decision with no clean 1:1 upstream NFR match. | None. | Resolved |
| R-04 | Minor | infrastructure-specification.md > Deployment | The single-task, no-auto-scaling sizing (Q1) is consistently reflected across `infrastructure-specification.md`, `cicd-pipeline.md`'s deployment-strategy note, and `traceability.json` — no contradictory sizing statement across the three documents. | None. | Resolved |

### Summary

This design correctly treats `admin-api`'s infrastructure as an addition to, not a duplicate of, `u1-backend-api`'s shared platform-level decisions — the two Units' Shared Infrastructure tables agree with each other (R-01, R-02), and the one genuinely Unit-specific access decision (WAF IP-allowlist) is traced sensibly despite not having a clean upstream NFR match (R-03). The minimal single-task sizing is stated consistently everywhere it appears (R-04). No blocking issues found; ready for Code Generation.
