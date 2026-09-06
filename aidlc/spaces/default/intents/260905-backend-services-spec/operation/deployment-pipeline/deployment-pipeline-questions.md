# Deployment Pipeline — Clarifying Questions

Conversation language: English

## Sources

- `u1-backend-api/infrastructure-design/cicd-pipeline.md`, `u2-admin-api/infrastructure-design/cicd-pipeline.md` — both READY-reviewed; already specify deployment strategy (rolling), environment promotion (dev → staging → production via three CDK env-parameterized stacks), the manual-approval production gate, and a 3-step rollback procedure. [scope]
- `construction/ci-pipeline/ci-config.md` — the `deploy-staging` job already stubbed in `guestguideiq-app/.github/workflows/ci.yml`, pending Environment Provisioning (AWS OIDC role, SSM parameter publishing from u1's stack). [scope]
- `requirements.md`, `rules.md` — no requirement anywhere calls for progressive-delivery feature flags; this is the one open item the stage's own question template raises that nothing upstream has settled. [scope]

Four of the five items this stage's template normally asks about are already decided and not re-asked here: deployment strategy (rolling, per `cicd-pipeline.md`), environment promotion gates (dev → staging → production, three CDK stacks), production approval workflow (manual, per `project.md` Mandated Q6), and rollback procedure (3-step: circuit-breaker auto-rollback during rollout, redeploy-previous-image for post-rollout issues, backward-compatible migrations by convention). One item remains genuinely open.

## Questions

**Q1. Feature flags.** Neither `requirements.md` nor `rules.md` calls for progressive-delivery feature flags anywhere in the product's scope, and both services are pre-launch with a small, low-traffic user base (per `scalability-requirements.md`'s year-one target: ~25-50 localities). `deployment-strategies.md` names AppConfig/CloudWatch Evidently as the AWS-native options if this project wants them.

[Answer]: B. AppConfig — AWS-native feature flags with validation, gradual rollout, and automatic rollback, adopted now rather than deferred

X. Other (please specify)

## Consolidated Summary Confirmation

- Q1 (Feature flags): AWS AppConfig, adopted now.

- Looks correct
- Request changes

[Answer]: Looks correct
