# Infrastructure Specification — u2-admin-api

Platform, VPC, ECS cluster, and the internal-listener isolation mechanism are all decided at `u1-backend-api/infrastructure-design` and apply here unchanged (see that Unit's Shared Infrastructure table). This document covers only what's specific to `admin-api`'s own deployment.

## Deployment

| Facet | Choice | Rationale |
|---|---|---|
| Compute model | Amazon ECS on Fargate, single task, no auto-scaling (Q1) | `admin-api`'s ops-only load doesn't justify horizontal scale-out capacity |
| Networking topology | Same VPC as `u1-backend-api`; `admin-api`'s ECS task in a private subnet, reachable via its own public ALB (Q2) | Consistent with the shared-VPC platform decision; only the ALB is public, the task itself is not directly internet-reachable |
| Storage strategy | None — `admin-api` owns no database (ADR-004, `tech-stack-decisions.md`) | N/A |
| Environments | Same dev/staging/production topology as `u1-backend-api`, deployed via the same parameterized CDK app | Environment parity across both Units |
| IaC approach | AWS CDK v2, TypeScript — a second Stack within the same CDK App as `u1-backend-api`, or a separate App sharing VPC/cluster via cross-stack references | Keeps both Units' infrastructure defined consistently, per `cdk-best-practices.md`'s stack-organization guidance |
| Resource sizing | 1 Fargate task, 0.25 vCPU / 0.5GB (Q1) | Sized to the negligible ops-staff concurrency this Unit expects |

## Infrastructure Services

| Service | Role | Configuration | Notes |
|---|---|---|---|
| Amazon ECS (Fargate) | Compute | 1 task, no auto-scaling | Shares the ECS cluster provisioned for `u1-backend-api` |
| Application Load Balancer | Load balancer / ingress | Public listener, WAF-attached (Q2) | A separate ALB from `u1-backend-api`'s — different WAF rules (IP-allowlist here vs. rate-based there) |
| AWS WAF | Access control | IP-allowlist rules restricting this ALB to office/VPN-egress ranges (Q2) | A different rule set than `u1-backend-api`'s rate-based rules — this is an allowlist, not a rate limiter, since the concern here is "who," not "how many" |
| AWS Secrets Manager | Secrets | Internal-scoped service JWT signing material, ops-role JWT verification key | Same Secrets Manager instance as `u1-backend-api`; separate secret entries |

## Shared Infrastructure

See `u1-backend-api/infrastructure-design/infrastructure-specification.md`'s Shared Infrastructure table — the VPC, ECS Cluster, and the `admin-api`→`backend-api` security-group rule are all defined there, with `u2-admin-api` as the named consumer/caller.

## Traceability

See `traceability.json`.
