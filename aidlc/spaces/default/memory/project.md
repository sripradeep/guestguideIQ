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

- Do not invent a deployment window or freeze period before team size or deploy frequency actually justifies one — a small team monitoring ad-hoc deploys is a reasonable state to stay in, not a gap to close prematurely. (learned 2026-09-07) <!-- cid:260905-backend-services-spec:deployment-execution:0e38ef5db16f6916350359aba74ec866f5f324f1ff00bf7766cd5ca32f0be153 -->
## Code Style

<!-- Project-specific specialisation. -->

- A file is named after what it exports — PascalCase when the primary export is a component or class, camelCase otherwise. This resolves a contradiction in the earlier affirmed rule (flat `camelCase.ts` plus `PascalCase` for component-like constructs), which the first component file would have violated (learned 2026-09-07) <!-- cid:260907-frontend-app:practices-discovery:883407f2e3425e42fd44e369fcdfcf30a5b990443834aa2566ce1b90cbf912ce -->
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

The following four rules were stamped `NEVER` in `project.md` on 2026-09-05, each scoped to backend deployment, backend pull requests, or the backend repository specifically. Per Q3 (the CI/scanning/linting rules) and Q6 (staging + manual approval, applied uniformly rather than split by surface), they now apply to frontend work as well — again, not restated here in full: (affirmed 2026-09-07)
- never deploy without first passing through staging and receiving manual approval; (affirmed 2026-09-07)
- never merge a pull request unless build, lint, test, and coverage checks are all green; (affirmed 2026-09-07)
- never commit secrets to the repository or any checked-in configuration file; (affirmed 2026-09-07)
- never treat a security scanner or the linter as merely advisory — each must be a blocking CI gate. (affirmed 2026-09-07)
No additional frontend-specific `NEVER` rule was stated by the human this round. Several were proposed by reviewers (guest-URL/telemetry handling, raw-HTML rendering, dependency-scan suppression discipline) — these are recorded as evidence and open candidates in `evidence.md`, not promoted here, because they were not put to or confirmed by the human in this interview. (affirmed 2026-09-07)

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

- ALWAYS build the frontend (Property Owner + Guest app) in its own new repository, alongside the backend repository (`guestguideiq-app`) — not as a folder or workspace inside the existing marketing-site repo (Q1). (affirmed 2026-09-07) (affirmed 2026-09-07)
- ALWAYS run the walking-skeleton Bolt first for the frontend — a thin end-to-end slice proving the Owner path (signup through to a published guide), solo and gated, approved by the user before remaining Bolts run (Q2). (affirmed 2026-09-07) (affirmed 2026-09-07)
- ALWAYS name frontend files after what they export: `PascalCase` when the primary export is a component or class, `camelCase` otherwise — this resolves the earlier ambiguity in the affirmed backend naming rule, which a component file would otherwise violate on day one (Q4). (affirmed 2026-09-07) (affirmed 2026-09-07)
- ALWAYS run frontend automated tests against both an intercepted/mocked network (unit and component tests) and a thin live-backend suite (end-to- end tests) (Q5). (affirmed 2026-09-07) (affirmed 2026-09-07)
- ALWAYS require a staging deployment with manual approval before production for the frontend, applying uniformly to the Owner and Guest surfaces — matching the backend's practice, not the marketing site's single- environment precedent (Q6). (affirmed 2026-09-07) (affirmed 2026-09-07)
- ALWAYS scope and land a backend follow-up — adding `POST /v1/stays` and fixing the CORS/`ALLOWED_ORIGINS` configuration so a frontend origin can call the API — before frontend Construction begins (Q8). (affirmed 2026-09-07) (affirmed 2026-09-07)
The following five rules were stamped `ALWAYS` in `project.md` on 2026-09-05, each scoped in its own text to "backend work" or "touching the backend." The human confirmed (Q3) that all five now apply to frontend work as well — no rule listed above duplicates their text; promotion should read each as applying workspace-wide from this affirmation forward: (affirmed 2026-09-07)
- short-lived feature branches merged via pull request after review; (affirmed 2026-09-07)
- blocking linter + formatter as a required pull request check from day one; (affirmed 2026-09-07)
- automated dependency-vulnerability scanning from day one; (affirmed 2026-09-07)
- automated secret scanning from day one; (affirmed 2026-09-07)
- a green CI check (build, lint, test, coverage) required before merge. (affirmed 2026-09-07)

