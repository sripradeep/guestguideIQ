# Technology Stack — `guestguideiq-app`

**Derived from**: the developer full-repo scan of 2026-09-07. Versions are as declared in the four `package.json` files; `package-lock.json` was consulted for the dependency list only, not for resolved transitive versions. Dependency relationships and risk analysis live in `dependencies.md`.

---

## Languages and Runtimes

| Item | Value |
|---|---|
| Language | TypeScript (both services and both CDK apps) |
| Declared engine | `engines.node >= 18.18` |
| Container base | `node:20-slim` |
| CI runtime | Node **24** |
| Compile target | ES2022, module CommonJS |
| Data layer language | Prisma DSL + SQL (one applied migration) |

**Three different Node majors are in play** — 18.18 declared, 20 shipped, 24 tested. The tested runtime is not the shipped runtime.

## Build and Tooling

| Concern | Tool |
|---|---|
| Package manager | npm (four independent lockfiles, no workspaces) |
| Compiler | `tsc` — **no bundler** |
| Dev loop | `tsx watch src/server.ts` |
| Test runner | Vitest (`environment: 'node'`, `globals: false`, `testTimeout: 10000`) |
| HTTP test client | Supertest; `nock` in u2 for outbound interception |
| Coverage | `@vitest/coverage-v8`, provider `v8`, reporters text/html/lcov |
| Linter | ESLint 8 with `@typescript-eslint` 7 |
| Formatter | Prettier 3 |
| Packaging | Multi-stage Docker, `runtime` and `migrate` targets, non-root user |
| IaC | AWS CDK v2 |
| CI | GitHub Actions, one workflow file |

## u1 `backend-api` — runtime dependencies

| Package | Version | Purpose |
|---|---|---|
| `fastify` | ^5.12.3 | HTTP framework for **both** listeners |
| `@fastify/cors` | ^11.3.0 | CORS — **the only Fastify plugin registered** |
| `@prisma/client` | ^5.18.0 | PostgreSQL ORM client |
| `jsonwebtoken` | ^9.0.2 | Access, refresh, and internal-service JWTs |
| `bcryptjs` | ^3.0.3 | Password hashing (pure-JS, not native `bcrypt`) |
| `pino` | ^9.3.2 | Structured logging with field redaction |
| `stripe` | ^16.8.0 | Subscription billing adapter |
| `@opentelemetry/sdk-node` | ^0.222.0 | Tracing SDK, opt-in via `OTEL_ENABLED` |
| `@opentelemetry/instrumentation-http` | ^0.222.0 | HTTP auto-instrumentation |
| `@opentelemetry/api` | ^1.9.1 | OTel API |
| `@opentelemetry/resources` | ^2.11.0 | Resource attributes |
| `@opentelemetry/semantic-conventions` | ^1.43.0 | Attribute names |

Notably absent: no validation library (no `zod`, `ajv` beyond Fastify's own, `joi`, or `class-validator`), no `@fastify/multipart`, no Redis client, no mailer, no OpenAPI generator.

## u1 — dev dependencies

`typescript` ^5.5.4 · `vitest` ^5.0.0 · `@vitest/coverage-v8` ^5.0.0 · `supertest` ^7.0.0 · `prisma` ^5.18.0 · `tsx` ^4.17.0 · `eslint` ^8.57.0 · `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin` ^7.18.0 · `eslint-config-prettier` ^9.1.0 · `prettier` ^3.3.3 · `pino-pretty` ^11.2.2 · `@types/node` ^24.13.3 · `@types/jsonwebtoken` · `@types/supertest`

## u2 `admin-api`

**Runtime**: `fastify` ^5.12.3 · `axios` ^1.7.4 · `jsonwebtoken` ^9.0.2 · `pino` ^9.3.2
**Dev**: the same toolchain as u1, plus `nock` ^13.5.4
**Absent**: no Prisma, no Stripe, no OpenTelemetry SDK

`axios` was chosen over native `fetch` specifically because `nock` intercepts Node's `http`/`https` modules, which native `fetch` does not — a testability-driven dependency choice, documented as such.

## Infrastructure

| Package | Version |
|---|---|
| `aws-cdk-lib` | ^2.150.0 |
| `constructs` | ^10.3.0 |
| `aws-cdk` (CLI) | ^2.150.0 |

Both CDK apps declare the same three.

## AWS Services in Use

VPC · ECS Fargate · Application Load Balancer · RDS PostgreSQL 16 · Secrets Manager · CloudWatch Logs · ACM (a hardcoded production certificate ARN) · SSM Parameter Store (u2 reads parameters u1 does not publish) · WAF (u2's IP allowlist) · GitHub OIDC for deploy credentials.

**Not present**: Route 53 (no DNS construct anywhere), SES or any mail transport, ElastiCache/Redis, S3 or any object storage, API Gateway.

## Version Risks

| Risk | Detail |
|---|---|
| `eslint` 8.x | EOL upstream; `@typescript-eslint` 7.x trails the current 8.x line |
| `vitest` / `@vitest/coverage-v8` | Pinned to a `^5.0.0` major |
| `@types/node` ^24 | Far ahead of both the declared `>=18.18` engine and the `node:20-slim` image — type definitions describe APIs the shipped runtime does not have |
| Three Node majors | 18.18 declared / 20 shipped / 24 tested |

## Relevance to the Frontend Intent

The backend's **tech stack does not constrain the frontend's** — the two repos share no code, no types, and no npm linkage, and there is no published client package to consume. What the frontend inherits is the *shape* of the toolchain, not the packages: TypeScript with the same strict compiler flags, Vitest, ESLint + Prettier as blocking gates, a typecheck step distinct from build, and the full CI security chain. Frontend framework and hosting remain open choices.

One concrete carry-over: because there is **no machine-readable API contract** and no shared types package, the frontend will hand-write and independently maintain every request/response type in this stack. Either accepting that duplication or introducing a generated contract is a decision the frontend design owes an answer to.
