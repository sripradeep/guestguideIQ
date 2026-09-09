# Performance Validation — Clarifying Questions

Conversation language: English

## Context

`api.guestguideiq.com` is live in production (single environment — no
staging tier exists; deferred in `environment-provisioning`, Q1/Q2). The
product is pre-launch: there is no real user traffic yet, so "production"
today is functionally an idle environment. This matters directly for how a
real load test can be run, since there is no separate staging environment to
target instead.

NFR targets to validate (`construction/u1-backend-api/nfr-requirements/performance-requirements.md`,
`scalability-requirements.md`):
- NFR1.2: general API p95 < 500ms
- NFR1.4: guest-guide read p95 < 300ms
- NFR1.5: lead-form submission p95 < 300ms
- NFR1.6: sustained throughput ≥ 50 RPS combined
- NFR5.2/5.3: horizontal scale-out (ECS auto-scaling 2→6 tasks on CPU > 70%,
  confirmed live and correctly configured per the `environment-provisioning`
  correction)
- NFR1.3 (itinerary chat, p95 < 3s): **cannot be validated this pass** —
  `CHAT_PROVIDER=null`, no LLM provider is wired in yet (see `dashboards.md`/
  `alarms.md` deferred sections).

## Q1: How should this stage validate performance, given no staging environment exists?

[Answer]: A. Run a bounded, low-load test directly against production now — safe because the product is pre-launch with no real users to affect

A. Run a bounded, low-load test directly against production now — safe
   because the product is pre-launch with no real users to affect
   (Recommended)
B. Defer performance validation entirely until a staging environment is
   provisioned
C. Run only a lightweight synthetic/smoke check (a handful of requests to
   confirm the paths respond within budget) rather than a full load test,
   and document real load testing as a follow-up
X. Other (please specify)

## Q2: Which load test tool should generate the traffic?

[Answer]: A. k6 — scriptable, straightforward to run once and discard, good fit for a one-off validation

A. k6 — scriptable, straightforward to run once and discard, good fit for a
   one-off validation (Recommended)
B. Artillery — YAML-driven, also quick to set up
C. A minimal custom script (e.g. a `curl`/`ab` loop) — least setup, least
   rigorous percentile reporting
X. Other (please specify)

## Q3: What time/risk budget should this test run within?

[Answer]: A. A short (~15-30 minute) ramp-up + steady-state test during a low-traffic window now

A. A short (~15-30 minute) ramp-up + steady-state test during a low-traffic
   window now (Recommended)
B. A longer soak test (multiple hours) to also surface slow leaks or
   connection-pool exhaustion
C. Produce the load-test plan as a design document only, without actually
   executing it this pass
X. Other (please specify)

## Q4: How should the NFR validation matrix treat itinerary chat (NFR1.3), which has no LLM provider wired in yet?

[Answer]: A. Mark it "Deferred — not yet implemented" in the matrix rather than PASS/FAIL

A. Mark it "Deferred — not yet implemented" in the matrix rather than
   PASS/FAIL (Recommended)
B. Exclude it from this pass's matrix entirely
X. Other (please specify)

## Q5: (Discovered mid-design) No guest Stay can be created — there's no `POST /v1/stays` endpoint anywhere in the codebase, only a raw DB insert could produce a valid token. How should NFR1.4 be handled?

[Answer]: A. Skip NFR1.4 this pass, mark it a real gap

A. Skip NFR1.4 this pass, mark it a real gap (Recommended)
B. Do a raw DB insert of one test Stay row directly into production
X. Other (please specify)

## Q6: (Discovered mid-design) `admin-api` is not deployed to production at all, so no locality/account/property can be created either — blocking NFR1.2 and the POI/Events reads, not just NFR1.4. How should the test scope handle this?

[Answer]: A. Test only what's real: health + lead-forms

A. Test only what's real: health + lead-forms (Recommended)
B. Also deploy admin-api first, then test
X. Other (please specify)

## Consolidated Summary Confirmation

Summary: run a short (~15-30 min) k6 load test directly against production
now — safe pre-launch with no real users. Two real gaps were discovered
while designing the test: no `POST /v1/stays` endpoint exists (so NFR1.4
guest-guide-read cannot be validated without a raw DB insert, which was
declined), and `admin-api` is not deployed to production (so no
locality/account/property can be created, blocking NFR1.2 and the
POI/Events reads too). Scope was narrowed to what's genuinely reachable:
`/health`, `/health/ready`, and the public lead-form endpoints (NFR1.5).
Synthetic lead-form data created by the test is left in production per
explicit instruction, not deleted. Itinerary chat (NFR1.3) is marked
"Deferred — not yet implemented" in the NFR validation matrix since no LLM
provider is wired in.

[Answer]: Looks correct
