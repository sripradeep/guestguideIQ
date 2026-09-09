# Performance Validation — NFR Validation Matrix

Conversation language: English


| NFR | Requirement | Target | Actual | Status | Test Date | Notes |
|---|---|---|---|---|---|---|
| NFR1.5 | Lead-form submission latency | p95 < 300ms | p95 = 99.5ms | **PASS** | 2026-09-07 | 10 real synthetic submissions against production; comfortably under budget |
| NFR1.6 | Sustained throughput, all public endpoints combined | ≥ 50 RPS | 30 RPS sustained (health + ready only), 0% errors | **PARTIAL** | 2026-09-07 | Only `/health`/`/health/ready` are reachable without seed data; genuinely demonstrates clean infra headroom at 30 RPS on ops endpoints, but does not reach or validate the 50 RPS target on real business endpoints |
| NFR5.2 / NFR5.3 | Horizontal auto-scaling (2→6 tasks on CPU > 70%) | Scales out under load | CPU peaked 4.9%; no scale-out event | **NOT VALIDATED** | 2026-09-07 | Health-check traffic too cheap to generate real CPU load; configuration was separately confirmed correct in `environment-provisioning`, but behavior under real load remains unverified |
| NFR1.2 | General API response time (all public endpoints excl. chat) | p95 < 500ms | — | **BLOCKED** | — | No account/property/locality can be created in production — `admin-api` (u2) is not deployed, so no authenticated business-logic endpoint is reachable |
| NFR1.4 | Guest-facing guide read | p95 < 300ms | — | **BLOCKED** | — | No `POST /v1/stays` endpoint exists anywhere in the codebase; a valid guest token can only come from a raw DB insert, which was declined |
| NFR1.3 | Itinerary chat response time | p95 < 3s | — | **Deferred — not yet implemented** | — | `CHAT_PROVIDER=null`, no LLM provider wired in yet (per human decision, Q4) |
| NFR1.7 | Application-tier resource footprint (single small instance comfortably serves year-one load) | Headroom at year-one load | CPU ≤ 4.9%, memory ≤ 3.2% at 30 RPS | **PASS (partial evidence)** | 2026-09-07 | Confirms ample headroom on the traffic actually exercised; does not confirm headroom under full NFR1.2/NFR1.6 business-endpoint load, which remains untested |

## Summary


Of the 6 NFRs in scope for this stage, 1 fully passed (NFR1.5), 2 are
partially evidenced (NFR1.6, NFR1.7 — real data on the reachable paths,
but the full target is not validated), 1 was attempted but not triggered
(NFR5.2/5.3 — auto-scaling), 1 is blocked on a real infrastructure gap
(NFR1.2/NFR1.4 — no seed data path), and 1 is explicitly deferred by human
decision (NFR1.3 — chat).

## Capacity planning recommendation

Current production headroom is enormous relative to the traffic actually
exercised (CPU/memory both under 5% at 30 RPS of health-check traffic). No
capacity change is recommended before launch. The real open item is not
capacity — it's **validation coverage**: NFR1.2, NFR1.4, and the
auto-scaling behavior all remain genuinely unverified, and closing that gap
requires either deploying `admin-api` and seeding a test locality/account,
or re-running this validation once real production traffic exists.

## Follow-ups (carried to `feedback-optimization` / future work)

1. Deploy `admin-api` (u2) to production, or seed a test locality directly,
   so NFR1.2/NFR1.4/the auto-scaling behavior can be genuinely validated.
2. Add `POST /v1/stays` (already a known backend follow-up blocking
   frontend Construction per the `260907-frontend-app` intent's own
   findings) — this closes both the frontend blocker and this stage's
   NFR1.4 gap in one change.
3. Re-run a heavier, CPU-bound synthetic load (once a real endpoint is
   reachable) specifically to validate the auto-scaling policy fires
   correctly, not just that it's configured correctly.
4. Revisit NFR1.3 (chat) once an LLM provider is wired in.

## Traceability

See `test-results.md` for the underlying measurements and
`performance-validation-questions.md` for the full decision record.
Upstream: `construction/u1-backend-api/nfr-requirements/performance-requirements.md`,
`scalability-requirements.md`.
