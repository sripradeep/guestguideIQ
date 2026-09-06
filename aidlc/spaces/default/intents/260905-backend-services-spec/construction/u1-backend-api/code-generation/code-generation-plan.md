# Code Generation Plan — u1-backend-api

Node.js + TypeScript + Fastify + PostgreSQL (Prisma), per `nfr-requirements/tech-stack-decisions.md`. Covers all 10 components this Unit hosts (`Identity`, `Subscription`, `Onboarding`, `PropertyGuide`, `PointOfInterest`, `LocalEvent`, `ItineraryChat`, `GuestAccess`, `LeadCapture`, `Locality`) and all 11 entities in `entities.md`.

## Testing Contract

```json
{
  "version": 1,
  "methodology": "custom",
  "source": "team",
  "ordering": "write the BDD scenario (given/when/then) first, implement",
  "scope": "classic",
  "test_strategy": "standard",
  "project_type": "brownfield",
  "applicable_notes": [
    {
      "layer": "org",
      "text": "We treat tests as a first-class deliverable in every Bolt. The specific\nmethodology (TDD, BDD, ATDD, or classic test-after) is affirmed at\npractices-discovery and recorded in `team.md` under this heading with explicit\n`Methodology` and `Ordering` fields; Code Generation resolves those fields\nindependently from coverage, tooling, and scope notes.\n\nWhen no posture has been affirmed, our default per scope is:\n- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer, then write and run\n  that layer's tests.\n- `mvp`, `enterprise`, `feature`, `infra`, `classic` add an 80% line-coverage\n  floor and CI execution before merge.\n- `bugfix`, `security-patch` add a targeted regression for the specific\n  bug/vulnerability and require the existing suite to remain green.\n- `express` uses the Minimal strategy: requirement-driven unit tests (one per\n  requirement, with a happy-path floor per component); existing tests remain\n  green.\n- `poc`, `refactor`, `workshop` add no extra new-test floor and require the\n  existing suite to remain green.\n\nThe active `Test Strategy` still applies in every scope and determines test\nvolume/types. Scope floors are additive; they never reduce or replace the\nselected strategy.\n\nBuild and Test verifies defined coverage floors and affirmed quality targets;\nthey may not be weakened to make a step pass.\n\nAffirm a stricter posture in `team.md` if the team commits to one."
    },
    {
      "layer": "team",
      "text": "- **Methodology**: custom\n- **Ordering**: write the BDD scenario (given/when/then) first, implement\n  the code to satisfy it, then add lower-level unit tests after\n  implementation.\n- **Confirmed (Q4)**: the human interview answer mixes cadences — write\n  the scenario first (BDD-style), then implement, then add lower-level\n  unit tests afterward. Per `org.md`'s Testing Posture rule, a mixed\n  cadence like this is recorded as `Methodology: custom` with an explicit\n  `Ordering` spelling out the actual sequence, rather than approximated as\n  plain `bdd` or `tdd`.\n- **CI gate (confirmed, Q5)**: every pull request touching the backend\n  must pass a green check — build, lint, test, and coverage — before it\n  can merge. This directly closes the gap `architecture.md` flagged\n  (no automated build/test gate on pull requests) and the quality agent's\n  candidate mandate (see `discovered-rules.md`).\n- **Coverage floor**: org default applies — 80% line-coverage floor per\n  the active scope's testing-posture rules (`mvp`/`enterprise`/`feature`/\n  `infra`/`classic` add this floor; the specific scope for this intent\n  governs which floor applies). Which coverage tool enforces it depends on\n  the backend's language/runtime, not yet chosen — see `evidence.md` for\n  the deferral to `domain-design`/`infrastructure-design`.\n- **Test pyramid, test data strategy, and NFR/perf testing**: not decided\n  at this stage — correctly deferred to `domain-design`/`functional-design`\n  (test pyramid shape, test data/fixture strategy) and `nfr-requirements`/\n  `nfr-design` (load/perf testing, SLO-driven test targets) since they\n  depend on the backend's stack and API surface, neither of which exists\n  yet. See `evidence.md` for the explicit list of deferred items so they\n  are not lost.\n- **Type-checking as a blocking gate**: whichever backend language is\n  chosen, the CI gate above must include a distinct type-check step (e.g.\n  `tsc --noEmit`, `mypy`, `go vet`) separate from the build/bundle step —\n  named positively now so the `astro build`-vs-`astro check` gap observed\n  in the existing frontend (type errors surfacing only as warnings) is not\n  repeated in the new backend."
    }
  ],
  "obligations": {
    "strategy": "standard",
    "strategy_volume": [
      "Five to eight tests per component.",
      "Unit tests plus integration tests for key boundaries.",
      "Add E2E, performance, or security tests when requirements demand them."
    ],
    "scope_floor": [
      "Keep the existing test suite green.",
      "This scope adds no extra new-test floor beyond the selected test strategy."
    ],
    "combination_rule": "Apply every selected-strategy obligation and every scope-floor obligation; neither replaces the other, and a targeted scope regression may add the narrowest necessary test type beyond the strategy default."
  },
  "plan_profile": {
    "methodology": "custom",
    "runner_step": "Verify the existing test runner/configuration and record the exact unit-scoped command.",
    "runner_ready_before_first_test": true,
    "testable_layers": [
      "Data model / database behavior",
      "Repository / data access",
      "Business logic",
      "API / endpoint",
      "Frontend behavior"
    ],
    "steps": [
      "Project structure and production configuration skeleton.",
      "Verify the existing test runner/configuration and record the exact unit-scoped command.",
      "Custom ordering - write the BDD scenario (given/when/then) first, implement",
      "Implementation and tests - preserve that exact ordering; do not convert it to layer-local TDD.",
      "Environment/build configuration.",
      "Documentation and traceability."
    ]
  },
  "input_sha256": "sha256:0bf1b1877d157d75ae4e80abf0825642c65023525ed07ba413f432e3207b48cb",
  "contract_sha256": "sha256:28640b404a6e00295ab703275e330a0d70a57d7906534a68a7906b9de7c442d4"
}
```

