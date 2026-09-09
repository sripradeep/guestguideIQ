<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
- 2026-09-07T16:45:00Z — the frontend intent's brownfield surface is the already-built backend repo `guestguideiq-app`, not a frontend codebase; scanned it as the API contract source the new frontend will consume, weighting the API surface heavily.

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->
- 2026-09-07T17:05:00Z — the backend repo moved mid-stage (the CORS branch merged to `main`, plus one infra commit), so the compare-and-swap publish refused. Re-ran the scan against current HEAD rather than publishing a candidate built from a superseded commit.
- 2026-09-07T16:45:00Z — the active-intent pointer on disk still named the earlier backend intent while the workflow was advancing the frontend intent; switched it to `260907-frontend-app` so receipts bind to the intent actually running. No workflow state was otherwise altered.

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->
- 2026-09-07T16:45:00Z — no CodeKB store existed for this repo, so the scan ran full-repo rather than focused; costs more time now but gives the frontend a complete, verified API picture instead of a partial one.

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
- 2026-09-07T17:05:00Z — the tenancy blocker and the CORS/auth-storage question share one candidate solution (a same-origin reverse proxy). Deciding them separately risks locking in bearer-token storage for an XSS exposure a proxy would remove; they belong together, before contract-design.
- 2026-09-07T16:45:00Z — no backend endpoint creates a `Stay`, yet the whole Guest app hangs off `/v1/stays/:token`; this looks like a backend prerequisite of the frontend intent rather than a construction-time discovery.
- 2026-09-07T16:45:00Z — tenancy is resolved from the request `Host` header, which a browser frontend on a shared API host cannot satisfy; needs a design decision before contract-design.
- 2026-09-07T16:45:00Z — CORS support (and the `credentials` setting that decides cookie-vs-bearer auth) exists only on an unmerged branch; the frontend's auth storage approach depends on how that lands.
