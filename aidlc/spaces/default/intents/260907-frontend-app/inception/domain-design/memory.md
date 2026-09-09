<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
- 2026-09-07T21:40:00Z — the team practice requiring a coverage include/exclude declaration at this stage collided with the framework being unchosen, so no file glob was expressible. Resolved by declaring the boundary in component-category terms instead (ADR-007), which the component catalogue makes possible; the globs are deferred to when the framework exists.
- 2026-09-07T21:40:00Z — accepted a deliberate two-component cycle (ApiClient and SessionManager) rather than inventing a third component whose only job was three HTTP calls. Recorded it explicitly per the catalogue rules, bounded it to the bottom layer, and left the implementation resolution (injected handler vs mutual import) to functional-design.
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->

## Deviations
- 2026-09-07T21:40:00Z — the human chose a component split (SessionManager separate from ApiClient) that departs from the literal wording of an affirmed team practice, having been shown that practice in the question. Recorded it as an ADR naming the practice, the departure and the preserved intent, rather than either silently overriding the answer or letting team.md and the design quietly disagree.
- 2026-09-07T21:40:00Z — two of the nine ADRs record findings rather than choices: pre-check-in access was already decided by backend behaviour, and requirements.md still lists it as open. Writing an ADR for a factual correction, with Alternatives Rejected explicitly stating none, keeps the open-question list honest without implying the frontend could decide it.
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
- 2026-09-07T21:40:00Z — three of the six answers grew work outside this frontend: the contract-publishing decision is the third addition to a backend follow-up that requirements.md already records as having no owner and no schedule. Surfaced the cumulative growth in the ADR rather than recording each addition in isolation, since the risk is the total, not any one item.
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
