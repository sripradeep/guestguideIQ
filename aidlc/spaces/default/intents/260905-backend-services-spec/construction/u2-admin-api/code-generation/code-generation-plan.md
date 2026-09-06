# Code Generation Plan — u2-admin-api

Node.js + TypeScript + Fastify, per `u1-backend-api/nfr-requirements/tech-stack-decisions.md`'s stack choice (this Unit shares the language/framework decision; it has no database of its own, per `entities.md`'s `entities: []`). Covers the single `Admin` component and its four thin-delegation workflows (`functional-spec.md`).

**Repository placement (interpretation, recorded per `memory.md`):** `admin-api` is written as a new, fully independent sibling directory `admin-api/` at the root of the existing `guestguideiq-app` repository — its own `package.json`, `tsconfig.json`, `src/`, `tests/`, `Dockerfile`, and `infra/`, with no npm-workspace linking to `u1-backend-api`'s existing project at the repo root. This keeps `team.md`'s Q2 mandate ("its own separate repository, not a folder or workspace inside the existing marketing-site repo") satisfied at the backend-vs-marketing-site boundary without requiring a third repository or retrofitting `u1-backend-api`'s already-reviewed, already-tested project into an npm workspace — `Admin` has zero entities and zero shared domain code with `u1-backend-api` (it only calls it over HTTP via `InternalCallerModule`), so no code-sharing need would justify that restructuring. `unit-of-work.md` confirms both Units are "Standalone — deploys independently," which this placement honors at the artifact level regardless of the shared outer repo.

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

