<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
- 2026-09-07T22:05:00Z — assigned the five auth-and-session stories (US1.1, US1.3, US1.4, US1.10, US1.11) to the foundation library unit rather than to a screen unit, because the substance of each is session behaviour and error translation rather than layout. The alternative left the foundation with no stories at all, which is a signal the mapping is wrong rather than that the unit is unnecessary.
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->

## Deviations
- 2026-09-07T22:35:00Z — revision after a NOT-READY review. The rule that fixes the hole: a story belongs to the unit that owns the surface it delivers, and where the logic behind that surface lives elsewhere it is recorded as cross-cutting rather than moving the story. Applying it moved six stories from the foundation library to the shell and left all three library/spec units story-less, which is a more consistent shape than the original mapping.
- 2026-09-07T22:05:00Z — the traceability sensor counts any story without an OK mapping to a declared unit as a gap, so the human explicit decision that US4.1 is NOT a frontend unit cannot be expressed cleanly: N/A and Deferred both still register as a gap. Left the honest Deferred classification and disclosed the advisory finding at the gate rather than inventing a unit for another team work to satisfy the check.
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
- 2026-09-07T22:35:00Z — chose to widen u4-owner-shell to own the unauthenticated entry screens rather than add a ninth unit, to respect the human granularity answer of eight units. The cost is that u4 grew from S to L and is now the largest ui unit; the benefit is that routing and the screens the route table admits stay together.
- 2026-09-07T22:05:00Z — grouped LocalityCuration and SubscriptionManagement into one unit on delivery shape rather than domain affinity; they have little in common beyond both being self-contained Owner screens outside the skeleton. Recorded it in unit-of-work.md as the weakest cohesion boundary in the decomposition, with the split line named, rather than presenting it as a natural grouping.
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
- 2026-09-07T22:05:00Z — seven of the eight units are blocked on external work with no owner and no schedule, and only the design system is startable today. Whether that makes the frontend startable at all is a Delivery Planning judgement this stage deliberately did not make.
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
