# Evidence — Practices Discovery (Frontend)

> Final. Lead: `aidlc-pipeline-deploy-agent`. Records what each participant
> inspected or inferred, the interview decisions and their rationale, this
> integration's disposition of every reviewer objection, and everything that
> remains open. Sourced from the lead's own draft evidence, the three
> contribution files, and the completed interview.

## Sources Inspected

**Lead draft (Step 2)** — reverse-engineering CodeKB for `guestguideiq-app`
(current as of `main` @ `76d190d`): `technology-stack.md`, `architecture.md`,
`code-quality-assessment.md` (91.15% line coverage, 19-item TD register),
`dependencies.md`, `code-structure.md`, `business-overview.md`. Live,
read-only inspection: `guestguideiq-app` git log/branches, `ci.yml` in full,
the outer marketing-site repo's absence of linter/formatter config,
`deploy.yml` in full, `astro.config.mjs`.

**aidlc-quality-agent** — read live, not only the CodeKB summary:
`vitest.config.ts` (both packages), the full `tests/`/`admin-api/tests/`
trees, `tests/bdd/signup.test.ts`, `tests/helpers/buildTestApp.ts`,
`tests/integration/contract1.test.ts`, `tests/unit/cors.test.ts`,
`.env.example`, `src/app.ts` + `src/config.ts` CORS wiring, `ci.yml` in full.

