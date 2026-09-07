# Performance Validation — Test Results

Conversation language: English


## Test execution


- **Run window**: 2026-09-07T18:28:55Z – 2026-09-07T18:44:25Z (~15m30s incl.
  graceful stop), against production (`api.guestguideiq.com`), from a local
  k6 client (`k6.exe v2.2.0`).
- **Script**: `perf-load-test.js` (this directory).
- **Baseline before test**: ECS service 2/2 running/desired tasks, 0
  pending; `/health` and `/health/ready` both `200` (~0.3s cold-connection
  curl, not representative of server-side latency).

## k6 results (client-observed)

| Metric | Value |
|---|---|
| Total requests | 22,510 (0 failed — `http_req_failed`: 0.00%) |
| Overall throughput | 25.0 req/s (includes ramp-up/down; steady-state segment held 30.0 req/s) |
| `http_req_duration` (health + ready combined) | avg 61.3ms, med 60.9ms, p90 64.6ms, **p95 67.4ms**, max 209ms |
| `lead_duration` (POST /v1/leads/waitlist) | avg 69.8ms, med 64.8ms, p90 83.7ms, **p95 99.5ms**, max 115ms |
| Checks | 22,510/22,510 passed (100%) |
| Thresholds | `health_errors < 1%` ✓ (0.00%), `ready_errors < 1%` ✓ (0.00%), `lead_errors < 1%` ✓ (0.00%) |
| Lead-form submissions | 10/10 succeeded (`201`), all tagged `loadtest+...@example.invalid`, left in production per instruction |

**Methodology caveat**: `http_req_duration` is measured client-side from a
local machine to AWS `us-east-1`, so it includes real network RTT — it is
not a pure server-processing-time measurement. The ALB-side
`TargetResponseTime` figures below isolate server-side latency and are
substantially lower, confirming the client-observed p95 is dominated by
network transit rather than application or database time.

## CloudWatch — infrastructure metrics for the test window (18:26–18:47Z)

**ECS service** (`GuestGuideIQ-BackendApi-production-PublicService...`):

| Metric | Value during steady-state |
|---|---|
| CPU utilization | avg ~3.5–4.4%, max **4.9%** |
| Memory utilization | ~2.3% → 3.2% (slow, small upward drift — consistent with normal steady-state memory behavior, not a leak signal over this short a window) |
| Running task count | flat at **2** the entire test — no scale-out event fired |

**ALB** (`GuestG-Publi-ISscF9Ojkmca`):

| Metric | Value |
|---|---|
| Request count | ~8,700–9,000 per 5-min window during steady-state (≈29-30 req/s, matching the k6 target) |
| Target response time (server-side) | avg **~2ms**, max ~150ms |
| 5xx count | **0** for the entire window |
| Unhealthy host count | **0** for the entire window |

**RDS** (`guestguideiq-backendapi-productio-databaseb269d8bb-...`):

| Metric | Value |
|---|---|
| CPU utilization | avg ~4%, max **6.4%** |
| Database connections | avg 1.4–4, max **4** |

## Auto-scaling validation (NFR5.2/5.3) — attempted, not triggered

The ECS service's auto-scaling policy (`targetUtilizationPercent: 70`) was
never exercised: CPU peaked at 4.9%, nowhere near the 70% scale-out
threshold. This is an honest result, not a pass — **health-check traffic is
too cheap to generate real CPU load**, so this test cannot validate the
auto-scaling *behavior* itself (only that it didn't spuriously fire under
normal load). The auto-scaling configuration was already confirmed correct
by direct inspection during `environment-provisioning` (the
`autoScaleTaskCount`/`scaleOnCpuUtilization` CDK construct); this test adds
no new evidence either way on whether it fires correctly under real load —
that would require either sustained CPU-bound synthetic load (not
attempted here, out of scope for a health-check-based test) or real
production traffic once the product launches.

## Traceability

See `load-test-plan.md` for the design and the scope-cut rationale, and
`performance-validation-questions.md` for the full decision record. Full
raw k6 summary: `perf-summary.json` (not committed — regenerate by
re-running `perf-load-test.js` if needed).
