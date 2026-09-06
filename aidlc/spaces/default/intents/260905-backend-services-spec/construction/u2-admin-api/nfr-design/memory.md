<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
- 2026-09-06T07:20:00Z — The non-idempotent-write retry policy (Q1) was treated as a real correctness decision, not a minor detail — cross-checked byte-for-byte against `contract-summary.md`'s own idempotency note rather than re-deriving it independently, since the two must agree exactly.

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->
- 2026-09-06T07:20:00Z — No caching, rate-limiting, or scaling design was created for this Unit — correctly judged unnecessary at its ops-only traffic volume rather than copied from `u1-backend-api` out of habit.

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->
- 2026-09-06T07:20:00Z — Centralized credential attachment and retry logic in one `InternalCallerModule` (Q2) rather than inline per-handler — slightly more upfront structure for a 4-workflow Unit, but avoids four separate, potentially inconsistent implementations of the same retry/credential logic.

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
- 2026-09-06T07:20:00Z — Same open item as `u1-backend-api`: the concrete network isolation mechanism for the shared internal listener remains deferred to `infrastructure-design`.
