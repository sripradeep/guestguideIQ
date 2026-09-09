# Performance Validation — Load Test Plan

Conversation language: English


## Environment and scope decisions


No staging environment exists (`environment-provisioning` Q1/Q2, deferred).
Per the human's explicit decisions recorded in
`performance-validation-questions.md`, this test runs directly against
production (`api.guestguideiq.com`) — safe because the product is
pre-launch with no real user traffic.

Two further real gaps were discovered while designing the test (not known
at the original Q1-Q4 gate) and resolved with the human before executing:

1. **No guest `Stay` can be created.** There is no `POST /v1/stays`
   endpoint anywhere in the codebase (confirmed via source search — only
   `GET /v1/stays/:token` and `POST /v1/stays/:token/chat` exist). A valid
   guest token can only come from a raw database insert, which the human
   declined. **Decision: skip NFR1.4 (guest-guide-read) this pass** —
   real, tracked gap, not silently absorbed.
2. **No locality/account/property can be created either.** `POST
   /v1/accounts` requires the request's `Host` to resolve to an existing
   `LocalityEntity` domain mapping, and localities can only be created
   through `admin-api` (u2) — which is **not deployed to production**
   (confirmed: `aws cloudformation list-stacks` shows only
   `GuestGuideIQ-BackendApi-production` and `CDKToolkit`). **Decision:
   test only what's genuinely reachable — `/health`, `/health/ready`, and
   the public lead-form endpoints — and document NFR1.2 (general
   authenticated API) and the POI/Events reads as untestable this pass,
   blocked on admin-api deployment.**

Per the human's explicit instruction, synthetic data created by this test
(the lead-form rows) is **not deleted afterward** — left in place, tagged.

## What is validated this pass

| NFR | Path | Validated? |
|---|---|---|
| NFR1.6 (≥50 RPS combined) | `/health`, `/health/ready` under ramping load | Partially — only these two paths are reachable; true "all public endpoints combined" throughput is not validated |
| NFR1.5 (lead-form p95 < 300ms) | `POST /v1/leads/waitlist` | Yes, at low volume (rate-limited 15/min per IP) |
| NFR5.2/5.3 (auto-scaling 2→6 on CPU>70%) | ECS service CPU during the health-check ramp | Attempted — see `test-results.md` for whether real CPU load was high enough to trigger it (health checks are cheap; scale-out may not fire) |
| NFR1.2 (general API, all public endpoints except chat) | — | **Not validated** — no authenticated business-logic endpoint is reachable without a locality (admin-api not deployed) |
| NFR1.4 (guest-guide-read) | `GET /v1/stays/:token` | **Not validated** — no `POST /v1/stays` endpoint exists to create a valid token |
| NFR1.3 (itinerary chat) | `POST /v1/stays/:token/chat` | **Not validated** — `CHAT_PROVIDER=null`, no LLM provider wired in (per human decision, marked "Deferred" in the matrix, not tested) |

## Test design

Tool: k6 (human's choice). Script: `perf-load-test.js` (below), run from a
local machine against the public `api.guestguideiq.com` endpoint.

```javascript
// See operation/performance-validation/perf-load-test.js for the full script.
```

Two scenarios, run together over ~15 minutes:

1. **`health_ramp`** — `ramping-arrival-rate` executor alternating `GET
   /health` and `GET /health/ready` (50/50): ramp 0→30 RPS over 3 minutes,
   hold 30 RPS for 10 minutes, ramp down over 2 minutes. Chosen at 30 RPS
   rather than the full 50 RPS NFR1.6 target because these two ops
   endpoints are not representative "public endpoints" in the product
   sense — pushing them harder would validate infrastructure headroom, not
   the product NFR, so the number is deliberately conservative rather than
   chasing the raw target on the wrong endpoints.
2. **`lead_burst`** — 10 sequential `POST /v1/leads/waitlist` requests,
   6 seconds apart (10/min, safely under the 15/min per-IP rate limit),
   each with a clearly-tagged synthetic email
   (`loadtest+<run>-<vu>-<iter>-<timestamp>@example.invalid` — the
   `.invalid` TLD is RFC 2606-reserved, so these can never be real
   deliverable addresses).

## Auto-scaling observation

ECS service (`GuestGuideIQ-BackendApi-production-PublicService...`)
baseline recorded immediately before the test: 2/2 running/desired tasks,
0 pending. CPU/memory utilization and task count are read from CloudWatch
for the test window and reported in `test-results.md`, alongside whatever
actually happened — a genuine attempt, not an assumed pass, since health
checks are cheap enough that 30 RPS may not push CPU past the 70% scale-out
threshold.

## Traceability

See `performance-validation-questions.md` for the full Q&A record
(original Q1-Q4 gate plus the two follow-up decisions above). Upstream:
`construction/u1-backend-api/nfr-requirements/performance-requirements.md`,
`scalability-requirements.md`; `construction/u1-backend-api/nfr-design/performance-design.md`,
`scalability-design.md`; `operation/observability-setup/dashboards.md`.
