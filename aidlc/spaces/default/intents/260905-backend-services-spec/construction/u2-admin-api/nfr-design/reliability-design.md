# Reliability Design — u2-admin-api

Concrete design for `nfr-requirements/reliability-requirements.md`'s 95% SLO and fail-closed behavior.

## Design

- **Health checks**: same shallow `/health` pattern as `u1-backend-api`, sufficient given this Unit holds no persistent state of its own to verify readiness against beyond reachability of `backend-api`'s internal listener (checked via `InternalCallerModule`'s own error handling, not a separate synthetic check).
- **Fail-closed behavior** (NFR2.4): if `backend-api`'s internal API is unreachable, `InternalCallerModule` surfaces a clear `503`-equivalent error to the ops caller (per BR1.6's relay behavior) — no silent hang, no misleading success response.
- **No independent backup/recovery** (NFR2.3): correctly not designed, since `admin-api` holds no data of its own — `u1-backend-api`'s backup/recovery design already covers everything this Unit's operations ultimately touch.

## Traceability

See `traceability.json`.
