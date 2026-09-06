# Evidence — Practices Discovery (Step 2: Lead Draft)

This log records what was inspected and what was inferred from each source,
so the Step 4 interview and Step 5 integration can trace every claim in
`team-practices.md` and `discovered-rules.md` back to its origin. Per org
Testing Posture / Evidence Standards convention: uncertain claims are labeled
as such, and thin evidence is stated as a finding rather than smoothed over.

## Sources Inspected

### 1. Git history (`git log --all --oneline --graph`, `git branch -a`, `git log --format="%h %ad %s" --date=short`)

**Observed:**
```
2812203 2026-09-05 Install AI-DLC workflow engine (AWS Labs)
b1234cc 2026-09-04 Wire real Formspree endpoints and submit forms via AJAX
baf6d0d 2026-09-04 Fix CI Node version and add custom domain CNAME
4814836 2026-09-04 Scaffold GuestGuideIQ marketing site
```
- Branches: only `main` (local) and `remotes/origin/main` — no other
  branches exist, locally or on the remote.
- Single author (`Pradeep Kumar`) across all 4 commits.
- No merge commits — history is fully linear.

**Inferred:**
- Trunk-based, single-branch workflow is *consistent with* the observation,
  but the observation cannot distinguish "team always uses short-lived
  feature branches that get deleted after merge" from "commits go straight
  to `main`, no branching at all" — both produce an identical `main`-only
  git history once branches are deleted/merged. **Uncertainty flagged**:
  this is exactly the kind of thing the interview should confirm directly
  rather than infer.
- Small-team or solo-project inferred from single-author history —
  **uncertain**: a small team could still show single-author history if
  only one person has committed so far in a very young repo (first commit is
  same-day/next-day as the most recent, i.e. the whole history spans 2
  days).
- Commit messages suggest incremental, single-concern commits (scaffold,
  then a CI/domain fix, then a feature, then tooling install) — a
  reasonable but not confirmed convention.

### 2. CI/deployment configuration (`.github/workflows/deploy.yml`)

**Observed (full file read):**
- Single workflow file. Triggers: `push` to `main`, and `workflow_dispatch`
  (manual).
- `concurrency: group: pages, cancel-in-progress: true`.
- `build` job: checkout → `setup-node@v4` (Node 22, npm cache) → `npm ci` →
  `npm run build` → `configure-pages` → `upload-pages-artifact` (path
  `./dist`).
- `deploy` job: `needs: build`, targets `environment: github-pages`, runs
  `actions/deploy-pages@v4`.
- No `pull_request` trigger anywhere. No test step, no lint step, no
  `astro check` step — only `npm run build`.
- No second environment (e.g. `staging`) defined anywhere in the workflow.
- No manual-approval gate configured (the `github-pages` GitHub Environment
  *could* have protection rules configured in the repo's GitHub settings,
  but that is **not visible from repository file contents** — flagged as an
  open question rather than assumed either way).

**Inferred:**
- Deploy-on-merge-to-`main`, single environment, no staging tier, no
  automated test/lint gate before deploy. This directly informs the
  `## Deployment` and `## Testing Posture` sections of `team-practices.md`.
- **Cannot confirm from file contents alone** whether GitHub's own branch
  protection rules or environment protection rules (configured server-side,
  not in a committed file) add any human-approval gate — this is called out
  explicitly as an open question rather than silently assumed to be absent.

### 3. CodeKB artifacts at `aidlc/spaces/default/codekb/guestguideIQ/`

Six of the eight generated artifacts were read in full for this pass
(`api-documentation.md` and `component-inventory.md` were available but not
separately needed beyond what the other six already cross-reference for
practices-relevant evidence):

- **`business-overview.md`**: confirms the site is pre-launch, six pages,
  lead-capture-only "backend" via Formspree; confirms this intent's purpose
  (spec a new backend) and situates why practices evidence is thin (nothing
  backend-shaped exists yet to have practices about).
- **`architecture.md`**: confirms zero server runtime, zero database,
  static Jamstack architecture; explicitly calls out (Improvement
  Opportunities) that "no automated build/test gate on pull requests" is a
  known gap the team should address, and that a new backend is "a good
  trigger to also add a PR-triggered CI workflow" — this is *analysis*
  authored by a prior reverse-engineering pass, not a team-stated
  practice/mandate, but it is useful signal for framing interview questions.
