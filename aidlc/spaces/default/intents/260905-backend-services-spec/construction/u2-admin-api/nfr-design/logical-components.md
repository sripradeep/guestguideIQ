# Logical Components — u2-admin-api

## Component Inventory

| Component | Owns | Failure Domain | Blast Radius if Down |
|---|---|---|---|
| **OpsAuthModule** | Ops-staff JWT verification (`ops` role claim) | Shares the app process | High to `admin-api` itself — no ops staff can act; zero impact on `u1-backend-api`'s Property Owner/Guest traffic |
| **InternalCallerModule** (Q2) | Credential attachment (internal service JWT), audit-identity forwarding, retry policy (Q1) for every call into `backend-api`'s internal API | Shares the app process; the one component every workflow (W1-W4) depends on | High to `admin-api`'s own capabilities if `backend-api`'s internal listener is unreachable — contained entirely within this Unit, per the fail-closed design in `reliability-design.md` |
| **POI/Event/Account/Locality route handlers (W1-W4)** | Thin request validation + delegation via `InternalCallerModule` | Shares the app process | Same as `InternalCallerModule`'s — these handlers have no independent failure mode of their own |

## Shared Resources

None beyond the app process itself — `admin-api` holds no database connection pool, no cache, and no rate-limit store of its own (its own traffic volume doesn't warrant one).

## Isolation Boundary

The one boundary that matters for this Unit is external to it: the internal-only listener on the `backend-api` side (`u1-backend-api/nfr-design/logical-components.md`'s `InternalAdminAPI` component) that `admin-api` calls into. `admin-api` itself needs no internal isolation boundaries — its entire surface is small enough that further decomposition would be exactly the kind of premature complexity `architecture-guide.md` warns against.

## Traceability

See `traceability.json`.
