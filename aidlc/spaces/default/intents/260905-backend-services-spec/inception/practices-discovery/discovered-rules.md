# Discovered Rules — Confirmed (Step 5: Lead Integration)

> **Status: CONFIRMED.** `## Mandated` and `## Forbidden` rules below are
> drawn only from what the Step 4 human interview confirmed as a hard
> constraint (not a soft preference), plus one org-default corollary
> (secrets) that the interview's confirmed choices make directly
> applicable. See `evidence.md` for the full trace from question to rule.

## Mandated

- ALWAYS use short-lived feature branches merged via pull request after
  review for backend work — direct commits to `main` are not the team's
  chosen work style going forward (Q1).
- ALWAYS build the new backend in its own separate repository, not as a
  folder or workspace inside the existing marketing-site repo (Q2).
- ALWAYS run the walking-skeleton Bolt first for this backend — a thin
  end-to-end slice, solo and gated, approved by the user before remaining
  Bolts run (Q3, per `org.md`'s Walking Skeleton practice).
- ALWAYS write the BDD scenario (given/when/then) before implementing,
  then add lower-level unit tests after implementation, for backend work
  (Q4 — recorded as `Methodology: custom` in `team-practices.md` per
  `org.md`'s mixed-cadence rule).
- ALWAYS require a green CI check — build, lint, test, and coverage — on
  every pull request touching the backend before it can merge; a failing
  build, a lint failure, a test failure, or a coverage drop below the
  affirmed floor blocks the merge until it is green (Q5, refining the
  quality agent's candidate mandate from Step 3).
- ALWAYS require manual approval before a production deployment of the
  backend; deployments first go to a staging environment (Q6).
- ALWAYS run automated dependency-vulnerability scanning on the backend
  from day one (Q7).
- ALWAYS run automated secret scanning on the backend from day one (Q7).
- ALWAYS enforce the backend's linter and formatter as a blocking pull
  request check from day one — not advisory-only (Q8).
- ALWAYS store backend secrets (database connection strings, API keys,
  session-signing keys) in a secrets manager, never in code, checked-in
  env files, or checked-in config — a direct corollary of the org-level
  Construction Phase Guardrail ("Never hardcode credentials, API keys, or
  secrets — use environment variables or a secrets manager") made
  concrete by the Q7 decision to run secret scanning and the Q6 decision
  to introduce a real backend with persistent data.

## Forbidden

- NEVER deploy the backend to production without first passing through
  staging and receiving manual approval (Q6).
- NEVER merge a pull request touching the backend unless the build, lint,
  test, and coverage checks are all green (Q5).
- NEVER commit secrets (credentials, API keys, connection strings,
  signing keys) to the backend repository or to any checked-in
  configuration file (Q7 plus the org-level Security guardrail).
- NEVER treat a security scanner (dependency or secret) or the linter as
  merely advisory for the backend — each must be wired as a blocking CI
  gate, matching the org default that "linter run in CI before merge;
  failure blocks the PR" (Q7, Q8; devsecops contribution §3 flags the
  "installed but not enforced" pattern as a security anti-pattern in its
  own right).

## Notes

The candidate mandate proposed in the Step 2 draft ("Notes for the
interview") — that the deploy pipeline should observe a staging +
manual-approval model — is now confirmed above (Q6) rather than left as a
candidate. The quality agent's Step 3 addition (a PR-triggered
build/lint/test/coverage gate) is likewise confirmed above (Q5), stated in
the interview's own phrasing rather than the agent's draft phrasing, since
the human answered the question as posed.

Item deliberately **not** promoted to `## Mandated`/`## Forbidden`: SAST,
DAST, SBOM generation, and IaC scanning, all raised by the devsecops
contribution (Step 3) as candidate security-tooling gaps. The interview
(Q7) asked specifically about dependency-vulnerability and secret
scanning and the team answered for those two; SAST/DAST/SBOM/IaC scanning
were not put to the team as a hard-constraint question and are therefore
recorded only as forward-looking considerations in `team-practices.md` §
Security Tooling, not as mandates here. Promoting them without an
explicit confirmation would overstate what the interview actually
established.
