# Performance Test Instructions

Conversation language: English

Generated because `u1-backend-api/nfr-requirements/performance-requirements.md` sets concrete, load-dependent targets (NFR1.6: ≥50 RPS sustained throughput, explicitly "load-test-validated") that this stage cannot honestly resolve to `Met` from a local, single-process test run — they need a running, load-generatable instance. This file records what will validate them and where; `test-results.md`'s Target Verification Matrix marks the load-dependent rows `Unverified` here with the deferral below, not `Met`.

## Why these targets are deferred, not skipped

Per this stage's own deferral rule, a check may be deferred only when it requires a deployed/production-like environment **and** a later, already-scheduled stage explicitly owns it. Both hold here:

- NFR1.2-NFR1.7 (u1) and NFR1.2-NFR1.3 (u2) are percentile-latency-under-load and throughput targets — meaningless without a running instance under generated traffic, which this stage's local `vitest` run does not provide.
- `Stages to Execute` (per `aidlc-state.md`) already includes **4.6 Performance Validation**, led by `aidlc-quality-agent` — the same lead agent as this stage — which exists specifically to run load tests against a real environment.

So this is the legitimate case the deferral rule describes, not a silent pass-through: the target is recorded `Unverified` with a named owning stage, never `Met`.

## What Performance Validation (4.6) should run, once an environment exists

| Target | Method |
|---|---|
| NFR1.2 — API p95 <500ms | Load-generate representative traffic (e.g. k6/autocannon) against the deployed Contract 2/3 routes; measure p95 from the load tool's own histogram, not server-side logs alone |
| NFR1.3 — chat p95 <3s | Same tooling, isolated to `/v1/stays/:id/chat`; the ChatModule bulkhead (per `nfr-design`) should be verified to actually isolate this path's latency from the rest |
| NFR1.4 — guide read p95 <300ms | Same tooling, isolated to the guide-read route |
| NFR1.5 — lead-form p95 <300ms | Same tooling, isolated to Contract 3 |
| NFR1.6 — ≥50 RPS sustained | Sustained-throughput run (not a burst) for the duration specified at `nfr-requirements`; this is the target that most explicitly cannot be met by anything short of a real load test |
| NFR1.7 — resource footprint monitored | Capture CPU/memory during the above runs against the connection-pool-sizing formula recorded in `nfr-design`'s `performance-design.md` |
| u2 NFR1.2 — end-to-end <600ms p95 | Load-generate against `admin-api`'s public routes with `backend-api` live (not `nock`-mocked) so the real relay hop is included |
| u2 NFR1.3 — relay overhead <50ms p95 | Derived from the above by subtracting `backend-api`'s own measured NFR1.2 latency for the same request |

## What this stage did verify locally (not deferred)

Functional correctness and unit/integration-level behavior of the same code paths — via the full `vitest` suites (`test-results.md`) — is not a performance measurement but does confirm the code these load tests will exercise is behaviorally correct first. A load test against broken logic would only measure how fast it fails.
