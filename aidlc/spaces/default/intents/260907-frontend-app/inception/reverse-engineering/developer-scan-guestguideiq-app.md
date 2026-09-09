# Developer Code Scan — `guestguideiq-app`

**Repo scanned**: `guestguideiq-app/` (sibling of `aidlc/` at the workspace root,
`C:\Projects\guestguideIQ\guestguideiq-app`)
**Scanned at**: 2026-09-07 (re-run over current source; supersedes the `40c8aed` scan)
**Git state at scan time**: branch `main`, HEAD `76d190d5011110d5fe0d115b87e9754368965094`
("Re-enable RDS deletion protection now that the stack is stable (#16)"), working tree clean,
tracking `origin/main`. `git branch --contains HEAD` returns `main`.

**Why this is a re-run**: an earlier link-1 scan ran at `40c8aed` on branch `feature/cors-support`.
Two commits have landed since, and that commit is now an ancestor of `main`:

| Commit | Description |
|---|---|
| `b9c7c6e` | Merge of PR #15 (`feature/cors-support` → `main`) — the CORS work is now **on `main`** |
| `76d190d` | "Re-enable RDS deletion protection now that the stack is stable" (#16) |

`git diff --stat 40c8aed..HEAD` touches exactly **one file** — `infra/lib/backend-api-stack.ts`,
8 insertions / 11 deletions (the `deletionProtection` literal plus its comment block). Every other
byte of the tree is identical to what the earlier pass analyzed. The two claims the delta
invalidates — TD-1 (CORS unmerged) and TD-14 (deletion protection disabled) — have been rewritten
below against current HEAD; see `### Scan Coverage` for exactly what was re-verified.

**Scan breadth**: FULL repository (pre-scan snapshot `paths: ["./"]`).

---

## Developer Code Scan Results

### Scan Coverage

This section describes **two passes**: the original full pass at `40c8aed`, and this re-run's
targeted re-verification at `76d190d`. Both are stated separately so the reader knows which
claims rest on fresh reads.

- **Re-verified against current HEAD (`76d190d`) in this pass** — read in full, at HEAD, not
  carried forward:
  - `git log`, `git status --short --branch`, `git branch --contains HEAD`,
    `git branch --no-merged main`, `git branch -r --no-merged main`,
    `git symbolic-ref refs/remotes/origin/HEAD`, and the complete `git diff 40c8aed..HEAD`
  - `infra/lib/backend-api-stack.ts` — the changed file: the `deletionProtection` / `removalPolicy`
    block (lines ~130-147) read in full, plus the task-definition `environment` block
    (`ALLOWED_ORIGINS` at line 185, `CHAT_PROVIDER: 'null'` at line 184)
  - The complete CORS chain, re-read end to end at HEAD to settle the merged-vs-branch question:
    `package.json` (`@fastify/cors` dependency), `src/config.ts` (`ALLOWED_ORIGINS` parsing),
    `src/wiring.ts` (threading), `src/app.ts` (the `app.register(cors, …)` call and its options
    object), `infra/bin/backend-api.ts` (`domainConfig.production.allowedOrigins`),
    `tests/unit/cors.test.ts` (read in full this pass; only enumerated in the prior pass),
    and `.env.example` (read in full)
  - **Not re-executed this pass**: the two test suites and the coverage run. The `src/` and
    `tests/` trees are byte-identical to `40c8aed`, so the recorded results below still describe
    this source exactly; they are carried forward, not re-measured.

- **Carried forward unchanged from the `40c8aed` pass** (justified: `git diff 40c8aed..HEAD` shows
  the entire tree outside `infra/lib/backend-api-stack.ts` is byte-identical, so every deep read
  below still describes the current source): the API surface (all three contracts), the domain
  components, the data model, the build system, the dependency inventory, the test-coverage
  numbers, and the code-quality indicators. Nothing in the one-file delta touches any of them.

- **Analyzed deeply** (in the `40c8aed` pass, still valid per the byte-identity above):
  - `README.md`
  - `package.json`, `package-lock.json` (dependency list only), `tsconfig.json`, `tsconfig.build.json`, `vitest.config.ts`
  - `.eslintrc.cjs`, `.prettierrc`, `.prettierignore`, `.gitignore`, `.dockerignore`, `.env.example`
  - `Dockerfile`, `docker-entrypoint.sh`
  - `.github/workflows/ci.yml`
  - `prisma/schema.prisma`, `prisma/migrations/migration_lock.toml`
  - `src/app.ts`, `src/internalApp.ts`, `src/server.ts`, `src/config.ts`, `src/wiring.ts`
  - `src/lib/errors.ts`, `src/lib/logger.ts`, `src/lib/otel.ts`
  - `src/auth/jwt.ts`, `src/auth/middleware.ts`
  - `src/ratelimit/plugin.ts`, `src/ratelimit/types.ts`, `src/ratelimit/memoryStore.ts` (presets block)
  - `src/chat/provider.ts`
  - Every `routes.ts` under `src/`: `identity/`, `onboarding/`, `guide/`, `poi/`, `event/`,
    `subscription/`, `guestaccess/`, `chatmodule/`, `leadcapture/`, `internal/`
  - Every `service.ts` under `src/`: `identity/`, `onboarding/`, `guide/`, `poi/`, `event/`,
    `subscription/`, `chatmodule/`, `guestaccess/`, `leadcapture/`, `locality/`
  - Repository **port interfaces and record types** for `poi/`, `event/`, `guide/`, `subscription/`,
    `chatmodule/`, `locality/`, `guestaccess/` (read to extract wire-visible response shapes)
  - `infra/bin/backend-api.ts`, `infra/lib/backend-api-stack.ts`, `infra/package.json`,
    `infra/cdk.json`, `infra/cdk.context.json`
  - `admin-api/README.md`, `admin-api/package.json`, `admin-api/.env.example`,
    `admin-api/vitest.config.ts`, `admin-api/src/app.ts`, `admin-api/src/auth/middleware.ts`,
    `admin-api/src/internal/types.ts`, `admin-api/src/internal/client.ts`, and all four
    `admin-api/src/{poi,events,accounts,localities}/routes.ts`
  - `tests/integration/contract2.test.ts`, `tests/integration/contract3.test.ts`
  - **Executed** both test suites and the u1 coverage run (results under Test Coverage)
  - **Executed** one throwaway probe test (since deleted; tree left clean) to empirically confirm
    the app-level rate-limit `preHandler` actually fires — see TD-9

- **Skimmed only** (directory granularity, not read line by line):
  - `src/**/repository.ts` Prisma **adapter bodies** below the exported interface (the query shapes
    were sampled for `poi`, `event`, `guide`, `locality`, `guestaccess`, `subscription`,
    `chatmodule`; `identity/repository.ts`, `onboarding/repository.ts`, `leadcapture/repository.ts`,
    `guide/propertyLookup.ts`, `locality/domainCache.ts`, `auth/password.ts`,
    `auth/refreshTokenStore.ts`, `lib/ids.ts`, `subscription/stripeAdapter.ts`,
    `db/prismaClient.ts` were read only via their call sites and type signatures)
  - `tests/bdd/`, `tests/unit/`, `tests/doubles/`, `tests/factories/`, `tests/helpers/`
    (39 files; enumerated and run, but only `tests/integration/contract2.test.ts`,
    `contract3.test.ts` and `tests/helpers/buildTestApp.ts` were read)
  - `admin-api/tests/` (15 files; enumerated and run, not read)
  - `admin-api/src/{config.ts,server.ts,wiring.ts,lib/*,auth/jwt.ts}`
  - `admin-api/infra/` (`bin/admin-api.ts`, `lib/admin-api-stack.ts`, `cdk.json`) — line count and
    the README's description of it; the stack body was not read line by line
  - `prisma/migrations/20260906234912_init/migration.sql` (existence and lock file confirmed; SQL
    not read — the Prisma schema is the authoritative shape and was read in full)

- **Skipped entirely** (generated/vendored; noted, not analyzed):
  `node_modules/`, `dist/`, `coverage/`, `admin-api/node_modules/`, `admin-api/dist/`,
  `admin-api/coverage/`, `infra/node_modules/`, `infra/cdk.out/`, `admin-api/infra/cdk.out/`,
  `.git/`. All are gitignored; `dist/` and `coverage/` trees are present on disk as untracked
  local build output.

---

### Packages Found

| Package | Type | Language | Purpose |
|---|---|---|---|
| `guestguideiq-app` (repo root) | HTTP service (`u1-backend-api`) | TypeScript / Node ≥18.18 | The public-facing backend. Hosts 10 of the 11 domain components and BOTH the public API (Contract 2 + Contract 3) and the internal API (Contract 1), on **two separate Fastify instances / listeners**. This is the API the new frontend consumes. |
| `guestguideiq-admin-api` (`admin-api/`) | HTTP service (`u2-admin-api`) | TypeScript / Node ≥18.18 | Internal-only ops tool. Owns **no data**; every route is a thin ops-role-gated delegation into `u1`'s internal API over HTTP. A fully independent sibling project — its own `package.json`, `tsconfig.json`, `node_modules/`, `Dockerfile`, `infra/`. **No npm workspace linking, no shared code** with the root package. |
| `guestguideiq-infra` (`infra/`) | IaC (CDK v2 app) | TypeScript | u1's CDK app: three environment-parameterized stacks (`dev`, `staging`, `production`) — VPC, ECS Fargate + ALB, RDS PostgreSQL 16, Secrets Manager, CloudWatch log group, one-off migration task definition. |
| `admin-api/infra/` | IaC (CDK v2 app) | TypeScript | u2's own separate CDK app (ECS Fargate, WAF IP allowlist). Reads shared VPC/cluster via SSM parameters **that u1's stack does not yet publish** — this stack is not deployable today. |
| `prisma/` | Schema + migrations | Prisma DSL / SQL | The 11-entity relational model plus one applied migration (`20260906234912_init`). |

Four independent `package-lock.json` files (root, `admin-api/`, `infra/`, `admin-api/infra/`) —
four independent dependency trees, no hoisting.

---

### Build System

- **Type**: npm + TypeScript (`tsc`), no bundler. Docker multi-stage for packaging. AWS CDK v2 for infra.
- **Config Files**:
  - Root: `package.json`, `tsconfig.json` (typecheck: `src/` + `tests/` + `vitest.config.ts`),
    `tsconfig.build.json` (emit only, `rootDir: src`, `outDir: dist`), `vitest.config.ts`,
    `.eslintrc.cjs`, `.prettierrc`, `Dockerfile`, `docker-entrypoint.sh`, `.env.example`
  - `admin-api/`: the same five, own `Dockerfile`
  - `infra/`, `admin-api/infra/`: `cdk.json`, `package.json`, `tsconfig.json`
- **Root npm scripts**: `build` (`tsc -p tsconfig.build.json`), `dev` (`tsx watch src/server.ts`),
  `start` (`node dist/server.js`), `typecheck` (`tsc --noEmit -p tsconfig.json`), `lint`,
  `lint:fix`, `format`, `format:check`, `test` (`vitest run tests/`), `test:watch`,
  `test:coverage`, `prisma:generate`, `prisma:migrate`. `admin-api/` mirrors all of these except
  the two Prisma ones.
- **TypeScript strictness** (both packages): `strict: true`, `noImplicitAny`,
  `noImplicitOverride`, `noImplicitReturns`, `noUncheckedIndexedAccess`,
  `noFallthroughCasesInSwitch`; `exactOptionalPropertyTypes: false`. Target ES2022, module
  CommonJS, path alias `@/* -> src/*`.
- **Build Dependencies (package → package)**:
  - `admin-api` → `backend-api` **at runtime over HTTP only** (`BACKEND_API_INTERNAL_URL`,
    default `http://localhost:3001/v1`). There is **no compile-time or npm dependency** in either
    direction; the two share no types, no client SDK, no generated code.
  - `infra/` → the repo root's `Dockerfile` as a build asset
    (`ecs.ContainerImage.fromAsset('..', { file: 'Dockerfile', target: 'runtime' | 'migrate' })`).
  - `admin-api/infra/` → u1's stack via **SSM parameters that are not yet published** (README and
    the stack's own top-of-file note both say so).
  - Internal module graph (u1): `routes.ts → service.ts → repository.ts (port)`; `wiring.ts` is
    the only place Prisma adapters are constructed. No circular imports observed.

---

### APIs Discovered

Three HTTP surfaces. All JSON. **No OpenAPI/AsyncAPI document exists anywhere in the repo** — the
README points at `contract-summary.md` in the sibling AI-DLC workspace, so there is no
machine-readable contract for the frontend to generate a client from (TD-3).

#### Surface A — u1 public API (Contract 2 + Contract 3) — the frontend's target

Process: `createApp()` in `src/app.ts`. Listener: `PORT`, default **3000**, bound `0.0.0.0`.
Routes are registered with **literal `/v1/...` paths** (no Fastify prefix), so the base path is
`{origin}/v1`.

Auth: `Authorization: Bearer <accessToken>`. Access token TTL **15 min**, claims
`{ accountId, propertyId }`. Refresh token TTL **7 days**, claims `{ accountId, propertyId, jti }`,
**rotation-on-use** (each refresh revokes the presented `jti`). Both are opaque to the client and
carry no role claim. No cookies, no sessions, no CSRF token.

**Health (no auth)**

| Method | Path | Success | Notes |
|---|---|---|---|
| GET | `/health` | `200 {status:"ok"}` | Shallow liveness. |
| GET | `/health/ready` | `200 {status:"ready"}` / `503 {status:"not_ready"}` | Deep — runs `SELECT 1` through Prisma. |

**Identity — `src/identity/routes.ts` (no auth required)**

| Method | Path | Request body | Success | Errors |
|---|---|---|---|---|
| POST | `/v1/accounts` | `{ username, password }` | `201 { accountId, propertyId, accessToken, refreshToken }` | `400 VALIDATION_ERROR` (with `details[{field,reason}]` for `username`/`password`), `409 CONFLICT` (username taken, case-insensitive), `404 LOCALITY_NOT_RESOLVED`, `429 RATE_LIMITED` |
| POST | `/v1/auth/login` | `{ username, password }` | `200 { accountId, propertyId, accessToken, refreshToken }` | `401 UNAUTHORIZED` (same message for unknown user and bad password), `500` if the account somehow has no Property |
| POST | `/v1/auth/reset/request` | `{ username }` | **always** `202 { message }` | `429 RATE_LIMITED`. Never reveals whether the account exists. |
| POST | `/v1/auth/reset/confirm` | `{ token, newPassword }` | `200 { message: "Password updated." }` | `400 VALIDATION_ERROR`, `410 LINK_INVALID` (expired, unknown, or already used) |
| POST | `/v1/auth/refresh` | `{ refreshToken }` | `200 { accountId, propertyId, accessToken, refreshToken }` | `401 UNAUTHORIZED` (invalid, expired, or replayed) |

> **`POST /v1/accounts` resolves the tenant (locality-brand) from the request's
> `X-Forwarded-Host` / `Host` header**, not from the body — `identity/service.ts` calls
> `locality.resolveDomain(input.host)` before creating anything. See the blocking constraint
> in Handoff Summary § "Host-header tenancy".

> There is **no delivery mechanism for the password-reset token**.
> `IdentityService.requestPasswordReset` returns `{ resetToken }`, and
> `identity/routes.ts` discards it — no email, no SMS, no queue. `/v1/auth/reset/confirm`
> is therefore unreachable in practice today (TD-5).

**Onboarding — `src/onboarding/routes.ts` (auth required; a 4-step state machine)**

Steps, in order: `property_basics` → `content_source` → `content_review` → `confirm` → completed.
Calling a step out of order returns `409 CONFLICT` with a message naming the actual current step.

| Method | Path | Request body | Response |
|---|---|---|---|
| GET | `/v1/onboarding` | — | `200 { currentStep, completed }` |
| POST | `/v1/onboarding/property-basics` | `{ name }` | `200 { currentStep:"content_source", completed:false }`; `400` if `name` blank |
| POST | `/v1/onboarding/content-source/scratch` | — | `200 { currentStep:"content_review", ... }` |
| POST | `/v1/onboarding/content-source/pdf` | `{ succeeded: boolean, sections?: [{title, body}] }` | `200 { currentStep:"content_review", ... }` |
| POST | `/v1/onboarding/content-review/confirm` | — | `200 { currentStep:"confirm", ... }` |
| POST | `/v1/onboarding/finish` | — | `200 { currentStep:"confirm", completed:true }` |

> **The server does not parse PDFs.** `/content-source/pdf` accepts a `succeeded` flag plus
> **already-extracted** `sections`. There is no file-upload endpoint and no `multipart` plugin
> registered anywhere. Whoever extracts the PDF is the caller's problem — a frontend
> responsibility the frontend design must account for (TD-4).

**Property Guide — `src/guide/routes.ts` (auth **and** ownership: `:propertyId` must equal the JWT's `propertyId`, else `403 FORBIDDEN`)**

`OwnerGuideView` = `{ propertyId, publishStatus: "draft"|"published", sections: [{title, body}],
favoritedPOIIds: string[], favoritedEventIds: string[] }`

| Method | Path | Request body | Response |
|---|---|---|---|
| GET | `/v1/guides/:propertyId` | — | `200 OwnerGuideView` (creates an empty draft guide on first read) |
| PATCH | `/v1/guides/:propertyId` | `{ sections: [{title, body}] }` | `200 OwnerGuideView`. **Full replace** of the sections array, not a merge or a patch. `400` if `sections` is not an array. |
| POST | `/v1/guides/:propertyId/publish` | — | `200 OwnerGuideView` (`publishStatus: "published"`) |
| POST | `/v1/guides/:propertyId/unpublish` | — | `200 OwnerGuideView` (`publishStatus: "draft"`) |
| POST | `/v1/guides/:propertyId/favorites` | `{ itemType: "poi"\|"event", itemId }` | `200 OwnerGuideView`; `400 VALIDATION_ERROR` if the item is not in the property's own locality |
| DELETE | `/v1/guides/:propertyId/favorites/:itemType/:itemId` | — | `200 OwnerGuideView` |

**Curated content browse — `src/poi/routes.ts`, `src/event/routes.ts` (auth required)**

Both derive the locality from the JWT's `propertyId`. **No query parameters, no filtering, no
pagination, no sorting** — the full locality list is returned.

| Method | Path | Response |
|---|---|---|
| GET | `/v1/pois` | `200 { items: [{ id, name, description, category, localityIds: string[] }], isEmptyLocality: boolean, emptyMessage?: string }` — `emptyMessage` is `"Content is being added for this locality."` |
| GET | `/v1/events` | `200 { items: [{ id, name, eventDate, localityId, expiryStatus: "active"\|"expired", sourceRef: string\|null }], isEmptyLocality: boolean, emptyMessage?: string }` — excludes expired; `emptyMessage` is `"No events yet — check back soon."` |

**Subscription — `src/subscription/routes.ts` (auth required)**

| Method | Path | Request body | Response |
|---|---|---|---|
| POST | `/v1/subscriptions` | — | `201 { id, accountId, plan: "standard", status: "active" }`; `404 NOT_FOUND` if no `SubscriptionRecord` row; `402 PAYMENT_FAILED` |
| PATCH | `/v1/subscriptions` | `{ action: "upgrade"\|"downgrade"\|"cancel" }` | `200 SubscriptionRecordRow`; `404`, `409 CONFLICT` (no active subscription) |

> **There is no `GET /v1/subscriptions`.** The frontend cannot read the current plan/status without
> mutating it. And `PATCH` uses an `if/else` chain whose final branch is `cancel` — **any body
> other than `upgrade`/`downgrade`, including a missing body or a typo, cancels the
> subscription** (`subscription/routes.ts`, the nested ternary). `upgrade` and `downgrade` are
> currently no-ops on `plan` (only one plan tier exists). See TD-6.

**Guest access (stay-scoped) — `src/guestaccess/routes.ts`, `src/chatmodule/routes.ts` (NO JWT)**

Auth is the opaque `:token` in the path plus a **`Host` header check**: `requireStayToken`
resolves the request host to a locality-brand and requires it to equal the linked Property's
`localityBrandId` (BR8.3). Every failure mode — unknown token, expired stay, missing property,
host/locality mismatch — returns the **same** `410 LINK_INVALID` with
`"This link is no longer valid."` (deliberate, so the failure mode is not leaked).

| Method | Path | Request body | Response |
|---|---|---|---|
| GET | `/v1/stays/:token` | — | `200 { property: {id, name}, locality: {id, name, tagline, visualStyling}, guide: { propertyId, sections: [{title,body}]\|null, notYetPublished: boolean, favoritedPOIIds: [], favoritedEventIds: [] } }`; `410 LINK_INVALID`; `429 RATE_LIMITED` |
| POST | `/v1/stays/:token/chat` | `{ message }` | `200 { reply: string, sparse: boolean, messages: [{ role: "guest"\|"assistant", text, timestamp }] }`; `400 VALIDATION_ERROR` (empty message); `410 LINK_INVALID`; `429 RATE_LIMITED`; `504 CHAT_PROVIDER_TIMEOUT` |

> `locality.visualStyling` is a free-form JSON blob (`Record<string, unknown> | null`) with **no
> schema anywhere in the codebase** — the guest UI is expected to theme from it and fall back
> gracefully on `null` (BR9.6). The frontend will have to define that schema (TD-7).

> `guide.sections` is `null` (with `notYetPublished: true`) when the owner has not published.

> **There is no endpoint to read chat history.** The message array only comes back as a side effect
> of `POST .../chat`. A guest reloading the page loses the transcript unless the frontend caches it.

> **Chat is non-functional in production today.** `CHAT_PROVIDER=null` in both `.env.example` and
> the CDK task definition, so `wiring.ts` resolves `NullChatProvider`, which always throws.
> `chatmodule/service.ts` retries once with a 1 s backoff, then returns `504
> CHAT_PROVIDER_TIMEOUT`. The **only** 200 path is the sparse-content fallback: when the stay's
> locality has fewer than **3** combined POIs + active events, the provider is bypassed entirely
> and a canned reply is returned with `sparse: true`. So today: <3 items → `200` canned message;
> ≥3 items → `504`. See TD-2.

**Lead capture (Contract 3) — `src/leadcapture/routes.ts` (no auth)**

Already consumed by the marketing site. Required fields are enforced in
`leadcapture/service.ts`; unlisted extra fields are stored without complaint; duplicates are
accepted (never deduplicated).

| Method | Path | Required fields | Response |
|---|---|---|---|
| POST | `/v1/leads/waitlist` | `email` | `201 { id }` |
| POST | `/v1/leads/partner` | `name, company, role, organizationType, email, message` | `201 { id }` |
| POST | `/v1/leads/investor` | `name, org, email, message` | `201 { id }` |

`400 VALIDATION_ERROR` with `details[{field, reason:"required"}]` per missing field; a malformed
`email` yields `details:[{field:"email", reason:"must be a valid email"}]`.

**Cross-cutting conventions (identical across all three contracts)**

- Error envelope: `{ "error": { "code": string, "message": string, "details"?: [{ "field"?: string, "reason": string }] } }`.
  **No `requestId`/correlation id in the envelope** — contrary to the framework's own API design
  guide, and a real gap for frontend error reporting (TD-8).
- Codes in use: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `PAYMENT_FAILED` (402),
  `FORBIDDEN` (403), `NOT_FOUND` (404), `LOCALITY_NOT_RESOLVED` (404), `CONFLICT` (409),
  `LINK_INVALID` (410), `RATE_LIMITED` (429), `CHAT_PROVIDER_TIMEOUT` (504),
  `INTERNAL_ERROR` (500).
- `429` responses carry a `Retry-After` header in **seconds** (`Math.ceil(retryAfterMs / 1000)`).
- **CORS** — **on `main` as of `b9c7c6e`; re-verified file by file at `76d190d`.** `@fastify/cors`
  `^11.3.0` is a declared runtime dependency in the root `package.json`, and the full chain is
  wired: `src/config.ts` parses `ALLOWED_ORIGINS` (comma-separated, trimmed, empties filtered) into
  `config.allowedOrigins`; `src/wiring.ts` passes it to `createApp`; `src/app.ts` registers the
  plugin as
  `{ origin: deps.allowedOrigins && deps.allowedOrigins.length > 0 ? deps.allowedOrigins : false }`;
  `infra/lib/backend-api-stack.ts` sets the task-definition env var
  `ALLOWED_ORIGINS: (allowedOrigins ?? []).join(',')`.
  - **An empty/unset list sets `origin: false`, refusing all cross-origin browser requests** — the
    safe default, and the current state for `dev` and `staging`, which have no `domainConfig` entry
    at all.
  - **The production allowlist is exactly one origin: `['https://guestguideiq.com']`** — the
    marketing site, hardcoded in `infra/bin/backend-api.ts`'s `domainConfig.production`, with an
    inline comment naming it as the marketing site's lead-capture caller. No API subdomain, no
    staging origin, no frontend origin, no wildcard, no localhost.
  - **`credentials` is NOT enabled.** The options object passed to `app.register(cors, …)` contains
    the single key `origin` and nothing else — no `credentials`, no `methods`, no `allowedHeaders`,
    no `exposedHeaders`, no `maxAge` (plugin defaults apply to all of those, and the plugin default
    for `credentials` is `false`). The server therefore never emits
    `Access-Control-Allow-Credentials`, so a browser will not send or accept cross-origin cookies:
    **cookie/session auth is not available to a cross-origin frontend; bearer tokens in the
    `Authorization` header are the only viable scheme.** See Handoff Summary risk 2 — this is the
    load-bearing input to the frontend's auth-storage decision.
  - `ALLOWED_ORIGINS` is **not listed in `.env.example`** (verified — the file documents `NODE_ENV`,
    `PORT`, `INTERNAL_PORT`, `LOG_LEVEL`, `DATABASE_URL`, the three JWT secrets, the two Stripe
    keys, `CHAT_PROVIDER`, and the three OTel vars, and stops there). Local development therefore
    gets `origin: false` unless the developer knows to set the variable themselves.
- **Rate limits** (token bucket, `src/ratelimit/memoryStore.ts` `RATE_LIMIT_PRESETS`), in-memory
  per process:
  | Bucket | Capacity (burst) | Refill | Key |
  |---|---|---|---|
  | `POST /v1/accounts`, `POST /v1/auth/reset/request` | 5 | 5/min | client IP |
  | `GET /v1/stays/:token` | 20 | 20/min | client IP |
  | `POST /v1/stays/:token/chat` | 10 | 10/min | **stay token** |
  | `POST /v1/leads/*` | 15 | 15/min | client IP |
  Empirically verified firing (429 after the 5th `POST /v1/accounts`) during this scan.
- **No Fastify JSON schemas on any u1 public route.** Bodies are cast with `as`, most with a
  `?? {}` fallback. Two routes lack the fallback and will throw on a missing body →
  `500 INTERNAL_ERROR` instead of `400` (TD-10).
- No pagination, no `ETag`/conditional requests, no `Cache-Control`, no API versioning beyond the
  `/v1` path segment.

#### Surface B — u1 internal API (Contract 1) — **not** frontend-reachable

Process: `createInternalApp()` in `src/internalApp.ts`. Separate Fastify instance on
`INTERNAL_PORT` (default **3001**), bound **`127.0.0.1` only**, never `EXPOSE`d in the Dockerfile
and never in the ALB target group (NFR3.11). Every `/v1/internal/*` route requires an
internal-scoped service JWT (`{ service }` claim, 5 min TTL, signed with `INTERNAL_JWT_SECRET`);
its own `/health` is unguarded.

| Method | Path | Purpose |
|---|---|---|
| POST | `/v1/internal/pois` | `createPOI` → `201` |
| GET | `/v1/internal/events?localityId&includeExpired` | `listEvents` → `200 { items: [...] }` (audit view: includes expired) |
| GET | `/v1/internal/accounts/:accountId` | `lookupAccount` → `200 { id, username, createdAt, property: {id,name}\|null }`, `404` |
| POST | `/v1/internal/localities` | `createLocalityBrand` → `201` |
| POST | `/v1/internal/localities/:localityId/domains` | `addLocalityDomain` → `200`, `409 CONFLICT` if bound elsewhere |

#### Surface C — u2 admin API — internal ops tool, **not** frontend-reachable

`admin-api/src/app.ts`, port `PORT` default **4000**, Fastify prefix `/v1`. Every `/v1` route
requires an **ops-role JWT** (`role === "ops"`); missing/invalid → `401`, valid-but-not-ops
(including a real u1 Property Owner token, which shares signing infrastructure) → `403`.
u1's Identity component **does not issue an ops token anywhere in this repo** — admin-api only
verifies it.

| Method | Path | Delegates to |
|---|---|---|
| GET | `/health` | — (unguarded) |
| POST | `/v1/pois` | `createPOI` |
| GET | `/v1/events?localityId&includeExpired` | `listEvents` |
| GET | `/v1/accounts/:accountId` | `lookupAccount` |
| POST | `/v1/localities` | `createLocalityBrand` |
| POST | `/v1/localities/:localityId/domains` | `addLocalityDomain` |

Unlike u1, these routes **do** carry Fastify JSON body schemas (`poi/routes.ts`,
`localities/routes.ts`). Upstream failures are relayed **verbatim** (status + body) by
`InternalApiError`. Outbound calls carry `Authorization: Bearer <internal JWT>` and a W3C
`traceparent`; 5 s timeout; idempotent reads retried once on 502/503/504/network error,
non-idempotent writes never retried.

---

### Frameworks & Libraries

**u1 runtime deps** (root `package.json`)

| Name | Version | Purpose |
|---|---|---|
| `fastify` | ^5.12.3 | HTTP framework (both listeners) |
| `@fastify/cors` | ^11.3.0 | CORS — the only Fastify plugin registered |
| `@prisma/client` | ^5.18.0 | PostgreSQL ORM client |
| `jsonwebtoken` | ^9.0.2 | Access / refresh / internal-service JWTs |
| `bcryptjs` | ^3.0.3 | Password hashing (pure-JS, not native `bcrypt`) |
| `pino` | ^9.3.2 | Structured logging with redaction |
| `stripe` | ^16.8.0 | Subscription billing adapter |
| `@opentelemetry/sdk-node` | ^0.222.0 | Tracing SDK (opt-in via `OTEL_ENABLED`) |
| `@opentelemetry/instrumentation-http` | ^0.222.0 | HTTP auto-instrumentation |
| `@opentelemetry/api` | ^1.9.1 | OTel API |
| `@opentelemetry/resources` | ^2.11.0 | Resource attributes |
| `@opentelemetry/semantic-conventions` | ^1.43.0 | Attribute names |

**u1 dev deps**: `typescript` ^5.5.4, `vitest` ^5.0.0, `@vitest/coverage-v8` ^5.0.0,
`supertest` ^7.0.0, `prisma` ^5.18.0, `tsx` ^4.17.0, `eslint` ^8.57.0,
`@typescript-eslint/{parser,eslint-plugin}` ^7.18.0, `eslint-config-prettier` ^9.1.0,
`prettier` ^3.3.3, `pino-pretty` ^11.2.2, `@types/{node ^24.13.3, jsonwebtoken, supertest}`.

**u2 runtime deps**: `fastify` ^5.12.3, `axios` ^1.7.4 (chosen because `nock` intercepts Node's
`http`/`https`, which native `fetch` does not), `jsonwebtoken` ^9.0.2, `pino` ^9.3.2.
**u2 dev deps**: same toolchain as u1 plus `nock` ^13.5.4; no Prisma, no Stripe, no OTel.

**Infra**: `aws-cdk-lib` ^2.150.0, `constructs` ^10.3.0, `aws-cdk` ^2.150.0 (CLI).

**Runtime targets**: `engines.node >= 18.18`; Docker base `node:20-slim`; CI runs Node **24**.
Three different Node majors across dev / package / CI (TD-11).

**Notable version risks**: `eslint` 8.x is EOL upstream; `@typescript-eslint` 7.x trails 8.x;
`vitest` and `@vitest/coverage-v8` are pinned to a `^5.0.0` major; `@types/node` ^24 is far ahead
of the declared `>=18.18` engine and the `node:20-slim` image.

---

### Test Coverage

- **Test Directories**:
  - u1: `tests/bdd/` (9 files), `tests/unit/` (13 + `tests/unit/repositories/` 11 = 24 files),
    `tests/integration/` (4), `tests/smoke.test.ts`, plus support: `tests/doubles/` (13),
    `tests/factories/` (4), `tests/helpers/` (3)
  - u2: `admin-api/tests/bdd/` (4), `admin-api/tests/unit/` (9),
    `admin-api/tests/integration/contract1.test.ts`, `admin-api/tests/smoke.test.ts`, plus
    `factories/` (2) and `helpers/` (3)
- **Test Frameworks**: Vitest (`environment: 'node'`, `globals: false`, `testTimeout: 10000`,
  `include: ['tests/**/*.test.ts']`) + Supertest. u2 adds `nock` for outbound HTTP interception.
- **Coverage Config**: **present** in both `vitest.config.ts` files — provider `v8`, reporters
  `text`/`html`/`lcov`, `include: ['src/**/*.ts']`, `thresholds: { lines: 80 }`.
  u1 excludes `src/server.ts`, `src/db/prismaClient.ts`, `src/wiring.ts`;
  u2 excludes `src/server.ts`, `src/wiring.ts`.
- **Actual results, executed during this scan**:
  - u1 `npx vitest run tests/`: **39 files passed, 1 skipped (40); 137 tests passed, 1 skipped
    (138)**; 2.85 s. The skipped file is `tests/integration/dbSmoke.test.ts`, gated on
    `RUN_DB_SMOKE_TEST=1` (set only in CI, where a real Postgres 16 service container runs).
  - u1 `--coverage`: **Lines 91.15 % (649/712)**, Statements 89.37 %, Branches 76.53 %,
    Functions 92.24 % — comfortably over the 80 % line floor. Weakest directories by lines:
    `src` (79.31 %), `src/poi` (80.76 %), `src/event` (83.33 %), `src/guide` (83.75 %),
    `src/guestaccess` (85.71 %, and only 70 % of functions).
  - u2 `npx vitest run tests/`: **15 files, 49 tests, all passed**; 1.29 s.
- **Test data strategy** (documented deviation, README § Running tests): every repository port has
  an in-memory double under `tests/doubles/`, all sharing one `fakeDb.ts` object so cross-module
  BDD scenarios see consistent state. The stated reason is that the code-generation environment
  had neither Docker nor local PostgreSQL. Prisma adapters are covered separately in
  `tests/unit/repositories/*.test.ts` against a mocked `PrismaClient`.
- **Coverage gaps worth naming**: the rate-limit `preHandler` wiring in `app.ts` has **no test
  at all** (`grep` for `429`/`RATE_LIMITED`/`rateLimit` across `tests/` matches only
  `buildTestApp.ts`'s store construction) — I verified it empirically instead, see TD-9.
- **CORS test coverage** (`tests/unit/cors.test.ts`, read in full during this re-run): three tests,
  all against `GET /health` via the test harness — an allowed origin is reflected back in
  `Access-Control-Allow-Origin`; a non-allowlisted origin is not reflected; and an unconfigured
  harness (no `allowedOrigins`) reflects nothing, pinning the safe default. **Nothing asserts
  `Access-Control-Allow-Credentials`, and no test exercises a preflight `OPTIONS` request or a
  cross-origin call against a real `/v1/...` route** — the credentials-disabled behaviour the
  frontend's auth design depends on is a property of the code, not of a regression test.

---

### Code Quality Indicators

- **Linting**: ESLint, config at `.eslintrc.cjs` (root) and `admin-api/.eslintrc.cjs` (identical).
  `eslint:recommended` + `plugin:@typescript-eslint/recommended` + `prettier`. Notable rules:
  `no-unused-vars` error (with `^_` escape), `no-explicit-any` **warn** (off in `tests/`),
  `eqeqeq` always, `no-empty` with `allowEmptyCatch: false`, `no-console` warn (allows
  `console.error`). `parserOptions.project: false` — **no type-aware linting**, so the
  `@typescript-eslint` rules that need type information are unavailable.
- **Formatting**: Prettier, `.prettierrc` (semi, single quotes, trailing comma all, printWidth
  100, tabWidth 2, arrowParens always). `format:check` is a blocking CI step.
- **CI/CD**: one file, `.github/workflows/ci.yml`. Triggers `pull_request` → `main` and
  `push` → `main`. Node 24. Jobs:
  - `backend-api (u1)`: Postgres 16 service container; `npm ci` → **lint → format:check →
    typecheck (distinct from build) → build → `prisma migrate deploy` → `test:coverage` with
    `RUN_DB_SMOKE_TEST=1` (coverage floor enforced by vitest config) → `npm audit
    --audit-level=high` → gitleaks → Semgrep (`p/ci`, `p/typescript`) → CDK synth → Checkov
    against `infra/cdk.out`** — every step blocking.
  - `admin-api (u2)`: same chain minus Postgres and Prisma.
  - `deploy-staging`, `integration-test-staging`, `smoke-test-production`: **placeholder `echo`
    no-ops** by explicit design (blocked on an OIDC deploy role and u1 publishing the SSM
    parameters u2 needs).
  - `deploy-production`: **real** — OIDC credentials, `cdk deploy
    GuestGuideIQ-BackendApi-production --require-approval never --no-rollback --force`, then a
    one-off ECS `run-task` for `prisma migrate deploy`, gated on the `production` GitHub
    Environment's required reviewer. Its `needs:` is `[backend-api, admin-api]` — the staging
    dependency is deliberately **not** wired.
  - Every third-party action is pinned to a commit SHA (Semgrep supply-chain finding), with the
    tag in a trailing comment.
  - All Checkov skips are individually documented with a stated reason at the skip site.
- **Documentation**: two substantial, accurate, current READMEs (root and `admin-api/`) covering
  stack, layout, local setup, test commands, and deployment. `.env.example` files in both packages
  name their variables with a comment and **no values** — with one verified omission: the root
  `.env.example` does not mention `ALLOWED_ORIGINS`, which `config.ts` reads. Source comments are unusually thorough and
  traceability-oriented — nearly every non-obvious decision cites the design artifact
  (`security-design.md`, `BR8.3`, `NFR3.11`, `AC4.3.2`, …) and several carry a post-mortem of a
  real deployment failure. **No generated API reference, no OpenAPI file, no ADR directory, no
  CHANGELOG, no CONTRIBUTING.**
- **Architecture discipline**: every u1 module is the same triad — `repository.ts` (narrow port +
  Prisma adapter), `service.ts` (business logic depending only on the port), `routes.ts` (HTTP).
  `wiring.ts` is the sole composition root. This is consistently applied with no observed
  violations. No file exceeds 175 lines (`src/app.ts`); u1 `src/` totals 3 268 lines against
  3 378 lines of tests.
- **Security posture**: no hardcoded secrets anywhere (`config.ts` reads every one from
  `process.env` and fails fast at startup); Secrets Manager wired in CDK; pino redaction covers
  `password`, `passwordHash`, `authorization`, `token`, `stayToken`; non-root container user;
  RDS in private subnets; internal listener bound to loopback. Only two `eslint-disable` comments
  in the entire repo (both `no-console` on a fatal-startup `console.error`). **Zero
  TODO/FIXME/HACK/XXX comments and zero `@ts-ignore`/`@ts-expect-error` across all TypeScript
  in `src/`, `tests/`, `admin-api/`, and `infra/`.**

---

### Technical Debt Signals

**TD-1 (RESOLVED for CORS; residual branch hygiene) — CORS is now merged; `origin/HEAD` still
points at the wrong branch.** The earlier scan recorded the CORS work as living only on the
unmerged `feature/cors-support`. **That is no longer true.** `b9c7c6e` merged PR #15 into `main`,
and every CORS artifact — the `@fastify/cors` dependency, `config.allowedOrigins`, the
`ALLOWED_ORIGINS` task-definition env var, and the `domainConfig.production.allowedOrigins` entry —
is present on `main` at `76d190d` and was re-read there. Nothing CORS-related in this document
depends on an unmerged branch any more.

What remains: `origin/HEAD` still points at `build-and-test-ci-pipeline-fixes` rather than `main`,
so a fresh `git clone` checks out a stale non-trunk branch by default — a real onboarding trap for
anyone joining this repo, and trivially fixable
(`git remote set-head origin main` locally, plus changing the default branch in the GitHub repo
settings). Branch cleanup has otherwise largely happened: only **one** local branch
(`fix/wire-missing-jwt-secrets`) and **two** remote branches
(`origin/fix/wire-missing-jwt-secrets`, `origin/fix/re-enable-rds-deletion-protection`) are
unmerged into `main`, down from seven — merged branches are being deleted, which matches `team.md`'s
short-lived-branch practice. Both PRs (#15, #16) went through pull request, consistent with
`project.md`'s Mandated rule on PR review.

**TD-2 — Itinerary chat has no LLM vendor.** `CHAT_PROVIDER=null` in `.env.example` **and** in the
CDK task definition (`infra/lib/backend-api-stack.ts`, `environment.CHAT_PROVIDER: 'null'`).
`wiring.ts:resolveChatProvider` therefore returns `NullChatProvider`, which always throws; any
other value throws at startup. Net effect on the wire is described under Surface A. US2.3
(itinerary chat) cannot be demonstrated end-to-end against the deployed backend.

**TD-3 — No machine-readable API contract.** No OpenAPI/Swagger file, no JSON Schema export, no
published types package, no generated client. The frontend must hand-write its API client and
duplicate every request/response type. The u1 public routes carry no Fastify schemas, so nothing
can even be derived from the running app.

**TD-4 — PDF import is a client-side responsibility with no server support.**
`POST /v1/onboarding/content-source/pdf` takes pre-extracted `sections` and a boolean. No
`@fastify/multipart`, no upload endpoint, no object storage, no file-size limit configuration
anywhere in `src/` or `infra/`.

**TD-5 — Password-reset tokens are generated and thrown away.** `identity/routes.ts` calls
`identity.requestPasswordReset(username)` and ignores its `{ resetToken }` return. No mailer, no
SES construct in the CDK stack, no queue. `POST /v1/auth/reset/confirm` is dead in practice.

**TD-6 — `PATCH /v1/subscriptions` cancels on any unrecognized action.** The handler is a nested
ternary whose final `else` is `subscriptions.cancel(accountId)`. A missing body, a typo, or a
future action value silently cancels the subscription. There is also no `GET /v1/subscriptions`,
so the frontend cannot render current plan/status without a mutation.

**TD-7 — `locality.visualStyling` is an unschematized JSON blob.** Typed `Record<string, unknown> |
null` in `locality/repository.ts` and `Json?` in Prisma. Nothing in the codebase constrains,
validates, or documents its keys, yet the guest UI is expected to theme from it (BR9.6).

**TD-8 — Error envelope has no correlation id.** `lib/errors.ts:toErrorEnvelope` emits only
`{ code, message, details? }`. OTel `traceparent` is propagated between services but never
surfaced to the client, so a frontend error report cannot be tied to a server-side trace.

**TD-9 — Rate limiting has zero test coverage.** No test in `tests/` asserts a 429 or exercises the
`app.addHook('preHandler', ...)` wiring in `app.ts`, which is registered *after* the route
registrations and applies its own hand-rolled path matching (`path.startsWith('/v1/stays/') &&
!path.endsWith('/chat') && method === 'GET'`). I verified empirically during this scan that it does
fire (12 consecutive `POST /v1/accounts` → `404,404,404,404,404,429,429,429,429,429,429,429`), but
that behaviour is unguarded by any regression test and the string matching is brittle against
future route additions.

**TD-10 — Two public routes throw 500 on a missing body.** `guide/routes.ts`'s favorites handler
does `const { itemType, itemId } = request.body;` and `subscription/routes.ts`'s PATCH does
`request.body?.action` (safe) — but the favorites destructuring has no `?? {}` fallback, unlike
every other handler in the file. With no body, it raises a `TypeError` that the central handler
maps to `500 INTERNAL_ERROR` rather than `400 VALIDATION_ERROR`. The absence of Fastify request
schemas on u1's public surface (present on u2's) is the root cause.

**TD-11 — Three Node majors in play.** `engines.node >= 18.18`, Docker `node:20-slim`,
CI `NODE_VERSION: '24'`. The tested runtime is not the shipped runtime.

**TD-12 — Single-instance state behind a multi-task service.** `InMemoryRefreshTokenStore` and
`InMemoryRateLimitStore` are per-process, while the production ECS service runs
`desiredCount: 2` (autoscaling to 6). Consequence: refresh-token revocation is not shared, so a
rotated token replayed against the *other* task will be accepted; and each rate-limit bucket is
effectively multiplied by the task count. Both files carry comments acknowledging the Redis
upgrade path; neither is wired.

**TD-13 — Staging is bypassed in the real deploy path.** `deploy-staging` and
`integration-test-staging` are `echo` placeholders while `deploy-production` is fully wired and
depends only on the two PR-gate jobs — the workflow's own comment says "Environment Provisioning
wired production directly, skipping staging-first validation." This is in tension with
`project.md`'s Mandated rule ("ALWAYS require manual approval before a production deployment …
deployments first go to a staging environment") and the matching Forbidden rule. The manual
approval half **is** honoured (the `production` GitHub Environment carries a required reviewer);
the staging-first half is not.

**TD-14 (RESOLVED) — RDS deletion protection has been re-enabled for production.** The earlier scan
recorded `deletionProtection: false` unconditionally. Commit `76d190d` ("Re-enable RDS deletion
protection now that the stack is stable", PR #16) restored it: `infra/lib/backend-api-stack.ts`
line 145 now reads `deletionProtection: isProd`, so production gets deletion protection while
`dev`/`staging` do not — which is the intended posture. `removalPolicy` is unchanged
(`isProd ? RETAIN : DESTROY`), so production now carries **both** guards. The replacement comment
records the original bring-up rationale (three `ROLLBACK_FAILED` occurrences where deletion
protection blocked rollback of a never-completed create) and states the stack has since reached
`CREATE_COMPLETE` and is running stably. **No open item remains here.**

**TD-15 — No DNS record for the production API domain.** `infra/bin/backend-api.ts` hardcodes a
production ACM certificate ARN (with a `-c productionCertificateArn` context override) and the
stack outputs only `PublicApiUrl = loadBalancer.loadBalancerDnsName`. There is **no Route 53
construct** anywhere, so the mapping of `api.guestguideiq.com` → ALB is manual/out-of-band and not
captured in IaC.

**TD-16 — u2's CDK stack is not deployable.** `admin-api/infra/lib/admin-api-stack.ts` imports the
shared VPC / ECS cluster / security group / subnet ids via SSM parameters that u1's stack does not
publish (documented in `admin-api/README.md` and at the top of the stack file).

**TD-17 — No type-aware linting.** `parserOptions.project: false` in both ESLint configs disables
every `@typescript-eslint` rule requiring type information (`no-floating-promises`,
`no-misused-promises`, `await-thenable`, …). Relevant because the code uses `void
app.register(...)` and several fire-and-forget async patterns.

**TD-18 — Untracked build artifacts on disk.** `dist/`, `coverage/`, `admin-api/dist/`,
`admin-api/coverage/`, `infra/cdk.out/`, `admin-api/infra/cdk.out/` all exist locally. All are
gitignored; noted only because they inflate any naive directory walk of this repo.

**TD-19 — `guestaccess`'s `createStayService` is dead code.** See the Handoff Summary — it is a
gap, not merely debt, and is recorded there.

---

## Handoff Summary

- **Intent-relevant finding — the Guest half of the frontend has no way to obtain a link, and the
  Owner has no way to issue one.** The Guest app is entirely stay-token-scoped
  (`GET /v1/stays/:token`, `POST /v1/stays/:token/chat`), but **no HTTP endpoint anywhere in
  either service creates a `Stay`**. `createStayService` / `StayService.createStay` exist in
  `src/guestaccess/service.ts` (lines 62-77) and are **never referenced** — not by `wiring.ts`,
  not by any `routes.ts`, not by `internal/routes.ts`, not by admin-api. `grep -rn
  "createStay\|StayService"` across `src/` and `tests/` matches only that file's own definition.
  Stays exist in tests solely via `tests/factories/stayFactory.ts` seeding the fake DB directly.
  **Consequence for this intent**: US2.x (the Guest stay-scoped guide + itinerary chat) cannot be
  built against the deployed backend as it stands, and the Property Owner UI has no "generate
  guest link" API to call. A new `POST /v1/stays` (owner-authenticated, returning the token /
  link) is a prerequisite backend change, not a frontend one. This should be surfaced at
  requirements-analysis rather than discovered at code-generation.

- **Risks / follow-up** (the architect must preserve all of these):

  1. **Host-header tenancy is a blocking architectural constraint for a browser frontend.** Two
     public flows resolve the tenant (locality-brand) from the *request's own* `Host` /
     `X-Forwarded-Host` header, not from a body field or a path segment:
     `POST /v1/accounts` (`identity/service.ts` → `locality.resolveDomain(input.host)`) and
     `requireStayToken` (`auth/middleware.ts` → `resolveStayForRequest(..., host)`, which requires
     the resolved locality to equal the property's `localityBrandId`, BR8.3). A browser calling
     `https://api.guestguideiq.com/v1/...` sends `Host: api.guestguideiq.com`, so **that single
     host would have to be registered as a domain of every locality-brand** — which
     `LocalityService.addDomain`/`createLocalityBrand` explicitly forbid (BR9.2: one domain maps to
     at most one locality-brand, enforced with a `409 CONFLICT`). A per-locality frontend origin
     calling a shared API origin therefore **cannot** resolve its tenant today. Resolving this is
     a joint frontend/backend design decision (same-origin reverse proxy per locality domain,
     an explicit `X-Locality-Domain`-style header, or a path/body tenant parameter) and must be
     taken before contract-design, not during construction.
  2. **CORS is merged and working, but its allowlist contains only the marketing site — and
     `credentials` is off, which decides the frontend's auth-storage approach.** (Corrects the
     earlier scan, which recorded CORS as living on an unmerged branch; it is on `main` as of
     `b9c7c6e` — see TD-1. All four sub-points below were re-read at `76d190d`.)
     - **Production `allowedOrigins` is exactly `['https://guestguideiq.com']`** — the marketing
       site and nothing else. `dev` and `staging` have no `domainConfig` entry at all, so
       `ALLOWED_ORIGINS` resolves empty there and `origin: false` refuses every cross-origin
       browser call. Every frontend origin this intent introduces (production, staging, preview
       deploys, and `http://localhost:<port>` for local development) must be added to
       `infra/bin/backend-api.ts`'s `domainConfig` and redeployed. **This is a backend change the
       frontend cannot make for itself**, and it must be sequenced before the first browser call
       from a new origin can succeed.
     - **`credentials` is NOT enabled** — the `app.register(cors, …)` options object in
       `src/app.ts` carries only `origin`, so `Access-Control-Allow-Credentials` is never emitted.
       Cross-origin cookies will be neither sent nor accepted by the browser. **Cookie/session auth
       is therefore not available to a cross-origin frontend.** Bearer tokens in the
       `Authorization` header are the only viable scheme unless the backend is changed, which
       pushes token storage (15-min access token + 7-day rotating refresh token) onto the frontend
       and makes the XSS-exposure trade-off of that storage a frontend design decision this intent
       must take explicitly.
     - The one alternative that would restore the cookie option is the **same-origin reverse proxy**
       already under consideration for the Host-header tenancy problem in risk 1 above. If the
       frontend is served same-origin with the API (per-locality domain proxying to the backend),
       CORS stops applying entirely and cookies become available again. **Risks 1 and 2 therefore
       share a solution and should be decided together, not separately.**
     - No `methods`, `allowedHeaders`, `exposedHeaders`, or `maxAge` overrides are configured
       (plugin defaults apply). Since no custom response header is exposed, a frontend cannot read
       any non-simple response header cross-origin — worth remembering if a correlation-id header
       is later added to answer TD-8.
  3. **Refresh-token rotation is unsafe behind the 2-task production service.** TD-12: the
     revocation store is per-process, so a rotated refresh token replayed against the other task
     succeeds, and legitimate refreshes can appear to work inconsistently. The frontend's silent
     re-auth strategy must not assume reliable single-use semantics until this is Redis-backed.
  4. **Itinerary chat cannot be demonstrated.** TD-2: with `CHAT_PROVIDER=null`, `POST
     /v1/stays/:token/chat` returns `504 CHAT_PROVIDER_TIMEOUT` whenever the locality has ≥3
     curated items, and a canned `sparse: true` reply otherwise. There is also **no endpoint to
     read chat history** — the transcript is only ever returned as a side effect of a POST.
  5. **Missing read endpoints the frontend will assume exist**: no `GET /v1/subscriptions` (TD-6 —
     and `PATCH` cancels on any unrecognized action), no `GET /v1/accounts/me` or any
     current-user/profile endpoint, no logout / token-revocation endpoint, no chat-history GET.
     `GET /v1/pois` and `GET /v1/events` have no pagination, filtering, or sorting and return the
     whole locality list.
  6. **No API contract artifact to generate a client from** (TD-3), and no request schemas on u1's
     public routes (TD-10) — so malformed requests can surface as `500` rather than `400`, and the
     frontend cannot rely on validation errors being well-shaped for every field.
  7. **Password reset is functionally incomplete** (TD-5) — the frontend can build the "request
     reset" screen, but the reset link will never arrive, and the confirm screen is untestable
     end-to-end.
  8. **PDF import is a frontend responsibility** (TD-4) — the backend accepts pre-extracted
     `sections` and a success flag; client-side extraction, size limits, and error handling are all
     unowned today.
  9. **`locality.visualStyling` has no schema** (TD-7) — the guest UI's theming contract must be
     defined by this intent, and the `null` fallback path is required (BR9.6).
  10. **Deployment/compliance flags to carry forward**: staging is bypassed in the real deploy path
      (TD-13, in tension with two `project.md` Mandated/Forbidden rules); the
      `api.guestguideiq.com` DNS record is not in IaC (TD-15); u2's CDK stack is not deployable
      (TD-16); `origin/HEAD` still points at a stale non-trunk branch (TD-1). None of these block
      frontend work, but the frontend's own hosting/CI design should not inherit the staging-bypass
      pattern.
      **No longer on this list**: RDS deletion protection, which commit `76d190d` restored to
      `isProd` — production now carries both `deletionProtection` and `removalPolicy: RETAIN`
      (TD-14, resolved).
  11. **What is genuinely strong and should be matched, not re-litigated, by the frontend**: a
      clean and consistently applied ports-and-adapters layering; a single shared error envelope
      across all three contracts; a full blocking CI gate (lint, format, typecheck-distinct-from-
      build, test, 80 % coverage floor, `npm audit`, gitleaks, Semgrep, Checkov, SHA-pinned
      actions); 91 % line coverage on u1 and a green 137+49-test suite; zero TODO/FIXME markers
      and zero `@ts-ignore` in the entire repo; no hardcoded secrets. The frontend repo should
      inherit this CI shape wholesale.
