# Security Test Instructions

Conversation language: English

Generated in addition to the Standard strategy's minimum (`integration-test-instructions.md`) because context demands it: both Units carry a heavy, explicit NFR3.x security posture (three-credential-type model, bcrypt hashing, rate limiting, internal-API isolation, audit logging) and `project.md`'s Mandated rules require dependency-vulnerability and secret scanning to be active from day one and wired as **blocking** CI checks (NFR3.4) — this document is the executable record of what those scans are and what they found, ahead of `ci-pipeline` (3.7) actually wiring them into an automated gate.

## Dependency vulnerability scanning

| Unit | Command | Run from |
|---|---|---|
| u1-backend-api | `npm audit` | `guestguideiq-app/` |
| u2-admin-api | `npm audit` | `guestguideiq-app/admin-api/` |

Both ran during Step 9. Full before/after counts, root-cause analysis, and the five remediations applied this stage (bcrypt→bcryptjs, fastify v5, vitest v5, the `@opentelemetry/sdk-node` bump, and the new u2 trace-context implementation) are in `test-results.md` § Dependency Vulnerability Disposition — that section is this scan's actual result record; this file documents the check itself so it is reproducible independent of this one run. Both Units now report 0 vulnerabilities.

`ci-pipeline` (3.7, the next stage) owns actually wiring `npm audit` (or an equivalent — Dependabot/Renovate/Snyk per `team.md`'s Security Tooling section) as a **blocking** step in the CI workflow definition; that is a distinct concern from running the scan locally, which is what this stage verifies.

## Secret scanning

Not executable from this stage's own remit — secret scanning (Gitleaks or GitHub's native secret scanning, per `team.md`) operates on the *repository's* commit history and requires the repository to exist on its hosting platform with the scanner enabled there; it isn't a local `npm`/build-tool command this stage can run against a working tree. Confirming it is active on `guestguideiq-app`'s GitHub repository, and wiring it as blocking, is `ci-pipeline`'s concern (3.7) — the same later-stage ownership recorded for the CI-wiring half of dependency scanning above. No manual review of the working tree for hardcoded secrets found any (both Units' `.gitignore` correctly excludes `.env`/`.env.local`; `guestguideiq-app`'s committed source was spot-checked during this stage's own build/test runs and no credential-shaped literal was observed in `src/`).

## Authentication / authorization spot-checks already covered by the existing suites

Rather than duplicate new security-specific test files, the following existing tests are the security-relevant subset already exercised during Step 9's full-suite runs (Test Strategy: Standard does not call for a separate penetration-style suite at this stage):

| Concern | NFR | Covered by |
|---|---|---|
| Ops-staff JWT vs. Property Owner/Guest JWT rejection | NFR3.7 (u2) | `admin-api/tests/unit/middleware.test.ts`, `admin-api/tests/bdd/locality-brand.test.ts` (AC4.4.3) |
| Internal-service JWT on Contract 1 | NFR3.8 (u1), NFR3.8 (u2) | `tests/integration/contract1.test.ts` |
| Password hashing (post-bcryptjs-swap) | NFR3.7 (u1) | `tests/unit` auth-adjacent suites — re-verified passing after the swap (see Step 9 results) |
| Rate limiting on signup/reset/guest-link/chat/lead-form | NFR3.10 (u1) | `src/ratelimit/` unit tests (`memoryStore.ts`, `plugin.ts` coverage rows in the Step 9 report) |
| Error-envelope relay with no added detail | NFR3.10 (u2, error relay) | `admin-api` BDD suites' assertions that a relayed error body matches `backend-api`'s unchanged |

## Not in scope for this stage

SAST, DAST, SBOM generation, and IaC scanning are flagged in `team.md` as forward-looking candidates for `ci-pipeline`/`infrastructure-design`-adjacent work, not required at Build and Test.