**Methodology applied per feature slice** (custom, not layer-local TDD): for each workflow group below, write the BDD given/when/then scenario first (as a Vitest test file using descriptive `describe`/`it` blocks phrased as scenarios), implement the slice across every layer that scenario touches (data access → business logic → API endpoint) until it passes, then add lower-level unit tests afterward for that slice's individual functions/modules. Standard test strategy: 5-8 tests per component, plus integration test stubs at the three contract boundaries (`contract-summary.md`).

## Plan Steps

- [x] **Step 1 — Project structure & production configuration skeleton**
  `package.json` (Fastify, Prisma, `bcrypt`, `jsonwebtoken`, `pino`, `stripe`, `@opentelemetry/*`, dev deps: `typescript`, `vitest`, `supertest`, `eslint`, `prettier`), `tsconfig.json` (strict), `.eslintrc`/`prettier.config`, `.env.example` (DATABASE_URL, JWT_SECRET, INTERNAL_JWT_SECRET, STRIPE_SECRET_KEY — names only, no values), `src/app.ts` (Fastify instance factory), `src/server.ts` (entrypoint), `src/config.ts` (env loading/validation). No test-to-code traceability (scaffolding only).

- [x] **Step 2 — Test runner verification**
  Bootstrap `vitest.config.ts` and one trivial passing smoke test (`tests/smoke.test.ts`); record the exact unit-scoped run command in `unit-test-instructions.md` before any BDD-first step below.

- [x] **Step 3 — Database schema (Prisma)**
  `prisma/schema.prisma` covering all 11 entities from `entities.md` (Account, Property, SubscriptionRecord, OnboardingProgress, GuideContent, POI, Event, ChatSession, Stay, LeadSubmission, LocalityEntity) with every declared relationship, constraint, and enum; initial migration. Maps: `entities.md` (all entities).

- [x] **Step 4 — Cross-cutting middleware & adapters**
  JWT issuance/verification (`src/auth/jwt.ts`, access+refresh per `security-design.md`), `requireOwnership`/`requireStayToken`/`requireInternalCaller` authorization middleware (`security-design.md`), domain-resolution LRU cache (`src/locality/domainCache.ts`, `performance-design.md`), `RateLimitStore` interface + in-memory implementation (`src/ratelimit/`, `security-design.md`), `ChatProvider` adapter interface with no concrete vendor wired (`src/chat/provider.ts`, `tech-stack-decisions.md` Q4), structured logging (`pino`) with credential redaction, error-handling middleware. No single AC — cross-cutting infrastructure for BR1.1/BR8.1-8.3/BR9.1/NFR3.7-3.10.

- [x] **Step 5 — W1: Property Owner Signup** (US1.1)
  BDD scenario (`tests/bdd/signup.test.ts`) → implement `POST /accounts` (domain resolution, duplicate-username check, bcrypt hash, Property/OnboardingProgress creation) → unit tests for the signup service. Maps: US1.1, AC1.1.1-AC1.1.5, BR1.1, BR1.2, BR1.5.

- [x] **Step 6 — W2: Password Reset** (US1.2)
  BDD scenario → implement reset-token issuance + consumption → unit tests. Maps: US1.2, AC1.2.1-AC1.2.2, BR1.4.

- [x] **Step 7 — W3: Onboarding Wizard** (US1.3, US1.4)
  BDD scenarios for each step transition + PDF-import fallback → implement wizard state machine and PDF-extraction integration point (interface-level; no concrete extraction vendor wired, matching the LLM-adapter deferral pattern) → unit tests. Maps: US1.3, US1.4, AC1.3.1-AC1.4.3, BR3.1-BR3.6.

