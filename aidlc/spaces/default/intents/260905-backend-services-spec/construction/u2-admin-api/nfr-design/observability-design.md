# Observability Design — u2-admin-api

Concrete design for `nfr-requirements/observability-requirements.md`.

## Design

Same `pino` structured-logging + OpenTelemetry-tracing approach as `u1-backend-api`, scoped to this Unit's four workflows:

- **Logging**: `InternalCallerModule` emits one structured log line per outbound call — ops identity, operation, outcome (success/error/retry) — satisfying `security-design.md`'s audit-identity-forwarding requirement at the logging layer, not just in the request payload.
- **Tracing**: the one real span this Unit produces is `InternalCallerModule`'s outbound call, carrying W3C Trace Context so it joins the same trace `u1-backend-api`'s own tracing design expects on the receiving end.
- **Metrics**: RED metrics per route, same shape as `u1-backend-api`, at a much lower expected volume.
- **Alerting**: no dedicated paging alert (matching the 95% SLO's ticket-level severity, `reliability-requirements.md` NFR2.2) — a ticket-level alert on sustained `InternalCallerModule` failures feeds the same incident-response process as `u1-backend-api`'s alerts.

## Traceability

See `traceability.json`.
