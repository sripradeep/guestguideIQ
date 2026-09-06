<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
- 2026-09-06T07:40:00Z — `requirements.md` C3's open hosting decision (not committed to AWS) resolved to AWS at this stage, on the strength of the workspace's own already-provisioned AWS-native tooling (AWS Platform Agent, CDK knowledge, AWS MCP servers) rather than the marketing site's original spec — a genuinely independent decision, not a foregone one.

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->
- 2026-09-06T07:40:00Z — No ElastiCache/Redis was provisioned despite it appearing as an option throughout `nfr-design`'s discussion — correctly not built, since the domain-resolution cache is in-process and no other caching tier was designed at NFR Design (Q1 there).

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->
- 2026-09-06T07:40:00Z — Chose RDS single-AZ over Multi-AZ (Q3) — roughly half the database cost, at the accepted risk of a longer outage during an AZ failure than Multi-AZ would provide; explicitly tied to the 99% SLO actually in force, with Multi-AZ named as the upgrade path if that SLO tightens.
- 2026-09-06T07:40:00Z — Chose the same-VPC/security-group isolation pattern over a VPN/PrivateLink for the internal API boundary (Q4) — simpler and cheaper for a same-team, same-account boundary, at the cost of a slightly less absolute network separation than a fully isolated network path would provide; the internal-scoped service JWT (`nfr-design`) is the compensating second layer.

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
- 2026-09-06T07:40:00Z — Concrete rate-limit thresholds (requests/window per rule) for the AWS WAF rules are not yet set — the mechanism is chosen here, but the exact numbers are a Code Generation/tuning decision once real traffic patterns exist.
