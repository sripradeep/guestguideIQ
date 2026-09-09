# Feedback & Optimization — Clarifying Questions

Conversation language: English

## Context

Real AWS data was pulled for this stage rather than assumed:

- **Cost Explorer / Budget actual spend**: `$0.00` billed month-to-date
  against the `$300/mo` budget. This is a real, expected artifact of
  recency — the production stack is less than a week old, and AWS billing
  data has a reporting lag (typically 24-48+ hours, with full accumulation
  over the billing cycle) before it shows up in Cost Explorer.
- **AWS Config**: the configuration recorder is active and recording
  (`SUCCESS`), but **zero AWS Config Rules are attached** — so there is no
  automated drift/compliance evaluation running today, only raw
  configuration-item history.
- **AWS Trusted Advisor**: unavailable — this account is on Basic/Developer
  support, which does not include the Trusted Advisor API
  (`SubscriptionRequiredException`).
- **SLO/SLI pipeline**: confirmed not built yet (`slo-config.md`, Q1 from
  `observability-setup`) — no route-level RED metrics instrumentation
  exists, so no SLI can be computed against the design targets.

## Q1: Cost data shows $0 billed to date. How should the cost-analysis artifact handle this?

[Answer]: A. Document the $0 as an expected artifact of recency and revisit with a real cost review once ~30 days of billing data exists

A. Document the $0 as an expected artifact of recency and revisit with a
   real cost review once ~30 days of billing data exists (Recommended)
B. Estimate costs analytically from known resource types/sizes instead of
   waiting for real billed data
C. Defer cost-analysis entirely until real billing data exists
X. Other (please specify)

## Q2: AWS Config has zero Config Rules attached, so no automated drift/compliance detection runs today. How should this be handled?

[Answer]: B. Add a small set of baseline AWS Config Rules now (e.g. required-tags, s3-bucket-public-read-prohibited, rds-storage-encrypted) as real infrastructure work

A. Document as a real, accepted gap for now — matches the team's
   minimal-tooling-until-justified pattern from earlier stages; no rules
   added this pass (Recommended)
B. Add a small set of baseline AWS Config Rules now (e.g. required-tags,
   s3-bucket-public-read-prohibited, rds-storage-encrypted) as real
   infrastructure work
X. Other (please specify)

## Q3: No SLO/SLI computation pipeline exists yet. How should the SLO report treat this?

[Answer]: A. Document current SLO status as "not measurable" and carry the pipeline build-out forward as a feedback-loop follow-up

A. Document current SLO status as "not measurable" and carry the pipeline
   build-out forward as a feedback-loop follow-up (Recommended)
B. Build a minimal SLI computation now (OTel instrumentation + CloudWatch
   Metrics Math) before closing this stage
X. Other (please specify)

## Q4: This is the final stage — the whole backend-services-spec workflow completes on approval here. How should the feedback-loop document be used?

[Answer]: A. Purely as documentation of follow-ups — no new Ideation cycle is being started now

A. Purely as documentation of follow-ups — no new Ideation cycle is being
   started now (Recommended)
B. Use this to kick off a new Ideation cycle immediately for the next
   round of work
X. Other (please specify)

## Consolidated Summary Confirmation

Summary: cost-analysis documents $0 billed month-to-date as an expected
recency artifact, with a real cost review scheduled once ~30 days of
billing data exists. Six baseline AWS Config Rules were added now
(S3 public read/write, RDS encryption/public-access, IAM root key,
restricted ingress) — real infrastructure work, confirmed ACTIVE though
not yet evaluated (a real, disclosed limitation). The SLO report documents
current status as "not measurable" (no SLI pipeline exists), carried
forward as a follow-up. The feedback-loop document consolidates every
real follow-up from this Operation phase (13 items) as documentation only
— no new Ideation cycle starts from it now.

[Answer]: Looks correct
