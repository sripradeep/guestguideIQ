# Team Practices — Confirmed (Step 5: Lead Integration)

> **Status: CONFIRMED.** These practices were drafted from repository
> evidence (Step 2), reviewed by the quality, developer, and devsecops
> agents (Step 3), and confirmed by the human interview (Step 4, 8/8
> questions answered, consolidated summary marked "Looks correct"). This
> is the version promoted into `aidlc/spaces/default/memory/team.md`.
>
> Context carried from the draft: this project is **brownfield** at the
> workspace level — the existing repository is a six-page static marketing
> site (Astro) with no backend, no test suite, and no linting configured —
> but the new backend specified by this intent (`260905-backend-services-spec`)
> is **greenfield** and, per the interview, will live in its own separate
> repository. The practices below apply to that new backend and its repo.

## Way of Working

- **Branching model** (confirmed, Q1): always use short-lived feature
  branches, merged via pull request after review. This matches the org
  default (trunk-based development, short-lived feature branches merged to
  `main`) and resolves the ambiguity the git-history evidence alone could
  not settle — the existing single-author, branch-free history was
  consistent with either "branches always used and deleted" or "no
  branching at all"; the team has now stated explicitly that PR review is
  required going forward.
- **Repository location** (confirmed, Q2): the new backend lives in **its
  own separate repository**, not as a folder or npm workspace inside the
  existing marketing-site repo. Way-of-Working, CI, and deployment
  practices below apply to that new repository from its first commit.
- **Worktree base/target branches**: org default applies unchanged — base
  `main`, merge target `main`, squash-merge Bolt branches into `main` in
  the new backend repository.
- **Commit granularity**: no change from observed practice — small,
  single-concern commits remain the expectation, now enforced additionally
  by PR review rather than left to convention.

## Walking Skeleton

- **Confirmed (Q3): Yes.** Build a thin end-to-end slice first — a minimal
  version that runs the whole way through (e.g. one real API route
  reachable end-to-end) before building out full domain logic. Per
  `org.md`, Bolt 1 (the walking-skeleton Bolt) runs solo and gated; the
  user explicitly approves it before remaining Bolts run. This should be
  recorded as `skeleton: on` in the scope file governing this intent's
  Construction phase.

## Testing Posture

- **Methodology**: custom
- **Ordering**: write the BDD scenario (given/when/then) first, implement
  the code to satisfy it, then add lower-level unit tests after
  implementation.
- **Confirmed (Q4)**: the human interview answer mixes cadences — write
  the scenario first (BDD-style), then implement, then add lower-level
  unit tests afterward. Per `org.md`'s Testing Posture rule, a mixed
  cadence like this is recorded as `Methodology: custom` with an explicit
  `Ordering` spelling out the actual sequence, rather than approximated as
  plain `bdd` or `tdd`.
- **CI gate (confirmed, Q5)**: every pull request touching the backend
  must pass a green check — build, lint, test, and coverage — before it
  can merge. This directly closes the gap `architecture.md` flagged
  (no automated build/test gate on pull requests) and the quality agent's
  candidate mandate (see `discovered-rules.md`).
- **Coverage floor**: org default applies — 80% line-coverage floor per
  the active scope's testing-posture rules (`mvp`/`enterprise`/`feature`/
  `infra`/`classic` add this floor; the specific scope for this intent
  governs which floor applies). Which coverage tool enforces it depends on
  the backend's language/runtime, not yet chosen — see `evidence.md` for
  the deferral to `domain-design`/`infrastructure-design`.
- **Test pyramid, test data strategy, and NFR/perf testing**: not decided
  at this stage — correctly deferred to `domain-design`/`functional-design`
  (test pyramid shape, test data/fixture strategy) and `nfr-requirements`/
  `nfr-design` (load/perf testing, SLO-driven test targets) since they
  depend on the backend's stack and API surface, neither of which exists
  yet. See `evidence.md` for the explicit list of deferred items so they
  are not lost.
- **Type-checking as a blocking gate**: whichever backend language is
  chosen, the CI gate above must include a distinct type-check step (e.g.
  `tsc --noEmit`, `mypy`, `go vet`) separate from the build/bundle step —
  named positively now so the `astro build`-vs-`astro check` gap observed
  in the existing frontend (type errors surfacing only as warnings) is not
  repeated in the new backend.

## Deployment