## Corrections

<!-- Project-specific corrections from human feedback. -->
<!-- Format: NEVER/ALWAYS [behavior] (learned [date]) -->
- Environment Provisioning can run after the real AWS work already happened ad-hoc (e.g. during an urgent production deploy) — treat the stage as formalizing/documenting what's already live rather than assuming it must drive fresh provisioning from scratch. (learned 2026-09-07) <!-- cid:260905-backend-services-spec:environment-provisioning:3a79f77d02c148cce61021b43c6f6a7b759e61e061e7dfb9d37ea52cda838032 -->
- When live infrastructure deviates from infrastructure-specification.md (WAF, auto-scaling, DNS provider, cert automation), surface each deviation as an explicit environment-provisioning question and record the human's decision — never silently absorb a spec/reality gap into the inventory. (learned 2026-09-07) <!-- cid:260905-backend-services-spec:environment-provisioning:f5f5041822e9848491a3fd5dbd5991b043a3f224f59044acb3beddf44a6b9bb9 -->
- When a human's answer to an environment-provisioning question is an explicit "yes, do it now" (e.g. re-enabling RDS deletion protection) and the fix is low-risk with an established PR workflow, make the actual code fix immediately rather than only recording it as a deferred follow-up. (learned 2026-09-07) <!-- cid:260905-backend-services-spec:environment-provisioning:be1c5bbadfc57a6c811897e46a648d3e1e2fabd1fc5422cdcff4417523e01848 -->
- The frontend intent's brownfield surface is the already-built backend repo `guestguideiq-app`, not a frontend codebase — reverse-engineering scans it as the API contract source the new frontend will consume, weighting the API surface heavily (learned 2026-09-07) <!-- cid:260907-frontend-app:reverse-engineering:bce6192f7aec095192ab9305684e7a4e2507a8b2e36c51270c90cc569322902c -->
- The workspace's active-intent pointer intermittently reverts to the earlier `260905-backend-services-spec` intent while a later intent is the one advancing, which makes repo-scoped tools refuse with "this intent has no registered repo identity" — re-run `aidlc-utility.ts intent switch <slug>` and retry rather than dropping `--repo`, which would write to the wrong store (learned 2026-09-07) <!-- cid:260907-frontend-app:reverse-engineering:6d44b813a654ad40dd4d09b48a2140e9ad2fb714bcc5ec44f829a6b2574a7a74 -->
- The `guestguideiq-app` backend is under active development while the frontend is being designed, so a CodeKB scan can be invalidated mid-stage by a merge — on a `CODEKB_SOURCE_CHANGED` refusal, re-scan against current HEAD rather than publishing a candidate built from a superseded commit (learned 2026-09-07) <!-- cid:260907-frontend-app:reverse-engineering:85749912234d4112040cfd0b91f5d4739da48768050c07d172aa90af787d25fa -->
- The first reverse-engineering pass over `guestguideiq-app` ran full-repo because no CodeKB store existed; later runs have a store to compare against and should weigh a focused scan instead (learned 2026-09-07) <!-- cid:260907-frontend-app:reverse-engineering:1cee2b71e046f1d4c5cdb108ded8210f9febbd9ad02f0af383d87d05411455cc -->
- When Deployment Execution runs after a real production deployment already happened ad-hoc earlier in the same effort, document that completed deployment as the stage's record rather than triggering a redundant fresh deploy just to have a formally-run one. (learned 2026-09-07) <!-- cid:260905-backend-services-spec:deployment-execution:d08af0d62634a9f6d4e0e2051c005ea4a8ed60c830f9887c4d479fa0527c0b77 -->
- Genuine automatic-rollback triggers from real deployment failures (e.g. an ECS deployment circuit breaker that actually fired and correctly rolled back a crash-looping deploy) count as real rollback validation evidence, stronger than a staged synthetic drill — accept them in place of inventing a separate drill. (learned 2026-09-07) <!-- cid:260905-backend-services-spec:deployment-execution:b6f74f88e53fa6badd859c275bd4ad7130900b317ab2eeeacfb2aef2c65b8a63 -->
- When a factual error is discovered in an already-approved stage artifact (e.g. a claim about the live infrastructure that later checking proves wrong), correct it in place with a clearly disclosed correction note rather than silently editing the historical human answer that was based on the wrong information. (learned 2026-09-07) <!-- cid:260905-backend-services-spec:observability-setup:14fa67b5a9e7f466dbc60757bc6b1723d46b5895c04f6145853902b0b8b3ce3f -->
- When the human explicitly scopes a stage to a minimal real implementation over the full aspirational design (e.g. observability), build the smaller real slice and document every deferred piece explicitly rather than either building nothing or over-building past the agreed scope. (learned 2026-09-07) <!-- cid:260905-backend-services-spec:observability-setup:06c1001b65f66856051d7f3180fd2d1c42a45c7cd88cabfba61313ccac46e3ef -->
- Do not fabricate a multi-tier alert-severity routing scheme (e.g. Page vs. Ticket) when no on-call or paging system actually exists to route to differently — a single honest notification tier reflects the team's real operational maturity better than a designed-looking but non-functional distinction. (learned 2026-09-07) <!-- cid:260905-backend-services-spec:observability-setup:a07106e2969e4cb619c6b1f597b73b11ca3ef4b2c4490351e066abf62a14c06c -->
- Document escalation paths and on-call structure honestly for the team's actual current size (e.g. a single responder) rather than describing a rotation or paging tier that doesn't exist. (learned 2026-09-07) <!-- cid:260905-backend-services-spec:incident-response:ca268cccdef4881c8adebff0acda8f8c32fe62edd5fb03f33df0488e9972a6a7 -->
- Write incident-response runbooks as manual, human-executed procedures when no automated remediation exists yet, rather than describing automation that hasn't been built. (learned 2026-09-07) <!-- cid:260905-backend-services-spec:incident-response:6baea0f43b8529dac22f9c9b9f1b76eaa6038fde31ece49dcf8b8efa93a8f847 -->
- Prefer lightweight, free tooling (e.g. Markdown runbooks) over provisioning a paid/formal operational tool (e.g. AWS Incident Manager) before the team size or incident frequency actually justifies its cost and setup. (learned 2026-09-07) <!-- cid:260905-backend-services-spec:incident-response:c2fea9c103dfaea661383de1511db7b97c13f1cf4a0dc34f90f24a637e86a643 -->
- When a decision is deferred to a later stage, record the constraint the deferral depends on rather than deferring bare — e.g. the token-storage decision was deferred to design, so "the hosting choice must not foreclose the same-origin-proxy option" was recorded with it, or the deferral would have lost its meaning (learned 2026-09-07) <!-- cid:260907-frontend-app:practices-discovery:1f846dd70b6802018a0130cd83c1c3a0ca2a9533211d4870c8d078b6f161934d -->
- Practices affirmed for an earlier intent are scoped to that intent's work — several `project.md` rules are phrased "for backend work" — so on a practices-discovery re-run, whether each affirmed rule extends to the new intent's work is a human decision at the interview, never an inference (learned 2026-09-07) <!-- cid:260907-frontend-app:practices-discovery:1c1f925b39cc343813cdd2218e18a78f5926d08552215293e2df588ffe3dedbd -->
- Support reviewers on practices-discovery propose far more interview questions than the five practice areas need; curate to the questions the human must actually settle and record the rest as open items in `evidence.md` for the stages that own them, rather than putting every proposed question to the human (learned 2026-09-07) <!-- cid:260907-frontend-app:practices-discovery:ef65468e234e3d7b54ff235b49d658f74ef36c2336a0fda3f747f5cc024b3c35 -->
- Before offering the human a scope choice that includes a screen, verify the API can actually support it — including authentication. Including the Admin/Ops locality-brand screen was chosen and then had to be reversed, because `u2-admin-api` requires an ops-role JWT that nothing in the system issues, and its locality endpoints are create-only (learned 2026-09-07) <!-- cid:260907-frontend-app:requirements-analysis:577abea30b6dd33aecd36b0fa88f42a14495f7a6b87ffcc38f6e85c412d948ef -->
- The GuestGuideIQ frontend's screens, stories, interaction specs and accessibility rules were designed and reviewed READY in the `260905-backend-services-spec` intent, so frontend requirements work is scope-setting, the MVP cut, and reconciling those designs against what the deployed API supports — not eliciting requirements from scratch (learned 2026-09-07) <!-- cid:260907-frontend-app:requirements-analysis:c49f76b1f79c073da70d23a4819178ef1b503b01d275870d3ae06d004c152a1d -->
- The frontend's automated accessibility check is advisory rather than blocking. This does not violate the affirmed Forbidden rule, which names only security scanners and the linter, but it is a deliberate time-boxed exception to the team's enforcement-discipline principle and carries a recorded intent to become blocking once the baseline is clean (learned 2026-09-07) <!-- cid:260907-frontend-app:requirements-analysis:f77e29103de53bece33b154295bc441d843805130976f7af6b2b148e9257253d -->
- Structured-question receipts must stay strictly ordered — record a question's answer receipt before logging the next question's decision receipt, or the answer receipt is refused for having no intervening human reply (learned 2026-09-07) <!-- cid:260907-frontend-app:requirements-analysis:01430028037926dd3da2b24a5bed197a8defa9bef8582222a3ce2accc3ca6269 -->
- When designing a load test (or any validation) uncovers that the paths originally promised can't actually be created or exercised (e.g. no way to create a locality/account/Stay in production), surface it as an explicit human decision before proceeding, rather than silently narrowing scope or fabricating the missing data. (learned 2026-09-07) <!-- cid:260905-backend-services-spec:performance-validation:dcc6e7fb0b6bf298e1a53a5c4b050fdf7570527c595ff1a650c3e99e65ccdc94 -->
- When an NFR appears blocked by a real infrastructure gap (e.g. a dependent service not deployed, or a documented-but-missing endpoint), confirm it via direct inspection (CloudFormation stack list, source search) before recording it as blocked — never assume. (learned 2026-09-07) <!-- cid:260905-backend-services-spec:performance-validation:6d7a05d0288d73a3cd780f8674d028736883cfbe375fcef03b5bc648dfe3b7e7 -->
- When the only reachable endpoint for a load test isn't representative of the real NFR being validated (e.g. cheap health checks standing in for real business endpoints), test it at a reasonable rate that demonstrates clean behavior rather than forcing the NFR's raw numeric target onto the wrong endpoint. (learned 2026-09-07) <!-- cid:260905-backend-services-spec:performance-validation:d1be228088fd90897616c5f12c5040f58a10e0117ef8a0c8cb44a1240451c7c6 -->
- When a human explicitly instructs not to clean up synthetic test data created during a validation, leave it in place even if the default practice would be to delete it afterward. (learned 2026-09-07) <!-- cid:260905-backend-services-spec:performance-validation:4353cd6159861c705d09332b9f8d7396357d8ff8d8c67b5701a0187afbdc6d2e -->
- When a validation genuinely cannot be triggered by the available test (e.g. auto-scaling under load too cheap to raise CPU), report it plainly as "attempted, not triggered" rather than skipping the attempt entirely or claiming a false pass. (learned 2026-09-07) <!-- cid:260905-backend-services-spec:performance-validation:58ed7c23568a5f6d7a25e9ac89311cbd1d5495c7009b06740d1f7fc87d5f8f28 -->
