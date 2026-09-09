# Incident Response — Escalation Matrix

Conversation language: English

Reflects the team's actual current size honestly (Q1) — no fabricated
rotation or paging tiers.

## Alert routing (as implemented in `observability-setup/alarms.md`)

| Alarm | Notifies |
|---|---|
| All 6 CloudWatch alarms | One SNS topic → email, `sripradeep@gmail.com` + `pradeep@guestguideiq.com` |

## Severity levels

| Level | Criteria | Response expectation |
|---|---|---|
| SEV1 — Critical | Production fully down, data loss, or a security incident | As soon as the email alert is seen — no formal SLA yet, single-responder team |
| SEV2 — Major | Partial degradation (one alarm firing, service still serving most traffic) | Same-day |
| SEV3 — Minor | Cosmetic, non-critical, or already self-recovered | Next available working session |

## Escalation path (Q1)

**There is no rotation and no secondary responder.** Both subscribed
emails reach the same person. This is documented as the honest current
state, not a placeholder for a rotation that doesn't exist yet — revisit
once the team grows beyond one person.

## Incident Manager tooling (Q4)

No AWS Incident Manager integration exists. Incidents are tracked
informally (this repository's issue tracker or direct notes) until team
size or incident frequency justifies the setup and cost of a dedicated
tool.
