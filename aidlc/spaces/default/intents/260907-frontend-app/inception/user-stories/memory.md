<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
- 2026-09-07T18:50:00Z - drew the mixed-granularity line at the walking-skeleton path (Owner signup through published guide) on the reasoning that the affirmed practice runs that Bolt first, solo and gated, so only that path needs Bolt-sized stories now. The developer review disputes where the line falls, arguing ten stories is most of the Owner app rather than a thin slice.

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->
- 2026-09-07T18:50:00Z - the human declined the four story-plan questions and directed the stage to proceed. Recorded the four answers in the questions file as orchestrator-selected with rationale, explicitly labelled as not human-chosen, rather than filling them in as if answered. The answer receipt correctly refused, since no human reply arrived; the file carries the truth.

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->
- 2026-09-07T18:50:00Z - minted new frontend story IDs rather than reusing the prior intent's, accepting a cross-reference burden in exchange for unambiguous traceability targets. Two intents owning the same ID would have made every downstream coverage row ambiguous.

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
- 2026-09-07T18:50:00Z - the mob found that the frontend cannot deliver its core value this release: no route returns a locality brand (all branding unbuildable), the guest receives favourite ids it cannot resolve into anything displayable (two of three guide tabs empty by construction), no property photo exists anywhere for the trust cue, Host-header tenancy breaks signup and every stay link cross-origin, and upgrade/downgrade change nothing. None of these are in the FR9 follow-up as scoped. This is a product-scope decision for the human, not a story-wording fix.