**Methodology applied per feature slice** (custom, not layer-local TDD): for each workflow group below, write the BDD given/when/then scenario first (as a Vitest test file), implement the slice (route → `InternalCallerModule` call) until it passes, then add lower-level unit tests afterward. Standard test strategy scaled to this Unit's single-component, no-database shape: 5-8 tests per workflow, plus one integration test stub at the Contract 1 boundary (`contract-summary.md`) exercised from `admin-api`'s side (mocking `backend-api`'s HTTP responses, since `backend-api` is a separate deployable, not an in-process dependency).

## Plan Steps

- [ ] **Step 1 — Project structure & production configuration skeleton**
  New sibling directory `admin-api/`: `package.json` (Fastify, `jsonwebtoken`, `pino`, dev deps: `typescript`, `vitest`, `supertest`, `nock` for mocking outbound HTTP to `backend-api`, `eslint`, `prettier`), `tsconfig.json` (strict), `.eslintrc`/`prettier.config` (mirroring `u1-backend-api`'s configuration exactly, per `team.md`'s formatter/linter mandate applying to the whole backend, not just one Unit), `.env.example` (OPS_JWT_SECRET, INTERNAL_JWT_SECRET, BACKEND_API_INTERNAL_URL — names only, no values), `src/app.ts` (Fastify instance factory), `src/server.ts` (entrypoint), `src/config.ts`. No test-to-code traceability (scaffolding only).

- [ ] **Step 2 — Test runner verification**
  Bootstrap `vitest.config.ts` and one trivial passing smoke test (`tests/smoke.test.ts`); record the exact unit-scoped run command in `unit-test-instructions.md` before any BDD-first step below.

- [ ] **Step 3 — Cross-cutting middleware & InternalCallerModule**
  Ops-role JWT verification middleware (`src/auth/middleware.ts`, requires the `ops` role claim per `security-design.md`'s Authentication Design — rejects any token lacking it, including a valid `u1-backend-api` Property Owner token); `InternalCallerModule` (`src/internal/client.ts`) implementing the interface from `security-design.md` — attaches the internal-scoped service JWT and the authenticated ops-staff identity to every outbound call, applies the per-operation retry policy (no retry for `createPOI`/`createLocalityBrand`/`addLocalityDomain`; one retry with backoff on `502`/`503`/`504`/timeout for `listEvents`/`lookupAccount`), and relays `backend-api`'s `ErrorResponse` unchanged on failure (BR1.6, no internal exception detail leaked per Error Relay Design). Structured `pino` logging with credential redaction (matching `u1-backend-api`'s redaction policy), central Fastify error handler. No single AC — cross-cutting infrastructure for BR1.1, BR1.6, NFR3.7-NFR3.10.

- [ ] **Step 4 — W1: Curate a POI** (US4.1)
  BDD scenario (`tests/bdd/poi-curation.test.ts`) → implement `POST /pois` (ops-role auth → `InternalCallerModule.call('createPOI', ...)` → relay `backend-api`'s 201/400 unchanged) → unit tests. Maps: US4.1, AC4.1.1, AC4.1.2, BR1.1, BR1.2, BR1.6.

- [ ] **Step 5 — W2: Manage the Event Lifecycle** (US4.2)
  BDD scenario → implement `GET /events` (ops-role auth → `InternalCallerModule.call('listEvents', ...)` with one-retry policy → present the audit-trail response including expired/duplicate-excluded events unchanged) → unit tests. Maps: US4.2, AC4.2.1-AC4.2.3, BR1.1, BR1.3, BR1.6.

- [ ] **Step 6 — W3: Review a Property Owner Account** (US4.3)
  BDD scenario → implement `GET /accounts/{accountId}` (ops-role auth → `InternalCallerModule.call('lookupAccount', ...)` with one-retry policy → relay 200/404 unchanged, treating not-found as a valid outcome per AC4.3.2, not an error) → unit tests. Maps: US4.3, AC4.3.1, AC4.3.2, BR1.1, BR1.4, BR1.6.

- [ ] **Step 7 — W4: Create/Manage a Locality-Brand Identity** (US4.4)
  BDD scenarios for both the create and domain-addition paths → implement `POST /localities` and `POST /localities/{localityId}/domains` (ops-role auth → `InternalCallerModule.call('createLocalityBrand' | 'addLocalityDomain', ...)`, no-retry policy → relay 201/200/400/409 unchanged) → unit tests. Maps: US4.4, AC4.4.1, AC4.4.2, AC4.4.4, AC4.4.5, BR1.1, BR1.5, BR1.6.

- [ ] **Step 8 — Integration test stub at the Contract 1 boundary**
  Supertest + `nock`-mocked `backend-api` internal endpoints, exercising each of the four workflows end-to-end through `admin-api`'s own HTTP surface (Standard strategy's "integration test for key boundaries" obligation, scaled to this Unit's single external dependency).

- [ ] **Step 9 — Documentation & traceability**
  `README.md` (setup, running locally, running tests, and how `BACKEND_API_INTERNAL_URL` points at a running `u1-backend-api` instance or its `nock` mock in tests), inline JSDoc on `InternalCallerModule`, `code-summary.md`, `traceability.json`.

- [ ] **Step 10 — Deployment artifacts**
  `Dockerfile` (multi-stage, non-root user, mirroring `u1-backend-api`'s container checklist), a minimal AWS CDK v2 stack skeleton (`infra/` — its own CDK App, not a second Stack inside `u1-backend-api`'s App, since `admin-api` is a fully independent sibling project per this plan's repository-placement interpretation; the Stack imports the shared VPC/ECS Cluster via SSM-parameter cross-stack references rather than a direct construct import, per `infrastructure-specification.md`'s Shared Infrastructure note) sized to 1 Fargate task / 0.25 vCPU / 0.5GB with no auto-scaling, its own public ALB with an IP-allowlist WAF rule set (distinct from `u1-backend-api`'s rate-based rules). Full production IaC hardening (the actual `admin-api`→`backend-api` security-group rule, WAF allowlist entries) is this project's `ci-pipeline`/`deployment-pipeline` stages' concern, not code-generation's, matching `u1-backend-api`'s own Step 17 scope note.

## Traceability Summary

Every plan step maps to at least one `USx.y`/`ACx.y.z`/`BRx.y` id from `functional-spec.md`/`rules.md`, or is explicitly marked cross-cutting infrastructure with no single AC (Steps 1, 2, 3, 8, 9, 10). `code-generation/traceability.json` (Step 9) will formalize this mapping to concrete file paths once implementation exists.

## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-09-06T20:22:00Z
**Iteration:** 1
**Request Challenge:** review:4192ba9dd695cd63ff146723699eb17b

Re-attestation after committing the generated code to `guestguideiq-app` (previously untracked/uncommitted, which a separate stage-completion evidence check required). No content in `guestguideiq-app/admin-api/`, `code-summary.md`, `traceability.json`, or `source-manifest.json` changed beyond that commit.

Findings (verified still accurate): the 401-vs-403 ops-role authorization distinction in `src/auth/middleware.ts` runs before any route logic; `InternalCallerModule`'s per-operation retry policy exactly matches `security-design.md`/`contract-summary.md`'s idempotency note, relaying `backend-api`'s `ErrorResponse` unchanged (BR1.6); traceability is complete across all 22 upstream ids with no overclaiming of `backend-api`'s own enforcement logic; `admin-api/` remains a fully independent project with zero imports from `u1-backend-api`. Three advisory, non-blocking notes stand (the `actor`-JWT-claim audit-identity choice, the SSM cross-stack publisher gap deferred to `ci-pipeline`, and the justified `UpstreamUnavailableError` addition). All 50 manifest paths remain confirmed present on disk.

### Summary

No new findings. This Unit's code-generation output remains unchanged and fully sound: architecture, tests (46/46 passing, 96.13% coverage), and traceability all verified. No blocking issues found; ready for Build and Test.
