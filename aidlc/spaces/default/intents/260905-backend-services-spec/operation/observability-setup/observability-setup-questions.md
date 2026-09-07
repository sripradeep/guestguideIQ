# Observability Setup — Questions

Conversation language: English

## Q1 — Real gap: almost none of the designed observability stack is deployed

`nfr-design/observability-design.md` and `infrastructure-design/monitoring-design.md`
(both READY-reviewed) call for: an ADOT collector sidecar exporting to X-Ray,
OpenTelemetry route-level RED metrics + business-event counters, 6 CloudWatch
alarms (error rate, latency, chat failure rate, RDS connection exhaustion,
ECS task health, SLO burn-rate), 2 CloudWatch dashboards defined as CDK
constructs, and log-retention tiers. None of this exists in the deployed
stack today — only the default CloudWatch Container Insights (from
`containerInsightsV2: ENABLED`) and AWS's own default ECS/RDS platform
metrics are live. `OTEL_ENABLED` is `false` in production; the app's own
OpenTelemetry SDK (`src/lib/otel.ts`) has never actually exported anything.

How far should this stage go toward closing that gap?

- A. Implement a practical minimal slice now: CloudWatch Alarms on default ECS/RDS metrics (no custom app metrics needed) plus one basic dashboard, as real CDK constructs
- B. Document the full gap as deferred; no new infrastructure this stage, revisit once real traffic exists
- C. Implement the full design now: ADOT sidecar, custom OTel business metrics, X-Ray tracing, both dashboards, all 6 alarms
- X. Other (please specify)

[Answer]: A. Implement a practical minimal slice now: CloudWatch Alarms on default ECS/RDS metrics (no custom app metrics needed) plus one basic dashboard, as real CDK constructs

## Q2 — Alarm notification target

If any alarms are implemented (Q1 = A or C), there's currently no on-call
system, PagerDuty, or Slack integration — this is a very small team. What
should "Page" alerts actually notify?

- A. Email (SNS topic → your email address)
- B. No real notification target yet; create the alarms but leave the SNS topic unsubscribed for now
- X. Other (please specify)

[Answer]: A. Email (SNS topic → your email address)

## Q3 — Scope: u1-backend-api only

Consistent with every prior Operation-phase stage this session:
`u2-admin-api` has no live environment (Environment Provisioning Q6), so no
observability setup applies to it in this pass. Confirm this stage's
artifacts cover `u1-backend-api` only.

- A. Yes — u1-backend-api only; u2-admin-api observability is a later, separate pass

[Answer]: A. Yes — u1-backend-api only; u2-admin-api observability is a later, separate pass

## Q4 — Cost awareness

CloudWatch Alarms, dashboards, and X-Ray tracing all carry small real costs
(alarms ~$0.10/month each, dashboards ~$3/month each, X-Ray ~$5 per million
traces recorded). Given the $300/month budget and guardrails already set up
this session, is this an acceptable additional cost for whatever scope Q1
selects?

- A. Yes — acceptable, proceed with Q1's chosen scope
- B. No — keep the scope smaller than Q1's answer to minimize cost further
- X. Other (please specify)

[Answer]: A. Yes — acceptable (clarified: ~$0.50-1/month for 5-6 alarms + 1 free-tier dashboard + free-tier SNS email)

## Consolidated Summary Confirmation

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
