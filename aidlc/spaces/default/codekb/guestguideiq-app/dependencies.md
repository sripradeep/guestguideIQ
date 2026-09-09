# Dependencies — `guestguideiq-app`

**Derived from**: the developer full-repo scan of 2026-09-07. Package names and versions are catalogued in `technology-stack.md` and are not repeated here — this file covers **relationships**: which package depends on which, in what direction, at compile time versus runtime, and what external systems the running services reach.

---

## Internal Package Dependencies

There are four independently installed npm packages in this repo and **no workspace linking, no hoisting, and no shared code between any of them**.

| From | To | Kind | Mechanism |
|---|---|---|---|
| `admin-api` | `backend-api` (u1 internal API) | **Runtime only, over HTTP** | `BACKEND_API_INTERNAL_URL`, default `http://localhost:3001/v1`, via `admin-api/src/internal/client.ts` (axios) |
| `infra/` | repo root `Dockerfile` | Build asset | `ecs.ContainerImage.fromAsset('..', { file: 'Dockerfile', target: 'runtime' \| 'migrate' })` |
| `admin-api/infra/` | `infra/` | Deploy-time, via AWS | SSM parameters for shared VPC / cluster / security group / subnet ids — **which `infra/` does not publish** |
| `backend-api` | `admin-api` | **None** | — |

The u1 ↔ u2 boundary is worth stating precisely because it constrains any future refactor: **there is no compile-time or npm dependency in either direction.** The two services share no types, no client SDK, and no generated code. u2 re-declares the request and response shapes it needs in `admin-api/src/internal/types.ts` by hand. This is real decoupling, and also real duplication.

## Internal Module Graph (inside u1)

`routes.ts` → `service.ts` → `repository.ts` (port), with `wiring.ts` as the sole place adapters are constructed. **No circular imports were observed.** The full component-to-component graph, including which service calls which, is in `component-inventory.md` § Component dependency graph.

## External Runtime Dependencies (systems the services talk to)

| System | Consumed by | Via | Notes |
|---|---|---|---|
| **PostgreSQL 16** | all ten u1 domain components | `@prisma/client`, always through a repository port | Single shared database; RDS in private subnets in production |
| **Stripe API** | `subscription` | `stripe` ^16.8.0, `subscription/stripeAdapter.ts` (skimmed, not read line by line) | The only third-party commercial API called |
| **Chat provider** | `chatmodule` | `src/chat/provider.ts` | **No vendor configured in any environment.** `CHAT_PROVIDER=null` resolves `NullChatProvider`, which always throws; any other value throws at startup |
| **OTLP trace collector** | `app-runtime` | OpenTelemetry SDK | Opt-in via `OTEL_ENABLED`; off by default |
| **AWS Secrets Manager** | container startup | CDK-wired ECS secrets | Every secret is injected as an env var; none are in code |
| **u1 internal API** | `admin-api` | axios, internal service JWT, W3C `traceparent`, 5 s timeout | Idempotent reads retried once on 502/503/504/network error; non-idempotent writes never retried |

**Not depended on**: no Redis or other shared cache (both stateful stores are per-process in memory), no mail transport (SES or otherwise), no object storage, no message queue, no search index, no feature-flag service.

## Dependencies the Frontend Will Inherit or Face

| Dependency of the frontend | Direction | Status |
|---|---|---|
| Frontend → u1 public API `/v1` | Runtime HTTP, bearer tokens | The only integration point. **No generated client and no OpenAPI to generate one from** — every type is hand-written and independently maintained on both sides |
| Frontend → u1 CORS allowlist | Deploy-time configuration | CORS itself is merged (`b9c7c6e`, on `main` at `76d190d`), but production's allowlist is **only** `https://guestguideiq.com` and `dev`/`staging` have no entry, so every frontend origin — production, staging, preview deploys, `localhost` — must be added to `infra/bin/backend-api.ts` `domainConfig` and redeployed. **A backend change the frontend cannot make for itself.** `credentials` is off, so cookie auth is unavailable cross-origin and bearer-token storage falls to the frontend. See `architecture.md` constraint 3 |
| Frontend → locality-brand domain registration | Deploy-time / data | Host-header tenancy means the frontend's origin and the API's origin are not independent choices. See `architecture.md` constraint 1 |
| Frontend → a `POST /v1/stays` that does not exist | **Blocked** | A prerequisite backend change. See `api-documentation.md` § A.9 |
| Frontend → client-side PDF extraction library | New, frontend-owned | The backend accepts pre-extracted sections only; extraction, size limits, and error handling are unowned today |
| Frontend → a `visualStyling` schema that does not exist | New, frontend-owned | Defining the theming contract and the `null` fallback (BR9.6) is this intent's work |

## Dependency Hygiene

- **Four independent lockfiles** mean four independent upgrade surfaces and four independent audit runs. CI runs `npm audit --audit-level=high` per package as a blocking step.
- **No transitive-dependency pinning beyond the lockfiles**, and no `overrides`/`resolutions` blocks.
- **Every third-party GitHub Action is pinned to a commit SHA**, with the human-readable tag in a trailing comment — a Semgrep supply-chain finding that was acted on rather than suppressed. The frontend repo should inherit this.
- **No dependency-update automation is configured** — no Dependabot or Renovate config file was found in the repo. `project.md` mandates automated dependency-vulnerability scanning from day one for backend work; `npm audit` in CI satisfies the scanning half, but nothing opens update PRs. Worth noting rather than assuming.
- **Direct dependency counts are small and deliberate**: 12 runtime packages in u1, 4 in u2. Each non-obvious choice is justified in a comment (for example `axios` over native `fetch`, chosen so `nock` can intercept).
