# Environment Provisioning — Environment Inventory

Conversation language: English

AWS account `774888248078` (`ggiq-prod`), region `us-east-1`. Snapshot taken
after the stack reached `CREATE_COMPLETE` and the deployed application was
verified healthy end-to-end.

## Environments

| Environment | Status | Notes |
|---|---|---|
| **production** | Provisioned and verified live | `u1-backend-api` only — see Q1, Q6 |
| staging | Not provisioned | Deliberately deferred (Q1) — production-only was the explicit scope for this pass |
| dev | Not provisioned | Deliberately deferred (Q1) |

`u2-admin-api` has no live AWS environment in any tier — synthesized and
tested locally/in CI only (Q6).

## Production — `u1-backend-api`

| Resource | Identifier | Configuration |
|---|---|---|
| CloudFormation stack | `GuestGuideIQ-BackendApi-production` | Status `CREATE_COMPLETE` |
| VPC | `vpc-0e9df3523e6b8f29a` | 2 AZs, public + private subnets, `natGateways: 2` |
| ECS Cluster | `GuestGuideIQ-BackendApi-production-BackendApiClusterC9D8EA02-NuhaX6ZaRv34` | Container Insights enabled |
| ECS Service (`PublicService`) | ACTIVE, 2/2 tasks running | Fargate, 0.5 vCPU / 1GB per task, fixed `desiredCount: 2`, **no auto-scaling policy** (Q3 — deferred) |
| Application Load Balancer | `GuestG-Publi-ISscF9Ojkmca-1149450849.us-east-1.elb.amazonaws.com` | Public, HTTPS on 443 (HTTP→HTTPS redirect), **no WAF attached** (Q2 — deferred, in-app rate limiting only) |
| RDS PostgreSQL | `guestguideiq-backendapi-productio-databaseb269d8bb-ucqc7zy3h5my` | `db.t4g.medium`, PostgreSQL 16.13, single-AZ, storage-encrypted, not publicly accessible, `deletionProtection` re-enabling via PR #16 (Q7) |
| ACM Certificate | `arn:aws:acm:us-east-1:774888248078:certificate/aec965fd-fa13-41fd-ac61-63be32380f72` | `api.guestguideiq.com`, DNS-validated, requested manually (Q5 — accepted interim state), hardcoded in `infra/bin/backend-api.ts` |
| DNS | `api.guestguideiq.com` → ALB (CNAME) | Hosted by the domain's existing external DNS provider, not Route 53 (Q4 — accepted permanently) |
| Secrets Manager | `DbCredentials`, `JwtSecrets` (jwtSecret), `JwtRefreshSecret`, `InternalJwtSecret`, `StripeSecret` | 5 secrets, injected into the ECS task definition as `secrets`, never plain environment variables |
| Migration mechanism | One-off ECS RunTask, `MigrationTaskDefinitionArn` (current revision `:6`) | Runs `npx prisma migrate deploy` before the service serves traffic; invoked from CI via `aws ecs run-task` |
| CI/CD identity | IAM role `guestguideiq-github-actions-deploy` (GitHub OIDC, no long-lived keys) | Scoped to assume the CDK bootstrap roles + a narrow `ecs:RunTask`/`iam:PassRole` policy for the migration task |

## Verified health (live, this session)

| Check | Result |
|---|---|
| `https://api.guestguideiq.com/health` | `200 {"status":"ok"}` |
| `https://api.guestguideiq.com/health/ready` (DB connectivity) | `200 {"status":"ready"}` |
| `http://api.guestguideiq.com/health` | `301` → HTTPS |
| TLS certificate | Valid, `CN=api.guestguideiq.com`, expires 2027-03-23 |

## Account-level guardrails (added this session, apply account-wide, not `u1`-specific)

| Control | State |
|---|---|
| AWS Budget | $300/month, 85%/100%/forecasted-100% email alerts |
| Budget Action (spend circuit-breaker) | Trips at 100% of budget, denies new NAT gateways/EC2/RDS instances/ALBs/ECS services/CloudFormation stacks on the CDK execution role |
| Cost Anomaly Detection | Daily, confirmed email |
| CloudTrail | Multi-region trail, logging, log file validation enabled |
| GuardDuty | Enabled (Foundational protections only) |
| AWS Config | Recording all supported resource types |
| S3 account-level Public Access Block | All 4 settings blocked |
| IAM Access Analyzer | Active (account-scoped) |

## Traceability

Answers to Q1–Q7 in `environment-provisioning-questions.md` govern every
deviation and deferral recorded above. Upstream: `infrastructure-specification.md`
(both Units) and `cd-config.md`.
