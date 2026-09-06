# Infrastructure Specification — u1-backend-api

Concrete AWS resources implementing every pattern designed at `nfr-design`, resolving `requirements.md` C3's open hosting decision (Q1-Q3, Q4-Q6).

## Deployment

| Facet | Choice | Rationale |
|---|---|---|
| Compute model | Amazon ECS on Fargate, one service per environment | Stateless, long-running Fastify service under steady traffic (Q2) — avoids Lambda cold-start risk against NFR1.2's p95<500ms budget |
| Networking topology | One VPC, public + private subnets across 2 AZs; ALB in public subnets, ECS tasks + RDS in private subnets | Public-facing traffic terminates at the ALB; the application tier and database are never directly internet-reachable |
| Internal API isolation | `admin-api`'s internal listener reachable only from `backend-api`'s security group, within the same private subnets (Q4) | Resolves the network-isolation open item carried since `contract-design` — no VPN/PrivateLink overhead for a same-team, same-VPC boundary |
| Storage strategy | RDS-managed EBS storage (gp3), auto-scaling storage enabled | No custom storage management needed at this data volume (`scalability-requirements.md` NFR5.2) |
| Environments | dev, staging, production — three environment-parameterized stacks from the same CDK app (per `cdk-best-practices.md`'s environment-aware-stack pattern) | Matches the team's Mandated staging + manual-approval-gated production deployment |
| IaC approach | AWS CDK v2, TypeScript | Same language as the application itself (`tech-stack-decisions.md`); L2 constructs preferred, L1 only where a specific property demands it |
| Resource sizing (initial) | 2 Fargate tasks (0.5 vCPU / 1GB each) behind the ALB, `db.t4g.medium` RDS instance | Sized to the year-one capacity target (`scalability-requirements.md` NFR5.2: ~25-50 localities, low-hundreds concurrent guests); Graviton (`t4g`) for better price-performance per `cost-optimization-patterns.md` |

## Infrastructure Services

| Service | Role | Configuration | Notes |
|---|---|---|---|
| Amazon ECS (Fargate) | Compute | 2 tasks minimum, auto-scaling up to 6 on CPU>70% or request-count-per-target, per `scalability-design.md`'s stateless horizontal-scaling design | Health check via `/health`/`/health/ready` (`reliability-design.md`) |
| Application Load Balancer | Load balancer / ingress | Public listener on 443 (ACM cert), routes to ECS target group | Terminates TLS for the public API surface |
| Amazon RDS for PostgreSQL | Database | `db.t4g.medium`, single-AZ (Q3), automated daily backups, point-in-time recovery, storage auto-scaling | Multi-AZ is the named future upgrade path if the SLO tightens (`reliability-requirements.md` NFR2.2) |
| ElastiCache | Cache | **Not provisioned** — the domain-resolution cache (`performance-design.md`) is in-process (Q1 at `nfr-design`), requiring no infrastructure of its own | N/A |
| AWS WAF | Rate limiting / edge security | Rate-based rules attached to the ALB (Q6): per-IP thresholds on `/accounts` (signup), `/auth/reset` (password-reset request), `/stays/*` (guest-link resolution), `/leads/*` (lead-form) | The finer-grained per-account/per-stay limiting (chat) remains the app-level token-bucket adapter designed at `nfr-design` |
| AWS Certificate Manager | TLS/certificates | One certificate per locality custom domain, DNS-validated, requested programmatically when `admin-api`'s locality-brand/domain-creation workflow (W4) completes (Q5) | Auto-renewing; no manual certificate lifecycle |
| AWS Secrets Manager | Secrets | Database credentials, JWT signing keys, Stripe API key — injected into ECS task definitions as secrets, never as plain environment variables | Satisfies the org-level "never hardcode credentials" guardrail and the team's Mandated secrets-manager rule |
| Amazon Route 53 | DNS | Hosts the shared GuestGuideIQ domain's subdomains; per-locality custom domains are delegated via the domain owner's own DNS pointing at this service, validated through ACM's DNS-validation records | Matches FR9.4's "custom domain or subdomain" requirement |

## Shared Infrastructure

| Shared Resource | Owner Unit | Consumer Units | Access Boundary |
|---|---|---|---|
| VPC (public + private subnets, 2 AZs) | Platform-level (not owned by either Unit) | `u1-backend-api`, `u2-admin-api` | Both Units' ECS services and `u1-backend-api`'s RDS instance live in this one VPC; `u2-admin-api` has no database of its own to place here |
| ECS Cluster | Platform-level | `u1-backend-api`, `u2-admin-api` | One cluster hosts both services' tasks, each in its own ECS Service with its own security group |
| Security group: `admin-api` → `backend-api`-internal | `u1-backend-api` (the internal listener's owner) | `u2-admin-api` (the sole permitted caller) | Inbound rule restricted to `u2-admin-api`'s ECS task security group only (Q4) |

## Traceability

See `traceability.json`.
