# Infrastructure Design — Plan & Questions — u2-admin-api

Hosting platform, VPC, ECS cluster, and the `admin-api`↔`backend-api` internal-listener isolation mechanism are all already decided at `u1-backend-api/infrastructure-design` (shared platform-level decisions, per that Unit's Shared Infrastructure table). Two questions remain, specific to how `admin-api`'s own small, ops-only surface gets provisioned.

---

## Q1: Compute sizing for `admin-api`?

- A. A single ECS Fargate task (0.25 vCPU / 0.5GB), no auto-scaling — Recommended. `admin-api`'s own performance design (`nfr-design/performance-design.md`) targets a handful of concurrent ops-staff sessions; provisioning for horizontal scale-out here would be pure unused capacity. If ops headcount ever grows enough to matter, the same stateless design (`scalability-design.md` NFR5.2) means adding a second task later needs no redesign.
- B. Match `u1-backend-api`'s sizing (2+ tasks with auto-scaling) for consistency
- X. Other (please specify)

[Answer]: A. A single ECS Fargate task (0.25 vCPU / 0.5GB), no auto-scaling — Recommended. `admin-api`'s own performance design (`nfr-design/performance-design.md`) targets a handful of concurrent ops-staff sessions; provisioning for horizontal scale-out here would be pure unused capacity. If ops headcount ever grows enough to matter, the same stateless design (`scalability-design.md` NFR5.2) means adding a second task later needs no redesign.

---

## Q2: How do ops staff reach `admin-api`'s own public-facing routes?

- A. A public Application Load Balancer with AWS WAF IP-allowlist rules restricting access to the team's office/VPN-egress IP range(s) — Recommended. Reuses the WAF mechanism already chosen for `u1-backend-api` (`u1-backend-api/infrastructure-design`'s Q6) rather than introducing a second access technology; no VPN client software needed for ops staff, appropriate for a small team.
- B. AWS Client VPN required to reach a fully private (non-internet-facing) ALB — stronger isolation, more setup and per-user client configuration overhead.
- X. Other (please specify)

[Answer]: A. A public Application Load Balancer with AWS WAF IP-allowlist rules restricting access to the team's office/VPN-egress IP range(s) — Recommended. Reuses the WAF mechanism already chosen for `u1-backend-api` (`u1-backend-api/infrastructure-design`'s Q6) rather than introducing a second access technology; no VPN client software needed for ops staff, appropriate for a small team.

---

## Consolidated Summary Confirmation

- `admin-api` runs as a single, minimally-sized Fargate task with no auto-scaling (Q1) — its own ops-only load doesn't justify more.
- Ops staff reach `admin-api` through a public ALB restricted by WAF IP-allowlisting to trusted network ranges (Q2), reusing the same edge-security mechanism already chosen for `u1-backend-api`.
- Hosting platform, VPC, ECS cluster, and the internal-listener isolation are all inherited from `u1-backend-api/infrastructure-design` — this Unit's design layers on top of those shared decisions rather than re-deciding them.
- `infrastructure-specification.md`, `monitoring-design.md`, `cicd-pipeline.md`, and `traceability.json` will be generated reflecting all of the above.

- Looks correct
- Request changes

[Answer]: Looks correct
