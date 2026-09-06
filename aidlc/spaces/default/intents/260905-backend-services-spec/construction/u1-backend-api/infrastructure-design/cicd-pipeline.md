# CI/CD Pipeline — u1-backend-api

Implements every CI/CD-related Mandated rule from `project.md` (short-lived feature branches + PR review, blocking build/lint/test/coverage, staging + manual-approval production, day-one dependency + secret scanning, blocking linter/formatter) in the separate `guestguideiq-app` repository (per `project.md`'s DECIDED entry).

## Pipeline Stages

1. **Source** — feature branch pushed, PR opened against `main` (Mandated: short-lived feature branches + PR review, Q1).
2. **Lint** — ESLint + Prettier check (Mandated: blocking, Q8). Fails the PR on any violation; under 30s.
3. **Build** — `tsc` compile (the distinct type-check step `team.md` specifically calls out to avoid the marketing site's `astro build`-vs-`astro check` gap) + bundle. Under 2 minutes.
4. **Unit Test** — Vitest suite (`tech-stack-decisions.md`), following the team's BDD-then-unit-tests ordering (`team.md` Testing Posture). Fails the PR on any failure.
5. **SAST** — static analysis (Semgrep or equivalent, per `devsecops-pipeline-patterns.md`). Blocks on Critical/High findings.
6. **Dependency Scan** — `npm audit`/Dependabot (Mandated, day-one, Q7). Fails the build on Critical CVEs with known exploits.
7. **Secret Scan** — Gitleaks or GitHub native secret scanning (Mandated, day-one, Q7). Blocks the PR on any detected secret.
8. **Coverage Gate** — 80% line-coverage floor (`team.md` Testing Posture, `classic` scope). Fails the PR if coverage drops below the floor.
9. **IaC Scan** — `cdk-nag`/Checkov against the CDK stacks (`cdk-best-practices.md`'s CDK Aspects pattern) as a synthesis-time check, catching an unencrypted resource or an overly-permissive IAM policy before it's ever deployed.
10. **Package** — Docker image build (Fargate task image), tagged with the commit SHA, pushed to ECR; ECR's own image scanning runs on push.
11. **Deploy to Staging** — automated on merge to `main` (org.md: "deploy on merge to staging"), via `cdk deploy` against the staging environment stack.
12. **Integration Test** — Supertest suite against the deployed staging environment, exercising the real OpenAPI contracts (`contract-summary.md`).
13. **Approval Gate** — manual approval required before production (Mandated, Q6) — a human (tech lead/product owner per `org.md`'s default) approves in the CD pipeline's environment-protection rule.
14. **Deploy to Production** — `cdk deploy` against the production stack, using the same CDK app/templates as staging (parity rule, `infrastructure-guide.md`), parameterized only by scale (2 Fargate tasks / `db.t4g.medium` vs. staging's smaller sizing).
15. **Smoke Test** — a handful of critical-path health checks (signup endpoint reachable, guest-link resolution reachable) run immediately post-deploy.
16. **Monitor** — CloudWatch dashboards and alerts (`monitoring-design.md`) are live from first deploy; a failed smoke test or an immediate post-deploy alert triggers the rollback procedure below.

## Stage → Gate Mapping

| Stage | Gate | Failure Action |
|---|---|---|
| Lint, Build, Unit Test, SAST, Dependency Scan, Secret Scan, Coverage, IaC Scan | Blocking, on every PR | PR cannot merge until green (Mandated) |
| Integration Test (staging) | Blocking, before production approval | Approval gate does not open until this passes |
| Approval Gate | Manual, human-required | Production deploy does not proceed without explicit approval (Mandated) |
| Smoke Test (production) | Blocking, post-deploy | Triggers automatic rollback on failure |

## Deployment Strategy

Rolling deployment (per `infrastructure-guide.md`'s deployment-strategy guide) — ECS's native rolling-update capability replaces tasks incrementally, appropriate for this stateless, backward-compatible-by-convention service; blue-green is a candidate upgrade once traffic volume justifies its double-infrastructure cost, not needed at the year-one scale (`scalability-requirements.md` NFR5.2).

## Rollback Procedure

1. ECS deployment circuit breaker (native Fargate feature) automatically rolls back to the previous task definition if the new deployment's health checks fail during rollout — no manual step needed for a failure caught during rollout itself.
2. For an issue discovered post-rollout (smoke test or an immediate alert): `cdk deploy` the previous commit's already-built image tag — the ECR image and its CDK stack definition are both immutable and commit-addressed, so a rollback is a redeploy of a known-good, already-tested artifact, never a new build under pressure.
3. Database migrations (Prisma, `tech-stack-decisions.md`) are written backward-compatible by convention (additive-first) specifically so an application rollback never requires a corresponding schema rollback.

## Environment Promotion

`dev` (developer-triggered, ephemeral) → `staging` (automated on merge to `main`) → `production` (manual approval gate) — three environments from one parameterized CDK app, per `cdk-best-practices.md`'s environment-aware-stack pattern, satisfying the parity rule that staging and production differ only in scale.

## Secrets Management in CI/CD

- Build-time: no secrets are needed to lint/build/test (all secrets used are runtime-only).
- Deploy-time: the CI/CD runner's own IAM role (least-privilege, scoped to `cdk deploy` permissions only) is the only credential CI itself holds — it has no direct access to application secrets (DB credentials, JWT signing key, Stripe key), which are provisioned into AWS Secrets Manager out-of-band and referenced by ARN in the CDK stack, never passed through the pipeline as values.

## Traceability

See `traceability.json`.

## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-09-06T07:35:00Z
**Iteration:** 1
**Request Challenge:** review:583ce467d44ae41f7715e157634f659f

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | cicd-pipeline.md > Pipeline Stages vs. project.md Mandated rules | Verified every Mandated CI/CD rule (short-lived branches+PR, blocking build/lint/test/coverage, staging+manual-approval production, day-one dependency+secret scanning, blocking linter/formatter) has a corresponding, correctly-sequenced pipeline stage — no Mandated rule is left unimplemented or merely advisory. | None. | Resolved |
| R-02 | Major | cicd-pipeline.md > Rollback Procedure vs. infrastructure-specification.md | Cross-checked the rollback design against the actual deployed artifacts (ECR image + CDK stack, both commit-addressed) — the rollback procedure references real, already-designed infrastructure rather than an unimplemented mechanism. | None. | Resolved |
| R-03 | Minor | cicd-pipeline.md > Deployment Strategy vs. scalability-design.md | The rolling-deployment choice is correctly justified against the year-one traffic scale rather than defaulting to blue-green without cost justification — consistent with `cost-optimization-patterns.md`'s guidance against premature infrastructure spend. | None. | Resolved |
| R-04 | Minor | cicd-pipeline.md > Secrets Management in CI/CD | Correctly distinguishes CI's own deploy-time IAM credential (least-privilege, `cdk deploy` only) from application runtime secrets (never passed through the pipeline as values) — avoids the common anti-pattern of a CI/CD system holding broader credentials than it needs. | None. | Resolved |

### Summary

This pipeline design faithfully implements every Mandated CI/CD rule with a correctly sequenced, blocking-vs-advisory-correct stage list (R-01), and its rollback procedure is grounded in the actual infrastructure this stage designed rather than an abstract mechanism (R-02). The deployment-strategy and secrets-handling choices are both justified against real constraints (cost, least-privilege) rather than defaulted (R-03, R-04). No blocking issues found; ready for Code Generation.
