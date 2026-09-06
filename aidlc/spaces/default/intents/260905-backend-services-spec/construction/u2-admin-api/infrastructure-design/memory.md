<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
- 2026-09-06T07:50:00Z — The WAF IP-allowlist decision (Q2) doesn't map cleanly onto any single NFRx.y id from this Unit's own nfr-design traceability — folded it into NFR3.7's coverage as a network-layer complement to the ops-role JWT check, rather than inventing an unanchored id, since it's genuinely in service of the same "only authenticated ops staff" requirement.

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->
- 2026-09-06T07:50:00Z — No independent VPC/ECS cluster/hosting-platform decision was made for this Unit — correctly inherited from `u1-backend-api/infrastructure-design` rather than re-litigated, since both Units share one platform-level footprint.

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->
- 2026-09-06T07:50:00Z — Chose a public ALB + WAF IP-allowlist over a Client VPN for ops-staff access (Q2) — simpler, no client software, at the cost of IP-based restriction being weaker than a VPN's authenticated tunnel; revisit if ops staff need access from unpredictable network locations.

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
- 2026-09-06T07:50:00Z — The concrete office/VPN-egress IP ranges for the WAF allowlist are not yet known — a Code Generation/deployment-time configuration detail once the team's actual network egress points are confirmed.
