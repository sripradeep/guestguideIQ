# Reverse Engineering Timestamp — `guestguideiq-app`

## Run Record

| Field | Value |
|---|---|
| **Repo analyzed** | `guestguideiq-app` — sibling of `aidlc/` at the workspace root, `C:\Projects\guestguideIQ\guestguideiq-app` |
| **Reverse engineering performed** | 2026-09-07 |
| **Analysis commit** | **`main` @ `76d190d5011110d5fe0d115b87e9754368965094`** — "Re-enable RDS deletion protection now that the stack is stable (#16)". Working tree clean, tracking `origin/main`; `git branch --contains HEAD` returns `main`. **This is the trunk, not a branch.** |
| **Prior pass** | `40c8aed` on `feature/cors-support`. That branch has since merged into `main` (`b9c7c6e`, PR #15), and `76d190d` landed on top. `git diff 40c8aed..HEAD` touches **exactly one file** — `infra/lib/backend-api-stack.ts`, 8 insertions / 11 deletions — so the entire tree outside that file, `src/` and `tests/` included, is byte-identical to what the earlier pass analyzed. |
| **Source fingerprint at snapshot** | `git:a08c7ba330b9278d7d7ec27568218b34efbcb838` |
| **Working tree** | Clean |
| **Scan breadth** | **Full repository rescan** — pre-scan snapshot `paths: ["./"]` |
| **Prior CodeKB store** | **None** — `codekb-scope-diff --repo guestguideiq-app` returned `NO_STORE`. This is a first scan; all nine artifacts were authored from this run with no merge and no prior prose to preserve. |
| **Intent** | `260907-frontend-app` — build the Property Owner and Guest-facing frontend consuming this backend |
| **Pipeline** | Link 1 developer full-repo scan (`inception/reverse-engineering/developer-scan-guestguideiq-app.md`) → link 2 architect synthesis (this run) |

## Verification Depth

Claims across these nine artifacts fall into **three honest buckets**, stated separately so a reader knows which rest on fresh reads at the analysis commit.

**1 — Re-verified at HEAD (`76d190d`) in this pass**, read again rather than carried forward: `git log`, `git status --short --branch`, `git branch --contains HEAD`, `git branch --no-merged main`, `git branch -r --no-merged main`, `git symbolic-ref refs/remotes/origin/HEAD`, and the complete `git diff 40c8aed..HEAD`; `infra/lib/backend-api-stack.ts` (the one changed file — the `deletionProtection` / `removalPolicy` block plus the task-definition `environment` block carrying `ALLOWED_ORIGINS` and `CHAT_PROVIDER`); and the complete CORS chain end to end — `package.json` (`@fastify/cors`), `src/config.ts`, `src/wiring.ts`, `src/app.ts` (the `app.register(cors, …)` call **and its options object**), `infra/bin/backend-api.ts` (`domainConfig.production.allowedOrigins`), `tests/unit/cors.test.ts` (read in full this pass; only enumerated in the prior one), and `.env.example` (read in full).

**2 — Explicitly NOT re-executed this pass**: both test suites and the u1 coverage run. The recorded numbers (u1 39 files / 137 tests passing plus 1 skipped, lines 91.15 %; u2 15 files / 49 tests) were measured during the `40c8aed` pass, together with one throwaway probe test (since deleted; tree left clean) that empirically confirmed the app-level rate-limit `preHandler` fires. They are **carried forward, not re-measured** — justified because `src/` and `tests/` are byte-identical to `40c8aed`, so those results still describe this exact source. They remain measured numbers, not inferred ones; they are simply measured one commit earlier against identical bytes.

**3 — Carried forward from the `40c8aed` pass** on the same byte-identity justification: the API surface for all three contracts, the domain components, the data model, the build system, the dependency inventory, and the code-quality indicators. Nothing in the one-file delta touches any of them.

Read line by line and understood: every `routes.ts` and every `service.ts` in both packages; all repository **port interfaces and record types**; the composition and cross-cutting files (`app.ts`, `internalApp.ts`, `server.ts`, `config.ts`, `wiring.ts`, `lib/*`, `auth/jwt.ts`, `auth/middleware.ts`, `ratelimit/*`, `chat/provider.ts`); `prisma/schema.prisma`; both READMEs and both `.env.example` files; all build, lint, format, and TypeScript configs; the Dockerfile and entrypoint; `.github/workflows/ci.yml`; u1's CDK app; and the two u1 contract integration tests.

Skimmed at directory or signature granularity, **not** deeply verified: the Prisma **adapter bodies** below each exported port interface; the u1 BDD, unit, doubles, factories, and helpers test files (enumerated and run, but only `contract2.test.ts`, `contract3.test.ts`, and `buildTestApp.ts` were read); all of `admin-api/tests/`; u2's `config.ts`, `server.ts`, `wiring.ts`, `lib/*`, and `auth/jwt.ts`; u2's CDK stack body; and the init migration SQL (the Prisma schema was treated as authoritative and read in full).

Skipped entirely as generated or vendored, and noted rather than analyzed: `node_modules/`, `dist/`, `coverage/` and their `admin-api/` and `infra/` equivalents, `infra/cdk.out/`, `admin-api/infra/cdk.out/`, `.git/`. All are gitignored; the build and coverage trees exist on disk as untracked local output.

Claims in the other eight artifacts are bounded by this split. In particular, database-level field nullability beyond what the port record types declare, and the internal quality of individual test files, are **not** independently verified.

## Freshness Caveat

This store describes the repo **as of `76d190d` on `main`** — the trunk, not a branch. A consumer reading `main` will find everything documented here, including the full CORS chain, which merged in `b9c7c6e` (PR #15) and is no longer branch-dependent. The earlier freshness caveat on this store — that the CORS work existed only on an unmerged `feature/cors-support` — **is withdrawn.**

Two caveats remain:

- **`origin/HEAD` still points at `build-and-test-ci-pipeline-fixes`, not `main`**, so a fresh `git clone` checks out a stale non-trunk branch by default. Anyone verifying these artifacts against a new clone must `git checkout main` first. The unmerged backlog is otherwise down to one local branch (`fix/wire-missing-jwt-secrets`) and two remote, from seven.
- **Test and coverage numbers were measured at `40c8aed`, not re-executed at `76d190d`** — see Verification Depth bucket 2. They are valid for this source because `src/` and `tests/` are byte-identical, and they would need re-running the moment either tree changes.

## Scope of Analysis

```yaml
scope_version: 1
kind: full
intent: 260907-frontend-app
fingerprint: a08c7ba330b9278d7d7ec27568218b34efbcb838
analyzed:
  paths:
    - ./
    - README.md
    - package.json
    - tsconfig.json
    - tsconfig.build.json
    - vitest.config.ts
    - .eslintrc.cjs
    - .prettierrc
    - .env.example
    - Dockerfile
    - docker-entrypoint.sh
    - .github/workflows/ci.yml
    - prisma/schema.prisma
    - src/
    - src/auth/
    - src/ratelimit/
    - src/lib/
    - src/chat/
    - src/internal/
    - src/identity/
    - src/onboarding/
    - src/guide/
    - src/poi/
    - src/event/
    - src/subscription/
    - src/guestaccess/
    - src/chatmodule/
    - src/leadcapture/
    - src/locality/
    - tests/integration/
    - infra/
    - admin-api/README.md
    - admin-api/package.json
    - admin-api/.env.example
    - admin-api/vitest.config.ts
    - admin-api/src/app.ts
    - admin-api/src/auth/middleware.ts
    - admin-api/src/internal/
    - admin-api/src/poi/
    - admin-api/src/events/
    - admin-api/src/accounts/
    - admin-api/src/localities/
  components:
    - identity
    - onboarding
    - guide
    - poi
    - event
    - subscription
    - guestaccess
    - chatmodule
    - leadcapture
    - locality
    - admin-api
    - app-runtime
    - auth
    - ratelimit
    - persistence
    - infra-u1
    - infra-u2
shallow:
  paths:
    - tests/bdd/
    - tests/unit/
    - tests/doubles/
    - tests/factories/
    - tests/helpers/
    - admin-api/tests/
    - admin-api/src/config.ts
    - admin-api/src/server.ts
    - admin-api/src/wiring.ts
    - admin-api/src/lib/
    - admin-api/src/auth/jwt.ts
    - admin-api/infra/
    - prisma/migrations/
    - src/db/
    - src/auth/password.ts
    - src/auth/refreshTokenStore.ts
    - src/lib/ids.ts
    - src/guide/propertyLookup.ts
    - src/locality/domainCache.ts
    - src/subscription/stripeAdapter.ts
```
