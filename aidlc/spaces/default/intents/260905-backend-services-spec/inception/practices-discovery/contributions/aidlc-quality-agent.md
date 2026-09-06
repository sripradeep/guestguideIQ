**Collaborator:** aidlc-quality-agent

## Contribution

Reviewed `team-practices.md`, `discovered-rules.md`, and `evidence.md` against
`code-quality-assessment.md` and `technology-stack.md`, focused on testing
posture, coverage tooling, CI quality gates, test/code patterns, and gaps the
Step 4 interview must resolve. The lead draft's evidence trace is accurate and
its thin-evidence framing is correct — the repository genuinely has zero
tests, zero lint/format tooling, and zero PR-triggered CI. The additions below
are QA-specific findings that supplement, not contradict, the draft.

### 1. Test strategy needs more than a methodology/ordering pair

`## Testing Posture` in `team-practices.md` currently records only
`Methodology` and `Ordering` (both `[draft — org default, unconfirmed]`), per
the org.md contract. That is correct as far as it goes, but a *test strategy*
for a from-scratch backend needs three more dimensions decided at the
interview, none of which are inferable from this brownfield repo (there is no
prior backend to observe):

- **Test pyramid shape for this backend**: proportion and scope of unit vs.
  integration vs. contract vs. e2e tests. Recommend proposing, as an interview
  option, a conventional split (many fast unit tests, an integration-test
  layer around persistence/external-service boundaries, a thin contract-test
  layer against the API surface produced by the upcoming `contract-design`
  stage, and minimal e2e) rather than leaving "Test Strategy" undifferentiated
  from "Testing Posture."
- **Coverage tool, not just coverage floor**: `team.md`/`org.md` sets an 80%
  line-coverage floor for `mvp`/`enterprise`/`feature`/`infra`/`classic`
  scopes, but *which tool enforces it* depends on the backend's
  language/runtime — a decision not yet made (see Gap 7 in `evidence.md`).
  Flag this explicitly as a downstream dependency: once `domain-design`/
  `infrastructure-design` picks the backend stack, the coverage tool
  (`c8`/`istanbul`/`nyc` for Node-TS, `coverage.py`/`pytest-cov` for Python,
  `go test -cover` for Go, etc.) must be wired into the same CI workflow this
  intent will need to create from scratch — there is no existing CI test step
  to extend.
- **Test data strategy**: fixtures/factories/seed data. Zero precedent exists
  in this repo (no test directories at all), so this is a pure interview
  question, not an inference. Given the hospitality-guest domain this backend
  will likely serve, flag as a candidate discussion point whether synthetic
  (non-PII) fixture data is a hard requirement rather than a nice-to-have —
  this may surface again at `nfr-requirements`/compliance stages but is worth
  seeding here since it shapes fixture design from day one.

### 2. CI quality gates: the gap is broader than "no test step"

`evidence.md` and `code-quality-assessment.md` correctly note the existing
pipeline (`.github/workflows/deploy.yml`) has no test step, no lint step, and
no PR trigger at all — only `push: main` and manual dispatch. `team-practices.md`
captures this under `## Deployment` and `## Testing Posture`, but
`discovered-rules.md`'s "Notes for the interview" section only proposes a
candidate mandated rule for the **deployment staging gate** — it does not
surface the **PR-triggered build/lint/test/coverage gate** as an equally
strong candidate for `## Mandated`, even though `architecture.md` (per
`evidence.md` §3) already flags "no automated build/test gate on pull
requests" as a known gap the new backend is "a good trigger" to close. From a
QA-gate perspective this is the more consequential of the two: without a
PR-triggered gate, an 80%-coverage floor or any affirmed methodology is
unenforceable — there is no automated point in the workflow where a failing
test or a coverage regression would block a merge. Recommend the interview
explicitly decide, and `discovered-rules.md` capture as candidate
`## Mandated` text once confirmed: *"Every PR touching the backend triggers a
CI run that fails the check on: build failure, lint failure, test failure, or
coverage drop below the affirmed floor — merge is blocked until it's green."*
This is additive to, not a replacement for, the deploy-gate candidate already
drafted.

