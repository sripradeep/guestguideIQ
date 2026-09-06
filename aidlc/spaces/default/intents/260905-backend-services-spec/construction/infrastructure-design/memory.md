<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->


- 2026-09-06T07:40:00Z — `requirements.md` C3's open hosting decision (not committed to AWS) resolved to AWS at this stage, on the strength of the workspace's own already-provisioned AWS-native tooling (AWS Platform Agent, CDK knowledge, AWS MCP servers) rather than the marketing site's original spec — a genuinely independent decision, not a foregone one.
<!-- aidlc-wave-memory:u1-backend-api:98199024fe184d57dbf76cf916070de167260174f792ee0329b5175c1fff784b -->

- 2026-09-06T07:50:00Z — The WAF IP-allowlist decision (Q2) doesn't map cleanly onto any single NFRx.y id from this Unit's own nfr-design traceability — folded it into NFR3.7's coverage as a network-layer complement to the ops-role JWT check, rather than inventing an unanchored id, since it's genuinely in service of the same "only authenticated ops staff" requirement.
<!-- aidlc-wave-memory:u2-admin-api:bee9cb31af5cbdca10c72c37e66d275af2726b1f80048664bff5e622453db099 -->
## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->


- 2026-09-06T07:40:00Z — No ElastiCache/Redis was provisioned despite it appearing as an option throughout `nfr-design`'s discussion — correctly not built, since the domain-resolution cache is in-process and no other caching tier was designed at NFR Design (Q1 there).
<!-- aidlc-wave-memory:u1-backend-api:512c9b49beaaf20c690f01f83030227c7b27961f728d121dadb8be0b8a189d26 -->

- 2026-09-06T07:50:00Z — No independent VPC/ECS cluster/hosting-platform decision was made for this Unit — correctly inherited from `u1-backend-api/infrastructure-design` rather than re-litigated, since both Units share one platform-level footprint.
<!-- aidlc-wave-memory:u2-admin-api:1ddb982d4026b57f3907568d1fcfbaab6b9419e3e995677a5c0a01cac106d305 -->
## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->


- 2026-09-06T07:40:00Z — Chose RDS single-AZ over Multi-AZ (Q3) — roughly half the database cost, at the accepted risk of a longer outage during an AZ failure than Multi-AZ would provide; explicitly tied to the 99% SLO actually in force, with Multi-AZ named as the upgrade path if that SLO tightens.
<!-- aidlc-wave-memory:u1-backend-api:77b3dcba08c4d8bff1e02380c09d08bf4616cde6016e82e4290574f2acff6f3e -->

- 2026-09-06T07:40:00Z — Chose the same-VPC/security-group isolation pattern over a VPN/PrivateLink for the internal API boundary (Q4) — simpler and cheaper for a same-team, same-account boundary, at the cost of a slightly less absolute network separation than a fully isolated network path would provide; the internal-scoped service JWT (`nfr-design`) is the compensating second layer.
<!-- aidlc-wave-memory:u1-backend-api:3b2cc119e6b9e728791523bd166377cea9b0e24162b1e5bec183647035e0f9b1 -->

- 2026-09-06T07:50:00Z — Chose a public ALB + WAF IP-allowlist over a Client VPN for ops-staff access (Q2) — simpler, no client software, at the cost of IP-based restriction being weaker than a VPN's authenticated tunnel; revisit if ops staff need access from unpredictable network locations.
<!-- aidlc-wave-memory:u2-admin-api:190af52a29f41715f71151236bb86dca4328e93d427613d12b3e8533f9c6e0ee -->
## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->

- 2026-09-06T07:40:00Z — Concrete rate-limit thresholds (requests/window per rule) for the AWS WAF rules are not yet set — the mechanism is chosen here, but the exact numbers are a Code Generation/tuning decision once real traffic patterns exist.
<!-- aidlc-wave-memory:u1-backend-api:0f33c89d694a1aa6bf91b66ab062e51296a5f3c3734c024119bcbcd065661367 -->

- 2026-09-06T07:50:00Z — The concrete office/VPN-egress IP ranges for the WAF allowlist are not yet known — a Code Generation/deployment-time configuration detail once the team's actual network egress points are confirmed.
<!-- aidlc-wave-memory:u2-admin-api:130e56e0f5170ae124274ac4fef2e90a5b508ba02d100d691c6ab2eab0f9e18b -->
