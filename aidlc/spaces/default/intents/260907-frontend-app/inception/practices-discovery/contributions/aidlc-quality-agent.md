**Collaborator:** aidlc-quality-agent

## Contribution

Remit: testing posture, coverage tooling, CI quality gates, test/code patterns,
and the gaps the interview must close. Naming/layering and security scanning are
other reviewers' lanes and I do not touch them except where they change a test
outcome.

Everything below was checked against live evidence, not read off the CodeKB
summary alone: `guestguideiq-app/vitest.config.ts`, `admin-api/vitest.config.ts`,
`package.json` scripts, the full `tests/` and `admin-api/tests/` trees,
`tests/bdd/signup.test.ts`, `tests/helpers/buildTestApp.ts`,
`tests/integration/contract1.test.ts`, `tests/unit/cors.test.ts`, `.env.example`,
`src/app.ts` + `src/config.ts` CORS wiring, and `.github/workflows/ci.yml` in
full. All reads were read-only; no git state was changed.

---

### 1. The `custom` cadence does survive UI work — but only if "the port" is named

The brief asks honestly whether BDD-scenario-first / implement / unit-tests-after
survives contact with UI. My read: **yes, and the backend already contains the
template**, but the draft should say what the frontend equivalent *is*, or the
team will apply the cadence at the wrong altitude and get brittle tests.

What the backend actually does (observed, `tests/bdd/signup.test.ts` +
`tests/helpers/buildTestApp.ts`) is not a BDD framework. It is:

- plain Vitest, with `describe('Scenario: …')` and
  `it('Given … When … Then …')` naming;
- one factory — `buildTestHarness()` — that wires **the real application**
  (`createApp`, real services, real routes) against **in-memory doubles
  substituted only at the outermost port**, thirteen repositories sharing a
  single `fakeDb.ts` so cross-module scenarios see consistent state;
- assertions written against externally observable behaviour (HTTP status, the
  error envelope, the resulting store state), never against internal calls.

The header comment in `signup.test.ts` even states the cadence explicitly:
scenario written before the route exists, implementation until green, then
`tests/unit/identity.test.ts` adds the lower-level coverage.

The frontend analogue is a near-exact translation, and the lead should record it
so `domain-design` inherits a shape rather than an argument:

| Backend | Frontend equivalent |
|---|---|
| `buildTestHarness()` composes the real app | a `renderApp(route, opts)` helper mounting the **real** router/providers/state |
| in-memory repository doubles at the port | a fake at the **network boundary** (request-interception, e.g. MSW-style), not per-component mocks |
| one shared `fakeDb.ts` | one shared API-fixture module, so multi-screen scenarios stay consistent |
| assert HTTP status + envelope | assert what the user can see and do (rendered text, enabled/disabled, navigation) |
| `tests/unit/*` after | `tests/unit/*` on **logic** units, after |

The load-bearing sentence: **the frontend's substitution boundary is the network,
not the component.** Scenarios that mount one component with mocked child
components are the failure mode; they invert the pyramid and couple tests to
markup. Naming this now costs one paragraph and prevents a rewrite in
`functional-design`.

**One honest refinement I recommend the interview put to the human.** The
`Ordering` clause "then add lower-level unit tests after implementation" is a
good fit for logic (hooks, reducers, form validators, the API client, date and
currency formatters) and a poor fit for presentational components, where a
component-level unit test after a passing scenario test frequently asserts
nothing the scenario did not already assert. Writing them anyway to satisfy a
line-coverage number is exactly the "100% coverage with meaningless assertions"
outcome. The specialisation I would propose — additive, not a weakening, so it
survives the `org.md` admission check — is:

> `Ordering` (frontend): write the scenario first; implement; then add
> lower-level unit tests **for logic units** (hooks, state reducers, API client,
> validators, formatters). Presentational components are covered by the scenario
> that exercises them; a component-level unit test is written when the component
> carries branching logic of its own, not by default.

This keeps `Methodology: custom` intact and inherits the backend's Ordering
verbatim for everything that is not markup.

### 2. What an 80% line floor actually means for component code

The org rule is unambiguous: `classic` scope adds an 80% line-coverage floor,
floors are additive, and they "may not be weakened to make a step pass." So the
floor stands. But the draft treats "80% carries over, tool TBD" as if the number
transfers with the same meaning, and it does not.