**aidlc-developer-agent** — read live: `src/lib/errors.ts`,
`src/app.ts:registerErrorHandler`, `api-documentation.md`'s error-code
catalogue, `C:/Projects/guestguideIQ/src/layouts/BaseLayout.astro` lines
105–129 (the workspace's only frontend-calling-backend code), `src/auth/
middleware.ts`, `code-structure.md`, all four `package-lock.json` files
confirming no npm workspace/hoisting.

**aidlc-devsecops-agent** — read live: `src/site.config.ts:25`,
`deploy.yml:40`, `guestguideiq-app/package.json` (12 direct dependencies),
directory listing of `.github/` confirming no `dependabot.yml`/
`renovate.json`, `ci.yml`'s action-pinning header comment and per-job
`permissions:` blocks, `api-documentation.md`'s auth/token-lifetime and CORS
sections, `locality/repository.ts` and its Prisma `Json?` field.

## Observed vs. Inferred (carried from the lead draft, unchanged by review)

| Claim | Status |
|---|---|
| Backend repo uses PR-based branching in practice, not just in policy | **Observed** |
| Backend CI chain matches `code-quality-assessment.md` | **Observed** (read `ci.yml` directly) |
| Marketing site has zero linter/formatter and zero test/lint/typecheck CI step | **Observed** |
| Marketing site deploys straight to production on merge, single environment | **Observed** |
| Frontend tech stack is undecided | **Stated directly**, not inferred |
| No endpoint creates a `Stay` (TD-19) | **Observed**, re-confirmed by `business-overview.md` |
| Production CORS allowlist excludes every possible frontend origin | **Observed** |
| Backend coverage floor lives in `vitest.config.ts`, not the workflow | **Observed** (quality review, §7) |
| `integration-test-staging`/`smoke-test-production` are `echo` placeholders | **Observed** (quality review §7 and devsecops review §10, independently) |
| No `dependabot.yml`/`renovate.json` in `guestguideiq-app/.github/` | **Observed** (devsecops review §2c, directory listing) |
| `ALLOWED_ORIGINS` absent from `.env.example` | **Observed** (quality review §6, confirmed by reading the file) |
| `locality.visualStyling` has no schema anywhere in the codebase | **Observed** (developer review §6, `api-documentation.md` line 242) |
| Refresh-token store is per-process while production runs 2–6 tasks | **Observed** (`architecture.md` T5 / TD-12) |

## Interview Decisions and Rationale

- **Q1 (repo location) → own new repository, alongside the backend.** No
  default was assumed from the backend's Q2 answer, which `project.md`
  scopes explicitly to `guestguideiq-app`. The human's answer settles this
  fresh rather than by analogy.
- **Q2 (walking skeleton) → yes, prove the Owner path.** The Guest path
  cannot be proven end-to-end today (TD-19 — no `POST /v1/stays`), so Owner
  is the only path currently demonstrable; Q8 schedules the backend fix that
  would eventually unblock a Guest-path skeleton.
- **Q3 (which backend-affirmed practices carry over) → all five, unchanged.**
  The human selected all five options offered (branching/PR review, blocking
  linter+formatter, dependency scanning, secret scanning, green CI gate),
  resolving the "extension likely, still needs asking" flags in the lead
  draft as confirmed rather than merely likely.
- **Q4 (naming) → PascalCase for components, camelCase otherwise.** This
  directly answers the developer review's contradiction finding (§5 of that
  review): the affirmed backend rule, read literally, is violated by the
  first component file. The human's answer is the "named after what it
  exports" formulation the developer review proposed independently.
- **Q5 (test target) → both mocked network and a thin live-backend E2E
  suite.** Resolves the quality review's Q-K proposal (§3) in substance,
  though not verbatim: rather than choosing option (a), (b), or (c), the
  human chose the combination the quality review itself recommended as best
  practice ("A as the default gate on every PR, plus a narrow B or C suite
  as the drift detector").
- **Q6 (deployment) → yes, same as the backend, applied uniformly.** The
  option to split by surface (Owner gated, Guest ungated) was offered and
  not chosen — the human opted for uniform treatment rather than a two-tier
  split.
- **Q7 (token storage / proxy) → defer to design.** Explicitly deferred
  rather than decided now, with the constraint (stated in the dispatch
  brief and carried into `team-practices.md`) that the hosting choice made
  at `nfr-design`/`infrastructure-design` must not foreclose the
  same-origin-proxy option.
- **Q8 (backend prerequisites) → scope a backend follow-up first.** Both
  `POST /v1/stays` and the CORS/`ALLOWED_ORIGINS` fix are scoped to land
  before frontend Construction starts, rather than being carried into
  requirements-analysis as prerequisites or handled ad hoc mid-Bolt.

## Disposition of Reviewer Objections

Each objection below is disposed as **accepted** (folded into
`team-practices.md` or `discovered-rules.md`), **accepted as evidence/open
item** (recorded here for a later stage, not promoted to a mandate because
the human did not state it as one), or **dissent maintained** (the
integrator disagrees and says why, per the stage's instruction that
maintained dissent must remain visible on disk).

### aidlc-quality-agent

1. **Contract tests / mock-drift boundary.** *Accepted.* The
   substitution-boundary framing ("the network, not the component") is now
   in `team-practices.md`'s Testing Posture section verbatim in substance.
   The specific mechanism for contract verification (schema-derived types
   vs. hand-written-plus-verification-suite vs. accepted duplication) was
   proposed as Q-L but not asked this round — recorded below as **open**,
   for `domain-design`/`functional-design` alongside the API-types-source
   decision the developer review raised.
2. **Coverage `include`/`exclude` set.** *Accepted, made a practice-level
   requirement, not left as an evidence note only.* `team-practices.md` now
   states explicitly that the `include`/`exclude` set is a required
   `domain-design` deliverable, and explains why (line coverage's 91.15%
   vs. 76.53% branch gap on the backend, widening further on template code).
   This does not weaken the affirmed 80% floor — it makes the floor
   meaningful.
3. **a11y gate (proposed Q-M).** *Accepted as open item, not promoted.* Not
   put to the human this round. No workspace precedent exists to infer a
   default from either. Recorded below as a candidate for
   `domain-design`/`nfr-requirements`.
4. **Flake policy for browser-driven E2E.** *Accepted as open item, not
   promoted.* The quality review's own framing — that automatic retry
   silently defeats the blocking-gate discipline the team has already
   committed to — is sound reasoning, but stating "no automatic retry" as a
   binding rule without asking the human would exceed this stage's mandate
   (team intent remains a human judgment). Recorded below for
   `ci-pipeline`.
5. **`integration-test-staging`/`smoke-test-production` are `echo`
   placeholders.** *Accepted, folded directly into `team-practices.md`'s
   Deployment section* as an explicit "do not copy this pattern" note. This
   did not require a new interview question: it is a direct operational
   consequence of the enforcement-discipline principle already affirmed
   (Q7/Q8 of the backend interview, reconfirmed via Q3 here), applied to
   post-deploy verification rather than scanning.

### aidlc-developer-agent

1. **Error-envelope consumption convention.** *Accepted, folded into
   `team-practices.md`'s Code Style section.* Not asked as a discrete
   interview question this round (proposed as Q-K by the developer review),
   but the dispatch brief for this integration explicitly instructed that
   this convention is "decidable now" given the envelope is fully specified
   and frozen in evidence, and the workspace's only live precedent
   (`BaseLayout.astro`) actively discards it. Recorded as team practice
   guidance rather than a `discovered-rules.md` mandate, since
   `discovered-rules.md` is reserved for hard constraints the human actually
   stated — this is evidence-derived convention, not a human-stated
   constraint, and the distinction is preserved on disk.
2. **Ports-and-adapters lesson — API boundary, downward imports, single
   composition root.** *Accepted, folded into `team-practices.md`'s Code
   Style section*, same reasoning as above (stack-agnostic, decidable now,
   explicitly instructed for disposition in this integration's brief). The
   backend-specific filenames and the Prisma adapter shape were **not**
   carried, matching the developer review's own distinction between what
   transfers and what does not.
3. **Correlation ids must ride in the envelope body, not a response
   header.** *Accepted as evidence/open item, not a team-practices
   convention* — it is a **backend** change (CORS sets no `exposedHeaders`,
   so a response header would be invisible cross-origin regardless of what
   the frontend does), not a frontend practice. Recorded below alongside the
   Q8 backend-follow-up items as a named frontend-driven backend dependency,
   distinct from the two items Q8 already scoped, since it was not part of
   the human's Q8 answer.
4. **`locality.visualStyling` theming contract absent from all three
   drafts.** *Accepted, folded into `team-practices.md`'s Code Style
   section* (one module parses it into typed tokens with defaults; no
   component reads the raw blob) alongside the untrusted-render lint rule,
   since devsecops raised the same value from a different angle (CSS
   injection / forced `style-src 'unsafe-inline'`). Both reviewers converge
   on the same convention from different remits; recorded once.
5. **Naming contradiction (`camelCase.ts` vs. `PascalCase` components).**
   *Accepted — this is what Q4 asked and resolved.* See Interview Decisions
   above.
6. **API-types sourcing tied to Q-A/Q1.** *Accepted as open item, not
   promoted.* The developer review is correct that repository location
   determines whether a shared types package is cheap (workspace) or
   expensive (separate repo, needs publishing/git dependency) — this is now
   stated explicitly in `team-practices.md` under Way of Working as a
   consequence of the Q1 answer. The specific sourcing mechanism (hand-
   written, OpenAPI-generated, or shared package) was proposed as Q-M but not
   asked this round — recorded below as open, tied to the same contract-drift
   item quality raised.
7. **`PATCH /v1/subscriptions` silent-cancel convention.** *Accepted,
   folded into `team-practices.md`'s Code Style section* verbatim in
   substance — evidence-derived, stack-agnostic, no interview question
   needed to state it as a client-side coding convention.
8. **Traceability comments, marker hygiene, TypeScript strictness floor,
   type-aware linting.** *Traceability comments and marker hygiene:
   accepted, folded into Code Style.* **TypeScript strictness floor**:
   *accepted as open item, not promoted* — it is conditional on TypeScript
   being the chosen language, which is not yet decided, so stating a
   specific `tsconfig` floor now would be premature; recorded below for
   `domain-design`. **Type-aware linting**: *accepted, folded into Code
   Style* (already a natural pairing with the raw-HTML-sink lint rule
   devsecops proposed, since taint-shaped rules require it).
9. **Interview budget skew.** *Acknowledged, partially addressed by the
   human's actual answers.* The developer review's complaint — that Q-B/
   Q-H/Q-I spent three of ten slots on near-certain re-asks while genuinely
   open conventions in its remit got none — is fair as written against the
   ten-question draft. In the event, the human's Q3 answer collapsed those
   three (plus two more) into a single bundled confirmation, which freed
   attention rather than spending it; but this integration turn is the
   first opportunity for the conventions in this review's §1–§7 to reach
   any artifact at all, and several are folded in above. The remainder
   (contract-test mechanism, API-types sourcing, a11y, flake policy) are
   recorded as open items below for the next stage that can put them to the
   human with proper context, rather than asserted unilaterally here.

### aidlc-devsecops-agent

1. **"NEVER commit secrets" needs a build-output scan, not only source-
   tree.** *Accepted, folded into `team-practices.md`'s Deployment section*
   — added as practice guidance ("every value reachable from frontend
   client code is public..."), not as a new `discovered-rules.md` mandate,
   since the human was not asked this specific refinement. The existing
   `NEVER commit secrets` rule's text and its Q3 scope-widening stand as
   stated; this is an operational refinement of *how the team achieves* that
   rule on a frontend, recorded as guidance.
2. **`npm audit --audit-level=high` needs a triage/suppression policy and a
   devDependency caveat.** *Accepted as practice guidance in
   `team-practices.md`* (the triage-policy need is now stated), *the specific
   policy mechanics accepted as open item, not promoted* — who may add a
   suppression, expiry enforcement, and whether an automated updater
   (Dependabot/Renovate with a cooldown) is in scope from day one were
   proposed as Q-O/Q-P but not asked this round. Recorded below for
   `ci-pipeline`, alongside the observed `dependabot.yml`/`renovate.json`
   gap.
3. **Supply-chain controls (SHA-pinned actions, per-job `permissions`,
   OIDC) missing from the draft.** *Accepted, folded into `team-practices.md`'s
   Deployment section* verbatim as carrying over unchanged — this was a
   gap in the pre-interview draft the review correctly caught; no new human
   question was needed since these already have backend precedent this
   team demonstrably follows.
4. **SBOM should be a frontend mandate even though it was not one for the
   backend.** *Dissent maintained, not promoted to `discovered-rules.md`.*
   The reasoning (a shipped-to-every-user dependency tree needs a
   per-release SBOM to answer "which builds were compromised") is sound and
   is recorded here in full so it is not lost. It is not promoted to a
   mandate because the human was not asked and `discovered-rules.md` is
   reserved for human-stated hard constraints. This is a genuine,
   deliberate divergence from the reviewer's recommendation, not an
   oversight: recorded below as a strong candidate for the
   devsecops-owned `ci-pipeline` stage to put to the human directly, with
   the reviewer's rationale attached rather than paraphrased away.
5. **CSP is a hosting requirement and must be an input to the hosting
   decision, asked before Q-G/Q7.** *Accepted in substance, though the
   sequencing could not be retrofitted onto an interview that already
   happened.* Q7 was answered as "defer to design," and the security-header
   capability constraint is now recorded in `team-practices.md`'s Deployment
   section directly alongside the same-origin-proxy constraint, so
   `infrastructure-design` receives both constraints together rather than
   discovering the CSP one after a static-only host is already chosen. The
   reviewer's stronger position — that this should have been asked as its
   own pre-Q7 question in this round — is noted as dissent from the
   question *ordering* the interview used, not from the substance, which is
   now preserved.
6. **Stay-token-as-credential-in-URL findings (referrer leakage, telemetry
   exfiltration, access-log retention, third-party script policy).**
   *Accepted as evidence/open item, not promoted to a `discovered-rules.md`
   mandate.* This is a genuinely new, well-evidenced risk class with no
   workspace precedent and no interview question asked this round. Recorded
   in full below so `nfr-design`/`infrastructure-design` and the eventual
   devsecops-owned CI stage inherit the finding rather than rediscovering
   it. The reviewer's proposed `NEVER` rule text is preserved verbatim
   below for that stage to put to the human directly.
7. **Raw-HTML-sink lint ban.** *Accepted, folded into `team-practices.md`'s
   Code Style section*, converging with the developer review's
   `visualStyling` finding (see developer §4 disposition above).
8. **DAST replaced with a testable security-header assertion.** *Accepted
   as a well-reasoned recommendation, recorded as open item, not promoted.*
   The reviewer's own argument — a deterministic header assertion delivers
   DAST's actual yield here faster and without a flaky scanner in the merge
   path — is sound and satisfies the Inception guardrail that every
   requirement need a clear pass/fail criterion, better than an open-ended
   "forward-looking" DAST TODO would. Not promoted to `discovered-rules.md`
   because it was not asked. Recorded below for `ci-pipeline`.
9. **SAST ruleset framework additions, Semgrep pin.** *Accepted as evidence
   note* — mechanical follow-through once the framework is chosen, recorded
   below, no interview question needed.
10. **Cross-lane flag: backend's staging bypass (TD-13) not mentioned in
    the draft's Deployment section.** *Accepted, folded into
    `team-practices.md`'s Deployment section* — same disposition as the
    matching quality-agent objection (§5 above); both reviewers raised it
    independently and it is recorded once.
11. **Token storage should have been asked as Q-K, before Q-G.** *Overtaken
    by the actual Q7 answer* — the human was asked (Q7) and explicitly chose
    to defer rather than decide now, with the proxy-option constraint
    preserved. The reviewer's underlying concern (a 7-day, non-revocable
    token with no logout endpoint is a real, currently-live exposure) is
    recorded below as the rationale for why the deferral carries a
    constraint rather than being an unconditional punt.

## Open Items (not promoted to `discovered-rules.md`; carried forward for a later stage)

Recorded so none of the above is lost between this stage and the one that
can properly resolve it:

- **Contract-verification mechanism** (quality review §4, developer review
  §4): whether the backend adds Fastify JSON schemas / an OpenAPI document
  with a generated frontend client, the frontend hand-writes types plus a
  recorded-response contract suite, or the team accepts hand-written types
  with no automated drift detection. Tied to the Q1 repo-location answer
  (a shared types package is cheap only inside a workspace, which Q1 ruled
  out). → `domain-design`/`functional-design`.
- **Accessibility as a blocking gate** on the Guest and Owner flows.
  → `domain-design`/`nfr-requirements`.
- **Flake policy for browser-driven E2E** (no automatic retry as the
  default remedy; quarantine-with-owner-and-date instead). → `ci-pipeline`.
- **Dependency-scan triage/suppression policy** — who may add a
  suppression, whether entries require an expiry, and whether an automated
  updater (Dependabot/Renovate) with a minimum-release-age cooldown is in
  scope from day one. Backend has neither `dependabot.yml` nor
  `renovate.json` today (observed gap). → `ci-pipeline` (devsecops-owned).
- **SBOM as a per-release mandate** (devsecops dissent, recorded above in
  full) — whether the frontend generates a CycloneDX SBOM per release build,
  given its dependency tree ships to every user unlike the backend's.
  → `ci-pipeline` (devsecops-owned), to be put to the human directly.
- **Real DAST-equivalent**: an automated security-header assertion against
  the deployed staging URL (CSP present, no `unsafe-inline` in `script-src`,
  HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors`) as
  the frontend's practical substitute for DAST, with real DAST revisited if
  the frontend grows server-side surface (SSR routes, an API proxy).
  → `ci-pipeline`.
