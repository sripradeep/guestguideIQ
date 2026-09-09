<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
- 2026-09-08T04:40:00Z — the review-freeze hook blocks fixing a produces artifact once its review is terminal, even on a gate-false per-unit directive where no stage gate is near. The hook names the unlock path (a human Request Changes decision), and --unit gate reporting is refused under solo ownership, so the rejection is recorded at stage level instead. Worth fixing a Critical at the unit rather than carrying a known-wrong shape into seven more units.
- 2026-09-08T04:15:00Z — treated a spec unit functional design as rules about fidelity and provenance rather than user-facing behaviour, since it delivers nothing a user sees. The three rules that matter (BR2.1, BR2.2, BR2.3) guard backend endpoints that treat a malformed request as a successful destructive action, where the type is the only enforcement point available because there is no error to handle.
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->

## Deviations
- 2026-09-08T04:40:00Z — review caught a Critical shape error in u1-api-contract that I introduced: GuestStayView typed guide as a bare section list, hoisted the favourite arrays to the top level, and omitted notYetPublished entirely — the field that drives the guest not-yet-published state the spec itself described. Root cause: wrote the shapes from the endpoint list and working memory rather than reading the response-body blocks in api-documentation.md. Fixed by reading them directly.
- 2026-09-08T04:15:00Z — u1-api-contract cannot pass the per-unit traceability sensor: it requires stories mapped to the unit in the story map, and this unit legitimately has none (confirmed at Units Generation). Kept the honest artifact, recorded the ACs whose enforcement point is genuinely this unit type with their owning unit named in each target, and disclosed the advisory finding rather than inventing a story assignment to satisfy the check.
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