Two pieces of evidence:

- The backend's own measured split is **91.15% lines against 76.53% branches**
  (`code-quality-assessment.md`, measured during the scan, not a badge). Lines
  already overstate rigour by ~15 points on *node service code*.
- On component code the gap widens sharply, because a single render assertion
  executes every line of a component's template. Line coverage on JSX/template
  code is close to free; branch coverage is not.

Two things the draft should carry, neither of which lowers the floor:

1. **The floor is meaningless until the `include`/`exclude` set is declared.**
   The backend config is explicit — `include: ['src/**/*.ts']`, excluding
   `server.ts`, `wiring.ts`, `prismaClient.ts` (i.e. composition roots and
   process entry). The frontend needs the equivalent decision made deliberately
   rather than by whatever the framework scaffold ships: are generated route
   files, design-system primitives, story files, and mock-service definitions in
   or out? An 80% floor over a set chosen to make 80% easy is theatre. Record
   this as an explicit `domain-design` deliverable, not a TBD.
2. **Add a second gate line coverage cannot fake.** My recommendation, in
   preference order: (a) every user story has at least one named
   `Scenario: …` test traceable to its acceptance criteria — cheap, directly
   enforces "test the requirement, not the implementation," and matches the
   affirmed BDD-first cadence; or (b) a branch-coverage floor alongside lines.
   I would propose (a) as the practice and leave (b) to `nfr-requirements`.

Note the backend enforces the floor in `vitest.config.ts` (`thresholds.lines: 80`)
rather than in the workflow file, so the same gate fires locally and in CI. That
is a good pattern and worth naming as inherited.

### 3. The decisive question nobody has asked: what does the frontend test *against*?

Q-E asks what **level** of component/E2E testing is expected. It does not ask
what those tests run **against**, and that is the half that determines whether
the answer is even implementable. Every option has a hard prerequisite that does
not exist today:

| Option | What it gives | Hard prerequisite, today's status |
|---|---|---|
| A. Fully faked network (request interception) | Fast, deterministic, runs in any CI, no backend needed | None. **But** with no OpenAPI (TD-3), the fakes are hand-written and can drift from the real API without a single test failing |
| B. Real backend run locally/in CI (Docker + Postgres service) | Catches contract drift for real | The backend has a `Dockerfile` and CI already runs a Postgres 16 service container, so it is feasible — **but** `ALLOWED_ORIGINS` must include the frontend's localhost/CI origin, which is a backend deploy-config change the frontend cannot make for itself. Also: no published backend image tag exists for a separate repo's CI to pull; `deploy-production` builds the image as a CDK asset, it does not publish a reusable tag |
| C. Deployed staging environment | Closest to production | **Does not exist.** `deploy-staging` and `integration-test-staging` in `ci.yml` are `echo` placeholders (TD-13), and `deploy-production` is wired `needs: [backend-api, admin-api]`, bypassing staging entirely |

My recommendation is **A as the default gate on every PR, plus a narrow B or C
suite that is the drift detector** — but this is a human decision with a real
cost attached, and it interacts with Q-A (repo location) and Q-G (hosting). If
the frontend lands in its own third repository, option B additionally requires
the backend to publish an image the frontend's CI can pull.

**Proposed new interview question, please add:**

> **Q-K (Testing Posture — test environment target)**: What should the frontend's
> automated tests run against? (a) a faked/intercepted network only — fastest and
> fully deterministic, but nothing detects drift from the real API; (b) a real
> backend started in CI (Docker + Postgres, as the backend's own CI already
> does), which requires a backend config change to add the CI/localhost origin to
> `ALLOWED_ORIGINS`; (c) a deployed staging environment, which does not exist
> today — the backend's staging deploy job is a placeholder and production is
> deployed directly. Or a combination: (a) on every PR plus a narrow (b) or (c)
> suite as the drift check.

### 4. Contract drift is the biggest untested risk in this intent, and it has no question

TD-3 is flagged once in the draft, in passing, inside the walking-skeleton
paragraph. In testing terms it is the central risk of the whole intent:
`dependencies.md` states there is no OpenAPI, no JSON Schema export, no published
types package, no generated client, **and no Fastify schemas on u1's public
routes**, so nothing is derivable even from the running app. The backend already
demonstrates the consequence internally — `admin-api/src/internal/types.ts`
re-declares u1's shapes by hand.

