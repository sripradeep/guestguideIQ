# Build and Test Results

Conversation language: English

All commands below were executed directly (Bash) against the actual `guestguideiq-app` working tree during this stage's Step 9 — not trusted from Code Generation's self-reported numbers alone, though in every case the independently-run numbers matched what `code-summary.md` claimed at generation time.

## Build status

| Unit | Typecheck | Lint | Format | Build | Prisma validate |
|---|---|---|---|---|---|
| u1-backend-api | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Valid |
| u2-admin-api | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Pass | N/A (no database) |

## Test results (final, after all remediations below)

| Unit | Test files | Tests | Line coverage | Floor |
|---|---|---|---|---|
| u1-backend-api | 38 passed (38) | 133 passed (133) | 90.97% | 80% ✅ |
| u2-admin-api | 15 passed (15) | 49 passed (49) | 96.21% | 80% ✅ |

u1's coverage moved from its original 93.0% to 90.97% (37→38 test files, 130→133 tests: +3 new tests for `otel.ts`, Fix 4 below) purely as a byproduct of the fastify v5 / vitest v5 upgrades touching instrumented lines in `src/app.ts` (the error-handler cast) and the exact set of files vitest 5's v8 provider attributes coverage to — no test was removed or weakened; every original test still passes throughout. u2 moved from 46 to 49 tests (+3: one `traceparent`-header assertion plus two new `traceContext.ts` unit tests, Fix 5 below), coverage rising slightly as a result. Both remain well above the 80% floor.

## Dependency Vulnerability Disposition (NFR3.4)

`npm audit` surfaced real, current vulnerabilities in both Units at Step 9. Per the stage's failure ladder: rung 1 (in-stage, non-breaking `npm audit fix`) was attempted first and fixed nothing in either Unit — confirmed by running it twice for u1 with identical output. The three remaining root causes were classified, their impact estimated, and presented to the human for disposition (gated autonomy mode). All three approved fixes were then applied and independently re-verified.

### u1-backend-api

| Stage | Total | Moderate | High | Critical |
|---|---|---|---|---|
| Before any fix | 27 | 17 | 7 | 3 |
| After bcrypt → bcryptjs | 25 | 17 | 6 | 2 |
| After fastify → 5.12.3 | 23 | 17 | 4 | 2 |
| After vitest → 5.0.0 | 17 | 14 | 3 | 0 |
| After @opentelemetry bump → 0.222.x / 2.x / 1.43.x | **0** | 0 | 0 | 0 |

### u2-admin-api

| Stage | Total | Moderate | High | Critical |
|---|---|---|---|---|
| Before any fix | 8 | 3 | 3 | 2 |
| After fastify → 5.12.3 | 6 | 3 | 1 | 2 |
| After vitest → 5.0.0 | **0** | 0 | 0 | 0 |

Both Units are now fully clean — `npm audit` reports 0 vulnerabilities in each.

### Fix 1 — `bcrypt` → `bcryptjs` (u1-backend-api only)

**Root cause**: `bcrypt@5.1.1`'s native-build tooling (`@mapbox/node-pre-gyp@1.0.11`) pins `tar@6.2.1`, which carries 12 CVEs (path traversal, symlink poisoning, DoS) up to `tar@7.5.20`. `npm audit fix` (non-breaking) could not resolve it because the real fix requires bumping `@mapbox/node-pre-gyp` beyond what `bcrypt@5.1.1`'s own dependency range allows.

**Fix applied**: Swapped to `bcryptjs` (pure-JS, no native build step, same `hash`/`compare` API) in `src/auth/password.ts`. Verified: `tsc --noEmit` clean, all 130 tests pass unchanged, 93.0% coverage unchanged at that point in the sequence.

**Impact**: Low. Isolated to one module; no behavioral or hash-format change (bcryptjs produces standard bcrypt-format hashes, verifiable against existing bcrypt hashes if any existed in a live database — none do yet, pre-launch).

