# Tech Stack Decisions — u1-backend-api

Resolves `requirements.md` C3 (hosting left open, unaffected here) and C4 (backend language/framework/database, resolved below) plus NFR3.6/OQ1/OQ2/OQ3's deferred technology choices (Q1-Q4, Q7-Q8). Nothing in the existing codebase constrains any of this — the marketing site (`technology-stack.md`) is a static Astro build with no server runtime, so this is a from-scratch decision set, not a migration.

## Decisions

| Area | Decision | Rationale | Alternatives Considered |
|---|---|---|---|
| Language & runtime | Node.js + TypeScript (Q1) | Matches the org's existing TS familiarity (`code-structure.md` naming conventions carry forward per `team.md` Code Style); single language across the whole codebase; mature SDKs for whichever LLM provider Q4's adapter eventually wraps; native `fetch`/async idioms suit the REST-heavy contract surface | Python+FastAPI (strong alternative, especially for LLM-heavy work — rejected only because Node/TS keeps one language org-wide); Go (rejected — zero prior team exposure) |
| Web framework | Fastify | Schema-based request/response validation maps directly onto `contract-summary.md`'s existing OpenAPI schemas; lower overhead than Express at the throughput target (NFR1.6); first-class TypeScript support | Express (more ubiquitous but weaker native schema validation — would need an add-on like `zod`/`ajv` wired in separately, which Fastify provides built-in) |
| Database | PostgreSQL (Q2) | The 11-entity domain model (`entities.md`) is heavily relational with genuine N:M relationships (`POI.localityIds`); JSONB columns hold `GuideContent.sections` and `LocalityEntity.visualStyling`'s optional/flexible shape without a second data store | MongoDB (rejected — the relational core would fight a document model); DynamoDB (rejected — premature before `infrastructure-design` confirms AWS as the host, per C3) |
| ORM / data access | Prisma | Type-safe query generation matching the TypeScript stack; migrations-as-code fit the team's PR-reviewed, CI-gated workflow (`team.md` Way of Working); mature Postgres support including JSONB columns | Drizzle (lighter-weight, viable alternative — Prisma chosen for its more mature migration tooling at this team's current scale); raw `pg` client (rejected — no type safety, more boilerplate) |
| Password hashing | bcrypt via the `bcrypt` npm package (Q3, concretizes NFR3.6/NFR3.7) | Industry-standard, audited, mature Node bindings | argon2id (stronger but less universally battle-tested in this ecosystem at the team's current scale) |
| Authentication | JWT (access + refresh), via a standard `jsonwebtoken`-family library | Keeps the app tier stateless (`scalability-requirements.md` NFR5.3) — no shared session store needed for horizontal scale-out | Server-side sessions (rejected — would require a shared session store, undermining the stateless-scaling goal) |
| LLM integration (itinerary chat) | Provider-agnostic adapter interface (Q4) — a single internal `ChatProvider` port with no concrete vendor wired yet | Keeps OQ3 open per the team's explicit choice to defer vendor lock-in to Code Generation, while still letting `functional-design`/`nfr-requirements` reason about the integration's shape (grounding context, timeout/retry per BR7.3) | Wiring Anthropic or OpenAI directly now (both viable — deliberately deferred per Q4's own reasoning) |
| Billing | Stripe (Q7), via Stripe Checkout/tokenized payment methods | Keeps PCI-DSS scope minimal (`security-requirements.md` NFR3.12) — this backend never touches raw card numbers; maps cleanly onto the placeholder `"standard"` plan tier already assumed at `functional-design` (Q3) | Deferring billing entirely (viable, rejected in favor of a real integration since Stripe's tokenization approach adds negligible complexity while resolving OQ1 now) |
| Event ingestion (FR6) | Manual/admin-curated feed via `admin-api`'s existing internal Event endpoint (Q8) | Avoids committing to an unvalidated third-party API's auth/rate-limit/cost profile before a concrete source is chosen; `BR6.1`'s dedup-by-`sourceRef` logic works identically whether ingestion is manual or automated later | Committing to a named third-party events API now (rejected — no such source has been evaluated; premature) |
| Observability | Structured JSON logging via `pino`; tracing via an OpenTelemetry SDK (Q9) | `pino`'s low overhead suits the performance targets in `performance-requirements.md`; OpenTelemetry avoids locking into a specific vendor's proprietary SDK before `infrastructure-design` picks a hosting/aggregation platform | Vendor-specific SDKs (e.g. Datadog's own agent) — rejected as premature per the same reasoning as the LLM/billing deferrals |
| Testing tooling | Vitest (unit) + Supertest (API/integration), per `team.md`'s affirmed BDD-then-unit-tests methodology | Vitest's TypeScript-native, fast execution suits the "write the scenario, implement, then add lower-level unit tests" ordering; Supertest exercises the Fastify routes directly against the OpenAPI contracts | Jest (viable alternative — Vitest chosen for faster TS-native execution with no separate transpile step) |
| Linting & formatting | ESLint + Prettier, enforced as a blocking PR check | Directly satisfies `team.md`'s Q8-confirmed mandate (blocking, not advisory) | N/A — this was already decided at practices-discovery; recorded here only for completeness of the tech-stack picture |

## Deferred to Infrastructure Design

- Concrete hosting/compute platform (`requirements.md` C3 — not committed to AWS despite the marketing site's original spec naming it)
- `admin-api` ↔ `backend-api` network isolation mechanism (`security-requirements.md` NFR3.11)
- TLS/certificate provisioning for an arbitrary number of locality-brand custom domains (NFR6.2)
- Concrete observability aggregation platform (CloudWatch, Datadog, etc.) — the SDK-level choice (OpenTelemetry) is fixed above, the destination is not
- Rate-limiting mechanism (API gateway vs. application-level middleware) for `security-requirements.md` NFR3.10

## Traceability

Tech-stack decisions are cross-cutting infrastructure/tooling choices rather than a distinct inception NFR category — see `traceability.json`'s `reverse` array for how this file's coverage is justified.