- **`code-structure.md`**: confirms single npm package (no monorepo), naming
  conventions (`PascalCase.astro`, `lowercase-kebab.astro`, `camelCase.ts`)
  are consistent but manually enforced (no lint/format tool).
- **`technology-stack.md`**: confirms no testing library, no
  linting/formatting tool installed as a dependency; confirms Node
  `>=22.12.0`, npm as package manager; confirms CI is GitHub Actions only.
- **`dependencies.md`**: confirms no dependency-scanning/audit tooling
  configured (no `npm audit` step in CI, no Dependabot/Renovate config) —
  relevant to a future CI-pipeline stage more than to practices-discovery
  directly, but noted since it reinforces the "CI is minimal" picture.
- **`code-quality-assessment.md`**: the single richest source for this
  stage. Directly states: zero test directories/frameworks/coverage tooling;
  zero linting/formatting configuration; CI has no test/lint step and no
  PR-trigger; git history is 4 commits, linear, single-author. Also
  documents the `astro check`-vs-`astro build` type-checking gap (type
  errors would only ever appear as build warnings, never as a blocking CI
  check).

**Inferred:** all of `## Testing Posture` and `## Code Style` thin-evidence
framing in `team-practices.md` is drawn primarily from
`code-quality-assessment.md`, cross-checked against the raw
`technology-stack.md` dependency list. No CodeKB artifact records anything
that reads as a team-stated mandate or prohibition — all are the prior
reverse-engineering agent's own analytical findings, which is why
`discovered-rules.md` is left minimal at this draft stage rather than
seeded from CodeKB content.

## Explicit Gaps / Thin-Evidence Areas (carried into Next Steps)

1. **Branching strategy in actual practice** — git history shows only
   `main`; cannot distinguish feature-branch-then-squash from
   commit-directly-to-`main`. *(interview question)*
2. **Team size and review process** — single-author history; unknown
   whether PRs/code review happen at all today, or whether this is
   currently a solo effort. *(interview question)*
3. **Testing methodology preference for the new backend** — no existing
   convention to infer from (zero tests in repo); org default (test-after)
   is only a placeholder pending explicit team commitment, especially since
   greenfield backend work is exactly when a team most often chooses to
   commit to TDD/BDD if that is their preference. *(interview question)*
4. **Coverage floor for the new backend** — no coverage tooling exists
   today to observe a baseline from. *(interview question)*
5. **Deployment topology for the new backend** — current site is
   single-environment/deploy-on-merge-to-prod with no staging; whether the
   new backend should follow the org default (staging + manual-approval
   production gate) or continue the current lighter-weight model is
   unresolved from evidence alone. *(interview question)*
6. **GitHub-side branch/environment protection rules** — not visible in
   repository file contents; unknown whether any server-side approval gate
   already exists outside of what `deploy.yml` shows. *(interview
   question — team should state this directly since it isn't discoverable
   from the checked-in files)*
7. **Code style/lint tooling intent for the backend's language/stack** —
   the frontend has no linter/formatter configured at all; whether the team
   wants to start clean with one for the backend (and which stack/language
   the backend will even be built in) is undecided at this stage.
   *(interview question, and also downstream of stack/architecture
   decisions not yet made)*

## Interview Resolution (Step 4 → Step 5 Integration)

All 8 interview questions were answered and the consolidated summary was
confirmed "Looks correct." This section records how each answer resolved
the corresponding Explicit Gap above (or, where a question mapped to a
Step 3 contribution rather than a Step 2 gap, which contribution it
resolved), and which gaps remain open by design.

- **Q1 (work style) → Gap 1 (branching strategy in actual practice)
  RESOLVED**: the team confirmed short-lived feature branches merged via
  PR review, going forward. The git-history ambiguity noted in Gap 1
  (branch-and-delete vs. no-branching-at-all both look identical in a
  linear `main`-only history) is now moot — the team has stated the
  practice directly rather than leaving it to be inferred.
- **Q1 → Gap 2 (team size and review process) PARTIALLY RESOLVED**: the
  interview confirms PR review will be required, but does not state
  current team size — left as genuinely out of scope for
  practices-discovery (team headcount is not a practice).
- **Q2 (repo location) is a NEW decision, not one of the original 7
  gaps**: it was raised by the developer-agent contribution (Step 3, item
  3) as an interview-worthy question rather than being one of the lead's
  original Explicit Gaps. Confirmed: the new backend lives in a separate
  repository.
