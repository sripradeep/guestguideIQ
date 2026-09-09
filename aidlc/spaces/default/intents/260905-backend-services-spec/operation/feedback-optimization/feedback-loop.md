# Feedback & Optimization — Feedback Loop

Conversation language: English

Consolidated real follow-ups surfaced across the entire Operation phase of
this intent (and the one cross-referenced item from the concurrent
`260907-frontend-app` intent, which independently found the same backend
gap). This document is documentation only (Q4) — no new Ideation cycle is
being started from it now.

## Blocking / high-value backend follow-ups


1. **Add `POST /v1/stays`.** No endpoint anywhere creates a guest `Stay`.
   This blocks: NFR1.4 validation (this intent, `performance-validation`),
   the Guest app's entire supply side (`260907-frontend-app`'s own
   Walking Skeleton decision explicitly routed around this gap), and any
   future guest-path testing.
2. **Deploy `admin-api` (u2) to production, or otherwise seed a test
   locality.** Currently no locality/account/property can be created in
   production at all, which blocks NFR1.2 general-API validation, the
   POI/Events read paths, and genuine auto-scaling validation under real
   business-endpoint load (this intent, `performance-validation`).
3. **Fix CORS `ALLOWED_ORIGINS`.** Production CORS allows only
   `https://guestguideiq.com`; no frontend origin (not even localhost) can
   call the API, and `ALLOWED_ORIGINS` is missing from `.env.example`
   (identified independently by `260907-frontend-app`).

## Operational gaps carried forward (accepted-for-now, not urgent)

4. Re-run auto-scaling validation with real (non-health-check) load once
   (1) or (2) above lands — the current attempt could not generate enough
   CPU to trigger scale-out (`performance-validation/nfr-validation-matrix.md`).
5. Build the SLI computation pipeline (OpenTelemetry instrumentation +
   CloudWatch Metrics Math) once real production traffic exists —
   currently no SLO is measurable (`slo-report.md`).
6. Check AWS Config compliance results for the 6 new baseline rules once
   the first evaluation pass completes (a few hours after this stage) —
   `drift-report.md`.
7. Run a genuine cost review once ~30 days of billing data has
   accumulated in Cost Explorer — `cost-analysis.md`.
8. Revisit itinerary chat (NFR1.3) once an LLM provider is wired in
   (`CHAT_PROVIDER` is currently `null`).
9. Add staging/dev environments (deferred at `environment-provisioning`)
   once team size or release cadence justifies the cost.
10. Add WAF (deferred at `environment-provisioning`).
11. Perform a real disaster-recovery drill (restore from an RDS snapshot
    end-to-end) — RTO/RPO targets in `incident-response/incident-plan.md`
    are design assumptions, never drill-verified.
12. Revisit the single-responder on-call structure and consider AWS
    Incident Manager once team size or incident frequency justifies it
    (`incident-response/escalation-matrix.md`).
13. Consider upgrading the AWS support plan (currently Basic/Developer —
    no Trusted Advisor API access) once cost-optimization visibility
    becomes valuable enough to justify the plan cost.

## What went well (worth repeating)

- Every stage in this Operation phase was grounded in the actual deployed
  state rather than aspirational design — real AWS data was pulled at
  every step (CloudFormation stack lists, CloudWatch metrics, Cost
  Explorer, Config compliance) rather than assumed.
- Real infrastructure changes were made when the human explicitly chose to
  act now rather than defer (RDS deletion protection, observability
  alarms/dashboard, and this stage's 6 Config Rules) — each gated on an
  explicit human decision first.
- Discovered gaps (missing `POST /v1/stays`, `admin-api` not deployed,
  Config Rules absent) were surfaced as explicit human decisions the
  moment they were found, never silently absorbed or fabricated around.

## Traceability

See `feedback-optimization-questions.md` for the full Q&A record. This
document is the terminal artifact of the `backend-services-spec` intent's
Operation phase — see `project.md`'s `## Corrections` section for the full
list of learnings persisted across every stage of this engagement.
