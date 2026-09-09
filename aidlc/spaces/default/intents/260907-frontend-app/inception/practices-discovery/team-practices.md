# Team Practices — Frontend (Property Owner + Guest app)

> Final. Lead: `aidlc-pipeline-deploy-agent`. This is a re-run of practices
> discovery for the frontend intent (`260907-frontend-app`), integrating the
> completed human interview (`practices-discovery-questions.md`) with three
> independent reviews (`contributions/`). These five sections replace the
> matching sections of `memory/team.md` on promotion, so they describe the
> team's complete current practice — backend and frontend work together, not
> frontend alone. See `evidence.md` for the full carry-over analysis, every
> reviewer objection and its disposition, and everything still open.

## Way of Working

- **Branching model**: short-lived feature branches, merged via pull request
  after review. Confirmed for backend work on 2026-09-05 and now confirmed
  (Q3) to apply to frontend work as well — this is a team-wide habit, not a
  repo-specific one. The backend repo's own history demonstrates it in
  practice (16+ PR merges, no direct pushes to `main` observed).
- **Repository location (confirmed, Q1)**: the frontend (Property Owner +
  Guest app) lives in **its own new repository**, alongside the backend
  repository (`guestguideiq-app`) — not as a folder or workspace inside the
  existing marketing-site repo. This is a fresh decision for this intent, not
  inherited by analogy from the backend's Q2 answer, which was scoped
  explicitly to the backend.
  - **Consequence flagged by review, carried here rather than dropped**: a
    separate repository means a shared frontend/backend API-types package is
    not free — it would need to be published (npm registry) or consumed as a
    git dependency, not just imported across a workspace. There is no
    OpenAPI document, JSON Schema export, or generated client anywhere in the
    backend today, so the near-term reality is hand-written frontend types
    reviewed against `api-documentation.md`, kept in one boundary module (see
    Code Style). Whether the backend later publishes a machine-readable
    contract that a generated client can consume is an open decision — see
    `evidence.md`.
- **Worktree base/target branches**: org default applies unchanged in the new
  frontend repository too — base `main`, merge target `main`, squash-merge
  Bolt branches into `main`.
- **Commit granularity**: small, single-concern commits, enforced by PR
  review, matching the backend's practice. No frontend-specific precedent
  existed to depart from this.

## Walking Skeleton

- **Confirmed (Q2): Yes — prove the Owner path.** Build a thin end-to-end
  slice first — signup through to a published guide — as Bolt 1, solo and
  gated, approved by the user before remaining Bolts run. Record
  `skeleton: on` in the scope file governing this intent's Construction
  phase.
- **Why the Owner path and not the Guest path**: the Guest path (opening a
  stay link and viewing a guide) cannot be demonstrated end-to-end today —
  no endpoint anywhere creates a `Stay`, so the Guest app currently has no
  supply side. Q8 scopes a backend follow-up to close this gap before
  frontend Construction starts (see Deployment below); the Owner-path
  skeleton does not depend on that follow-up landing first.
