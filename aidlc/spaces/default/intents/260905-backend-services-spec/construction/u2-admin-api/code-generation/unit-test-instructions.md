# Unit Test Instructions — u2-admin-api

## Test Framework Setup

- **Runner**: Vitest, matching `u1-backend-api`'s framework choice (`tech-stack-decisions.md`)
- **HTTP testing**: Supertest, driving the Fastify `app.ts` instance directly (no network binding needed for tests)
- **Outbound HTTP mocking**: `nock`, intercepting `InternalCallerModule`'s calls to `backend-api`'s internal API (Contract 1) — `admin-api` has no database and no in-process dependency on `u1-backend-api`'s code, so its own tests never start a second server; they stub the HTTP boundary instead
- **Config**: `vitest.config.ts` at `admin-api/`'s own root, `test.include: ["tests/**/*.test.ts"]`

## Running This Unit's Tests

Exact unit-scoped command (bootstrap this in Step 2 before any BDD-first step), run from inside the `admin-api/` directory:

```bash
npx vitest run tests/
```

This runs every test under `admin-api/tests/` for this Unit only — this repository (`guestguideiq-app`) hosts both `u1-backend-api` (at its root) and `u2-admin-api` (under `admin-api/`) as two fully independent Node projects, per `code-generation-plan.md`'s repository-placement interpretation. `Build and Test` runs each Unit's scoped command separately from its own directory; neither command is ever replaced with a single repo-root `npm test`.

## Test Strategy (Standard)

5-8 tests per workflow, unit tests plus one integration test stub at the Contract 1 boundary, per the embedded Testing Contract in `code-generation-plan.md`. `Admin` is a single, data-less component (`entities.md`), so this Unit's "components" for volume-planning purposes are its four workflows plus the shared cross-cutting middleware.

| Workflow / Group | Test File(s) | Approx. Count |
|---|---|---|
| W1 — POI curation | `tests/bdd/poi-curation.test.ts`, `tests/unit/poi.test.ts` | 6 |
| W2 — Event lifecycle audit | `tests/bdd/event-audit.test.ts`, `tests/unit/events.test.ts` | 6 |
| W3 — Account review | `tests/bdd/account-review.test.ts`, `tests/unit/accounts.test.ts` | 5 |
| W4 — Locality-brand management | `tests/bdd/locality-brand.test.ts`, `tests/unit/localities.test.ts` | 7 |
| Cross-cutting (ops-role auth middleware, `InternalCallerModule` retry/relay policy) | `tests/unit/middleware.test.ts`, `tests/unit/internalCallerModule.test.ts` | 8 |
| Integration stub (Contract 1 boundary) | `tests/integration/contract1.test.ts` | 3-5 |

**Total**: ~35-40 tests, within the Standard strategy's per-workflow 5-8 range across 4 workflows plus one cross-cutting group and an integration stub — proportionally scaled down from `u1-backend-api`'s ~65-70 to match this Unit's single-component, no-database, pure-delegation shape (M complexity vs. XL).

## Coverage Target

80% line coverage (`team.md` Testing Posture, `classic` scope floor). Configure `admin-api/vitest.config.ts`'s `coverage.thresholds.lines: 80` — this is a floor to enforce, not a suggestion; `Build and Test` verifies it and it must never be lowered to pass.

## Mocking/Stubbing Guidance

- **`backend-api` (Contract 1)**: mocked exclusively via `nock` at the HTTP boundary — `admin-api` never imports or runs any of `u1-backend-api`'s code in its own test suite, matching the two Units' "Standalone — deploys independently" status (`unit-of-work.md`).
- **JWT signing/verification**: real `jsonwebtoken` calls against test-fixture secrets (fast, deterministic, no external dependency) — exercises the actual `ops`-role claim check rather than mocking it away.
- **Time**: Vitest fake timers for any test touching JWT expiry or the retry backoff delays in `InternalCallerModule`.
- **Retry backoff**: tests assert retry *count* and *classification* (retried vs. not-retried operation) against mocked `502`/`503`/`504`/timeout responses from `nock`, not real wall-clock delays — fake timers advance past the backoff windows.

## Test Data Management

Factory functions (`tests/factories/`) building valid default request payloads per workflow (e.g. `makePoiPayload({ name: "x" })`) with override support, matching `u1-backend-api`'s factory pattern. No shared mutable fixtures across tests.
