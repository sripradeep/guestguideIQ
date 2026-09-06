# Contract Design — Plan & Questions

Three boundaries need a formal contract, per `units-generation/unit-of-work-dependency.md`'s DAG and each Unit's externally-consumed surface:

1. **Inter-unit**: `admin-api` (U2) → `backend-api` (U1) — the internal write API `Admin` calls for POI/Event/Identity/Locality mutations (the one DAG edge).
2. **Public/external**: `backend-api` (U1) → a not-yet-chosen Property Owner/Guest-facing web client — the product's main public API.
3. **Public/external**: `backend-api` (U1) → the *existing* marketing-site repository's lead-capture forms — the `LeadCapture` endpoints replacing Formspree (FR1.3).

---

## Q1: Integration mechanism for `admin-api` → `backend-api`

- A. Synchronous REST/HTTP with JSON payloads — simplest, no new tooling, matches the team's small scale and the fact that neither service's tech stack is chosen yet (`requirements.md` C4).
- B. gRPC — stronger typing and better performance, at the cost of extra tooling (protobuf codegen, gRPC server/client setup) for what is currently a single internal boundary between two small services.
- X. Other (please specify)

[Answer]: A. Synchronous REST/HTTP with JSON payloads — simplest, no new tooling, matches the team's small scale and the fact that neither service's tech stack is chosen yet (`requirements.md` C4).

---

## Q2: API style for `backend-api`'s public/external surface

- A. REST (resource-oriented HTTP/JSON) — the conventional default for a web/mobile client and for form-style submissions (`LeadCapture`); no reason identified to deviate.
- B. GraphQL — more flexible querying for a frontend, at the cost of a schema/resolver layer this early-stage, single-team product doesn't yet need.
- X. Other (please specify)

[Answer]: A. REST (resource-oriented HTTP/JSON) — the conventional default for a web/mobile client and for form-style submissions (`LeadCapture`); no reason identified to deviate.

---

## Q3: Versioning and breaking-change policy

- A. URI versioning (`/v1/...`), additive/backward-compatible changes preferred within a version; a breaking change requires a new version path. Simplest, most widely understood, easiest for the marketing-site repo's forms to adopt without header/content-negotiation logic.
- B. Header-based versioning (`Accept: application/vnd.guestguideiq.v1+json`) — cleaner URLs, more setup and less familiar to a small team building its first backend.
- X. Other (please specify)

[Answer]: A. URI versioning (`/v1/...`), additive/backward-compatible changes preferred within a version; a breaking change requires a new version path. Simplest, most widely understood, easiest for the marketing-site repo's forms to adopt without header/content-negotiation logic.

---

## Q4: Error, timeout, and retry behavior at each boundary

`requirements.md`'s NFR1.1 explicitly scopes this as a pre-launch, low-initial-traffic product with concrete performance/resilience targets deferred to `nfr-requirements`. Should Contract Design specify full resilience patterns now (circuit breaker, bulkhead) or just the baseline every HTTP boundary needs?

- A. Baseline only: every boundary declares a request timeout and a small bounded retry (idempotent operations only, exponential backoff with jitter, per `nfr-design-patterns.md`'s defaults) for transient failures; circuit breakers, bulkheads, and concrete SLA numbers are deferred to `nfr-requirements`/`nfr-design`, consistent with NFR1.1.
- B. Specify full resilience patterns (circuit breaker, bulkhead) now, ahead of `nfr-requirements`.
- X. Other (please specify)

[Answer]: A. Baseline only: every boundary declares a request timeout and a small bounded retry (idempotent operations only, exponential backoff with jitter, per `nfr-design-patterns.md`'s defaults) for transient failures; circuit breakers, bulkheads, and concrete SLA numbers are deferred to `nfr-requirements`/`nfr-design`, consistent with NFR1.1.

---

## Consolidated Summary Confirmation

- Three contracts: (1) `admin-api` → `backend-api` internal API (REST/HTTP+JSON), (2) `backend-api` public API for the Property Owner/Guest frontend (REST/HTTP+JSON), (3) `backend-api` public API for the marketing-site's lead-capture forms (REST/HTTP+JSON) — all three use the same mechanism (Q1, Q2)
- Versioning: URI-based (`/v1/...`), additive-preferred (Q3)
- Resilience: baseline timeout + bounded retry only; circuit breakers/bulkheads/SLAs deferred to `nfr-requirements`/`nfr-design` (Q4)
- Each contract's owner is its provider Unit (`backend-api` owns all three specs, since it is the provider in every boundary)
- `contract-design/contract-summary.md` will be generated with a contracts table, one OpenAPI-shaped spec block per boundary, ownership rules, and an open-questions table

- Looks correct
- Request changes

[Answer]: Looks correct