- **Guest-link credential handling**: `Referrer-Policy: no-referrer` on the
  guest surface, mandatory URL-scrubbing verification before any analytics/
  error-reporting/session-replay tool is enabled, and treating host access
  logs containing guest URLs as credential-bearing for retention/access
  purposes. Proposed `NEVER` text preserved for the next stage to put to the
  human: *"NEVER send a guest URL, or any value derived from
  `window.location`, to a third-party analytics, error-reporting, or
  session-replay service without URL scrubbing verified to strip the stay
  token."* → `nfr-design`/`infrastructure-design`.
- **Third-party script policy**: no third-party script added to either
  surface without a named owner and a written reason, given read access to
  bearer tokens (Owner) and stay tokens (Guest). → `nfr-design`.
- **Stripe.js CSP exception**: `js.stripe.com` must be an allowed CSP
  script-src origin and cannot be self-hosted or SRI-pinned (Stripe rotates
  it) — a named, justified exception once CSP is designed, not a gap.
  → `infrastructure-design`.
- **TypeScript strictness floor** (`strict`, `noImplicitAny`, etc.,
  matching the backend's set; explicit decision on
  `exactOptionalPropertyTypes`), conditional on TypeScript being chosen.
  → `domain-design`.
- **Correlation ids in the error envelope body** — a backend change
  (`toErrorEnvelope` currently emits only `{ code, message, details? }`,
  and CORS sets no `exposedHeaders` so a response header would be invisible
  cross-origin). Named alongside, but distinct from, the two Q8 backend-
  follow-up items — not scoped by the human's Q8 answer, so tracked
  separately. → next backend-facing follow-up scoping.
- **Copy ownership / i18n**: server-supplied `emptyMessage` strings are
  currently unlocalised; worth flagging for `functional-design` if i18n is
  ever wanted, since server-owned copy is the first thing that breaks.

## Deferred Items Carried Forward From the Backend Intent (for completeness)

Unchanged from the pre-interview draft: test data/fixture strategy detail
beyond the pattern named in `team-practices.md`, NFR/perf testing
(`nfr-requirements`/`nfr-design`), remaining layer-boundary/file-organization
questions beyond the API boundary now stated (`domain-design`/
`functional-design`), artifact versioning/rollback scheme
(`ci-pipeline`/`deployment-pipeline`).
