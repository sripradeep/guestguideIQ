# Deployment Execution — Questions

Conversation language: English

The actual production deployment for `u1-backend-api` already happened this
session, end-to-end, including migrations and live health verification. These
questions decide how this stage records that and settle a few operational
parameters the prior stages didn't establish.

## Q1 — Treat the completed session deployment as this stage's record

Production reached `CREATE_COMPLETE`, the database migration ran successfully
via the one-off ECS RunTask, and `/health`/`/health/ready` were verified live
returning `200`. Should this stage's `deployment-log.md` document that
already-completed deployment as the record, rather than triggering a fresh
deployment?

- A. Yes — document the completed deployment as the record
- B. No — trigger and document a fresh deployment now
- X. Other (please specify)

[Answer]: A. Yes — document the completed deployment as the record

## Q2 — Rollback validation evidence

No deliberate rollback drill was run. However, the ECS deployment circuit
breaker's automatic rollback genuinely triggered multiple times during this
session's earlier failed attempts (crash-looping containers), and each time
it correctly detected the failure and rolled back without manual
intervention. Does this count as real rollback validation, or is a
deliberate rollback drill against the current healthy version still needed?

- A. Accept the circuit-breaker's real trigger history as rollback validation
- B. Still run a deliberate rollback drill against the current healthy version
- X. Other (please specify)

[Answer]: A. Accept the circuit-breaker's real trigger history as rollback validation

## Q3 — Deployment window / freeze periods

No deployment window or freeze period is defined — every deploy this session
happened ad-hoc, at whatever time the work was in progress. Now that this is
live production, should a deployment window be established?

- A. Establish a window now (e.g., business hours only, avoid Fridays)
- B. Not yet — team is small enough to monitor any-time deploys for now
- X. Other (please specify)

[Answer]: B. Not yet — team is small enough to monitor any-time deploys for now

## Q4 — u2-admin-api scope (carried forward from Environment Provisioning)

Consistent with Environment Provisioning's Q6: `u2-admin-api` has no live
environment, so no deployment execution applies to it in this pass. Confirm
this stage's artifacts should cover `u1-backend-api` only.

- A. Yes — u1-backend-api only; u2-admin-api deployment execution is a later, separate pass
- X. Other (please specify)

[Answer]: A. Yes — u1-backend-api only; u2-admin-api deployment execution is a later, separate pass

## Consolidated Summary Confirmation

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
