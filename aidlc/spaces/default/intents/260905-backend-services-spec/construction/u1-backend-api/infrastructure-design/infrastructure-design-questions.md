# Infrastructure Design — Plan & Questions — u1-backend-api

`requirements.md` C3 deliberately left hosting open ("not committed to AWS despite the original site spec naming it"). This stage has to resolve that and everything downstream of it — compute model, database hosting, the internal-API network isolation mechanism carried forward unresolved since `contract-design`, TLS for locality custom domains, the rate-limiting mechanism, and the observability platform.

---

## Q1: Hosting platform?

- A. AWS — Recommended. This workspace is already tooled for it (the AWS Platform Agent persona, CDK best-practices/Well-Architected knowledge base, and AWS pricing/IaC MCP tooling are all provisioned), the team's `org.md` Security guardrails already name AWS Secrets Manager/SSM as the secrets-manager example, and nothing in `requirements.md` rules AWS out — C3 only said it isn't a foregone conclusion, not that another cloud was preferred.
- B. Another cloud provider (name it in your answer)
- X. Other (please specify)

[Answer]: A. AWS — Recommended. This workspace is already tooled for it (the AWS Platform Agent persona, CDK best-practices/Well-Architected knowledge base, and AWS pricing/IaC MCP tooling are all provisioned), the team's `org.md` Security guardrails already name AWS Secrets Manager/SSM as the secrets-manager example, and nothing in `requirements.md` rules AWS out — C3 only said it isn't a foregone conclusion, not that another cloud was preferred.

---

## Q2: Compute model?

- A. Amazon ECS on Fargate — Recommended. `u1-backend-api` is a stateless, long-running Fastify service (`scalability-requirements.md` NFR5.3) serving steady, not bursty, traffic — Fargate avoids Lambda's cold-start risk against the NFR1.2 p95<500ms budget and avoids EC2's own patching/AMI-management overhead, while still scaling horizontally behind a load balancer exactly as `scalability-design.md` already assumes.
- B. AWS Lambda (serverless) — viable for the mostly-CRUD workload, but cold starts risk the p95 latency budget on the general API path, and the itinerary chat's already-generous 3s budget (NFR1.3) makes this less of a differentiator there than it would be elsewhere.
- C. EC2 with an Auto Scaling Group
- X. Other (please specify)

[Answer]: A. Amazon ECS on Fargate — Recommended. `u1-backend-api` is a stateless, long-running Fastify service (`scalability-requirements.md` NFR5.3) serving steady, not bursty, traffic — Fargate avoids Lambda's cold-start risk against the NFR1.2 p95<500ms budget and avoids EC2's own patching/AMI-management overhead, while still scaling horizontally behind a load balancer exactly as `scalability-design.md` already assumes.

---

## Q3: Database hosting and availability tier?

- A. Amazon RDS for PostgreSQL, single-AZ with automated daily backups and point-in-time recovery — Recommended. Matches the 99% availability SLO (`reliability-requirements.md` NFR2.2) and RTO≤4h/RPO≤1h targets (NFR2.3) without paying for Multi-AZ's ~2x cost before the SLO actually demands it; revisit to Multi-AZ if the SLO tightens post-launch.
- B. Amazon RDS for PostgreSQL, Multi-AZ from day one — stronger availability guarantee, at roughly double the database cost, ahead of the current 99% SLO actually requiring it.
- X. Other (please specify)

[Answer]: A. Amazon RDS for PostgreSQL, single-AZ with automated daily backups and point-in-time recovery — Recommended. Matches the 99% availability SLO (`reliability-requirements.md` NFR2.2) and RTO≤4h/RPO≤1h targets (NFR2.3) without paying for Multi-AZ's ~2x cost before the SLO actually demands it; revisit to Multi-AZ if the SLO tightens post-launch.

---

## Q4: Network isolation mechanism for the `admin-api` ↔ `backend-api` internal API?

Carried forward unresolved since `contract-design` and reaffirmed at `nfr-requirements`/`nfr-design` (NFR3.11) — this stage has to actually decide it.