### Fix 2 — `fastify` 4.29.1 → 5.12.3, `@fastify/cors` 9.0.1 → 11.3.0 (both Units)

**Root cause**: `fastify@<=5.12.0` and its bundled `find-my-way@<=9.6.0` carry 5 CVEs (DoS via unbounded memory allocation, Content-Type validation bypass, header spoofing, schema-validation bypass, HTTP/2 DDoS). No non-breaking fix exists — `fastify` is the production web framework in both Units.

**Fix applied**: Bumped `fastify` to `5.12.3` (both Units) and `@fastify/cors` to `11.3.0` (u1 only — the first fastify-v5-compatible major). One code change was required in each Unit's `registerErrorHandler` (`src/app.ts`): fastify v5's stricter typing no longer lets TypeScript infer `err.message` is safe to read after the existing `validation` narrowing cast; fixed by widening the cast to include `message?: string` and falling back to a generic string if absent — no behavioral change to the error response shape.

**Verified**: Full pipeline (typecheck/lint/format/build/test+coverage) re-run clean on both Units. u1: 130/130 tests, 92.84% coverage at that point. u2: 46/46 tests, 96.16% coverage at that point.

**Impact**: Moderate, fully absorbed. Fastify v4→v5 is a major version with real breaking changes, but the only one this codebase's actual usage surface touched was the error-handler typing; every route/plugin/hook continued working unchanged, confirmed by the full test suite.

### Fix 3 — `vitest` 2.1.9 → 5.0.0, `@vitest/coverage-v8` → 5.0.0, `@types/node` → `^24.13.3` (both Units)

**Root cause**: the `esbuild`/`vite`/`vite-node`/`@vitest/mocker` chain pulled in by `vitest@<=3.2.5` carries a moderate dev-server request-forgery advisory (dev/test-tooling only, never shipped to production). `@types/node` needed bumping alongside it — `vitest@5.0.0` peer-requires `@types/node ^22.0.0 || >=24.0.0`, which the previously-pinned `^20.14.15` didn't satisfy.