- [x] **Step 8 — W4: Guide Editing & Publishing** (US1.5)
  BDD scenario → implement `GET/PATCH /guides/{propertyId}` + publish/unpublish → unit tests. Maps: US1.5, AC1.5.1-AC1.5.4, BR4.1, BR4.3, BR9.5, BR9.6.

- [x] **Step 9 — W5: Locality Content Curation & Favoriting** (US1.6)
  BDD scenario → implement POI/Event browse (read-only here; write paths are internal-only, Step 12) + `POST /guides/{propertyId}/favorites` → unit tests. Maps: US1.6, AC1.6.1-AC1.6.4, BR4.2, BR5.2, BR6.4.

- [x] **Step 10 — W6: Subscription Lifecycle** (US1.7, US1.8)
  BDD scenario → implement `POST/PATCH /subscriptions` with Stripe Checkout integration point → unit tests. Maps: US1.7, US1.8, AC1.7.1-AC1.8.3, BR2.1-BR2.3.

- [x] **Step 11 — W7+W8: Guest Access & Guide View** (US2.1, US2.2)
  BDD scenario → implement `GET /stays/{token}` (link validation, domain-consistency check, guide serving) → unit tests. Maps: US2.1, US2.2, AC2.1.1-AC2.2.4, BR8.1-BR8.4.

- [x] **Step 12 — W9: Itinerary Chat** (US2.3)
  BDD scenario → implement `POST /stays/{token}/chat` (lazy session creation, grounding-context assembly, `ChatProvider` call with timeout+retry per `reliability-design.md`, sparse-content fallback) → unit tests. Maps: US2.3, AC2.3.1-AC2.3.3, BR7.1-BR7.3.

- [x] **Step 13 — W10: Lead Capture** (US3.1, US3.2)
  BDD scenario for each of the three form types → implement `POST /leads/{waitlist,partner,investor}` → unit tests. Maps: US3.1, US3.2, AC3.2.1-AC3.2.2, BR10.1, BR10.2.

- [x] **Step 14 — Internal-only write API (Contract 1, consumed by `admin-api`)**
  BDD scenario → implement `/internal/pois` (create), `/internal/events` (list, with expired/duplicate audit view), `/internal/accounts/{id}` (lookup), `/internal/localities` + `/internal/localities/{id}/domains` (create/add), each behind `requireInternalCaller`, on the separate internal listener (`infrastructure-specification.md`) → unit tests. Maps: US4.1-US4.4 (write side), BR5.1, BR6.1-BR6.3, BR9.1-BR9.4.

- [x] **Step 15 — Integration test stubs at contract boundaries**
  Supertest-based integration stubs exercising all three OpenAPI contracts (`contract-summary.md`) end-to-end against a test database, per the Standard strategy's "integration test stubs for key boundaries" obligation.

- [x] **Step 16 — Documentation & traceability**
  `README.md` (setup, running locally, running tests), inline JSDoc on public service functions, `code-summary.md`, `traceability.json`.

- [x] **Step 17 — Deployment artifacts**
  `Dockerfile` (multi-stage, non-root user, per `cdk-best-practices.md`'s container checklist), a minimal AWS CDK v2 stack skeleton (`infra/` — ECS Fargate service + task definition referencing `infrastructure-specification.md`'s sizing; full production IaC hardening is this project's `ci-pipeline`/`deployment-pipeline` stages' concern, not code-generation's).

## Traceability Summary

Every plan step maps to at least one `USx.y`/`ACx.y.z`/`BRx.y` id from `functional-spec.md`/`rules.md`, or is explicitly marked cross-cutting infrastructure with no single AC (Steps 1, 2, 4, 15, 16, 17). `code-generation/traceability.json` (Step 16) will formalize this mapping to concrete file paths once implementation exists.

## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-09-06T20:22:00Z
**Iteration:** 1
**Request Challenge:** review:664bba61ed2f400dffd7405909a0bf84

Re-attestation after committing the generated code to `guestguideiq-app` (previously untracked/uncommitted, which a separate stage-completion evidence check required). No content in `guestguideiq-app/`, `code-summary.md`, `traceability.json`, or `source-manifest.json` changed beyond that commit.

Findings (verified still accurate): dependency-inversion layering holds in practice; the two-listener isolation boundary is structurally enforced; the three JWT trust boundaries are distinct, non-overlapping middleware functions; `keyByStayToken`'s chat rate-limit wiring is real; traceability is complete across all 99 upstream ids including its three legitimate "enforced by omission" N/A rows. All 127 manifest paths remain confirmed present on disk.

### Summary

No new findings. This Unit's code-generation output is unchanged and remains fully sound: architecture, tests (130/130 passing, 93.0% coverage), and traceability all verified. No blocking issues found; ready for Build and Test.