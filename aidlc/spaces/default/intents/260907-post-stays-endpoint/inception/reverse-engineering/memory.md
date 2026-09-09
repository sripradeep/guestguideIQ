<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
- 2026-09-07T20:33:05Z — The active-intent cursor had reverted to `260907-frontend-app`; the first directive of this session was for that intent's User Stories stage, not this one. Switched back with `intent switch post-stays-endpoint` before running anything. This is the recurrence of a previously-recorded workspace quirk.
- 2026-09-07T20:33:05Z — `codekb-scope-diff` returns STALE for `guestguideiq-app`, but the drift is narrow: the store was built at `76d190d`, HEAD is `721b33c` on branch `feature/observability-minimal-slice`, and `git diff 76d190d..HEAD --stat` touches exactly one file — `infra/lib/backend-api-stack.ts` (+142, the observability slice). `src/`, `prisma/`, and `tests/` are byte-identical to what the store analyzed, which is the whole surface this intent touches.
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
- 2026-09-07T20:33:05Z — STALE forecloses the reuse option, so the choice is full rescan vs focused scan. A focused scan on a STALE store demotes ALL prior deep coverage to shallow — and the in-flight `260907-frontend-app` intent consumes this same space-level store. Recommending a full rescan to preserve that store's depth, accepting the higher scan cost.
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