Consequence for testing: **the frontend cannot write a contract test today.**
There is no artifact to verify against. Whatever fixtures the frontend's fakes
return will be believed by 100% of the test suite, and the first disagreement
with the real API will surface in a browser, not in CI. This is precisely the
class of defect a quality gate exists to catch, and the current plan has no gate
for it at any level.

Options worth putting to the human, cheapest first: add Fastify schemas to u1's
public routes and generate OpenAPI from them (also fixes TD-10's 500-on-missing-
body, so it pays twice); or hand-author an OpenAPI document in the backend repo
and generate frontend types from it; or accept hand-written types and make a
recorded-response contract suite (fixtures captured from a real backend and
re-verified on a schedule) the compensating control.

**Proposed new interview question, please add:**

> **Q-L (Testing Posture — API contract verification)**: There is no OpenAPI
> document, no schema export, no shared types package and no generated client for
> the backend API, so the frontend will hand-write every request/response type and
> no test can detect the two sides drifting apart. Do you want (a) a
> machine-readable contract added to the backend (the cheapest route also fixes
> the missing-request-schema defect, TD-10), with frontend types generated from
> it; (b) hand-written types plus a contract-verification suite run against a real
> backend as the compensating control; or (c) accept the duplication with no
> automated drift detection for now?

### 5. Backend behaviours that will make frontend tests non-deterministic

Three findings that are not practice questions but will silently produce flaky
frontend suites the moment any test touches a real backend. They belong in
`evidence.md` next to the Q-J blockers, because delivery-planning needs them.

- **TD-12 — per-process auth and rate-limit state behind a multi-task service.**
  `InMemoryRefreshTokenStore` and `InMemoryRateLimitStore` are per-process while
  production runs `desiredCount: 2` autoscaling to 6. Refresh-token revocation is
  not shared across tasks, so single-use rotation semantics are not reliable
  across instances. **Any frontend test asserting silent-re-auth or
  token-rotation behaviour against a multi-task environment is
  non-deterministic by construction** — it will pass or fail depending on which
  task the load balancer picks. Either such tests run against a single-instance
  backend, or they cannot be trusted.
- **TD-9 + TD-12 — rate limiting is untested and its buckets multiply per task.**
  Rate limiting has *zero* backend test coverage (verified: a grep for `429` /
  `RATE_LIMITED` across `tests/` matches only the harness's store construction),
  and the effective limit varies with task count. A frontend E2E suite hammering
  a shared environment can trip limits intermittently. If E2E targets a shared
  backend, test-data and rate-limit isolation is a real design item, not a
  detail.
- **The suite's own precedent for isolation is excellent and should transfer.**
  Every backend test constructs a fresh harness in-test; nothing shares state
  across test files; the whole u1 suite runs in 2.85s. That independence is the
  most valuable habit in the repo and the one most easily lost the moment a
  shared staging environment enters the picture.

### 6. CORS is not only a misconfiguration — it is an *untested* behaviour

The draft correctly flags the CORS allowlist as a Construction blocker (Q-J).
The testing half is missing. I read `tests/unit/cors.test.ts` in full: three
tests, all against `GET /health`. There is **no preflight `OPTIONS` test, no
cross-origin test against any real `/v1/…` route, and nothing asserts
`Access-Control-Allow-Credentials`.**

Two consequences in my lane:

- `credentials` is off (`src/app.ts` registers `@fastify/cors` with
  `origin: <allowlist> | false` and no credentials flag). Cookie auth is
  therefore unavailable cross-origin and **bearer-token storage falls to the
  frontend** — an auth design constraint with direct test implications (token
  handling becomes frontend-owned behaviour that needs its own scenarios), and it
  is guarded by no regression test on either side. If someone later enables
  credentials or changes the allowlist, nothing fails.
- **`ALLOWED_ORIGINS` is absent from the backend's `.env.example`** (confirmed by
  reading the file — `src/config.ts` reads it, the example never mentions it), so
  a developer following the documented local setup silently gets `origin: false`.
  A frontend developer's very first local integration attempt fails with an
  opaque browser CORS error and no hint that a variable is missing. Small,
  concrete, and squarely a prerequisite for option B in §3.

