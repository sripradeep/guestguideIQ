# Quality Gates

Conversation language: English

Confirmed per `ci-pipeline-questions.md`'s Consolidated Summary Confirmation.

Every row is **blocking** (job failure ⇒ PR cannot merge) per `project.md`'s Mandated rule that a scanner or linter is never merely advisory. Implemented in `guestguideiq-app/.github/workflows/ci.yml` (see `ci-config.md`).

| Gate | Criteria | Tool / Command | Applies to |
|---|---|---|---|
| Lint | Zero ESLint errors | `npm run lint` | Both units |
| Format | Zero Prettier violations | `npm run format:check` | Both units |
| Type check | Zero TypeScript errors, as a step distinct from build (`team.md`'s explicit anti-pattern callout: the marketing site's `astro build`-vs-`astro check` gap must not repeat here) | `npm run typecheck` | Both units |
| Build | Compiles cleanly | `npm run build` | Both units |
| Schema migration | `prisma migrate deploy` succeeds against a real, ephemeral Postgres | GitHub Actions `services:` container | u1 only (u2 owns no database) |
| Unit + BDD + integration tests | 100% pass rate, zero flakes tolerated | `npm run test:coverage` | Both units |
| Real-DB adapter smoke test | Migrates + round-trips a real write/read through the Prisma adapter and a real FK relation | `tests/integration/dbSmoke.test.ts` (`RUN_DB_SMOKE_TEST=1`) | u1 only |
| Coverage floor | ≥ 80% line coverage, enforced by `vitest.config.ts`'s `coverage.thresholds.lines` (fails the test command's own exit code — no separate step) | `npm run test:coverage` | Both units |
| Dependency vulnerability scan | Zero vulnerabilities at High/Critical severity | `npm audit --audit-level=high` | Both units |
| Secret scan | Zero detected secrets | `gitleaks/gitleaks-action` | Both units (repo-wide by nature; wired on the u1 job since it runs first) |
| SAST | Zero Critical/High Semgrep findings | `semgrep ci --config p/ci --config p/typescript` | Both units |
| IaC scan | Zero Checkov findings against synthesized CloudFormation | `cdk synth` + `bridgecrewio/checkov-action` | Both units, each against its own `infra/cdk.out` |

## Current status of each gate, as of this stage (independently re-verified, not self-reported)

All twelve rows above were exercised locally during this stage against the current `guestguideiq-app` tree and pass for both units, **except** the two that require CI's own environment to run at all (the real-Postgres migration/smoke-test gate, and — trivially — the workflow-native gitleaks/Checkov actions, which don't have local equivalents this stage's Bash access can invoke). See `ci-config.md` § Known gaps for exactly what remains unverified and why, and `../build-and-test/test-results.md` for the full before/after dependency-vulnerability numbers this gate now enforces going forward (both units: 0 vulnerabilities).

## Deferred gates (not yet blocking — future stages own them)

| Gate | Owning stage |
|---|---|
| Integration test against the deployed staging environment | Deployment Pipeline / Environment Provisioning (needs a live environment first) |
| Manual approval before production | Deployment Pipeline (needs the approval-gate environment-protection rule configured, which needs staging deploys working first) |
| Post-deploy smoke tests | Deployment Execution |
| Production monitoring/alerting thresholds | Observability Setup (4.4) — `monitoring-design.md`'s four symptom-based alerts already specify what to configure |

## Traceability

Every Mandated CI/CD rule from `project.md` (short-lived branches + PR review, blocking build/lint/test/coverage, staging + manual-approval production, day-one dependency + secret scanning, blocking linter/formatter) maps to a row above except the staging/production/approval rows, which are correctly deferred per the table above with a named owning stage — none silently dropped.
