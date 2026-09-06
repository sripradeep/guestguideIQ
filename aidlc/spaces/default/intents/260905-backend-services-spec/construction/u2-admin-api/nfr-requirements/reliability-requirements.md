# Reliability Requirements — u2-admin-api

`admin-api`'s availability matters far less than `u1-backend-api`'s — an ops tool being briefly unavailable does not affect any Property Owner or Guest, since none of their flows depend on it (`u1-backend-api`'s own components remain fully operational independent of `admin-api`'s health).

## SLO

| Term | Value |
|---|---|
| SLI | Successful requests / total requests |
| SLO | 95% availability over a 30-day rolling window — deliberately looser than `u1-backend-api`'s 99% (`u1-backend-api/nfr-requirements/reliability-requirements.md` NFR2.2), reflecting this Unit's internal-tool status and small blast radius when unavailable |
| Error budget | 5% = ~36 hours/month |

## Requirements

| ID | Requirement |
|---|---|
| NFR2.2 | 95% availability over a 30-day rolling window — an internal-tool-appropriate target, looser than the customer-facing SLO since no Property Owner or Guest workflow depends on `admin-api`'s uptime. |
| NFR2.3 | No independent backup/recovery objective is needed — `admin-api` holds no persistent state of its own (ADR-004); its only dependency is `u1-backend-api`'s database, whose RTO/RPO (`u1-backend-api/nfr-requirements/reliability-requirements.md` NFR2.3) already covers everything `admin-api` touches. |
| NFR2.4 | If `backend-api`'s internal API is unreachable, `admin-api` fails closed with a clear error to the ops caller (relayed per BR1.6) rather than presenting a misleading success or a silent hang — consistent with this project's Construction guardrail that "errors must be surfaced to the caller or logged." |

## Traceability

See `traceability.json`. Upstream: `NFR2` (Availability).
