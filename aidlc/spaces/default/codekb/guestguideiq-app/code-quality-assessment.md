# Code Quality Assessment — `guestguideiq-app`

**Derived from**: the developer full-repo scan of 2026-09-07, re-run over current HEAD (branch `main`, HEAD `76d190d`; the earlier pass ran at `40c8aed`, and `git diff 40c8aed..HEAD` touches only `infra/lib/backend-api-stack.ts`, leaving `src/` and `tests/` byte-identical). **Both test suites and the u1 coverage run were executed during the `40c8aed` pass and are carried forward on that byte-identity, not re-executed at `76d190d`** — the numbers below are measured, not read off a badge. Test *directories* under `tests/bdd/`, `tests/unit/`, `tests/doubles/`, `tests/factories/`, `tests/helpers/` and all of `admin-api/tests/` were enumerated and run but **not read line by line**, so claims about individual test quality inside them are not made.

---

## Verdict

This is a **well-built backend with a small number of sharp, specific gaps**. The engineering discipline — layering, CI, secret handling, comment traceability, marker hygiene — is above the norm and should be inherited wholesale by the frontend repo. The gaps are not sloppiness; they are unfinished integrations (chat vendor, mail transport, stay creation) and a handful of deliberate shortcuts that were documented at the time and never revisited.

## Test Coverage — measured

| Suite | Result | Time |
|---|---|---|
| u1 `npx vitest run tests/` | **39 files passed, 1 skipped (40); 137 tests passed, 1 skipped (138)** | 2.85 s |
| u2 `npx vitest run tests/` | **15 files, 49 tests, all passed** | 1.29 s |

The skipped file is `tests/integration/dbSmoke.test.ts`, gated on `RUN_DB_SMOKE_TEST=1`, which is set only in CI where a real Postgres 16 service container runs.

**u1 coverage (`--coverage`, executed during the scan):**

| Metric | Result |
|---|---|
| **Lines** | **91.15 % (649/712)** |
| Statements | 89.37 % |
| Branches | 76.53 % |
| Functions | 92.24 % |

Comfortably over the **80 % line floor** configured in `vitest.config.ts` (`thresholds: { lines: 80 }`, provider `v8`, `include: ['src/**/*.ts']`). u1 excludes `src/server.ts`, `src/db/prismaClient.ts`, `src/wiring.ts` from coverage; u2 excludes `src/server.ts`, `src/wiring.ts`.

Weakest directories by line coverage: `src` (79.31 %), `src/poi` (80.76 %), `src/event` (83.33 %), `src/guide` (83.75 %), `src/guestaccess` (85.71 %, and only **70 % of functions** — the dead `createStay` code sits in this directory).

**Test data strategy** (documented in the README as a deliberate deviation): every repository port has an in-memory double under `tests/doubles/`, all thirteen sharing one `fakeDb.ts` object so cross-module BDD scenarios see consistent state. The stated reason is that the code-generation environment had neither Docker nor local PostgreSQL. Prisma adapters are covered separately in `tests/unit/repositories/*.test.ts` against a mocked `PrismaClient`.

**Named coverage gap**: the rate-limit `preHandler` wiring in `app.ts` has **no test at all** — a grep for `429` / `RATE_LIMITED` / `rateLimit` across `tests/` matches only `buildTestApp.ts`'s store construction. The developer verified firing empirically instead (12 consecutive `POST /v1/accounts` produced `404,404,404,404,404,429,429,429,429,429,429,429`). **CORS coverage is thin**: `tests/unit/cors.test.ts` (read in full at `76d190d`) has three tests, all against `GET /health` — an allowed origin is reflected in `Access-Control-Allow-Origin`, a non-allowlisted origin is not, and an unconfigured harness reflects nothing. **Nothing asserts `Access-Control-Allow-Credentials`, and there is no preflight `OPTIONS` test and no cross-origin test against a real `/v1/...` route** — the credentials-disabled behaviour the frontend's auth design depends on is unguarded by any regression test.

## Linting and Formatting