- **Q3 (walking skeleton) → the `team-practices.md` Step 2 recommendation
  RESOLVED**: the draft flagged a walking skeleton as "a reasonable fit"
  without asserting it. Confirmed: yes, build a thin end-to-end slice
  first (Bolt 1, solo and gated per `org.md`).
- **Q4 (testing approach) → Gap 3 (testing methodology preference)
  RESOLVED, with a methodology-recording nuance**: the team's answer mixes
  cadences — BDD scenario first, then implementation, then lower-level
  unit tests after. Per `org.md`'s Testing Posture rule, this is recorded
  as `Methodology: custom` with an explicit `Ordering` field, not as plain
  `bdd`, since the answer does not match a single named methodology
  cleanly.
- **Q5 (blocking CI checks) → the quality-agent contribution (Step 3, §2)
  RESOLVED**: the quality agent's candidate mandate text ("Every PR
  touching the backend triggers a CI run that fails the check on: build
  failure, lint failure, test failure, or coverage drop below the
  affirmed floor — merge is blocked until it's green") was put to the team
  essentially as posed, and confirmed: yes, require a green build+lint+
  test+coverage check before merge.
- **Q6 (deployment topology) → Gap 5 (deployment topology for the new
  backend) RESOLVED**: confirmed staging + manual approval before
  production — the org default, and a deliberate departure from the
  current single-environment, deploy-straight-to-prod frontend model.
- **Q6 also touches Gap 6 (GitHub-side branch/environment protection
  rules) — REMAINS OPEN BY DESIGN**: the interview confirmed the desired
  *policy* (staging + manual approval) but did not, and could not, confirm
  whether any server-side GitHub branch/environment protection already
  exists — that remains unobservable from repository file contents and is
  now a concrete implementation task for the upcoming `ci-pipeline`/
  `deployment-pipeline` stages (configure the protection rule, don't just
  assume one exists).
- **Q7 (dependency/secret scanning) → the devsecops-agent contribution
  (Step 3, §1) RESOLVED, partially**: confirmed dependency-vulnerability
  scanning and secret scanning both set up from day one. The devsecops
  contribution's broader five-category finding (SAST, DAST, SBOM
  generation, IaC scanning also entirely absent today) was **not** put to
  the team as its own interview question — only dependency + secret
  scanning were asked. Per `discovered-rules.md` § Notes, the other three
  categories are recorded as forward-looking considerations in
  `team-practices.md`, not promoted to `## Mandated`, since promoting them
  would overstate what was actually confirmed.
- **Q8 (linting/formatting enforcement) → Gap 7 (code style/lint tooling
  intent) RESOLVED**: confirmed a linter + formatter will be set up and
  enforced as a blocking PR check from day one, matching the org default
  and closing the "manual convention only" gap the frontend currently has.

### Contributions correctly deferred, not lost

The following Step 3 contribution items were **not** put to the human
interview and are **not** resolved above — they are correctly deferred to
later stages because they depend on the backend's actual stack, API
surface, or domain model, none of which are chosen yet. Naming them here
explicitly so they are not silently dropped between stages:

- **Developer-agent contribution, items 1–3** (layer boundaries — e.g.
  controller/service/repository vs. a flatter split; error-handling
  convention — typed error classes vs. result/either objects, 4xx-vs-5xx
  distinction; file organization — feature-based vs. layer-based internal
  structure): deferred to **`domain-design`** and **`functional-design`**,
  where the backend's architecture and API shape are actually decided.
- **Quality-agent contribution, items 1 and 5** (test pyramid shape —
  unit/integration/contract/e2e proportions; coverage tool selection tied
  to the backend's language/runtime; test data/fixture strategy; test
  environment and data isolation for a now-stateful system): deferred to
  **`domain-design`** (stack/persistence choice) and **`functional-design`**
  (API surface the contract-test layer would target).
- **Quality-agent contribution, item 6** (NFR/performance validation —
  load-testing tooling, latency/throughput SLOs): deferred to
  **`nfr-requirements`** and **`nfr-design`**, since no NFR targets exist
  yet to test against.
- **Devsecops-agent contribution, item 1 partial** (SAST, DAST, SBOM
  generation, IaC scanning): not confirmed as mandates (see Q7 resolution
  above); flagged as forward-looking candidates for CI-pipeline hardening
  once the backend has real attack surface and infrastructure-as-code to
  scan.

None of these deferred items contradict anything confirmed in the
interview — they are simply questions the interview's 8-question scope did
not (and, for the stack-dependent ones, could not yet) cover.