- **Confirmed (Q6)**: add a staging environment with manual approval
  before production. This matches the org default (deploy on merge to
  staging; production deploys gate on manual approval) and is a deliberate
  departure from the existing frontend's single-environment,
  deploy-straight-to-production model — appropriate because the backend
  will hold real data and likely authentication, unlike the current static
  site.
- **CI/CD pipeline**: the new backend repository needs its own CI/CD
  pipeline built from scratch (the existing `.github/workflows/deploy.yml`
  in the marketing-site repo has no PR trigger, no test/lint step, and no
  staging tier — none of it is inherited by the new, separate backend
  repo).
- **Secrets handling**: any backend secrets (database connection strings,
  API keys, session-signing keys) must never live in code, env files
  checked into the repo, or `site.config.ts`-style checked-in config — use
  a secrets manager (e.g. AWS Secrets Manager / SSM Parameter Store) per
  the org security defaults. This becomes a concrete requirement the
  moment the backend introduces persistent state and secrets, which the
  frontend never had to address.
- **Artifact versioning/rollback**: not yet decided — no artifact
  versioning/tagging scheme or rollback mechanism exists to inherit from
  the current site (GitHub Pages redeploy-of-previous-commit is its only
  rollback path). This is in scope for the upcoming `ci-pipeline` and
  `deployment-pipeline` stages once the backend's deployment target is
  chosen.

## Code Style

- **Formatter and linter (confirmed, Q8)**: set up a linter and formatter
  for the new backend (e.g. ESLint + Prettier for a Node/TS backend, or the
  language-idiomatic equivalent per `org.md`) and enforce both as a
  **blocking** PR check from day one — not advisory-only. This is a
  deliberate departure from the existing frontend, which has no
  formatter/linter configured at all.
- **Naming conventions**: language-idiomatic per the org default, with one
  carried-forward precedent — if the backend is TypeScript/Node, the
  existing frontend's `camelCase.ts` file naming (config/data files) and
  `PascalCase` for component/class-like constructs (`code-structure.md` §
  Naming Conventions) is a natural continuation of current practice (e.g.
  `userService.ts`, `authMiddleware.ts`), independent of the org's
  "language idiomatic" fallback for other stacks.
- **Layer boundaries and error handling**: no existing-codebase precedent
  to inherit (the frontend has no server-side layering and no
  server-side error-handling convention — only a client-side fallback-UI
  pattern for Formspree failures, which does not transfer). These remain
  open and are correctly deferred to `domain-design`/`functional-design`,
  where the backend's actual architecture is decided; see `evidence.md`
  for the explicit gap. Once decided, lint rules should encode the
  layer-boundary convention (e.g. import-restriction rules preventing
  data-access code from importing route handlers) rather than leaving it
  manually reviewed only.
- **File organization**: which directory/package structure the backend
  uses internally (feature-based vs. layer-based) is deferred alongside
  layer boundaries; the repository-location question itself is resolved
  above (Q2 — separate repository).

### Security Tooling (confirmed, Q7)

The existing frontend has zero security scanning of any kind (no SAST, no
DAST, no secret scanning, no dependency/vulnerability scanning, no SBOM
generation, no IaC scanning) — reasonable for a static site with no
secrets, no database, and only two direct dependencies. The interview
confirmed this changes for the new backend:

- **Dependency-vulnerability scanning**: set up from day one (e.g.
  Dependabot or Renovate plus `npm audit`/Snyk or the language-appropriate
  equivalent, wired into CI as a **blocking** check per the org default
  that "linter run in CI before merge; failure blocks the PR" — the same
  blocking standard applies to security scanners, not just lint).
- **Secret scanning**: set up from day one (e.g. Gitleaks or GitHub's
  native secret scanning, confirmed active on the new repository — not
  merely assumed).
- **SAST, DAST, SBOM generation, IaC scanning**: not explicitly asked in
  the interview (the 8 questions scoped to dependency + secret scanning
  specifically), but flagged here as forward-looking considerations once
  the backend has real attack surface (HTTP endpoints → DAST candidate)
  and infrastructure-as-code (→ `cfn-nag`/Checkov/`cdk-nag` candidate).
  These are natural candidates for the upcoming `devsecops`-owned stages
  (e.g. CI pipeline hardening) rather than asserted as mandates here.
- **Enforcement discipline**: every scanner set up for this backend must
  be wired as a blocking CI gate, not merely installed and left advisory —
  a tool that exists but never blocks a merge (the same failure pattern as
  `astro build` never running `astro check`) provides no real protection.