Worth a line in `evidence.md`: adding the frontend's dev/CI/staging origins to
`domainConfig` and documenting `ALLOWED_ORIGINS` in `.env.example` are two
distinct backend changes, and the second is a five-minute fix that unblocks all
local frontend testing.

### 7. CI quality gates — inherit the shape, refuse two patterns

The backend's PR gate is genuinely strong and I endorse the draft's
"inherit wholesale" position. Verified directly in `ci.yml`, in order and all
blocking: `npm ci` → lint → `format:check` → **typecheck (distinct from build)**
→ build → migrate → `test:coverage` (floor enforced by the vitest config, not the
workflow) → `npm audit` → gitleaks → Semgrep → CDK synth → Checkov, on both
`pull_request` and `push` to `main`, with every third-party action SHA-pinned.
That is the template.

Two patterns the frontend must **not** inherit, one of which the draft misses:

- **TD-17, no type-aware linting** — the draft already names this. Endorsed.
- **Placeholder post-deploy verification.** `integration-test-staging` and
  `smoke-test-production` are `echo` no-ops, so **the backend today deploys to
  production with no automated post-deploy verification of any kind.** Whatever
  the human decides about staging (Q-F), the frontend's pipeline should define a
  real post-deploy smoke check as part of the gate rather than shipping the
  placeholder shape. This is the team's own stated anti-pattern — a gate that
  exists but never blocks — in its post-deploy form, and it is worth naming
  because the draft's Deployment section discusses the staging tier without
  mentioning that verification after deploy is currently absent.

Two additions I would put in `team-practices.md` under Testing Posture:

- The frontend's coverage floor is enforced in the test runner's own config (as
  the backend does), so the same gate fires locally and in CI and cannot be
  bypassed by editing the workflow.
- Both `test` and `test:coverage` scripts exist and the CI job runs the coverage
  variant — trivial, but the marketing site has **no** `lint`, `test`, or
  `typecheck` script at all, so "the scripts exist and CI runs them" is not a
  given in this workspace's frontend precedent.

### 8. Flake is new ground for this team, and unmanaged flake kills a blocking gate

Every test this team has ever run in this workspace is a fast, deterministic,
in-process Node test — 137 + 49 tests, 2.85s and 1.29s, no browser, no clock, no
network. Browser-driven E2E introduces real flake for the first time.

This matters for practices because the team's mandates make the CI gate blocking.
The predictable failure mode is: a flaky E2E blocks a merge, someone adds
automatic retries, and the gate quietly stops detecting the class of bug it was
built for — the same "installed but not enforced" pattern the team already named
as an anti-pattern, in its test form. Worth a stated position now, while it is
cheap:

> Automatic retry is not the default remedy for a flaky test. A test that flakes
> is quarantined out of the blocking gate with an owner and a date, or fixed —
> it is not silently retried into green.

I would raise this at the interview alongside Q-E/Q-K rather than assert it as a
mandate; it is a genuine judgment call and the human may prefer a limited retry
budget for browser tests specifically.

### 9. Accessibility as a testable gate; visual regression as a deliberate "not yet"

Two frontend-specific quality gates with no precedent anywhere in this workspace.
Neither is asked in the current ten questions.

- **Accessibility.** A guest-facing SaaS surface consumed on phones by
  non-technical users has a real a11y stake, and a11y is machine-checkable
  (automated rule checks inside component/scenario tests) at low cost and low
  flake. The marketing site has none. I would propose this as a **candidate**, not
  a mandate: automated a11y assertions on the primary Guest and Owner flows,
  blocking, from day one — accepting that automated checks catch perhaps a third
  of real issues and are not a substitute for manual review.
- **Visual regression.** I would advise **against** it as a day-one blocking
  gate. Screenshot diffing is the highest-flake, highest-maintenance gate
  available (font rendering, animation timing, platform differences), and a team
  with zero browser-test experience will burn its goodwill for the blocking-gate
  discipline on false positives. Revisit after the UI stabilises. Recording the
  reasoning now stops it being re-argued later.

**Proposed new interview question, please add:**

