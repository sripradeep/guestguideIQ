<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
- 2026-09-06T07:05:00Z — Two isolation boundaries were drawn for two distinct reasons (ChatModule for reliability, InternalAdminAPI listener for security) rather than treating "isolation" as one undifferentiated concept — `logical-components.md` states each boundary's actual justification explicitly.

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->
- 2026-09-06T07:05:00Z — No circuit breaker was designed for the LLM adapter (Q2), a deliberate human override of the recommended default — `reliability-design.md` names the honest cost of that choice (wasted retry latency under a sustained outage) rather than silently omitting the trade-off discussion.
- 2026-09-06T07:05:00Z — No data partitioning/sharding was designed despite `ddd-patterns.md`/`architecture-patterns.md` covering the technique — correctly deferred as premature at the year-one data volume, with the natural future shard key (`localityBrandId`) named for later.

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->
- 2026-09-06T07:05:00Z — Chose an in-process LRU cache for domain resolution over a distributed cache (Q1) — cheaper to build and operate now, at the cost of each app instance holding its own (small, cheaply rebuilt) copy rather than one shared source of truth; acceptable given the tiny, slow-changing dataset.
- 2026-09-06T07:05:00Z — The rate-limit storage adapter is explicitly in-memory today with a named migration trigger (second instance added) rather than building the Redis-backed version now — avoids speculative infrastructure while keeping the redesign cost at zero when the trigger fires.

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
- 2026-09-06T07:05:00Z — The concrete network isolation mechanism for the InternalAdminAPI listener (VPN, private subnet, IP allowlist) remains open, now doubly dependent on `infrastructure-design`'s hosting choice — flagged again here since this design fixes only the application-level separation, not the network boundary.
