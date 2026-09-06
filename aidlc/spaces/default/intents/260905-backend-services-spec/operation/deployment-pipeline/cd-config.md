# CD Configuration

Conversation language: English

## What was written

Extended `guestguideiq-app/.github/workflows/ci.yml` (the same file `ci-pipeline` created) with the remaining stages from both Units' READY-reviewed `infrastructure-design/cicd-pipeline.md`, each staged as a pipeline-shape-complete placeholder matching `deploy-staging`'s own pattern from that stage:

| Job | Depends on | Trigger | What it will do once live |
|---|---|---|---|
| `deploy-staging` (already existed) | `backend-api`, `admin-api` (both PR-gate jobs) | push to `main` | `cdk deploy` against the staging stack for both units |
| `integration-test-staging` | `deploy-staging` | push to `main` | Re-run `tests/integration/contract{1,2,3}.test.ts` against the live staging ALB URL instead of the in-process app |
| `deploy-production` | `integration-test-staging` | push to `main`, gated by the `production` GitHub Environment's required-reviewer protection rule | `cdk deploy` against the production stack |
| `smoke-test-production` | `deploy-production` | push to `main` | Critical-path health checks (signup, guest-link resolution for u1; an ops health check for u2) |

Every job is currently an echo-only placeholder naming exactly what it's blocked on — none silently pretend to deploy. This is a deliberate extension of `ci-pipeline`'s own `deploy-staging` pattern to the full remaining pipeline, so "turning it on" later is uniformly a matter of removing placeholder steps and setting secrets/environment-protection rules, not redesigning pipeline shape stage by stage as each dependency gets resolved.

## What "turning it on" requires (all Environment Provisioning deliverables, not this stage's)

1. **`AWS_DEPLOY_ROLE_ARN`** — an AWS OIDC deploy role, scoped to `cdk deploy` permissions only (least-privilege, per `cicd-pipeline.md`'s Secrets Management section), configured as a GitHub Actions secret.
2. **u1's CDK stack publishing the SSM parameters u2's stack already reads** — `/guestguideiq/{env}/vpc-id`, `/guestguideiq/{env}/ecs-cluster-name`, `/guestguideiq/{env}/ecs-cluster-security-group-id`, and the subnet ids (see `u2-admin-api/code-generation/code-summary.md` Deviation #2 and `admin-api/infra/lib/admin-api-stack.ts`'s own top-of-file note for the exact list).
3. **A hardcoded `availabilityZones` placeholder in u2's stack** (`u2-admin-api/code-generation/code-summary.md` Deviation #3) — parameterizing this per target region is bundled with (2) as the same follow-up.
4. **GitHub Environment protection rules** — a `staging` Environment (already referenced by `deploy-staging`) and a `production` Environment with at least one required reviewer configured in the repository's Settings, which is where the Mandated manual-approval gate (`project.md`, Q6) actually becomes enforced rather than merely documented.

None of these four are artifacts this stage (`deployment-pipeline`) produces — (1) and (4) are account/repository configuration, (2) and (3) are `infrastructure-design`/`code-generation` amendments. This stage's job was the deployment *process* design, which is now complete and correctly sequenced.

## Environment promotion matrix

| Environment | Trigger | Approval | Scale (u1) | Scale (u2) |
|---|---|---|---|---|
| dev | Developer-triggered, ephemeral | None | Minimal (single task) | Single task |
| staging | Automated on merge to `main` | None (integration test must pass before production) | Smaller than production | Single task |
| production | After staging integration test passes | Manual (GitHub Environment required reviewer) | 2 Fargate tasks, `db.t4g.medium` RDS | Single task |

## Traceability

Implements the full 16-stage pipeline `u1-backend-api/infrastructure-design/cicd-pipeline.md` and `u2-admin-api/infrastructure-design/cicd-pipeline.md` specify (both READY-reviewed), completing the portion `ci-pipeline` (3.7) left as a single placeholder.
