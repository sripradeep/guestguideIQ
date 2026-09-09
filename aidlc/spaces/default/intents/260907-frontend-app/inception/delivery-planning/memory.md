<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
- 2026-09-08T00:05:00Z — classified Construction as unit-major rather than the stage-major default, because the plan builds one unit completely before the next and demos the skeleton path partway through the first Bolt. Under stage-major no working code would exist until every design stage had run for all eight units, which contradicts the skeleton-first intent the affirmed practice asks for.
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->

## Deviations
- 2026-09-08T00:05:00Z — recorded solo unit ownership without putting the staffing question to the human, because team ownership requires the workspace root itself to be the source repository and this intent has a recorded sibling repo. There was only one available answer; asking would have offered a choice that does not exist. Stated the constraint in team-allocation.md and in the completion message rather than presenting it as a preference.
- 2026-09-08T00:05:00Z — the human answer to Q1 overrode a stamped ALWAYS rule in project.md (the thin-slice half of the walking-skeleton mandate). Surfaced the conflict with the rule quoted before the choice was recorded, offered the option that keeps the mandate intact, and on confirmation wrote it into the plan as a deliberate human override with its cost named — rather than either overriding the human or planning around the rule silently.
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
- 2026-09-08T00:05:00Z — the scored order of the post-skeleton Bolts (B3 then B4 then B2) is not the order they are numbered in, because grouping by blocker and scoring by value disagree. Recorded both, said which should win when the blocker clears, and stated explicitly that the numbering is an identifier rather than a queue position.
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
- 2026-09-08T00:05:00Z — the phase-boundary check passes with one disclosed exception that is a limitation of the traceability model rather than a coverage gap: a story that is legitimately another team work cannot be expressed as covered. Worth raising with whoever owns the sensor, since any project with an external prerequisite will hit it.
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
