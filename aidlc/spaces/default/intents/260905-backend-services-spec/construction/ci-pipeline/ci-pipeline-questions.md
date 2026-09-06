# CI Pipeline — Clarifying Questions

Conversation language: English

## Sources

- `u1-backend-api/infrastructure-design/cicd-pipeline.md` and `u2-admin-api/infrastructure-design/cicd-pipeline.md` — both READY-reviewed, already specify the full 16-stage pipeline shape, gate mapping, deployment strategy, rollback procedure, and secrets handling for a single shared monorepo-style pipeline covering both Units in the `guestguideiq-app` repository. [scope]
- `build-and-test/test-results.md`, `build-and-test/build-and-test-summary.md` — actual build/lint/test/coverage commands and results this pipeline must wire as blocking gates. [scope]
- `code-generation/code-summary.md` (both units) — explicitly defers real-PostgreSQL adapter verification to CI: *"that verification is expected to happen in CI once the upcoming `ci-pipeline` stage provisions a real Postgres service container."* [scope]
- `project.md` DECIDED — the repository is hosted at `git@github.com:sripradeep/guestguideiq-app.git`. [scope]

Given how much the infrastructure-design stage already decided (branch strategy, gate list, artifact repository = ECR, deployment strategy, rollback, secrets handling), this stage does not re-ask those. Three items remain genuinely open.

## Questions

**Q1. CI platform.** `infrastructure-design` names pipeline *stages* but not the concrete CI tool that runs them. The existing marketing-site repository already uses GitHub Actions (`.github/workflows/deploy.yml`, not inherited by this new repo per `team.md`, but an established precedent for this GitHub organization/account), and `guestguideiq-app` is itself hosted on GitHub. AWS CodePipeline/CodeBuild is the alternative, staying fully inside AWS.

[Answer]: A. GitHub Actions

**Q2. Real-PostgreSQL test provisioning.** `code-summary.md` explicitly defers real Prisma-adapter-against-real-Postgres verification to this stage. How should CI provision that database for the Integration Test stage?

[Answer]: A. A GitHub Actions `services:` Postgres container for the job, migrated via `prisma migrate deploy` before tests run

**Q3. SAST tool.** `cicd-pipeline.md` names the SAST stage generically ("Semgrep or equivalent, per `devsecops-pipeline-patterns.md`") without pinning a specific tool/ruleset.

[Answer]: A. Semgrep, with its default `p/ci` + `p/typescript` rulesets

X. Other (please specify)

## Consolidated Summary Confirmation

- Q1 (CI platform): GitHub Actions.
- Q2 (Postgres in CI): GitHub Actions `services:` Postgres container, migrated via `prisma migrate deploy` before tests run.
- Q3 (SAST tool): Semgrep, with its default `p/ci` + `p/typescript` rulesets.

- Looks correct
- Request changes

[Answer]: Looks correct
