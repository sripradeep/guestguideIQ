# Code Structure — `guestguideiq-app`

**Derived from**: the developer full-repo scan of 2026-09-07. Component responsibilities live in `component-inventory.md`; dependency tables live in `dependencies.md`. This file covers directory layout, file classification, and the code patterns a new frontend repo should either inherit or deliberately diverge from.

---

## Repository Layout

```
guestguideiq-app/
├── README.md                      # substantial, accurate, current
├── package.json  package-lock.json
├── tsconfig.json                  # typecheck: src/ + tests/ + vitest.config.ts
├── tsconfig.build.json            # emit only: rootDir src, outDir dist
├── vitest.config.ts               # coverage thresholds live here
├── .eslintrc.cjs  .prettierrc  .prettierignore
├── .gitignore  .dockerignore  .env.example
├── Dockerfile  docker-entrypoint.sh
├── .github/workflows/ci.yml       # the single CI file
├── prisma/
│   ├── schema.prisma              # 11 entities, authoritative data shape
│   └── migrations/20260906234912_init/
├── src/                           # 3 268 lines total
│   ├── app.ts                     # public Fastify instance (175 lines, largest file)
│   ├── internalApp.ts             # internal Fastify instance
│   ├── server.ts                  # process entry, starts both listeners
│   ├── config.ts                  # env parsing, fail-fast
│   ├── wiring.ts                  # SOLE composition root
│   ├── lib/                       # errors.ts, logger.ts, otel.ts, ids.ts
│   ├── auth/                      # jwt.ts, middleware.ts, password.ts, refreshTokenStore.ts
│   ├── ratelimit/                 # plugin.ts, types.ts, memoryStore.ts
│   ├── chat/provider.ts
│   ├── db/prismaClient.ts
│   ├── internal/routes.ts         # Contract 1 surface
│   └── <domain>/                  # identity, onboarding, guide, poi, event,
│                                  # subscription, guestaccess, chatmodule,
│                                  # leadcapture, locality
├── tests/                         # 3 378 lines — more test code than source
│   ├── bdd/            (9 files)
│   ├── unit/           (13 files + unit/repositories/ 11)
│   ├── integration/    (4 files, incl. contract2 and contract3)
│   ├── smoke.test.ts
│   ├── doubles/        (13 in-memory port implementations)
│   ├── factories/      (4, incl. stayFactory.ts)
│   └── helpers/        (3, incl. buildTestApp.ts)
├── infra/                         # u1 CDK v2 app
│   ├── bin/backend-api.ts         # domainConfig: per-env allowedOrigins, cert ARN
│   ├── lib/backend-api-stack.ts
│   └── cdk.json  cdk.context.json  package.json  tsconfig.json
└── admin-api/                     # fully independent sibling project
    ├── README.md  package.json  package-lock.json  tsconfig.json
    ├── vitest.config.ts  .eslintrc.cjs  .env.example  Dockerfile
    ├── src/
    │   ├── app.ts  config.ts  server.ts  wiring.ts
    │   ├── auth/{jwt.ts,middleware.ts}
    │   ├── internal/{types.ts,client.ts}
    │   └── {poi,events,accounts,localities}/routes.ts
    ├── tests/                     # bdd (4), unit (9), integration, smoke, factories, helpers
    └── infra/                     # u2's own CDK app
```

**Four independent `package-lock.json` files** — root, `admin-api/`, `infra/`, `admin-api/infra/`. Four independent dependency trees, **no npm workspaces, no hoisting, no shared code**.

## The Dominant Pattern: the module triad

Every u1 domain module is exactly three files with the same roles, applied consistently across all ten with **no observed violation**:

| File | Role | May import |
|---|---|---|
| `routes.ts` | HTTP shape only — path, method, status codes, body extraction, error mapping | its own `service.ts` |
| `service.ts` | Business rules and cross-component orchestration | its own `repository.ts` **port interface** and other components' services |
| `repository.ts` | A narrow **port interface** and record types at the top; the Prisma **adapter** implementing it below | `@prisma/client` |

`src/wiring.ts` is the **only** place a Prisma adapter is constructed. This single-composition-root discipline is what makes the in-memory test doubles work at all. No circular imports were observed.

The convention worth carrying into a frontend repo is the shape, not the specifics: **one narrow port per external dependency, a single composition root, and a layer that may only be imported downward**. `team.md` already anticipates encoding this as ESLint import-restriction rules rather than leaving it to review.

## File Classification

| Class | Where | Count / size |
|---|---|---|
| HTTP entry points | `src/*/routes.ts`, `src/internal/routes.ts` | 11 in u1, 4 in u2 |
| Business logic | `src/*/service.ts` | 10 in u1 |
| Persistence ports + adapters | `src/*/repository.ts` | 10 in u1 |
| Composition | `src/wiring.ts`, `src/app.ts`, `src/internalApp.ts`, `src/server.ts` | 4 |
| Cross-cutting | `src/lib/`, `src/auth/`, `src/ratelimit/`, `src/chat/`, `src/db/` | 12 files |
| Schema / migration | `prisma/` | 1 schema, 1 migration |
| Tests | `tests/`, `admin-api/tests/` | 40 u1 files, 15 u2 files |
| Test support | `tests/doubles/`, `factories/`, `helpers/` | 20 files |
| IaC | `infra/`, `admin-api/infra/` | 2 CDK apps |
| Config | root and `admin-api/` dotfiles | ~10 per package |

