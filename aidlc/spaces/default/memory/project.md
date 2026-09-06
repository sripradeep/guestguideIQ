# Project-Level Rules

> Project-specific specialisation and corrections. Loaded after `org.md` and
> `team.md` as strict-additive guidance; contradictions with broader policy
> are rejected. Populated by practices-discovery and the self-learning loop.
>
> Use sparingly: most teams don't need a project layer. Reach for it
> only when this specific project needs stable, durable guidance beyond the
> team practice (for example, package-specific release checks or an additional
> regression suite for a legacy component).

## Way of Working

<!-- Project-specific specialisation. Example: -->
<!-- This monorepo requires package-scoped branch names and a package owner -->
<!-- review in addition to the team's normal merge policy. -->

## Walking Skeleton

<!-- Project-specific specialisation. Example: -->
<!-- The walking skeleton must exercise the legacy service adapter as well -->
<!-- as the new service boundary. -->

## Testing Posture

<!-- Project-specific specialisation. -->

## Deployment

<!-- Project-specific specialisation. -->

## Code Style

<!-- Project-specific specialisation. -->

## Tech Stack

<!-- Technology choices locked for this project. -->

## Decided

<!-- Decisions made in earlier stages that should not be re-asked. -->
<!-- Format: DECIDED: [decision] (Stage [slug], [date]) -->

- DECIDED: The separate backend repository required by Q2 (`## Mandated` above) is `git@github.com:sripradeep/guestguideiq-app.git`, checked out locally at `C:\Projects\guestguideIQ\guestguideiq-app` — an immediate child of this workspace's root, sibling to `aidlc/`, per AI-DLC's multi-repo sibling-discovery convention (`guestguideiq-app/` is gitignored in this outer repo so its nested `.git` is never tracked here). Construction-phase ops for this intent (which recorded no `repos` row at intent-creation time, since the backend repo didn't exist yet) should pass `--repo guestguideiq-app` explicitly to target it — the tooling honors an explicit `--repo` anchor even for an intent with no recorded repo set, as long as the named sibling directory exists. (Delivery Planning, 2026-09-06)

## Scope Overrides

<!-- Custom scope rules for this project. -->

## Forbidden

<!-- Populated by practices-discovery affirmation gate. -->
<!-- Format: NEVER [behavior] (affirmed [date]) -->
<!-- Example: NEVER throw exceptions across service layer boundaries (affirmed 2026-05-17) -->

- NEVER deploy the backend to production without first passing through staging and receiving manual approval (Q6). (affirmed 2026-09-05)
- NEVER merge a pull request touching the backend unless the build, lint, test, and coverage checks are all green (Q5). (affirmed 2026-09-05)
- NEVER commit secrets (credentials, API keys, connection strings, signing keys) to the backend repository or to any checked-in configuration file (Q7 plus the org-level Security guardrail). (affirmed 2026-09-05)
- NEVER treat a security scanner (dependency or secret) or the linter as merely advisory for the backend — each must be wired as a blocking CI gate, matching the org default that "linter run in CI before merge; failure blocks the PR" (Q7, Q8; devsecops contribution §3 flags the "installed but not enforced" pattern as a security anti-pattern in its own right). (affirmed 2026-09-05)

## Mandated

<!-- Populated by practices-discovery affirmation gate. -->
<!-- Format: ALWAYS [behavior] (affirmed [date]) -->
<!-- Example: ALWAYS use Result<T,E> for fallible operations in service layer (affirmed 2026-05-17) -->

- ALWAYS use short-lived feature branches merged via pull request after review for backend work — direct commits to `main` are not the team's chosen work style going forward (Q1). (affirmed 2026-09-05)
- ALWAYS build the new backend in its own separate repository, not as a folder or workspace inside the existing marketing-site repo (Q2). (affirmed 2026-09-05)
- ALWAYS run the walking-skeleton Bolt first for this backend — a thin end-to-end slice, solo and gated, approved by the user before remaining Bolts run (Q3, per `org.md`'s Walking Skeleton practice). (affirmed 2026-09-05)
- ALWAYS write the BDD scenario (given/when/then) before implementing, then add lower-level unit tests after implementation, for backend work (Q4 — recorded as `Methodology: custom` in `team-practices.md` per `org.md`'s mixed-cadence rule). (affirmed 2026-09-05)
- ALWAYS require a green CI check — build, lint, test, and coverage — on every pull request touching the backend before it can merge; a failing build, a lint failure, a test failure, or a coverage drop below the affirmed floor blocks the merge until it is green (Q5, refining the quality agent's candidate mandate from Step 3). (affirmed 2026-09-05)
- ALWAYS require manual approval before a production deployment of the backend; deployments first go to a staging environment (Q6). (affirmed 2026-09-05)
- ALWAYS run automated dependency-vulnerability scanning on the backend from day one (Q7). (affirmed 2026-09-05)
- ALWAYS run automated secret scanning on the backend from day one (Q7). (affirmed 2026-09-05)
- ALWAYS enforce the backend's linter and formatter as a blocking pull request check from day one — not advisory-only (Q8). (affirmed 2026-09-05)
- ALWAYS store backend secrets (database connection strings, API keys, session-signing keys) in a secrets manager, never in code, checked-in env files, or checked-in config — a direct corollary of the org-level Construction Phase Guardrail ("Never hardcode credentials, API keys, or secrets — use environment variables or a secrets manager") made concrete by the Q7 decision to run secret scanning and the Q6 decision to introduce a real backend with persistent data. (affirmed 2026-09-05)

## Corrections

<!-- Project-specific corrections from human feedback. -->
<!-- Format: NEVER/ALWAYS [behavior] (learned [date]) -->
