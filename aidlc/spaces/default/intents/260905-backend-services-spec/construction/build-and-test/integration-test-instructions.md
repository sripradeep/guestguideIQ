# Integration Test Instructions

Conversation language: English

Test Strategy: Standard. Both Units already carry integration-level coverage inside their generated `tests/integration/` and `tests/bdd/` suites (written per `unit-test-instructions.md` at Code Generation, following the team's affirmed BDD-then-unit-tests ordering). This document records how to run them and what they assert, for reproducibility beyond this stage's own execution.

## u1-backend-api

Run: `npm run test:coverage` from `guestguideiq-app/` (runs everything under `tests/`, including `tests/integration/` and `tests/bdd/`; there is no separate integration-only script — the suite is not partitioned by directory at the `npm run` level).

Contract-level integration tests (`tests/integration/`):

| File | Contract | Asserts |
|---|---|---|
| `contract1.test.ts` | Contract 1 (internal API, `/internal/*`) | Internal-only routes reject callers without a valid internal-service JWT; accept `admin-api`'s scoped token; end-to-end shape of the internal POI/locality-mutation surface `admin-api` delegates into |
| `contract2.test.ts` | Contract 2 (Property Owner / Guest public API) | Full request→response round-trips through `createApp()` for the public-facing routes (identity, onboarding, guide, POI, events, subscriptions, guest access, chat) |
| `contract3.test.ts` | Contract 3 (lead capture) | All three lead-form types accept a valid submission end-to-end; a validation failure returns the same `ErrorResponse` envelope as every other contract (FR1.1, FR1.4, AC3.1.1, AC3.2.1) |

BDD scenario suites (`tests/bdd/`) exercise the Given/When/Then acceptance criteria directly against the wired app (via `tests/helpers/buildTestApp.ts`) rather than through unit-level doubles alone — `signup.test.ts`, `guide.test.ts`, `onboarding.test.ts`, `password-reset.test.ts` are the ones with cross-module request flows (signup → locality assignment → onboarding, password reset request → confirm, etc.).

## u2-admin-api

Run: `npm run test:coverage` from `guestguideiq-app/admin-api/`.

`tests/bdd/` (`poi-curation.test.ts`, `event-audit.test.ts`, `account-review.test.ts`, `locality-brand.test.ts`) exercise each of the four ops workflows (W1-W4) end-to-end through `InternalCallerModule`, using `nock` to stand in for `u1-backend-api`'s internal listener rather than a live second process — this keeps the suite hermetic while still exercising the real HTTP client code path (request construction, the internal-service JWT attachment, response relay including error-envelope pass-through per BR1.6).

**Note on true end-to-end (both Units live, real network hop)**: no test in either suite currently boots both Units as separate live processes and drives a request across the wire between them — `u2-admin-api`'s suite mocks `u1-backend-api`'s internal listener at the HTTP-client boundary (`nock`), and `u1-backend-api`'s Contract 1 tests exercise the internal routes in-process. This is consistent with the Standard test strategy (no cross-process integration environment implied) and with NFR3.11's network-isolation mechanism itself being deferred to `infrastructure-design`/`environment-provisioning` — a real two-process integration check is more naturally owned by `ci-pipeline`/`deployment-pipeline` once both Units deploy together, and is noted here rather than treated as a gap in this stage's own remit.

## Results

See `test-results.md` for the actual run output (pass/fail counts, coverage percentages) captured during Step 9 of this stage.