- **Confirmed by Q3**: this practice, like the backend's, is scoped per
  intent — the frontend's walking-skeleton answer is its own decision, not
  inherited by analogy from the backend's Q3 answer, even though both
  landed on "yes" for materially similar reasons (proving an unbuilt
  system's integration points before building out logic).

## Testing Posture

- **Methodology**: custom
- **Ordering**: write the BDD scenario (given/when/then) first, implement the
  code to satisfy it, then add lower-level unit tests after implementation.
  This carries over unchanged from the backend (Q4 in the original backend
  interview) — the methodology choice was never backend-specific reasoning,
  and re-affirming it for frontend work required no new interview question
  this round beyond the Q3 carry-over confirmation.
- **Frontend specialisation of the Ordering clause (additive, does not
  weaken the affirmed cadence)**: "lower-level unit tests after
  implementation" applies to **logic units** — hooks, state reducers, the
  API client, validators, formatters — where a unit test adds coverage the
  scenario test does not already provide. For **presentational components**,
  the scenario test that exercises them is the primary coverage; a
  component-level unit test is written only when the component carries
  branching logic of its own, not by default. Writing a component test purely
  to hit a coverage number, when the scenario already exercised every branch,
  produces exactly the "meaningless assertions" pattern the team's testing
  standards guard against.
- **The frontend's substitution boundary is the network, not the
  component.** The backend's own scenario tests (`tests/bdd/signup.test.ts`)
  wire the real application end-to-end and substitute doubles only at the
  outermost port (the database), never inside the call graph. The frontend
  equivalent: scenario tests mount the real router/providers/state and
  substitute only at the network boundary (request interception), never by
  mocking child components. A scenario test that mocks a component's children
  inverts the pyramid and couples the test to markup rather than behaviour —
  this is the failure mode to avoid, named now so it is not rediscovered the
  hard way in `functional-design`.
- **What tests run against (confirmed, Q5): both.** Mocked/intercepted
  network for unit and component tests, plus a thin live-backend end-to-end
  suite as the drift detector. Every option has a real prerequisite that does
  not exist today — see Deployment/backend-follow-up below and `evidence.md`
  Q-J — so "thin" is deliberate: the live-backend suite is scoped narrowly,
  not the primary gate.
- **Contract drift is a real, currently-unaddressed risk, not yet a settled
  practice.** There is no OpenAPI document, no schema export, and no
  generated client for the backend API, so hand-written frontend fixtures for
  the mocked-network tests can drift from the real API with no test failing.
  The live-backend E2E suite (the "both" half of Q5's answer) is the
  team's chosen compensating control for this, consistent with the human's
  framing that contract tests matter here specifically to stop mocks
  drifting. Which mechanism formalises contract verification beyond that
  — a machine-readable contract added to the backend, or a recorded-response
  suite re-verified on a schedule — is not yet decided; see `evidence.md`.
- **Coverage floor**: the org default 80% line-coverage floor for `classic`
  scope carries over unchanged as the floor — this is additive per `org.md`
  and is not weakened here. Which coverage tool enforces it depends on the
  frontend framework, not yet chosen.
- **The floor needs a declared `include`/`exclude` set to have teeth, and
  that declaration is a required `domain-design` deliverable, not an
  afterthought.** The backend's own measured split — 91.15% lines against
  76.53% branches — shows line coverage overstates rigour even on plain
  service code; on component/template code the gap is wider still, because a
  single render assertion executes every line of a template. `domain-design`
  must state explicitly which paths count (and which are excluded —
  generated route files, design-system primitives, story files, mock-service
  definitions) rather than inheriting whatever a framework scaffold ships.
  Enforce the floor in the test runner's own config (as the backend does in
  `vitest.config.ts`), not only in the CI workflow, so the same gate fires
  locally and cannot be bypassed by editing the workflow.
- **CI gate**: a green CI check — build, lint, type-check, test, coverage —
  is required before any pull request touching the frontend can merge,
  matching the backend's practice and now stated to apply team-wide per Q3.
- **Type-checking as a blocking gate**: whichever frontend language is
  chosen, the CI gate must include a distinct type-check step separate from
  build, continuing the explicit fix for the `astro build`-vs-`astro check`
  gap the marketing site never closed.
- **Post-deploy verification must be real, not a placeholder.** The
  backend's `integration-test-staging` and `smoke-test-production` CI jobs
  are `echo` no-ops today — the backend currently reaches production with no
  automated post-deploy check of any kind, which is a live instance of the
  team's own "installed but not enforced" anti-pattern (Q7/Q8's enforcement
  discipline, applied to deployment verification rather than scanning). The
  frontend's pipeline must define and run a genuine post-deploy check (at
  minimum, that the deployed build serves and its core routes respond) as
  part of its gate — not copy the placeholder shape.
