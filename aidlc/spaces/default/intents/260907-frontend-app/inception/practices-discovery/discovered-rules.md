# Discovered Rules — Frontend (Property Owner + Guest app)

> Final. Lead: `aidlc-pipeline-deploy-agent`. Only hard constraints the human
> actually stated in `practices-discovery-questions.md` appear below. Items
> reviewers proposed as candidate mandates but that were never put to (or
> confirmed by) the human stay out of this file — they are recorded, with
> disposition, in `evidence.md` instead. These rules are appended to
> `project.md`'s existing stamped rules on promotion, not restated wholesale;
> where an already-affirmed rule's scope widens from "backend work" to all
> work, that is said explicitly rather than duplicating the rule's text.

## Mandated

- ALWAYS build the frontend (Property Owner + Guest app) in its own new
  repository, alongside the backend repository (`guestguideiq-app`) — not as
  a folder or workspace inside the existing marketing-site repo (Q1).
  (affirmed 2026-09-07)
- ALWAYS run the walking-skeleton Bolt first for the frontend — a thin
  end-to-end slice proving the Owner path (signup through to a published
  guide), solo and gated, approved by the user before remaining Bolts run
  (Q2). (affirmed 2026-09-07)
- ALWAYS name frontend files after what they export: `PascalCase` when the
  primary export is a component or class, `camelCase` otherwise — this
  resolves the earlier ambiguity in the affirmed backend naming rule, which
  a component file would otherwise violate on day one (Q4). (affirmed
  2026-09-07)
- ALWAYS run frontend automated tests against both an intercepted/mocked
  network (unit and component tests) and a thin live-backend suite (end-to-
  end tests) (Q5). (affirmed 2026-09-07)
- ALWAYS require a staging deployment with manual approval before production
  for the frontend, applying uniformly to the Owner and Guest surfaces —
  matching the backend's practice, not the marketing site's single-
  environment precedent (Q6). (affirmed 2026-09-07)
- ALWAYS scope and land a backend follow-up — adding `POST /v1/stays` and
  fixing the CORS/`ALLOWED_ORIGINS` configuration so a frontend origin can
  call the API — before frontend Construction begins (Q8). (affirmed
  2026-09-07)

### Scope widened from "backend work" to all work (Q3)

The following five rules were stamped `ALWAYS` in `project.md` on 2026-09-05,
each scoped in its own text to "backend work" or "touching the backend." The
human confirmed (Q3) that all five now apply to frontend work as well — no
rule listed above duplicates their text; promotion should read each as
applying workspace-wide from this affirmation forward:

- short-lived feature branches merged via pull request after review;
- blocking linter + formatter as a required pull request check from day one;
- automated dependency-vulnerability scanning from day one;
- automated secret scanning from day one;
- a green CI check (build, lint, test, coverage) required before merge.

## Forbidden

### Scope widened from "backend work" to all work (Q3, Q6)

The following four rules were stamped `NEVER` in `project.md` on 2026-09-05,
each scoped to backend deployment, backend pull requests, or the backend
repository specifically. Per Q3 (the CI/scanning/linting rules) and Q6
(staging + manual approval, applied uniformly rather than split by surface),
they now apply to frontend work as well — again, not restated here in full:

- never deploy without first passing through staging and receiving manual
  approval;
- never merge a pull request unless build, lint, test, and coverage checks
  are all green;
- never commit secrets to the repository or any checked-in configuration
  file;
- never treat a security scanner or the linter as merely advisory — each
  must be a blocking CI gate.

No additional frontend-specific `NEVER` rule was stated by the human this
round. Several were proposed by reviewers (guest-URL/telemetry handling,
raw-HTML rendering, dependency-scan suppression discipline) — these are
recorded as evidence and open candidates in `evidence.md`, not promoted here,
because they were not put to or confirmed by the human in this interview.