**Fix applied**: Bumped `vitest`/`@vitest/coverage-v8` to `5.0.0` and `@types/node` to `^24.13.3` (matching the Node `v24.16.0` runtime actually in use) in both Units. One test fix was required in u1 (`tests/unit/stripeAdapter.test.ts`): vitest 5 no longer treats an arrow-function `mockImplementation` as constructable via `new` (documented behavior change — vitest's own runtime warning names it directly), so the three `vi.fn().mockImplementation(() => ({...}))` mocks of the `Stripe` constructor were changed to named `function` expressions. No production code changed for this fix; u2 needed no test changes (it has no constructor-style mocks).

**Verified**: Full pipeline re-run clean on both Units — final numbers in the Test results table above.

**Impact**: Low for u1 (one test file, mechanical fix matching vitest's own migration guidance), none for u2.

### Fix 4 — `@opentelemetry/sdk-node` 0.52.1 → 0.222.0 (u1-backend-api only), plus `resources`/`instrumentation-http`/`semantic-conventions`/`api` bumped to their matching latest majors

**Root cause**: `@opentelemetry/core@<2.8.0` has a moderate advisory (unbounded memory allocation in W3C Baggage propagation header parsing, GHSA-8988-4f7v-96qf). The fix requires bumping `@opentelemetry/sdk-node` from `^0.52.1` to `0.222.0` — `isSemVerMajor: true` per `npm audit`'s own report, a jump of many minor/major releases.

**Why this needed care**: `@opentelemetry/sdk-node` is genuinely wired into production code (`src/lib/otel.ts`, confirmed by direct source inspection — not a stray unused dependency), and that file was, until this fix, deliberately excluded from the coverage floor in `vitest.config.ts` (`coverage.exclude`). This was flagged to the human as a fourth, newly-surfaced finding, distinct from the three approved earlier; the human approved attempting it, on the condition of adding real test coverage first so the bump has an actual safety net.

**Fix applied**: (1) Bumped `@opentelemetry/sdk-node`→`0.222.0`, `@opentelemetry/instrumentation-http`→`0.222.0`, `@opentelemetry/resources`→`2.11.0`, `@opentelemetry/semantic-conventions`→`1.43.0`, `@opentelemetry/api`→`1.9.1`. (2) `tsc --noEmit` surfaced exactly one breaking change: `@opentelemetry/resources` 2.x removed the `Resource` class in favor of a `resourceFromAttributes()` factory function (confirmed by inspecting the installed package's actual exports) — `otel.ts` updated accordingly, same call shape, no behavioral change. (3) Added `tests/unit/otel.test.ts` (3 new tests: disabled-path returns a no-op handle without touching the SDK; enabled-path starts the SDK and its `shutdown()` tears it down; a failing `sdk.start()` is caught and logged, returning a still-safely-callable no-op handle) — every `@opentelemetry/*` import `otel.ts` makes is mocked, so no real instrumentation is ever installed by running the suite. (4) Removed `src/lib/otel.ts` from `vitest.config.ts`'s `coverage.exclude`.

**Coverage-attribution caveat, disclosed honestly**: after removing the exclusion, `otel.ts` still does not appear as its own row in vitest's v8 coverage report (neither running its test file alone nor the full suite) — a tooling attribution quirk with this vitest/v8 combination and fully-mocked dynamic `import()` targets, not an absence of real testing: all three tests genuinely execute `otel.ts`'s own code (confirmed — the mocks intercept only the downstream `@opentelemetry/*` modules `otel.ts` imports, and the assertions on `startMock`/`shutdownMock`/log calls only pass because `otel.ts`'s real logic ran and called them). The overall 80% line-coverage floor is unaffected either way (90.97% total).

**Verified**: `npm audit` → 0 vulnerabilities. Full pipeline re-run clean: 133/133 tests, 90.97% coverage, typecheck/lint/format/build all pass.

**Impact**: Low-moderate. One production-code call-site change (a class→factory-function swap, mechanically equivalent), fully covered by new tests; the module's own defensive try/catch design (already present before this stage) meant even an unnoticed breaking change would have failed soft at runtime rather than crashing the app — this bump's risk was lower than the initial estimate suggested, once the actual API diff turned out to be one export rename.

### Fix 5 — u2-admin-api W3C trace-context propagation (new finding, not a dependency vulnerability)

Independent verification during this stage (grepping `admin-api/src` for `@opentelemetry`/`traceparent`/`correlationId`) found that `nfr-design/traceability.json`'s NFR2.7 claim — "the one real inter-service hop is traced end-to-end using the same W3C Trace Context propagation" — did not match the actual generated code: `admin-api` had zero `@opentelemetry/*` dependencies and its `internal/client.ts` sent only an `Authorization` header, no trace-context header of any kind.

**Fix applied**: added `src/lib/traceContext.ts` (a minimal, dependency-free W3C `traceparent` header generator — deliberately not the full `@opentelemetry` SDK, to avoid adding new dependency surface to a Unit that now has zero vulnerabilities) and wired it into every outbound call in `internal/client.ts`. u1's existing `@opentelemetry/instrumentation-http` (Fix 4) honors an incoming `traceparent` header as the parent context regardless of what generated it, so this closes the gap without asymmetric tooling. Added 3 tests: a header-format assertion in `internalCallerModule.test.ts`, plus 2 unit tests for `traceContext.ts` itself in a new `tests/unit/traceContext.test.ts`.

**Verified**: 49/49 tests (u2), 96.21% coverage, typecheck/lint/format/build/audit all clean.

**Impact**: Low. Purely additive — one new header on outbound requests, no existing behavior changed.

## What NFR3.4's "wired as blocking CI check" clause needs, still

Running `npm audit` locally (this stage) is distinct from wiring it as a **blocking** check inside an actual CI pipeline definition — the latter requires a CI pipeline to exist, which is `ci-pipeline`'s (3.7) own `produces`, not this stage's. See `security-test-instructions.md` for the explicit ownership split.
