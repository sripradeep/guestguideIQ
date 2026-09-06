# Reliability Requirements — u1-backend-api

Concretizes `requirements.md` NFR2 (Availability) with Q5's conservative pre-launch SLO, and covers fault tolerance, backup/recovery, and graceful degradation.

## SLO

| Term | Value |
|---|---|
| SLI | Successful requests / total requests, measured per the RED-method metrics in `observability-requirements.md` |
| SLO | 99% availability over a 30-day rolling window (Q5) |
| Error budget | 1% = ~7.3 hours/month |
| SLA | None yet — this is an internal SLO, not an external contractual commitment; no story or stakeholder has asked for one at this phase |

Per the SLO-setting guide's rule that "SLO must be stricter than SLA," there is currently no SLA to be stricter than — this SLO is the sole reliability commitment until one is negotiated.

## Requirements

| ID | Requirement |
|---|---|
| NFR2.2 | 99% availability over a 30-day rolling window (concretizes NFR2.1). Achievable with basic monitoring and manual recovery per `nfr-reliability-guide.md`'s availability-target table — no multi-AZ/automated-failover investment is justified at this SLO tier. |
| NFR2.3 | Recovery objectives: RTO ≤ 4 hours, RPO ≤ 1 hour for the primary database. Sized to the pre-launch stage's low data-loss tolerance cost (few accounts/properties exist yet) balanced against not requiring continuous replication infrastructure this early. |
| NFR2.4 | Fault tolerance follows the priority tiers from `scalability-requirements.md` NFR5.5: signup, guest-guide-read, and stay-link resolution are critical-path (must always work); the itinerary chat degrades first under dependency failure — on an LLM-provider timeout/error, BR7.3's retry-able waiting state is the reliability-level contract this requirement backs. |
| NFR2.5 | Standard automated daily backups of the primary database, retained for 30 days, with backup restoration tested at least once before the production launch gate (a concrete, verifiable action rather than an assumed-working backup). |

## Failure Mode Notes

Per the failure-mode checklist in `nfr-design-guide.md`, applied to this Unit's key dependencies:
- **Database unavailable**: all read/write paths fail; no in-memory fallback exists at this SLO tier — an outage here is a full-service outage, consistent with 99% (not 99.9%+) being the accepted target.
- **LLM provider unavailable/slow** (chat, W9): BR7.3 already specifies the guest-facing behavior (retry-able waiting state, message history preserved) — this reliability requirement confirms that behavior is the accepted mitigation, not a gap to close later.
- **Stripe unavailable** (subscription flows, W6): BR2.3 already specifies no-partial-state on payment failure — the reliability posture here is "fail cleanly," not "retry automatically," since payment retries carry their own correctness risk.

## Traceability

See `traceability.json`. Upstream: `NFR2` (Availability).