### 3. Type-checking gate — agree with the draft, one addition

The draft's observation that `astro build` never runs `astro check` (so type
errors surface only as warnings) is accurate and correctly scoped to the
*existing frontend*. Flag for the interview: whichever backend
language/runtime is chosen, the same failure mode (a "build" step that
silently tolerates type errors) is avoidable from day one only if the CI gate
proposed above explicitly names a type-check step distinct from the
build/bundle step (e.g., `tsc --noEmit`, `mypy`, `go vet`) — worth stating
positively now so it isn't rediscovered as a gap after the backend ships.

### 4. Security/negative-path testing tied to a concrete existing gap

`code-quality-assessment.md` Technical Debt Signal 3 states plainly: **no
server-side form validation exists anywhere today** — all three current forms
rely on HTML5 client validation and whatever Formspree does on receipt, with
nothing enforcing business rules (enum validity, length limits, duplicate
submissions). This is a direct, concrete input for `## Testing Posture`: the
new backend is not just "a backend with no prior test convention" — it is
specifically *replacing an integration point that has zero validation
history to inherit*. Recommend flagging as an interview question (and later,
a devsecops-agent handoff item) that the test strategy for this backend
include boundary/negative test cases for every field crossing the API
boundary (missing/malformed/oversized input, invalid enum values, duplicate
submission handling) as a first-class category alongside happy-path tests,
not an afterthought bolted on after functional tests pass.

### 5. Test environment and data isolation for a now-stateful system

The current site has no persistent data store; the new backend will
presumably introduce one. This is a genuine new testing concern with zero
brownfield precedent: recommend the interview surface (a) what environment
integration/contract tests run against (local ephemeral instance, containerized
dependency, or a shared dev/staging tier — noting the draft already flags that
no staging tier exists today), and (b) how test data isolation is achieved
across runs (per-test transaction rollback, ephemeral schema/container,
seeded-and-reset fixtures) so that "tests must be independent, repeatable"
(inception phase guardrail) is achievable once persistence exists. This has no
current-repo evidence to draw on and should be recorded as an open question in
`evidence.md` §"Explicit Gaps" alongside the existing seven.

### 6. NFR/performance validation — placeholder only at this stage

No NFR targets have been set yet (that is a `nfr-requirements`/`nfr-design`
concern downstream of this stage), so no load-testing tooling or SLO can be
committed to here. Flag only as a forward pointer: once NFR targets exist,
the test strategy affirmed at this stage should be revisited to add a
load/perf-testing plan (tooling such as k6/Artillery, latency-percentile and
throughput targets, and auto-scaling validation) rather than treating
performance testing as out of scope for the backend permanently. No action
needed in this draft beyond noting the dependency.

## Positions

- AGREE: The brownfield evidence trace (zero tests, zero lint/format, no
  PR-triggered CI, `astro build` vs `astro check` gap) is accurate and
  correctly labeled `[inferred]`/`[unconfirmed]` throughout — no correction
  needed to the underlying facts.
- AGREE: Carrying the org-default test-after posture forward as a provisional
  placeholder (rather than asserting TDD or a coverage number the repo cannot
  support) is the right call, and correctly flagged as an interview-must-confirm
  item given this is greenfield backend work.
- AGREE, with an addition: `discovered-rules.md`'s "Notes for the interview"
  section should also surface the PR-triggered build/lint/test/coverage gate
  as a `## Mandated` candidate (see Contribution §2) — today it only proposes
  the deployment staging-gate candidate, leaving the CI test-gate gap (which
  `architecture.md` independently flagged) unrepresented as an explicit
  interview item even though it is more directly a testing-posture concern
  than a deployment one.
- AGREE: Deferring backend language/stack and coverage-tool selection to
  `domain-design`/`infrastructure-design` is correct scope discipline for an
  inception-phase practices document; this contribution only asks that the
  *dependency* be named so it isn't lost by the time those stages run.
