<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
- 2026-09-07T17:55:00Z — the previously affirmed file-naming rule was internally contradictory (flat `camelCase.ts` plus `PascalCase` for component-like constructs), which the first component file would have violated. The human chose PascalCase components / camelCase otherwise, recorded as the unifying formulation "a file is named after what it exports".
- 2026-09-07T17:25:00Z — treated this as a re-run against the practices affirmed one day ago for the backend intent, not a blank slate. The central question is which affirmed practices carry to frontend work unchanged, which need frontend-specific specialisation, and which do not apply; several `project.md` rules are phrased "for backend work" and their extension is a human decision, not an inference.

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->
- 2026-09-07T17:55:00Z — the three reviewers proposed far more interview questions than the five practice areas needed. Curated to eight questions in two batches rather than putting every proposed question to the human; the rest are recorded in `evidence.md` as open items for the stages that actually own them.

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->
- 2026-09-07T17:55:00Z — the human deferred the token-storage/same-origin-proxy decision to design rather than settling it now. Deferring keeps the option open but risks the hosting choice foreclosing it, so the constraint "hosting must not foreclose the same-origin-proxy option" was recorded as part of the deferral instead of leaving the deferral bare.
- 2026-09-07T17:25:00Z — the frontend's stack and hosting are unchosen, so some practice answers (linter choice, coverage tooling, deploy target) can only be settled as far as the stack allows. Chose to ask what is answerable now and defer the rest explicitly to design stages rather than guess a stack to make the questions answerable.

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
- 2026-09-07T17:55:00Z — the security review maintained dissent that SBOM generation should become a frontend mandate now; the human was never asked, so it was recorded rather than promoted. It should be put to the human directly at the `ci-pipeline` stage.
- 2026-09-07T17:55:00Z — the backend follow-up scoped at Q8 (`POST /v1/stays` plus the CORS/origin fix) has no owner or sequencing yet; requirements-analysis needs to place it before frontend Construction.
