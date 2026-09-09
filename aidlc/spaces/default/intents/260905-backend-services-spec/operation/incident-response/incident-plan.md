# Incident Response — Incident Plan

Conversation language: English

## RTO / RPO targets (Q2 — carried forward from `reliability-design.md`)

| Target | Value | Basis |
|---|---|---|
| RTO (Recovery Time Objective) | ≤ 4 hours | Standard tier per `reliability-requirements.md`; achievable via RDS automated snapshotting + point-in-time recovery, already live |
| RPO (Recovery Point Objective) | ≤ 1 hour | Same basis — PostgreSQL write-ahead-log-based PITR |

Neither target has been tested against a real restore drill yet — a real
follow-up, not assumed-working.

## Detection

The 6 CloudWatch Alarms in `observability-setup/alarms.md` are the only
automated detection mechanism today. No synthetic monitoring (CloudWatch
Synthetics canaries) exists — the first signal of most issues will be one
of those alarms firing, or a direct user report.

## Response process (Q1, Q3, Q4 — right-sized for team of one)

1. Alarm fires → email notification received
2. Check `dashboards.md`'s CloudWatch Dashboard
   (`GuestGuideIQ-BackendApi-production`) for the affected metric
3. Consult `runbooks.md` for the matching manual procedure
4. Execute the runbook step-by-step — **no automated remediation exists**
   (Q3); every response action is a human running an AWS CLI command or
   console action
5. Once resolved, note what happened informally (no formal incident
   tracking tool yet, Q4)

## Post-incident review

Per `incident-response-guide.md`'s blameless postmortem structure
(Timeline, Impact, Root Cause, Contributing Factors, What Went Well, What
Could Be Improved, Action Items) — to be conducted for any SEV1/SEV2
incident, once one actually occurs. No incident has happened yet in
production (the deploy-time failures this session were pre-launch bring-up
issues, not production incidents affecting real users).

## Disaster recovery

- **Database**: automated daily backups + point-in-time recovery, 30-day
  retention (already live, `infrastructure-specification.md`)
- **Application**: stateless — a fresh `cdk deploy` from the same CDK
  code recreates the entire compute/networking layer from scratch if
  needed; the migration RunTask mechanism re-applies schema if the
  database itself needs restoring from a snapshot
- **Full DR drill**: not yet performed — a genuine, tracked gap, not
  claimed as tested

## Traceability

See `incident-response-questions.md` for the full Q&A record. Upstream:
`observability-setup/dashboards.md`, `observability-setup/alarms.md`,
`reliability-design.md`, `security-design.md`,
`infrastructure-specification.md`.
