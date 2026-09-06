# Build Instructions

Conversation language: English

Both Units live in the sibling repository `guestguideiq-app` (`u1-backend-api` at its root, `u2-admin-api` in `guestguideiq-app/admin-api/`). Each Unit is built and verified independently — `u2-admin-api` has no dependency on `u1-backend-api`'s build output, only on its running HTTP surface at test/runtime (Contract 1, via `InternalCallerModule`).

## u1-backend-api (repo root: `guestguideiq-app/`)

| Step | Command | Purpose |
|---|---|---|
| Install | `npm ci` | Reproducible install from `package-lock.json` |
| Typecheck | `npm run typecheck` (`tsc --noEmit -p tsconfig.json`) | Blocking type-check gate (team-practices: distinct from build, per `team.md`'s "Type-checking as a blocking gate") |
| Lint | `npm run lint` (`eslint "src/**/*.ts" "tests/**/*.ts"`) | Blocking lint gate (NFR3.4/Mandated: enforced from day one) |
| Format check | `npm run format:check` (`prettier --check "src/**/*.ts" "tests/**/*.ts"`) | Blocking formatter gate (Mandated) |
| Prisma schema validate | `DATABASE_URL="postgresql://user:pass@localhost:5432/guestguideiq" npx prisma validate` | Schema validity only — no live database required; the placeholder connection string satisfies Prisma's env-var precondition without connecting |
| Build | `npm run build` (`tsc -p tsconfig.json`) | Compiles `src/` to `dist/` |
| Test + coverage | `npm run test:coverage` (`vitest run tests/ --coverage`) | Full suite (unit + BDD + integration) with v8 coverage, 80% line floor enforced via `vitest.config.ts`'s `coverage.thresholds.lines` |
| Dependency audit | `npm audit` | Non-blocking-in-this-stage visibility check; disposition recorded in `test-results.md` |

Node.js `>=18.18` is the package's declared engine floor; this run used Node `v24.16.0`, which also satisfies fastify v5's `>=20` requirement (see Findings in `test-results.md`).

## u2-admin-api (`guestguideiq-app/admin-api/`)

| Step | Command | Purpose |
|---|---|---|
| Install | `npm ci` | Reproducible install |
| Typecheck | `npm run typecheck` | Blocking type-check gate |
| Lint | `npm run lint` | Blocking lint gate |
| Format check | `npm run format:check` | Blocking formatter gate |
| Build | `npm run build` | Compiles `src/` to `dist/` |
| Test + coverage | `npm run test:coverage` (`vitest run tests/ --coverage`) | Full suite with v8 coverage, same 80% line floor |
| Dependency audit | `npm audit` | Same as above |

No Prisma step — `u2-admin-api` owns no database (ADR-004); its own `package.json` has no `@prisma/client` dependency.

## Order of execution

`u1-backend-api` was verified first (it is the dependency direction's root — `admin-api` calls into it at runtime, never the reverse), then `u2-admin-api`. Both must pass every gate above independently; neither Unit's green build substitutes for the other's.

## What this stage changed in the generated code

Five remediations were applied to already-generated, already-reviewed code during this stage's Step 9, across two rounds of human disposition (see `test-results.md` § Dependency Vulnerability Disposition for the full before/after and impact analysis of each):

1. **`bcrypt` → `bcryptjs`** (`u1-backend-api` only) — pure-JS drop-in replacement in `src/auth/password.ts`; same `hash`/`compare` API, eliminates the `@mapbox/node-pre-gyp`/`tar` native-build vulnerability chain.
2. **`fastify` 4.29.1 → 5.12.3** (both Units), **`@fastify/cors` 9.0.1 → 11.3.0** (`u1-backend-api` only) — major-version bump; required one one-line fix per Unit in `registerErrorHandler` (`src/app.ts`), where fastify v5's stricter error-handler typing no longer infers `err` as carrying `.message` after a structural cast.
3. **`vitest` 2.1.9 → 5.0.0, `@vitest/coverage-v8` 2→5** (both Units), **`@types/node` bumped to `^24.13.3`** (both Units, vitest 5's peer requirement) — required one test-file fix in `u1-backend-api` (`tests/unit/stripeAdapter.test.ts`): vitest 5 no longer treats an arrow-function `mockImplementation` as constructable via `new`; changed to a named `function` expression, matching vitest's own documented guidance.
4. **`@opentelemetry/sdk-node` 0.52.1 → 0.222.0** (`u1-backend-api` only, plus its `resources`/`instrumentation-http`/`semantic-conventions`/`api` peers) — required swapping `new Resource(...)` for `resourceFromAttributes(...)` in `src/lib/otel.ts` (the class was removed in `@opentelemetry/resources` 2.x); added `tests/unit/otel.test.ts` and removed `otel.ts` from `vitest.config.ts`'s coverage exclusion.
5. **New W3C trace-context propagation in `u2-admin-api`** — not a dependency bump but a genuine implementation gap found during this stage's independent verification (`nfr-design` claimed it, no code existed for it); added `src/lib/traceContext.ts` and wired a `traceparent` header into every outbound call in `internal/client.ts`.

All five were re-verified with the full pipeline above after each change, on the affected Unit(s) — see `test-results.md` for the exact before/after test and coverage numbers.
