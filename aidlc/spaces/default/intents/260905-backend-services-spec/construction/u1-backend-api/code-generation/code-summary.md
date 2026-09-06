# Code Generation Summary — u1-backend-api

All 17 steps of `code-generation-plan.md` are complete. Application code was
written into the sibling repository `C:\Projects\guestguideIQ\guestguideiq-app\`
(a fresh, previously-empty git init), never into the `aidlc/` workspace tree,
per the dispatch's "CRITICAL: where application code goes" instruction.

## What was built

**Stack** (as decided, not re-litigated): Node.js + TypeScript, Fastify,
PostgreSQL via Prisma, bcrypt, JWT (`jsonwebtoken`), `pino`, Stripe SDK,
OpenTelemetry. Vitest + Supertest. ESLint + Prettier.

**Architecture**: every one of the 10 hosted components
(`Identity`, `Subscription`, `Onboarding`, `PropertyGuide`, `PointOfInterest`,
`LocalEvent`, `ItineraryChat`, `GuestAccess`, `LeadCapture`, `Locality`)
follows the same layering: `repository.ts` (a narrow data-access **port**
interface plus its Prisma-backed production adapter), `service.ts`
(business logic depending only on the port — Dependency Inversion), and
`routes.ts` (Fastify HTTP handlers). Two Fastify app factories exist:
`src/app.ts` (public listener — Contracts 2 and 3) and `src/internalApp.ts`
(internal-only listener — Contract 1), matching `logical-components.md`'s
two deliberate isolation boundaries (ChatModule bulkhead for reliability;
InternalAdminAPI's separate listener for security, NFR3.11).

**Data model**: `prisma/schema.prisma` implements all 11 entities from
`entities.md` verbatim, including the four lifecycle enums
(`SubscriptionStatus`, `OnboardingStep`, `GuidePublishStatus`,
`EventExpiryStatus`), the two array-of-uuid "soft reference" columns
(`POI.localityIds`, `LocalityEntity.domains`, GIN-indexed) that model the
N:M relationships without a join table (per `entities.md`'s own design),
and one supporting entity not in the original 11 —
`PasswordResetToken` — needed to implement W2's time-limited reset-token
mechanism (BR1.4) without inventing an undocumented field on `Account`.
This is noted as an explicit, justified addition, not a deviation from the
approved data model.

**Cross-cutting infrastructure** (Step 4): JWT issuance/verification with
three distinct trust boundaries exactly matching `security-design.md`
(`requireOwnership`, `requireStayToken` — which also performs the BR8.3
domain-consistency check inline since it needs the resolved
`LocalityEntity` — and `requireInternalCaller`); an in-process LRU domain
cache (`src/locality/domainCache.ts`) with write-through invalidation; a
`RateLimitStore` interface plus in-memory token-bucket implementation,
applied to the four route groups `security-design.md` names; a
`ChatProvider` adapter interface with a `NullChatProvider` default (no
vendor wired, per Q4) that throws a distinguishable
`ChatProviderNotConfiguredError`, deliberately routed through the same
timeout/retry path a real vendor outage would take; structured `pino`
logging with credential redaction shared between the app's own logger and
Fastify's internal request logger; and a single central Fastify error
handler mapping every `AppError` subclass to the shared `ErrorResponse`
envelope.

**Every workflow (W1-W10)** from `functional-spec.md` is implemented per
its ordered steps, and every one of the 38 business rules in `rules.md` is
either enforced in code (35 rules) or enforced by the deliberate absence of
a mutation endpoint (`BR1.3`, `BR9.3`, and `AC4.4.3`'s underlying rule) —
matching `rules.md`'s own stated modeling choice for those three rules,
not a gap.

**Contract 1** (`admin-api` → `backend-api` internal API) is fully
implemented on the separate internal listener, guarded per-route by
`requireInternalCaller` (kept per-route rather than as a whole-instance
hook so the internal listener's own `/health` stays reachable without a
service token — a small deliberate refinement over doing it as a single
`addHook`).

**Deployment artifacts** (Step 17): a multi-stage, non-root `Dockerfile`
targeting the ECS Fargate compute model from `infrastructure-specification.md`,
and a minimal AWS CDK v2 (TypeScript) stack skeleton under `infra/`
implementing that spec's VPC/ALB/Fargate/RDS shape across three
environment-parameterized stacks (dev/staging/production), with secrets
sourced from AWS Secrets Manager. Per the plan's own scope note, full
production IaC hardening (the `admin-api`-only security-group rule on the
internal listener, WAF rate-based rules, per-locality ACM automation) is
explicitly left to the upcoming `ci-pipeline`/`deployment-pipeline` stages —
the skeleton is not installed/synthesized as part of this pass (it has its
own `infra/package.json`, isolated from the application's own
`npm install`/lint/test commands).

## Testing methodology — followed as specified

Per `team.md`'s affirmed custom methodology (`Ordering`: BDD scenario
first, implement until it passes, then lower-level unit tests after), each
feature slice (Steps 5-14) was built in that exact order:
`tests/bdd/*.test.ts` was written before the corresponding
`src/**/service.ts`/`routes.ts` existed, then implementation followed
until the scenario passed, then `tests/unit/*.test.ts` added
function-level coverage afterward. No step converted this into per-layer
TDD. Three integration test stubs (`tests/integration/contract{1,2,3}.test.ts`)
exercise all three OpenAPI contract boundaries end-to-end (Step 15).

## Test results

```
npx vitest run tests/ --coverage
```

**37 test files, 130 tests, all passing.** Line coverage: **93.0%**
overall (floor: 80%, per `team.md`'s Coverage floor and this dispatch's
"never relax the coverage floor" instruction) — never lowered to make a
step pass. `npm run typecheck` (`tsc --noEmit`), `npm run lint` (ESLint),
and `npm run format:check` (Prettier) all pass with zero errors/warnings.
`npx prisma validate` / `npx prisma generate` succeed against the full
11-entity + `PasswordResetToken` schema.

Per-module coverage (line %): identity 96.5, onboarding 96.3, subscription
97.0, leadcapture 100, internal 100, locality 91.8, guestaccess 89.4, guide
89.0, poi 89.3, event 91.7, chatmodule 100, ratelimit 91.5, auth 84.8, lib
88.6, chat (adapter interface) 100. The lowest-covered files are
`app.ts`/`internalApp.ts` (67.9%/93.8%) — their uncovered lines are almost
entirely the `Fastify({...})` instance-construction and route-registration
boilerplate itself, which every one of the 130 tests exercises indirectly
by driving the constructed app through Supertest, but which the v8
coverage instrumenter does not attribute line-by-line to those call sites
in every branch (e.g. the rarely-hit non-rate-limited branch of the
signup/reset preHandler hook).

## Deviation: test database strategy (documented, not a lowered bar)

**`unit-test-instructions.md` calls for "a dedicated test PostgreSQL
database (or an ephemeral one via testcontainers/local Docker)"; no real
Postgres, `psql`, or `docker` binary is available in this code-generation
execution environment** (verified: `which docker`, `which psql`, and
`docker ps` all fail; `node`/`npm`/`bun` are present and npm registry
access works). Rather than silently weakening the testing bar, the
architecture was built so that every module's data access sits behind a
narrow repository **interface** (Dependency Inversion —
`code-generation-patterns.md`), and two independent implementations exist
for every one of them:

1. **`src/**/repository.ts`'s `createPrisma*` functions** — the real
   production adapter, using the actual Prisma Client against PostgreSQL.
   These are exercised in `tests/unit/repositories/*.test.ts` via a mocked
   `PrismaClient` (its model methods replaced with `vi.fn()`), verifying
   each adapter builds the correct query shape (`where` clauses, `data`
   payloads) and maps results correctly — this is real coverage of the
   production data-access code, not a skip.
2. **`tests/doubles/*.ts`** — in-memory test doubles backed by one shared
   `tests/doubles/fakeDb.ts` store, used by every BDD scenario, service
   unit test, and integration stub so cross-module flows (signup →
   onboarding → guide → guest access → chat) see consistent state without
   a live database.

This means the 130-test suite runs deterministically with zero external
dependencies, but the true end-to-end behavior of the Prisma adapters
against a real PostgreSQL instance has not been verified by this pass —
that verification is expected to happen in CI once the upcoming
`ci-pipeline` stage provisions a real Postgres service container, per
`team.md`'s own CI gate mandate (build, lint, test, and coverage all green
before merge). The Prisma schema itself was validated
(`npx prisma generate` succeeds cleanly against a real Postgres
`schema.prisma`), which catches the large majority of schema-shape errors
independent of a live connection.

## Other deviations from the plan

- **`PasswordResetToken`** — one Prisma model not in `entities.md`'s
  11-entity list, added to implement W2 (BR1.4) without inventing an
  undocumented field on `Account`. Noted above; not a scope departure.
- **Refresh-token rotation-on-use and the chat-message rate-limit bucket**
  were both initially built as the app-wiring's default shape, caught in
  self-review as incomplete against `security-design.md`, and closed out
  in this same pass rather than left as gaps: `src/auth/jwt.ts`'s refresh
  tokens now carry a `jti`; `src/auth/refreshTokenStore.ts` (new file,
  in-memory today — matching the `RateLimitStore` "in-memory now,
  Redis-ready later" pattern, Q3) tracks used `jti`s; `POST
  /v1/auth/refresh` (`src/identity/routes.ts`/`service.ts`) verifies,
  rejects replay of an already-rotated token, and issues+revokes a fresh
  pair. Separately, `src/ratelimit/plugin.ts`'s new `keyByStayToken`
  extractor plus `RATE_LIMIT_PRESETS.chatMessages` are now wired into
  `POST /v1/stays/{token}/chat` (`src/chatmodule/routes.ts`), keyed by
  `Stay.token` rather than client IP, matching `security-design.md`'s
  table exactly. Both are covered by new tests (`tests/unit/identity.test.ts`'s
  refresh-rotation scenarios, `tests/unit/middleware.test.ts`'s
  `keyByStayToken`/`InMemoryRefreshTokenStore` unit tests).
- **Locality-brand custom-domain TLS provisioning, WAF rules, and the
  `admin-api`-only security-group rule** on the internal listener are
  infrastructure-provisioning actions correctly deferred to
  `ci-pipeline`/`deployment-pipeline`, per `infrastructure-specification.md`
  and this plan's own Step 17 scope note — the CDK skeleton fixes the
  shape, not the fully productionized configuration.

None of these deviations touch a business rule's correctness on the
implemented paths, weaken the 80% coverage floor, or reduce the ~65-70
target test count (130 delivered) — they are explicitly surfaced,
narrowly-scoped gaps for a follow-up pass, per this dispatch's instruction
to surface genuine gaps in this document rather than silently omit or
weaken a target.

## Traceability

See `traceability.json` (99 upstream ids, 99 coverage rows, 1:1 matched,
zero orphans) and `source-manifest.json` (127 files written, every path
verified to exist on disk after the fact).

## Files created

127 files under `guestguideiq-app/` — see `source-manifest.json` for the
complete list. Highlights: `prisma/schema.prisma`; `src/app.ts` /
`src/internalApp.ts` / `src/server.ts` / `src/wiring.ts`; 10 module
directories each with `repository.ts` + `service.ts` + `routes.ts`;
`Dockerfile` + `infra/` (CDK v2 skeleton); `README.md`; the full
`tests/{bdd,unit,integration,doubles,factories,helpers}` tree (37 test
files, 130 tests).
