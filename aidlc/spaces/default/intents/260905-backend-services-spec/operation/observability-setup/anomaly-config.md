# Observability Setup — Anomaly Detection Configuration

Conversation language: English

## Application-level anomaly detection (CloudWatch Anomaly Detection on app metrics)

Not implemented this pass (Q1 — minimal slice). `observability-patterns.md`
recommends combining CloudWatch's ML-based Anomaly Detection with static
thresholds — the static thresholds are what `alarms.md` implements; the
ML-based anomaly bands on latency/error-rate metrics are deferred, same as
the rest of the application-level metrics work (no custom OTel metrics
exist yet for anomaly detection to run against).

## Account-level anomaly detection (already exists, unrelated to this stage)

For completeness: **AWS Cost Anomaly Detection** was set up earlier this
session (account-wide, not `u1`-specific) — a Cost Anomaly Monitor and
Subscription already exist, confirmed daily, $100 absolute / 40% relative
threshold, email-confirmed. This is financial anomaly detection, not the
application-metric anomaly detection this stage's `produces` list refers
to; documented here only to avoid the reader wondering whether it's the
same thing.

## What implementing application-level anomaly detection later requires

1. Have at least 2-4 weeks of real metric history on a signal (per
   `observability-patterns.md`) — CloudWatch's ML model needs a baseline
2. Enable `cloudwatch.CfnAnomalyDetector` (or the L2 equivalent) on a
   chosen metric (e.g., ALB target response time, once real traffic
   establishes a stable pattern)
3. Create an alarm using `ANOMALY_DETECTION_BAND` as the comparison
   operator, referencing that detector

Not meaningful to configure yet against near-zero real production traffic.
