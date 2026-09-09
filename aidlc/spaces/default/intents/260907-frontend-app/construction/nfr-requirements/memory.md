<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
- 2026-09-08T04:45:00Z — for a spec unit with no runtime, the security surface is the pipeline that produces the types rather than the types themselves: a generator runs in the build with developer privileges against a source in a repository this frontend does not control. Wrote the requirements around that distinction and recorded the six inapplicable NFR categories explicitly, so a reader can tell does-not-apply from was-not-considered.
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->

## Deviations
- 2026-09-08T04:55:00Z — the stage ID convention (every detailed requirement inherits an inception NFR and appends a sub-number) has no slot for a requirement a unit legitimately ORIGINATES. u1-api-contract needed twelve such requirements (supply chain, freshness, type-safety guards) because nothing in requirements.md anticipated a vendored type package from another repository, and labelling them NFR7.x claimed a lineage they do not have. From u2 onward, unit-original requirements carry a U<n>-SEC-n prefix and are recorded in the traceability reverse array rather than claiming NFR coverage.
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
- 2026-09-08T04:55:00Z — chose not to rewrite u1 after the review found the mislabelling. The review-freeze hook only lifts via a gate rejection (unavailable: under unit-major the stage is still pending) or a full stage restart, which is disproportionate for a labelling fix on one unit. Stopping the pattern for units 2-8 gets the benefit the reviewer actually wanted (no propagation) at zero cost, and R-01 stays visible in u1 own Review section for the stage gate.
- 2026-09-08T04:45:00Z — both human answers (scheduled drift check, pin-and-verify) depend on a published contract that does not exist and has no owner. Specified them now with their interim degradation stated, rather than deferring them silently, so the gap is recorded as owed rather than rediscovered later.
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
