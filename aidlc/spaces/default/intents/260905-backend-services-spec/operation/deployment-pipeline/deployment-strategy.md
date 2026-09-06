# Deployment Strategy

Conversation language: English

Confirmed per `deployment-pipeline-questions.md`'s Consolidated Summary Confirmation (Q1: AWS AppConfig, adopted now).

## Deployment strategy (already decided at Infrastructure Design, not re-litigated)

**Rolling deployment** via ECS's native rolling-update capability, per `u1-backend-api/infrastructure-design/cicd-pipeline.md` and `u2-admin-api/infrastructure-design/cicd-pipeline.md` (both READY-reviewed): tasks replaced incrementally, appropriate for both stateless, backward-compatible-by-convention services. Blue/green is the named future upgrade once traffic volume justifies its double-infrastructure cost (`cost-optimization-patterns.md`) — not needed at the year-one scale (`scalability-requirements.md` NFR5.2). `u2-admin-api`'s single-task sizing (Q1 at infrastructure-design) makes its "rolling" deploy effectively replace-one-task, relying on ECS's deployment circuit breaker rather than a load-balanced rolling window.

## Environment promotion (already decided)

`dev` (developer-triggered, ephemeral) → `staging` (automated on merge to `main`) → `production` (manual approval gate) — three environment-parameterized stacks from one CDK app per Unit, per `cdk-best-practices.md`'s environment-aware-stack pattern. Staging and production differ only in scale (2 Fargate tasks / `db.t4g.medium` for u1 production vs. smaller staging sizing; u2 stays single-task in both).

## Production approval workflow (already decided)

Manual approval required before every production deployment (`project.md` Mandated, Q6) — implemented as a GitHub Actions `environment: production` protection rule requiring a designated reviewer, gating the `deploy-production` job the same way `deploy-staging` already gates on `environment: staging` in `guestguideiq-app/.github/workflows/ci.yml`.

## Feature flags — AWS AppConfig (this stage's one open decision)

Adopted now, ahead of any specific feature that needs it — a deliberate choice to have the mechanism in place before urgency ever pressures a rushed setup.

### What AppConfig needs, and who owns provisioning it

AppConfig is genuinely new infrastructure and a new application-runtime integration, not a deployment-process document alone — this stage documents the design decision and integration plan; provisioning the AWS resources and writing the code that reads flags fall to the stages that actually own infrastructure-as-code and application code:

| Piece | Owner | Status |
|---|---|---|
| AppConfig `Application` (one, spanning both Units — they're one product) | `infrastructure-design` (amendment) or `environment-provisioning` | Not yet provisioned |
| AppConfig `Environment`s (dev/staging/production, matching the existing CDK environment split) | Same | Not yet provisioned |
| AppConfig `ConfigurationProfile` (feature-flag type) + a linear/canary deployment strategy for config changes themselves | Same | Not yet provisioned |
| Application-side flag reads — `@aws-sdk/client-appconfigdata` polling with local caching, or the AWS AppConfig Agent as an ECS sidecar container | `code-generation` (amendment) | Not yet implemented; no flag-gated feature exists yet to need it |

**Recommended integration shape**, for whichever stage implements it: the AWS AppConfig Agent as a sidecar container in each Fargate task (polls AppConfig on the team's behalf, exposes a local HTTP endpoint the app calls), rather than each service embedding its own SDK polling loop — one less thing for `u1-backend-api` and `u2-admin-api` to independently get right, and the pattern `cicd-patterns.md`'s "reusable workflow" principle favors (shared mechanism, not duplicated per-service logic).

### Why this is disclosed as a gap rather than built here

This stage's own `produces` (`cd-config`, `deployment-strategy`, `rollback-runbook`) are deployment-*process* documents. Provisioning new AWS infrastructure and writing new application code that depends on it are `infrastructure-design`'s and `code-generation`'s declared remits respectively — inventing CDK constructs or SDK integration code here would touch artifacts this stage doesn't own and wasn't reviewed to produce. This mirrors the same boundary already drawn at Build and Test and CI Pipeline (fixing real bugs/vulnerabilities in already-generated code was in-remit; adding a wholly new third-party integration is not).

**Until that follow-up work lands, no feature in either Unit is flag-gated** — every current workflow (W1-W10 for u1, W1-W4 for u2) ships as ordinary, ungated code, matching what Code Generation actually built and Build and Test verified. Adopting AppConfig now is a forward-looking decision, not a currently-active mechanism.

## Rollback

See `rollback-runbook.md` for the full procedure.

## Traceability

Implements `project.md` Mandated deployment rules (staging + manual-approval production) and `org.md`'s Deployment guardrail. No FR/NFR directly requires feature flags; this is a team-chosen forward-looking practice per Q1's answer, not a requirement-traced item.
