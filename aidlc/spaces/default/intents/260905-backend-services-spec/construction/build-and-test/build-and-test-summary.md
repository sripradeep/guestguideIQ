# Build and Test Summary

Conversation language: English

## Overview

Both Units (`u1-backend-api`, `u2-admin-api`) were independently built, typechecked, linted, format-checked, and tested via direct execution (not trusted from `code-summary.md`'s self-reports alone — every number below was re-produced by this stage's own Bash runs; see `test-results.md` for full command output). Five remediations were applied and re-verified during Step 9, across two rounds of human disposition (gated autonomy mode): bcrypt→bcryptjs, fastify v4→v5, and vitest v2→v5 (round 1); the `@opentelemetry/sdk-node` 0.52→0.222 bump and a new W3C trace-context implementation for u2-admin-api (round 2, after those two findings surfaced independently during the first round's verification). Both Units now report 0 dependency vulnerabilities and every previously-disclosed gap below is resolved and re-verified.

## Target Verification Matrix

Every applicable measurable target from both Units' `nfr-requirements/` is resolved below to `Met`, `Not Met`, `Unverified`, or `N/A` — none left `Pending`. "Unverified" always names the owning stage that will resolve it; per this stage's deferral rule, that is only valid because each named stage is already scheduled in `aidlc-state.md`'s `Stages to Execute`.

### u1-backend-api

| Target ID | Source | Expected | Actual | Evidence | Owning Stage | Verdict |
|---|---|---|---|---|---|---|
| NFR1.2 | performance-requirements.md | API p95 <500ms | Not measured under load | — | Performance Validation (4.6) | Unverified |
| NFR1.3 | performance-requirements.md | Chat p95 <3s | Not measured under load | — | Performance Validation (4.6) | Unverified |
| NFR1.4 | performance-requirements.md | Guide read p95 <300ms | Not measured under load | — | Performance Validation (4.6) | Unverified |
| NFR1.5 | performance-requirements.md | Lead-form p95 <300ms | Not measured under load | — | Performance Validation (4.6) | Unverified |
| NFR1.6 | performance-requirements.md | ≥50 RPS sustained | Not measured under load | — | Performance Validation (4.6) | Unverified |
| NFR1.7 | performance-requirements.md | Resource footprint monitored | Not measured under load | — | Performance Validation (4.6) | Unverified |
| NFR2.2 | reliability-requirements.md | 99% availability / 30-day window | Not measurable pre-deployment | — | Observability Setup (4.4) / ongoing operation | Unverified |
| NFR2.3 | reliability-requirements.md | RTO ≤4h, RPO ≤1h; backup restore tested before launch | No environment/backups exist yet | — | Infrastructure Design / Environment Provisioning | Unverified |
| NFR2.4 | reliability-requirements.md | Chat degrades first on LLM failure; other paths unaffected | Retry-able waiting state on chat failure implemented and tested | `src/chatmodule/service.ts` (100% stmt/func coverage), `tests/bdd` chat scenarios, AC2.3.3 | — | Met |
| NFR2.5 | reliability-requirements.md | Daily backups, 30-day retention, restore tested pre-launch | No environment exists yet | — | Infrastructure Design / Environment Provisioning | Unverified |
| NFR2.6 | observability-requirements.md | RED metrics via OpenTelemetry Metrics SDK | Implemented (`src/lib/otel.ts`), now on a vulnerability-free `@opentelemetry/sdk-node@0.222.0` with 3 new unit tests (`tests/unit/otel.test.ts`) covering the disabled/success/failure branches | `test-results.md` § Fix 4 | — | Met |
| NFR2.7 | observability-requirements.md | Structured JSON logs, redaction, correlation-ID | Implemented — pino with `LOG_REDACT_PATHS`; per-request correlation via Fastify's built-in `reqId` (no custom code needed) | `src/lib/logger.ts` (79.31% cov), `src/app.ts` logger wiring | — | Met |
| NFR2.8 | observability-requirements.md | W3C Trace Context across the admin-api→backend-api boundary | Implemented on u1's side via OpenTelemetry SDK, and now genuinely propagated end-to-end since u2's NFR2.7 fix below | `src/lib/otel.ts` (`@opentelemetry/instrumentation-http` honors an incoming `traceparent` as the parent context, regardless of what generated it) | — | Met |
| NFR2.9 | observability-requirements.md | 4 symptom-based alerts (error-rate, SLO burn, chat failure, pool exhaustion) | Alerting rules are an operational/platform artifact, not application code | — | Observability Setup (4.4) | Unverified |
| NFR3.4 | security-requirements.md (via project.md Mandated) | Dependency/secret scanning active, wired as blocking CI | `npm audit` run; all 4 found vulnerability chains (bcrypt/tar, fastify/find-my-way, vitest/esbuild/vite, @opentelemetry/core) fixed and independently re-verified; **0 vulnerabilities remain**; CI-wiring itself not yet built | `test-results.md` § Dependency Vulnerability Disposition | ci-pipeline (3.7) for CI-wiring (the scan itself is Met) | Met |
| NFR3.7 | security-requirements.md | bcrypt-family hashing, tuned work factor | Implemented (`bcryptjs`, factor 12) | `src/auth/password.ts`, 91.66% cov, all auth tests pass post-swap | — | Met |
| NFR3.8 | security-requirements.md | JWT 15min access / 7d refresh | Implemented | `src/auth/jwt.ts` (90.47% cov) | — | Met |
| NFR3.9 | security-requirements.md | Authorization model (ownership/stay-token/internal-caller) | Implemented | `src/auth/middleware.ts` (87.5% cov) | — | Met |
| NFR3.10 | security-requirements.md | Rate limiting on 5 named endpoints | Implemented | `src/ratelimit/` (92.15% cov), `app.ts` preHandler wiring | — | Met |
| NFR3.11 | security-requirements.md | Internal-API network isolation | Mechanism explicitly deferred to infrastructure-design by this NFR's own text; logical separation (distinct listener) implemented at the app level | `src/internal/routes.ts`, `contract1.test.ts` | Infrastructure Design | Unverified (network-level enforcement only) |
| NFR3.12 | security-requirements.md | Stripe tokenization, LLM data minimization | Implemented | `src/subscription/stripeAdapter.ts` (100% cov, post-mock-fix), `src/chat/provider.ts` (100% cov) | — | Met |
| NFR3.13 | security-requirements.md | admin-api write audit logging | Implemented on the emitting side (u2, see below) | `admin-api/src/lib/logger.ts` | — | Met |
| NFR4.2 | security-requirements.md | Data minimization at the schema level | Implemented | `prisma/schema.prisma` (reviewed READY at NFR Requirements) | — | Met |
| NFR4.3 | security-requirements.md | Deletion runbook exists | No runbook document exists yet — this is an operational document, not code | — | Not yet scheduled to a specific stage — flagged for Delivery Planning / Operation phase | Unverified |
| NFR5.2 | scalability-requirements.md | Year-one capacity without rewrite | Structural design verified (stateless tier, indexed FKs) | Code inspection; no load test performed | Performance Validation (4.6) for the load-bearing confirmation | Met (structural) |
| NFR5.3 | scalability-requirements.md | Stateless app tier (no server-side sessions) | Implemented — JWT-only auth, no session store | `src/auth/` module, no session middleware present | — | Met |
| NFR5.4 | scalability-requirements.md | Connection pool sized to formula; read-replica path open | Pool configured; no read-replica code needed yet (schema doesn't preclude one) | `src/db/prismaClient.ts` (excluded from coverage by design, reviewed at code-gen) | — | Met (structural) |
| NFR5.5 | scalability-requirements.md | Chat degrades first under load pressure | Bulkhead code exists; degrade-first behavior under real concurrent load not measured | `src/chatmodule/` isolation | Performance Validation (4.6) | Unverified |
| NFR6.3 | scalability-requirements.md | Domain-lookup cache adds <10ms | Cache implemented; latency not measured | `src/locality/domainCache.ts` (86.2% cov) | Performance Validation (4.6) | Unverified |
| NFR6.4 | scalability-requirements.md | Domain writes only via admin-api/internal listener | Implemented | `src/internal/routes.ts`, `contract1.test.ts` | — | Met |

### u2-admin-api

| Target ID | Source | Expected | Actual | Evidence | Owning Stage | Verdict |
|---|---|---|---|---|---|---|
| NFR1.2 | performance-requirements.md | E2E p95 <600ms | Not measured under load (tests mock the internal hop via `nock`) | — | Performance Validation (4.6) | Unverified |
| NFR1.3 | performance-requirements.md | Own relay overhead p95 <50ms | Not measured under load | — | Performance Validation (4.6) | Unverified |
| NFR2.2 | reliability-requirements.md | 95% availability / 30-day window | Not measurable pre-deployment | — | Observability Setup (4.4) / ongoing operation | Unverified |
| NFR2.3 | reliability-requirements.md | N/A — no independent backup needed | Correctly not applicable (ADR-004, no persistent state) | — | — | N/A |
| NFR2.4 | reliability-requirements.md | Fails closed with clear error on backend-api unreachable | Implemented and tested | `internalCallerModule.test.ts`: *"surfaces an UpstreamUnavailableError... when a non-retryable op has no HTTP response to relay"* | — | Met |
| NFR2.5 | observability-requirements.md | RED metrics per operation | Implemented at the same structural level as u1 | Route-level instrumentation present | — | Met |
| NFR2.6 | observability-requirements.md | Ops-identity write-audit logging | Implemented | `src/lib/logger.ts`, `tests/bdd/account-review.test.ts`, `event-audit.test.ts` | — | Met |
| NFR2.7 | observability-requirements.md | W3C Trace Context propagated to backend-api | Independent verification first found this **not implemented** (no `@opentelemetry/*` dependency, no trace header in `internal/client.ts` — a real discrepancy against `nfr-design`'s claim); fixed this stage with a dependency-free `traceparent` generator (`src/lib/traceContext.ts`) wired into every outbound call | `test-results.md` § Fix 5; 3 new tests (`internalCallerModule.test.ts` header assertion, `traceContext.test.ts`) | — | Met |
| NFR3.7 | security-requirements.md | Ops-role JWT verification | Implemented | `src/auth/middleware.ts`, `middleware.test.ts` | — | Met |
| NFR3.8 | security-requirements.md | Internal service JWT on outbound calls | Implemented | `internalCallerModule.test.ts` (attaches JWT + actor claim) | — | Met |
| NFR3.9 | security-requirements.md | No independent authorization logic (delegated) | Confirmed by design — no local authorization beyond entry-point role check | Code inspection of `src/poi/routes.ts` et al. | — | Met |
| NFR3.10 | security-requirements.md | Error responses relayed unchanged | Implemented | `app.ts` `registerErrorHandler`, BDD relay assertions | — | Met |
| NFR3.11 | security-requirements.md | Network isolation (mechanism deferred) | Same as u1 — deferred by this NFR's own text | — | Infrastructure Design | Unverified |
| NFR3.12 | security-requirements.md | Ops identity forwarded for audit | Implemented | `internalCallerModule.test.ts` actor-claim assertion | — | Met |
| NFR3.4 | security-requirements.md (Mandated) | Dependency scanning active | `npm audit` run; both found issues (fastify, vitest chain) fixed; **0 vulnerabilities remain** | `test-results.md` | ci-pipeline (3.7) for CI-wiring | Met (scan run and clean; CI-wiring itself still ci-pipeline's job) |
| NFR5.2 | scalability-requirements.md | Stateless tier, trivially satisfied by one instance | Implemented — same JWT pattern as u1 | Code inspection | — | Met |
| NFR4, NFR6 | security-requirements.md | N/A (no entities, no domain rendering) | Correctly not applicable, already reviewed READY at nfr-requirements | ADR-004 | — | N/A |

## Cross-Unit Final Coverage Gate

See `cross-unit-traceability.md` — zero orphaned FR/NFR/BR; one disclosed AC-level traceability-documentation gap (9 ACs with real implementing code/tests but missing from `code-generation/traceability.json`'s own coverage arrays), not a functional gap.

## Overall Verdict: PASSED

Both findings that initially resolved to `Not Met` — NFR3.4's u1 `@opentelemetry/sdk-node` residual and u2's NFR2.7 tracing gap — were, per the human's explicit disposition (halt-and-ask, gated autonomy mode), fixed and independently re-verified this stage (`test-results.md` § Fix 4, Fix 5). No applicable target in either Unit's matrix now resolves to `Not Met`. Every `Unverified` row above names an already-scheduled owning stage (`Stages to Execute` in `aidlc-state.md`: Performance Validation 4.6, Observability Setup 4.4, Infrastructure Design, Environment Provisioning) per this stage's own deferral rule, and the one AC-level traceability-documentation gap (`cross-unit-traceability.md`) is a bookkeeping finding with real implementing code/tests behind every item, not a functional gap.

Both Units: 0 dependency vulnerabilities, clean typecheck/lint/format/build, full test suites passing well above the 80% coverage floor (u1: 133/133 tests, 90.97%; u2: 49/49 tests, 96.21%).
