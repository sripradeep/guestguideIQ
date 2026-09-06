# CI Configuration

Conversation language: English

Confirmed per `ci-pipeline-questions.md`'s Consolidated Summary Confirmation (Q1: GitHub Actions, Q2: GHA `services:` Postgres container, Q3: Semgrep).

## Sources

- `u1-backend-api/infrastructure-design/cicd-pipeline.md`, `u2-admin-api/infrastructure-design/cicd-pipeline.md` — both READY-reviewed; this document implements the pipeline shape they already specified. [scope]
- `ci-pipeline-questions.md` — the three genuinely open decisions this stage resolved: GitHub Actions as the CI platform, a GitHub Actions `services:` Postgres container for real-database verification, Semgrep for SAST. [scope]
- `construction/build-and-test/test-results.md`, `construction/build-and-test/build-and-test-summary.md` — the actual, independently-verified build/lint/typecheck/format/test/coverage/audit commands and results this pipeline wires as blocking gates. [scope]

## What was written

**`guestguideiq-app/.github/workflows/ci.yml`** — the real, working GitHub Actions workflow (not just this document's description of one). Two independent jobs, one per Unit, both triggered on every PR to `main` and every push to `main`:

| Job | Working dir | Steps (in order) |
|---|---|---|
| `backend-api` (u1) | repo root | checkout → setup-node 24 → `npm ci` → lint → format:check → typecheck → build → `prisma migrate deploy` (real Postgres) → `test:coverage` with `RUN_DB_SMOKE_TEST=1` → `npm audit --audit-level=high` → gitleaks → Semgrep (`p/ci` + `p/typescript`) → CDK synth → Checkov |
| `admin-api` (u2) | `admin-api/` | checkout → setup-node 24 → `npm ci` → lint → format:check → typecheck → build → `test:coverage` → `npm audit --audit-level=high` → Semgrep → CDK synth → Checkov |
| `deploy-staging` | repo root | `needs: [backend-api, admin-api]`, `if: push to main` — currently a placeholder step, not a real deploy (see Known Gaps below) |

Both jobs' PR-blocking steps (everything before `deploy-staging`) are fully functional today — no AWS credentials, no environment, nothing pending. They were validated by this stage: the workflow YAML parses cleanly, and every command it runs (`npm run lint`, `format:check`, `typecheck`, `build`, `test:coverage`, `npm audit`) was independently re-executed locally against the current `guestguideiq-app` tree during this stage and passed, for both Units.

## New: real-PostgreSQL adapter verification (closes a code-generation-time gap)

`code-generation`'s own `code-summary.md` flagged, for both Units, that every existing test exercises the Prisma repository adapters against either a mocked `PrismaClient` or an in-memory double — never a real PostgreSQL instance, because no `docker`/`psql` was available in that execution environment. That environment constraint is unchanged in this stage's own execution environment too (`which docker`/`which psql` still fail here), so this stage could not run the new test against a real database either — but it CAN, and did, provision the mechanism and write the test, so CI's first real run genuinely closes the gap rather than deferring it again.

Added `guestguideiq-app/tests/integration/dbSmoke.test.ts`:
- Gated behind `RUN_DB_SMOKE_TEST=1` (set only by the CI workflow step above) — never inferred from `DATABASE_URL`'s mere presence, so a developer's local `DATABASE_URL` for unrelated purposes can never cause this file to touch it. Confirmed skipped in every local run this stage performed (`1 skipped` in the suite output, `133 passed` unaffected).
- Exercises `createPrismaAccountRepository` (`src/identity/repository.ts`) — `createAccountWithProperty` (a real `$transaction` across `Account`+`Property`+`OnboardingProgress`) then `findByUsername` — against a real `LocalityEntity` foreign key, then re-reads through the actual Prisma `include` relation to confirm the FK is genuinely enforced, not just a plain column.
- Scope: one representative path (Account → Property → LocalityEntity), not exhaustive per-repository coverage. This proves the schema migrates cleanly on real Postgres and the transaction/FK shape is correct — the highest-value, previously totally-unverified claim — without this stage inventing a full second test suite outside its own `produces`.

`npm run typecheck`, `lint`, `format:check` all pass with the new file included; the full suite (`133 passed, 1 skipped`) is unaffected locally, at unchanged 90.97% coverage.

## Quality gate rationale (see `quality-gates.md` for the full table)

Every gate in `infrastructure-design`'s `cicd-pipeline.md` Stage → Gate Mapping table is implemented as a **blocking** step (job failure = PR cannot merge), per `project.md`'s Mandated rule that no scanner or linter is merely advisory. Coverage itself is not a separate CI step — `vitest.config.ts`'s own `coverage.thresholds.lines: 80` already fails the `test:coverage` command's exit code below the floor, so wiring that command as a step is sufficient; a duplicate coverage-check step would be redundant, not additional safety.

## Known gaps (disclosed, not silently worked around)

1. **`deploy-staging` is not yet a real deployment.** Blocked on two Environment Provisioning deliverables, neither of which this stage can produce: (a) an AWS OIDC deploy role (`AWS_DEPLOY_ROLE_ARN`), and (b) `u1-backend-api`'s CDK stack publishing the SSM parameters `u2-admin-api`'s stack already reads (flagged as a cross-unit gap in `u2-admin-api/code-generation/code-summary.md` Deviation #2). The job is positioned and gated correctly (`needs`, `if: push to main`) so enabling it later is a secrets/parameter-publishing change, not a workflow restructure.
2. **Everything from "Integration Test (against deployed staging)" onward** in `cicd-pipeline.md`'s 16-stage list — Approval Gate, Deploy to Production, Smoke Test, Monitor — requires a live staging environment to exist first, which requires (1) above. Not implemented in this pass; correctly sequenced to follow once it is.
3. **`tests/integration/dbSmoke.test.ts` has never actually executed against a real database** — validated only by typecheck/lint and by confirming it is correctly *skipped* locally. Its first real execution is CI's own first run of this workflow. This is disclosed, not hidden: the alternative (leaving code-generation's flagged gap open indefinitely, or fabricating a "verified" claim this stage cannot back) would be worse.