- **Test pyramid, component/E2E tooling choice, and test-data/fixture
  strategy**: not decided — correctly deferred to `domain-design`/
  `functional-design` once the frontend framework is chosen. The backend's
  test-doubles pattern (one shared fixture module, per-entity factories,
  every test builds a fresh, independent harness) is a proven asset worth
  translating deliberately rather than reinventing; it should not be
  inherited as a constraint (it was itself a deviation forced by no
  Docker/Postgres in the backend's original generation environment).
- **Accessibility, flake policy, and NFR/perf testing**: raised by review as
  genuinely new ground with no workspace precedent, but not yet asked of the
  human this round. Recorded as open candidates for the next testing-related
  gate (`domain-design`/`nfr-requirements`) rather than affirmed here — see
  `evidence.md`.

## Deployment

- **Staging + manual production approval (confirmed, Q6): yes, same as the
  backend.** Every frontend deploy (Owner and Guest surfaces together, not
  split) goes to a staging environment first; production requires manual
  approval. This applies uniformly rather than only to the Owner app, which
  simplifies the pipeline relative to a two-tier approval split.
- **The backend's staging tier is not currently real, and the frontend must
  not copy that.** `deploy-staging` and `integration-test-staging` in the
  backend's CI are `echo` placeholders; `deploy-production` runs without
  going through them. The Q6 answer is about what the team wants for the
  frontend, not a copy of what the backend currently does — the frontend's
  staging tier and its manual approval gate must both be genuinely wired
  from day one.
- **Backend follow-up before frontend Construction starts (confirmed, Q8).**
  Two backend gaps block frontend Construction and are scoped as a backend
  follow-up to land first, ahead of the frontend's own work:
  1. `POST /v1/stays` — no endpoint anywhere creates a `Stay` today, so the
     Guest app has no supply side to build or test against.
  2. The CORS/origin fix — production CORS currently allows only
     `https://guestguideiq.com`; no frontend origin, not even localhost, can
     call the API; `ALLOWED_ORIGINS` is also missing from the backend's
     `.env.example`, so a developer following the documented setup silently
     gets no allowed origins at all.
  - **Interaction with the token-storage/proxy question (Q7, below):** fixing
    the allowed origins is part of this follow-up and is independent of
    which auth-transport direction the team eventually takes. Adding the
    frontend's dev/CI/staging origins to the allowlist commits the team to
    neither a same-origin-proxy nor a cross-origin-bearer-token direction —
    it only unblocks local and CI integration testing.
- **Token storage and same-origin proxy — deferred to design (confirmed,
  Q7).** Where the Owner app's access and refresh tokens live (in-memory,
  browser storage, or behind a same-origin reverse proxy using `HttpOnly`
  cookies) is not decided now. It is deferred to `nfr-design`/
  `infrastructure-design`, where the hosting target is chosen.
  - **Constraint carried forward from the deferral, not lost with it**: the
    hosting choice made at that stage must not foreclose the same-origin-proxy
    option. A hosting target that cannot sit behind (or act as) a same-origin
    proxy — for example one that can only ever serve static assets with no
    server-side routing capability — would silently decide Q7 for the team.
    `infrastructure-design` must treat "keeps the proxy option open" as a
    hosting requirement, not a nice-to-have, given the alternative is a
    7-day, non-revocable bearer token held in browser-reachable storage with
    no logout/revocation endpoint on the backend today.
  - **A related, not-yet-decided input for the same stage**: whether the
    hosting target can set arbitrary response headers (for a Content-Security
    Policy and similar security headers) is a second, related constraint on
    the same decision — flagged here so it reaches `infrastructure-design`
    alongside the proxy constraint rather than being discovered after a
    static-only host is already chosen. See `evidence.md` for the full
    reasoning.
