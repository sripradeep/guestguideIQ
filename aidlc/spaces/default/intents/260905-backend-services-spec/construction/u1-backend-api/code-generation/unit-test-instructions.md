# Unit Test Instructions — u1-backend-api

## Test Framework Setup

- **Runner**: Vitest (`tech-stack-decisions.md`)
- **HTTP testing**: Supertest, driving the Fastify `app.ts` instance directly (no network binding needed for tests)
- **Config**: `vitest.config.ts` at the repo root, `test.include: ["tests/**/*.test.ts"]`
- **Database for tests**: a dedicated test PostgreSQL database (or an ephemeral one via `testcontainers`/local Docker), migrated fresh per test run via Prisma; each test wraps its work in a transaction that rolls back, per `test-strategy-patterns.md`'s test-data isolation guidance

## Running This Unit's Tests

Exact unit-scoped command (bootstrap this in Step 2 before any BDD-first step):

```bash
npx vitest run tests/
```

This runs every test under `tests/` for this Unit only — this repository (`guestguideiq-app`) hosts both `u1-backend-api` and `u2-admin-api`, so `Build and Test` will also record `u2-admin-api`'s own scoped command separately once that Unit's code exists; this command must never be replaced with a bare `npm test` / `vitest run` with no path filter.

## Test Strategy (Standard)

5-8 tests per component, unit tests plus integration test stubs at the three contract boundaries (`contract-summary.md`), per the embedded Testing Contract in `code-generation-plan.md`.

| Component | Test File(s) | Approx. Count |
|---|---|---|
| Identity (signup, auth, reset) | `tests/bdd/signup.test.ts`, `tests/unit/identity.test.ts` | 7 |
| Subscription | `tests/bdd/subscription.test.ts`, `tests/unit/subscription.test.ts` | 6 |
| Onboarding | `tests/bdd/onboarding.test.ts`, `tests/unit/onboarding.test.ts` | 7 |
| PropertyGuide | `tests/bdd/guide.test.ts`, `tests/unit/guide.test.ts` | 6 |
| PointOfInterest | `tests/unit/poi.test.ts` | 5 |
| LocalEvent | `tests/unit/event.test.ts` | 5 |
| ItineraryChat | `tests/bdd/chat.test.ts`, `tests/unit/chat.test.ts` | 8 |
| GuestAccess | `tests/bdd/guest-access.test.ts`, `tests/unit/guest-access.test.ts` | 6 |
| LeadCapture | `tests/bdd/lead-capture.test.ts` | 5 |
| Locality | `tests/unit/locality.test.ts` | 5 |
| Cross-cutting (auth middleware, rate limiting, domain cache) | `tests/unit/middleware.test.ts` | 6 |
| Integration stubs (3 contract boundaries) | `tests/integration/contract1.test.ts`, `tests/integration/contract2.test.ts`, `tests/integration/contract3.test.ts` | 3-6 |

**Total**: ~65-70 tests, within the Standard strategy's per-component 5-8 range across 11 components/cross-cutting groups plus integration stubs.

## Coverage Target

80% line coverage (`team.md` Testing Posture, `classic` scope floor). Configure `vitest.config.ts`'s `coverage.thresholds.lines: 80` — this is a floor to enforce, not a suggestion; `Build and Test` verifies it and it must never be lowered to pass.

## Mocking/Stubbing Guidance

- **Database**: real Postgres (test instance/container) for repository-layer and integration tests — per `test-strategy-patterns.md`'s "use fakes/real dependencies where practical for integration tests," not an in-memory mock, since Prisma's query behavior is part of what's under test.
- **Stripe**: mocked at the SDK boundary (`stripe` client stub) — no real Stripe calls in tests.
- **`ChatProvider`**: a test-double implementation of the adapter interface (deterministic canned replies) — never a real LLM call in tests.
- **`RateLimitStore`**: the real in-memory implementation is fine in tests (no external dependency).
- **Time**: use Vitest's fake timers for any test touching `Stay.expiresAt`/JWT expiry/token-window logic.

## Test Data Management

Factory functions per entity (`tests/factories/`) building valid default objects with override support (per `test-strategy-patterns.md`'s factory/builder guidance) — e.g. `makeAccount({ username: "x" })`. No shared mutable fixtures across tests; each test creates its own data inside its own transaction.