**No file in u1 `src/` exceeds 175 lines.** Source is 3 268 lines against 3 378 lines of tests.

## Naming Conventions

- **Files**: `camelCase.ts` throughout (`prismaClient.ts`, `refreshTokenStore.ts`, `propertyLookup.ts`, `stripeAdapter.ts`, `domainCache.ts`). The triad filenames (`routes.ts`, `service.ts`, `repository.ts`) are fixed and repeated per directory — the directory carries the domain name, the file carries the layer.
- **Directories**: lowercase, single-word domain nouns (`identity`, `onboarding`, `guide`, `poi`, `event`, `subscription`, `guestaccess`, `chatmodule`, `leadcapture`, `locality`). Note the two compound names are unseparated, not kebab-cased.
- **Types and classes**: `PascalCase` (`OwnerGuideView`, `StayService`, `InternalApiError`, `NullChatProvider`, `InMemoryRateLimitStore`).
- **Constants**: `SCREAMING_SNAKE_CASE` (`RATE_LIMIT_PRESETS`).
- **Test files**: `*.test.ts` under a directory naming the test kind (`bdd/`, `unit/`, `integration/`).
- **Path alias**: `@/*` → `src/*` in both packages.

This matches the precedent `team.md` already records for a TypeScript/Node backend (`camelCase.ts` files, `PascalCase` constructs) and is a reasonable default for a TypeScript frontend repo too.

## Organisation Style: feature-based, not layer-based

u1 groups by **domain feature** (`src/identity/`, `src/guide/`) with the layer expressed as the filename inside it — not by layer (`src/controllers/`, `src/services/`). Cross-cutting concerns are the exception and live in shared directories (`lib/`, `auth/`, `ratelimit/`). `team.md` records this choice as previously deferred for the backend; the backend has now resolved it feature-first, and the same question is open for the frontend.

## Code Patterns Observed

- **Fail-fast configuration**: `config.ts` reads every value from `process.env` and throws at startup on anything missing. No defaults that would silently work in the wrong environment, and no secrets in code.
- **A single error envelope built centrally**: `lib/errors.ts:toErrorEnvelope` is the one place the wire shape is produced; route handlers throw typed errors rather than assembling responses.
- **Deliberate information hiding in failure paths**: identical `401` for unknown-user and wrong-password; identical `410 LINK_INVALID` for all four stay-link failure modes; `202` always on password-reset request.
- **Server-supplied empty-state copy**: list endpoints return `isEmptyLocality` and a canned `emptyMessage` rather than leaving the client to invent it.
- **Unvalidated body casting** — the anti-pattern: u1's public routes have **no Fastify JSON schemas**; bodies are cast with `as`, most with a `?? {}` fallback. Two routes lack it and throw `500` on a missing body. u2's routes **do** carry schemas, so the good pattern exists in the repo and simply was not applied to the public surface.
- **In-memory stores with an acknowledged upgrade path**: `InMemoryRefreshTokenStore` and `InMemoryRateLimitStore` both carry comments naming Redis as the intended replacement. The comment exists; the wiring does not.
- **Traceability comments**: nearly every non-obvious decision cites the design artifact that motivated it (`security-design.md`, `BR8.3`, `NFR3.11`, `AC4.3.2`, …), and several carry a post-mortem of a real deployment failure. This is unusually disciplined and is the single practice most worth replicating in the frontend repo.
- **Marker hygiene**: **zero** `TODO` / `FIXME` / `HACK` / `XXX` comments and **zero** `@ts-ignore` / `@ts-expect-error` across all TypeScript in `src/`, `tests/`, `admin-api/`, and `infra/`. Only two `eslint-disable` comments exist repo-wide, both `no-console` on a fatal-startup `console.error`.

## Test Code Organisation

Three tiers, mirrored in both packages: `bdd/` (given/when/then scenarios crossing modules), `unit/` (per-module, plus `unit/repositories/` against a mocked `PrismaClient`), `integration/` (contract tests, plus a DB smoke test gated on `RUN_DB_SMOKE_TEST=1`).

The distinguishing choice is the **shared fake database**: every repository port has an in-memory double under `tests/doubles/`, and all thirteen share **one `fakeDb.ts` object**, so cross-module BDD scenarios observe consistent state. The README documents this as a deviation forced by a code-generation environment with neither Docker nor local PostgreSQL. It works, but it means the port implementations most tests exercise are not the ones that ship — hence the separate `unit/repositories/` tier against a mocked Prisma client.

## TypeScript Configuration (both packages, identical)

`strict: true`, `noImplicitAny`, `noImplicitOverride`, `noImplicitReturns`, `noUncheckedIndexedAccess`, `noFallthroughCasesInSwitch`; `exactOptionalPropertyTypes: false`. Target ES2022, module CommonJS, path alias `@/* → src/*`. `typecheck` (`tsc --noEmit -p tsconfig.json`) is a **distinct CI step from `build`** — exactly the separation `team.md` mandates and the Astro marketing site failed to achieve.