- **Hosting target**: not decided, dependent on the frontend framework
  choice and the constraints above. Static hosting (GitHub Pages, the
  marketing site's current precedent) only works if neither the proxy
  constraint nor the security-headers constraint above end up mattering;
  server-capable hosting (CDN + functions, or a container alongside the
  backend's ECS/Fargate setup) is the fallback if either does.
- **Secrets handling**: no secret, API key, or credential lives in checked-in
  code or config, for the frontend exactly as for the backend. Refinement
  carried from the backend's evidence and made explicit here: **every value
  reachable from frontend client code is public the moment a user loads the
  page**, regardless of whether it was ever committed to source control — a
  framework's public-prefix build-time injection (`PUBLIC_*`, `VITE_*`,
  `NEXT_PUBLIC_*`) publishes a value into a shipped JS chunk, and a
  source-tree secret scan does not see that. The marketing site's
  `PUBLIC_API_BASE_URL` pattern is the correct model for a genuinely public
  value; nothing that authenticates or authorizes may use the same mechanism.
- **Artifact versioning/rollback**: not yet decided, same open status as the
  backend intent recorded for itself — deferred to the upcoming
  `ci-pipeline`/`deployment-pipeline` stages once the frontend's hosting
  target is chosen.
- **Security scanning — applies team-wide (confirmed, Q3)**: dependency-
  vulnerability scanning and secret scanning, both blocking, extend to the
  frontend from day one, matching the backend. Two frontend-specific
  refinements, carried from evidence rather than newly interviewed, so they
  are recorded as informed practice rather than affirmed mandates (see
  `evidence.md` for the open decisions this leaves):
  - secret scanning must also run against the **built output**, not only the
    source tree, since a build-time-injected secret is invisible to a
    source-tree scan;
  - a frontend dependency tree is an order of magnitude larger than the
    backend's twelve direct dependencies, so the dependency-scan gate needs a
    triage/suppression policy (owner, reason, expiry per suppressed finding)
    decided at the same time it is wired, not after the first flood of
    build-tooling advisories forces it to advisory status.
- **Supply-chain controls carry over unchanged**: SHA-pinned third-party CI
  actions, per-job least-privilege `permissions`, and OIDC deploy credentials
  (no long-lived AWS keys) are observed, deliberately-documented backend
  practice and apply to the frontend's CI/CD from day one — if anything, OIDC
  matters more for a frontend deploying to S3+CloudFront, where a long-lived
  key sitting in repo secrets is a bigger blast radius than on the backend.

## Code Style

- **Tech stack is not chosen; most of this section is provisional pending
  `domain-design`/`infrastructure-design`.** What follows is either
  stack-agnostic (and therefore decidable now) or explicitly marked
  provisional.
- **File naming (confirmed, Q4): a file is named after what it exports.**
  PascalCase when the primary export is a component or class; camelCase
  otherwise. This resolves a real contradiction in the previously-affirmed
  rule: a flat "`camelCase.ts` file naming, `PascalCase` for
  component/class-like constructs" reading breaks on the very first
  component file (`UserCard.tsx` violates the flat camelCase reading; the
  component convention every mainstream framework and generator uses). The
  backend's own file naming is consistent with the "named after what it
  exports" formulation — it has simply never had a component file to
  reveal the ambiguity. The directory-carries-the-domain,
  file-carries-the-layer pattern from the backend also carries forward,
  framework-independent.
- **Formatter and linter**: set up a linter and formatter for the frontend
  and enforce both as a **blocking** PR check from day one, matching the
  backend's practice and confirmed team-wide per Q3 — explicitly breaking
  from the existing Astro marketing site, which has zero linter/formatter
  configuration.
- **Type-aware linting**: unlike the backend (`parserOptions.project: false`,
  a named gap), the frontend's linter is configured for type-aware rules
  from the start. This is not only a code-quality preference: type-aware
  linting is what lets a rule reason about where a value came from, which is
  the mechanism the untrusted-render rule below depends on.
- **API boundary — one module owns the backend, nothing else touches it
  directly.** Exactly one API-client module makes every request to the
  backend; no component, page, route, or view calls `fetch` (or the
  framework's equivalent) directly, and imports flow downward only (UI → view
  state → API client → transport). This is the stack-agnostic generalisation
  of the backend's ports-and-adapters lesson — "one narrow port per external
  dependency, a single composition root, imports only flow downward" — with
  the backend-specific filenames (`routes.ts`/`service.ts`/`repository.ts`)
  dropped, since those do not transfer. The reason this is worth stating now,
  before the stack is chosen: the backend's own architecture notes flag a
  same-origin reverse proxy as the leading fix for its tenancy constraint,
  which would also flip the frontend's auth transport from cross-origin
  bearer tokens to same-origin cookies. If a single API-client module owns
  transport and token handling, that flip is a change in one module. If
  components call `fetch` and read tokens themselves, it is a rewrite.
  Confining the boundary now is what keeps the hosting/auth-transport
  decision safely deferred — deferring the boundary itself is what would
  foreclose it.
  - **Token handling lives inside that same module**: no component, route
    guard, or page reads the token store directly; they consume a resolved
    session object.
  - **Concurrent-401 handling**: the backend's refresh-token store is
    per-process while production runs 2–6 tasks, so single-use rotation is
    not reliably enforced across instances. The frontend's API client
    collapses concurrent 401s into one in-flight refresh, with all other
    waiters retrying against its result, rather than letting several
    parallel requests each trigger their own refresh and race.
- **Error-envelope handling — one module, keyed on `error.code`.** The
  backend's error responses share one wire shape (`{ code, message,
  details? }`, catalogued as eleven stable codes in `api-documentation.md`).
  Exactly one module in the API-client layer parses that envelope into a
  discriminated union keyed on `error.code`; nothing above that module reads
  a raw HTTP status or an unparsed response body. That module also defines a
  fallback for a response that is not envelope-shaped at all (a raw 500 on a
  missing body, or a 502/504 from infrastructure with no envelope), and
  treats an unrecognised future code as a defined default rather than a
  crash. This is a deliberate departure from the workspace's only existing
  frontend-calling-backend code (`BaseLayout.astro`'s lead-capture form
  handler), which collapses every failure to one generic message — a
  reasonable, explicitly-scoped choice for a marketing lead form, and the
  wrong default to carry into an app where `410 LINK_INVALID` is the Guest
  app's central navigational state and `402 PAYMENT_FAILED` needs to route
  to billing recovery rather than a toast.
- **Untrusted server content never reaches a raw-HTML sink.** Two server-
  supplied values are attacker-influenceable and will be rendered by this
  frontend: LLM chat replies (the guest's own message round-trips through a
  model) and `locality.visualStyling` (an unschematised `Record<string,
  unknown> | null` the guest UI themes from, per `api-documentation.md`).
  Both are handled the same way as the API and error-envelope boundaries
  above — one module owns them:
  - a blocking lint rule bans raw-HTML injection APIs (`dangerouslySetInnerHTML`
    or the chosen framework's equivalent), with a documented per-use exception
    requiring a named sanitizer;
  - `visualStyling` is parsed into typed design tokens with defaults by one
    module before any component reads it; no component reads the raw blob or
    spreads it into a style object.
- **Server-supplied user-facing copy**: where the backend returns a canned
  message alongside empty-state data (e.g. `emptyMessage` on empty locality
  content), the server-supplied string renders as-is; components do not
  carry a competing hardcoded empty string for the same case.
- **`PATCH /v1/subscriptions`'s `action` value is a typed union at the
  API-client boundary, never a bare string** — the endpoint's final `else`
  branch cancels the subscription on anything unrecognised, so a typo or a
  speculative retry of an ambiguous failure is a silent, billing-affecting
  action if the client sends an unvalidated value.
- **Naming for multi-word directories**: pick kebab-case (or the chosen
  language's idiomatic default) and apply it consistently. The backend's own
  two unseparated compound names (`guestaccess`, `chatmodule`) are a
  self-flagged wart, not a pattern to inherit at greater volume.
- **Traceability comments**: non-obvious decisions cite the artifact that
  motivated them (a business rule ID, an NFR, an acceptance criterion), as
  the backend does throughout. Costs nothing, carries forward unchanged.
- **Marker hygiene**: `TODO`/`FIXME`/`HACK`/type-suppression comments are
  used only with an explicit rationale, per the org construction guardrail —
  matching the backend's discipline (zero unmarked markers across its
  source) rather than the marketing site's three unmarked `TODO`s.
- **Layer boundaries, state management, and file organization beyond the API
  boundary above**: genuinely new ground, dependent on the framework choice,
  and correctly deferred to `domain-design`/`functional-design`.
