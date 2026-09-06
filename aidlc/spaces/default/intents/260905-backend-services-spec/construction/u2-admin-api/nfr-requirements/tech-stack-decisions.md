# Tech Stack Decisions — u2-admin-api

Most of this Unit's tech stack is inherited by reference from `u1-backend-api/nfr-requirements/tech-stack-decisions.md`, since `admin-api` has no domain logic of its own — the decisions below are only the ones specific to this Unit.

## Decisions

| Area | Decision | Rationale |
|---|---|---|
| Language & runtime | Node.js + TypeScript (Q1) | Same as `u1-backend-api` — no reason to diverge for a thin delegation layer; keeps the two-service split (Units Generation) a deployment/trust boundary, not a technology fragmentation |
| Web framework | Fastify | Same as `u1-backend-api`, for the same schema-validation and TypeScript-support reasons |
| Database | **None.** `admin-api` owns no entities (ADR-004) — every read/write it performs is a delegated call into `u1-backend-api`'s PostgreSQL-backed internal API. There is no second database to choose. | — |
| Authentication library | Same JWT library as `u1-backend-api`, configured with a distinct `ops` role claim (Q2) and a separate internal-service-JWT issuance path (Q3) | Reuses infrastructure rather than introducing a second auth mechanism |
| Testing tooling | Vitest + Supertest, same as `u1-backend-api`, per `team.md`'s affirmed BDD-then-unit-tests methodology | Consistency across both services' CI pipelines |
| Linting & formatting | ESLint + Prettier, blocking PR check | Same org-wide mandate (`team.md` Q8) applies identically to this repository/service |
| Observability | Structured JSON logging (`pino`) + OpenTelemetry SDK, same as `u1-backend-api` | Keeps the one real inter-service trace (this Unit → `u1-backend-api`) coherent across both ends |

## Explicitly Not Applicable to This Unit

- Billing provider (Q7) — `admin-api` never touches subscription/payment flows
- LLM provider (Q4) — `admin-api` has no chat capability
- Event-source mechanism (Q8) — `admin-api` only curates events via `backend-api`'s internal API; the ingestion-source decision belongs entirely to `u1-backend-api`

## Traceability

Cross-cutting tooling decisions — see `traceability.json`'s `reverse` array.