- **ESLint** at `.eslintrc.cjs` (root) and `admin-api/.eslintrc.cjs` (identical): `eslint:recommended` + `plugin:@typescript-eslint/recommended` + `prettier`. Notable rules: `no-unused-vars` error with a `^_` escape, `no-explicit-any` **warn** (off in `tests/`), `eqeqeq` always, `no-empty` with `allowEmptyCatch: false`, `no-console` warn (permits `console.error`).
- **`parserOptions.project: false` — there is no type-aware linting.** Every `@typescript-eslint` rule requiring type information is unavailable: `no-floating-promises`, `no-misused-promises`, `await-thenable`, and the rest. This matters because the code uses `void app.register(...)` and several fire-and-forget async patterns that exactly those rules exist to catch.
- **Prettier** at `.prettierrc`: semicolons, single quotes, trailing comma all, printWidth 100, tabWidth 2, arrowParens always. `format:check` is a **blocking** CI step.

## CI/CD

One file, `.github/workflows/ci.yml`. Triggers: `pull_request` → `main` and `push` → `main`. Node 24.

**`backend-api (u1)` job** — every step blocking, with a Postgres 16 service container:

`npm ci` → **lint** → **format:check** → **typecheck** (distinct from build) → **build** → `prisma migrate deploy` → **`test:coverage`** with `RUN_DB_SMOKE_TEST=1` (the 80 % floor enforced by the vitest config) → **`npm audit --audit-level=high`** → **gitleaks** → **Semgrep** (`p/ci`, `p/typescript`) → **CDK synth** → **Checkov** against `infra/cdk.out`.

**`admin-api (u2)` job**: the same chain minus Postgres and Prisma.

This chain satisfies every gate `project.md` mandates for backend work — green build, lint, test, coverage; blocking dependency-vulnerability scanning; blocking secret scanning; blocking linter and formatter; a typecheck step separate from build. It is the single strongest asset in the repo and **the frontend repo should inherit its shape wholesale**.

Two structural notes on the deploy half:
- `deploy-staging`, `integration-test-staging`, and `smoke-test-production` are **placeholder `echo` no-ops** by explicit design, blocked on an OIDC deploy role and on u1 publishing the SSM parameters u2 needs.
- `deploy-production` is **real**: OIDC credentials, `cdk deploy GuestGuideIQ-BackendApi-production --require-approval never --no-rollback --force`, then a one-off ECS `run-task` for `prisma migrate deploy`, gated on the `production` GitHub Environment's required reviewer. Its `needs:` is `[backend-api, admin-api]` — the staging dependency is deliberately **not** wired.

Every third-party action is pinned to a commit SHA (with the tag in a trailing comment), and every Checkov skip carries a documented reason at the skip site.

## Documentation Quality

- **Two substantial, accurate, current READMEs** (root and `admin-api/`) covering stack, layout, local setup, test commands, and deployment.
- **`.env.example` in both packages** documents its variables with a comment and **no values** — with one verified omission: the root `.env.example` never mentions `ALLOWED_ORIGINS`, which `src/config.ts` reads, so a local developer silently gets `origin: false` unless they know to set it. (This corrects the earlier claim that every variable is named.)
- **Source comments are unusually thorough and traceability-oriented**: nearly every non-obvious decision cites the design artifact that motivated it (`security-design.md`, `BR8.3`, `NFR3.11`, `AC4.3.2`, …), and several carry a post-mortem of a real deployment failure.
- **Absent**: no generated API reference, **no OpenAPI file**, no ADR directory, no CHANGELOG, no CONTRIBUTING.

## Security Posture

Strong, with no findings of the "credentials in code" class:
- **No hardcoded secrets anywhere.** `config.ts` reads every one from `process.env` and fails fast at startup; Secrets Manager is wired in CDK.
- pino redaction covers `password`, `passwordHash`, `authorization`, `token`, `stayToken`.
- Non-root container user; RDS in private subnets; the internal listener bound to loopback and never `EXPOSE`d or placed in a target group.
- Deliberate information hiding in failure paths (identical `401` for unknown-user and wrong-password; identical `410` for all four stay-link failure modes; `202` always on reset request).
- Only two `eslint-disable` comments repo-wide, both `no-console` on a fatal-startup `console.error`.
- **Zero `TODO` / `FIXME` / `HACK` / `XXX` comments and zero `@ts-ignore` / `@ts-expect-error`** across all TypeScript in `src/`, `tests/`, `admin-api/`, and `infra/`.

## Architecture Discipline

Every u1 module is the same `repository.ts` / `service.ts` / `routes.ts` triad, consistently applied with no observed violation; `wiring.ts` is the sole composition root; no circular imports. No file exceeds 175 lines. u1 `src/` totals 3 268 lines against 3 378 lines of tests.