> **Q-M (Testing Posture — accessibility)**: Should automated accessibility
> checks run as a blocking gate on the Guest and Owner flows from day one? This
> is new ground — the existing marketing site has none — and automated checks
> catch roughly a third of real accessibility issues, so it is a floor, not a
> guarantee.

### 10. Two smaller notes for `evidence.md`

- **The backend's test-data strategy is a real asset the draft lists only as
  "deferred."** `tests/doubles/` (13 in-memory repositories over one shared
  `fakeDb.ts`) plus `tests/factories/` is a working, proven pattern, and its
  frontend translation is direct (one shared API-fixture module + per-entity
  factories). Deferring the *decision* to `functional-design` is right;
  recording that a proven pattern exists to translate is worth doing here so the
  later stage starts from it rather than from scratch. Note the documented
  caveat: the in-memory doubles were a deviation forced by no Docker/Postgres in
  the generation environment — the frontend should adopt the *pattern*
  deliberately, not inherit the constraint.
- **`Observed vs. Inferred` gap.** The table says the backend's stated CI chain
  was observed. It does not record the two testing-relevant facts I confirmed by
  reading the same file: that the coverage floor lives in `vitest.config.ts`
  rather than the workflow, and that the post-deploy verification jobs are `echo`
  placeholders. Both are **Observed** and both change what the frontend should
  copy.

## Positions

- AGREE: "inherit the backend CI chain wholesale" — I verified the chain in
  `ci.yml` line by line and it is the strongest asset in the workspace; the
  frontend should copy its order and its all-blocking discipline.
- AGREE: type-checking as a distinct blocking gate, and explicitly not inheriting
  TD-17's `parserOptions.project: false` — the draft names both correctly, and
  the `astro build`/`astro check` precedent makes the point concrete.
- AGREE: the 80% line floor carries over as a floor and the enforcing tool is
  stack-dependent — this matches `org.md`'s additive-floor rule and I am not
  proposing any weakening.
- AGREE: the BDD-first `custom` cadence should be re-asked rather than silently
  inherited — but see my §1 for what "yes" should concretely mean for UI, which
  the draft leaves undefined.
- AGREE: TD-19 (`POST /v1/stays`) and the CORS allowlist are surfaced now rather
  than mid-Bolt — right call, and Q-J is well framed.
- OBJECT: the draft has no question about **what the frontend's tests run
  against**, which determines whether any answer to Q-E is implementable — all
  three options have a hard prerequisite that does not exist today. Add Q-K (§3).
- OBJECT: TD-3 (no OpenAPI, no schemas, no generated client) is mentioned only in
  passing as a walking-skeleton concern, when in testing terms it means **no
  contract test is possible at any level** and drift between frontend and backend
  is undetectable by CI. Add Q-L (§4).
- OBJECT: `team-practices.md` says the 80% floor "carries over" without noting
  that line coverage means something materially weaker on component code — the
  backend's own measured 91.15% lines against 76.53% branches is the evidence —
  and without requiring the coverage `include`/`exclude` set to be declared
  deliberately. The floor should stand and be given teeth (§2).
- OBJECT: TD-12 and TD-9 are absent from the draft entirely; per-process refresh-
  token and rate-limit state behind a 2-to-6-task service makes any frontend test
  of silent re-auth or rate-limited paths non-deterministic against a real
  environment (§5).
- OBJECT: the draft treats CORS purely as a configuration blocker and misses that
  the behaviour the frontend's auth design depends on (`credentials` off, the
  allowlist) is guarded by three tests against `/health` with no preflight and no
  credentials assertion — plus `ALLOWED_ORIGINS` is undocumented in the backend's
  `.env.example`, which blocks local frontend integration testing outright (§6).
- OBJECT: the Deployment section discusses the staging tier without recording
  that `integration-test-staging` and `smoke-test-production` are `echo`
  placeholders, so the backend currently deploys to production with **no**
  post-deploy verification — a pattern the frontend pipeline must not copy (§7).
- OBJECT: nothing addresses test flake, which is new ground for a team whose
  entire test history is sub-3-second deterministic Node tests, and unmanaged
  flake is the most likely way the affirmed blocking CI gate gets quietly
  defanged (§8).
- OBJECT: no question covers accessibility as a testable gate, which is a
  frontend-specific quality dimension with zero precedent in this workspace and a
  real stake for a guest-facing mobile surface. Add Q-M (§9).
