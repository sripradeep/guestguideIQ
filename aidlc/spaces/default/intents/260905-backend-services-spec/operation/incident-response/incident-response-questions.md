# Incident Response — Questions

Conversation language: English

## Q1 — On-call structure for a very small team

There's no on-call rotation, PagerDuty, or shared team distribution list —
alerts route to one person's email (per `observability-setup/alarms.md`,
Q2). Should the incident response plan reflect that honestly (single
responder, no rotation) rather than describing a rotation that doesn't
exist?

- A. Yes — document single-responder reality; add rotation structure once the team grows
- B. Set up a real rotation/distribution list now, even with just one or two people
- X. Other (please specify)

[Answer]: A. Yes — document single-responder reality; add rotation structure once the team grows

## Q2 — RTO/RPO targets

`reliability-design.md` already specifies RTO ≤ 4 hours, RPO ≤ 1 hour for
the "Standard" tier (backed by RDS automated daily backups + point-in-time
recovery, already live). Carry these forward as the incident response
plan's stated targets, or adjust given real production is now live?

- A. Carry forward as-is (RTO ≤ 4h, RPO ≤ 1h)
- B. Tighten the targets now that real production exists
- X. Other (please specify)

[Answer]: A. Carry forward as-is (RTO ≤ 4h, RPO ≤ 1h)

## Q3 — Automated remediation

No automated remediation exists (no Lambda-triggered restarts, no
SSM Automation documents). Per the established pattern this session
(minimal real slice over full aspirational design), should this stage
build any automated remediation now, or document it as fully manual for
now (a human responds to every alarm)?

- A. Fully manual for now — document runbooks as human-executed steps; automate later if incidents recur
- B. Build at least one automated remediation now (e.g., Lambda-triggered ECS task restart on repeated health-check failure)
- X. Other (please specify)

[Answer]: A. Fully manual for now — document runbooks as human-executed steps; automate later if incidents recur

## Q4 — AWS Incident Manager

The design mentions AWS Incident Manager integration. Given the team size
and that no incident has ever occurred yet, is a lightweight Markdown
runbook/escalation doc sufficient for now, or should AWS Incident Manager
actually be provisioned (a real AWS service with its own setup and cost)?

- A. Lightweight Markdown runbooks are sufficient for now; revisit AWS Incident Manager if the team grows
- B. Provision AWS Incident Manager now
- X. Other (please specify)

[Answer]: A. Lightweight Markdown runbooks are sufficient for now; revisit AWS Incident Manager if the team grows

## Consolidated Summary Confirmation

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