---

## Technical Debt Register

Nineteen signals, in the developer's original numbering so downstream references stay stable. Items marked **[FE]** directly shape the frontend design; the rest are recorded for completeness.

| ID | Signal | Impact |
|---|---|---|
| **TD-1** (CORS half **RESOLVED**; residual branch hygiene) | **The CORS work is now on `main`** — `b9c7c6e` merged PR #15, and the `@fastify/cors` dependency, `config.allowedOrigins`, the `ALLOWED_ORIGINS` task-definition var, and the `domainConfig.production.allowedOrigins` entry were all re-read on the trunk at `76d190d`. Nothing CORS-related depends on an unmerged branch any more. **What remains is branch hygiene**: `origin/HEAD` still points at the stale non-trunk branch `build-and-test-ci-pipeline-fixes`, so a fresh `git clone` checks out the wrong branch by default — an onboarding trap, trivially fixed with `git remote set-head origin main` plus changing the default branch in the GitHub repo settings. The backlog has otherwise improved from seven unmerged branches to **one local (`fix/wire-missing-jwt-secrets`) and two remote**, and both recent changes (#15, #16) went through pull request, consistent with `project.md`'s Mandated PR-review rule. | Onboarding trap only — no longer blocking. **But CORS being merged is not the same as the frontend being able to call the API**: the allowlist excludes every frontend origin and `credentials` is off. Those frontend-blocking facts are recorded in `architecture.md` constraint 3 and `api-documentation.md` § CORS, not as a debt signal here. |
| **TD-2** **[FE]** | **Itinerary chat has no LLM vendor.** `CHAT_PROVIDER=null` in `.env.example` and in the CDK task definition. `NullChatProvider` always throws; the only 200 path is the sparse-content fallback (<3 curated items). US2.3 cannot be demonstrated end to end. | Feature non-functional |
| **TD-3** **[FE]** | **No machine-readable API contract.** No OpenAPI/Swagger, no JSON Schema export, no published types package, no generated client — and no Fastify schemas on u1's public routes, so nothing is derivable from the running app. | Frontend hand-writes and duplicates every type |
| **TD-4** **[FE]** | **PDF import is a client-side responsibility with no server support.** No `@fastify/multipart`, no upload endpoint, no object storage, no file-size limit anywhere in `src/` or `infra/`. | Unowned work lands on the frontend |
| **TD-5** **[FE]** | **Password-reset tokens are generated and thrown away.** `identity/routes.ts` ignores the `{ resetToken }` return; no mailer, no SES construct, no queue. `POST /v1/auth/reset/confirm` is dead in practice. | Reset flow untestable end to end |
| **TD-6** **[FE]** | **`PATCH /v1/subscriptions` cancels on any unrecognised action** — a nested ternary whose final `else` is `cancel`. A missing body, a typo, or a future action value silently cancels. There is also **no `GET /v1/subscriptions`**. | Dangerous call; no safe way to render plan state |
| **TD-7** **[FE]** | **`locality.visualStyling` is an unschematized JSON blob** (`Record<string, unknown> \| null`; `Json?` in Prisma). Nothing constrains, validates, or documents its keys, yet the guest UI themes from it (BR9.6). | Theming contract is this intent's to define |
| **TD-8** **[FE]** | **Error envelope has no correlation id.** `toErrorEnvelope` emits only `{ code, message, details? }`. OTel `traceparent` is propagated between services but never surfaced to the client. | Frontend error reports cannot be tied to server traces |
| TD-9 | **Rate limiting has zero test coverage.** No test asserts a 429 or exercises the `preHandler` wiring, which is registered *after* route registration and uses hand-rolled path matching (`path.startsWith('/v1/stays/') && !path.endsWith('/chat') && method === 'GET'`). Verified empirically during the scan; brittle against future route additions. | Unguarded regression risk |
| **TD-10** **[FE]** | **Two public routes throw 500 on a missing body.** The `guide/routes.ts` favorites handler destructures `request.body` with no `?? {}` fallback, unlike every other handler in the file. Root cause is the absence of Fastify request schemas on u1's public surface (u2 has them). | Malformed requests can surface as `500`, not `400` |
| TD-11 | **Three Node majors in play** — `engines.node >= 18.18`, Docker `node:20-slim`, CI Node 24. The tested runtime is not the shipped runtime. | Latent runtime divergence |
| **TD-12** **[FE]** | **Single-instance state behind a multi-task service.** `InMemoryRefreshTokenStore` and `InMemoryRateLimitStore` are per-process while production runs `desiredCount: 2`, autoscaling to 6. Refresh-token revocation is not shared, so a rotated token replayed against another task is accepted; each rate-limit bucket is multiplied by the task count. Both files name Redis as the upgrade path; neither is wired. | Frontend silent-re-auth must not assume reliable single-use semantics |
| TD-13 | **Staging is bypassed in the real deploy path.** `deploy-staging` and `integration-test-staging` are `echo` placeholders while `deploy-production` is fully wired and depends only on the two PR-gate jobs; the workflow comment says "Environment Provisioning wired production directly, skipping staging-first validation." **This is in tension with `project.md`'s Mandated rule** ("ALWAYS require manual approval before a production deployment … deployments first go to a staging environment") **and the matching Forbidden rule.** The manual-approval half **is** honoured via the `production` GitHub Environment's required reviewer; the staging-first half is not. | Compliance gap; the frontend repo must **not** inherit this pattern |
| TD-14 (**RESOLVED**) | **RDS deletion protection has been re-enabled for production.** Commit `76d190d` ("Re-enable RDS deletion protection now that the stack is stable", PR #16) replaced the unconditional `deletionProtection: false` with `deletionProtection: isProd`, so production gets deletion protection while `dev`/`staging` do not — the intended posture. `removalPolicy` is unchanged (`isProd ? RETAIN : DESTROY`), so **production now carries both guards**. The replacement comment records the original bring-up rationale (three `ROLLBACK_FAILED` occurrences where deletion protection blocked rollback of a never-completed create) and notes the stack has since reached `CREATE_COMPLETE` and runs stably. | **No open item remains.** |
| TD-15 | **No DNS record for the production API domain.** A production ACM certificate ARN is hardcoded (with a `-c productionCertificateArn` context override) and the stack outputs only `PublicApiUrl = loadBalancer.loadBalancerDnsName`. **No Route 53 construct exists anywhere**, so `api.guestguideiq.com` → ALB is manual and out of band. | Untracked infrastructure state |
| TD-16 | **u2's CDK stack is not deployable** — it imports shared VPC / cluster / security group / subnet ids via SSM parameters u1's stack does not publish. Documented in `admin-api/README.md` and at the top of the stack file. | Ops tool cannot ship |
| TD-17 | **No type-aware linting** — `parserOptions.project: false` in both ESLint configs disables `no-floating-promises`, `no-misused-promises`, `await-thenable`, and every other type-dependent rule. Relevant given `void app.register(...)` and several fire-and-forget async patterns. | Class of bugs the linter cannot see |
| TD-18 | **Untracked build artifacts on disk** — `dist/`, `coverage/`, `admin-api/dist/`, `admin-api/coverage/`, `infra/cdk.out/`, `admin-api/infra/cdk.out/`. All gitignored; noted only because they inflate a naive directory walk. | Cosmetic |
| **TD-19** **[FE]** | **`guestaccess`'s `createStayService` is dead code** — `StayService.createStay` (`src/guestaccess/service.ts` lines 62–77) is referenced by nothing. **No endpoint anywhere creates a `Stay`**, yet the whole Guest app hangs off `GET /v1/stays/:token`. Stays exist only via `tests/factories/stayFactory.ts`. | **Blocking** — the Guest frontend has no supply side; a `POST /v1/stays` is a prerequisite backend change |

## What the Frontend Repo Should Inherit, Not Re-Litigate

Named positively so it is not lost among the debt: a clean and consistently applied ports-and-adapters layering; a single shared error envelope across all three contracts; the **full blocking CI gate** (lint, format, typecheck-distinct-from-build, test, 80 % coverage floor, `npm audit`, gitleaks, Semgrep, Checkov, SHA-pinned actions); 91 % line coverage on u1 with a green 137 + 49 test suite; zero TODO/FIXME markers and zero `@ts-ignore` repo-wide; no hardcoded secrets; and the habit of citing the motivating design artifact in the comment next to a non-obvious decision.

Two things it should **not** inherit: the staging bypass (TD-13) and the absence of type-aware linting (TD-17).