- A. Both services in the same VPC, `backend-api`'s internal listener in a private subnet with a security group that allows inbound only from `admin-api`'s own security group — Recommended. The standard AWS pattern for exactly this shape (two internal services, one boundary), needs no additional service (VPN, API Gateway) to operate or pay for, and composes cleanly with the internal-scoped service JWT (`nfr-design`'s `security-design.md`) as a second, independent layer of defense rather than the only one.
- B. A site-to-site VPN or AWS PrivateLink between separately-networked services
- X. Other (please specify)

[Answer]: A. Both services in the same VPC, `backend-api`'s internal listener in a private subnet with a security group that allows inbound only from `admin-api`'s own security group — Recommended. The standard AWS pattern for exactly this shape (two internal services, one boundary), needs no additional service (VPN, API Gateway) to operate or pay for, and composes cleanly with the internal-scoped service JWT (`nfr-design`'s `security-design.md`) as a second, independent layer of defense rather than the only one.

---

## Q5: TLS/certificate provisioning for locality custom domains (NFR6.2)?

- A. AWS Certificate Manager (ACM) with DNS validation, requested and attached automatically as part of the `admin-api` locality-brand/domain-creation workflow (W4/Contract 1) — Recommended. Matches FR9.5's requirement that domain registration/configuration is centrally managed by GuestGuideIQ (never delegated to Property Owners), and ACM's free, auto-renewing certificates avoid a manual certificate-lifecycle burden as the locality count grows.
- B. Manually provisioned/uploaded certificates per domain
- X. Other (please specify)

[Answer]: A. AWS Certificate Manager (ACM) with DNS validation, requested and attached automatically as part of the `admin-api` locality-brand/domain-creation workflow (W4/Contract 1) — Recommended. Matches FR9.5's requirement that domain registration/configuration is centrally managed by GuestGuideIQ (never delegated to Property Owners), and ACM's free, auto-renewing certificates avoid a manual certificate-lifecycle burden as the locality count grows.

---

## Q6: Rate-limiting mechanism (NFR3.10's deferred mechanism choice)?

- A. AWS WAF rate-based rules at the load balancer/CloudFront edge for broad per-IP limiting (signup, password-reset, guest-link resolution, lead-form submission), combined with the already-designed app-level token-bucket middleware for the finer-grained per-account/per-stay limiting (chat) — Recommended. Defense-in-depth: the edge layer blocks obvious abuse before it reaches the application at all, while the app-level adapter (`nfr-design`) still exists for the cases WAF's IP-based model can't express (per-stay-token limiting).
- B. Application-level middleware only, no edge-layer component
- X. Other (please specify)

[Answer]: A. AWS WAF rate-based rules at the load balancer/CloudFront edge for broad per-IP limiting (signup, password-reset, guest-link resolution, lead-form submission), combined with the already-designed app-level token-bucket middleware for the finer-grained per-account/per-stay limiting (chat) — Recommended. Defense-in-depth: the edge layer blocks obvious abuse before it reaches the application at all, while the app-level adapter (`nfr-design`) still exists for the cases WAF's IP-based model can't express (per-stay-token limiting).

---

## Q7: Observability platform (deferred from `nfr-requirements` Q9)?

- A. Amazon CloudWatch, fed via the AWS Distro for OpenTelemetry (ADOT) collector — Recommended. Keeps the OTel-based instrumentation already designed (`nfr-design`'s `observability-design.md`) completely intact, integrates natively with ECS/RDS metrics with no extra platform to provision or pay for, and is the cost-conscious choice for a pre-launch product (per `cost-optimization-patterns.md`'s guidance against premature spend).
- B. A third-party platform (Datadog, etc.) — stronger dashboards/UX out of the box, at real additional monthly cost this pre-launch phase may not yet justify.
- X. Other (please specify)

[Answer]: A. Amazon CloudWatch, fed via the AWS Distro for OpenTelemetry (ADOT) collector — Recommended. Keeps the OTel-based instrumentation already designed (`nfr-design`'s `observability-design.md`) completely intact, integrates natively with ECS/RDS metrics with no extra platform to provision or pay for, and is the cost-conscious choice for a pre-launch product (per `cost-optimization-patterns.md`'s guidance against premature spend).

---

## Consolidated Summary Confirmation

- Hosting: AWS (Q1), compute: ECS Fargate (Q2), database: RDS PostgreSQL single-AZ (Q3).
- The `admin-api`/`backend-api` internal-API isolation is a same-VPC, private-subnet, security-group-restricted boundary (Q4) — resolving the open item carried since `contract-design`.
- TLS for locality custom domains is automated via ACM as part of the domain-creation workflow (Q5).
- Rate limiting combines an edge-layer (AWS WAF) with the already-designed app-level token-bucket adapter (Q6).
- Observability lands on CloudWatch via an OTel/ADOT collector, preserving the vendor-neutral instrumentation already designed (Q7).
- `infrastructure-specification.md`, `monitoring-design.md`, `cicd-pipeline.md`, and `traceability.json` will be generated reflecting all of the above.

- Looks correct
- Request changes

[Answer]: Looks correct
