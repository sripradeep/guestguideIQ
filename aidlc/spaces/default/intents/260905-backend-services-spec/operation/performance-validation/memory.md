<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
- 2026-09-07T18:45:00Z — interpreted "run a bounded load test against production" as testing only the paths genuinely reachable today (`/health`, `/health/ready`, public lead-forms), after discovering mid-design that no locality/account/property and no guest Stay can be created at all in the current production deployment — rather than either fabricating test data through a raw DB insert or silently narrowing scope without surfacing it.

## Deviations
- 2026-09-07T18:45:00Z — did not validate NFR1.2 (general authenticated API) or NFR1.4 (guest-guide-read) as originally scoped by the stage file's default inputs — both are blocked on real infrastructure gaps (`admin-api` not deployed; no `POST /v1/stays` endpoint exists), discovered during test design and confirmed via direct inspection (CloudFormation stack list, source search) rather than assumed.
- 2026-09-07T18:45:00Z — target throughput for the health-check scenario was set to 30 RPS rather than the NFR1.6 target of 50 RPS, since health/ready are not representative product endpoints — pushing them harder would validate infrastructure headroom, not the actual NFR, so the test was designed to demonstrate clean behavior at a reasonable rate rather than force the numeric target on the wrong endpoint.
- 2026-09-07T18:45:00Z — synthetic lead-form data created by the test was left in production rather than cleaned up, per explicit human instruction given mid-test.

## Tradeoffs
- 2026-09-07T18:45:00Z — accepted that auto-scaling (NFR5.2/5.3) could not be genuinely validated this pass, since the only reachable endpoint (health checks) is too cheap to generate real CPU load — reported as "attempted, not triggered" rather than either skipping the attempt or claiming a false pass.

## Open questions
- 2026-09-07T18:45:00Z — whether to deploy `admin-api` to production now (to unblock NFR1.2/NFR1.4/auto-scaling validation) or wait for the frontend's own backend follow-up (which needs `admin-api`-created localities too) to land first — not decided this stage, carried to `feedback-optimization` as a follow-up.
