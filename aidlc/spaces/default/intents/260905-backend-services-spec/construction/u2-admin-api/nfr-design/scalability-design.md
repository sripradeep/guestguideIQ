# Scalability Design — u2-admin-api

Concrete design for `nfr-requirements/scalability-requirements.md`'s minimal NFR5.2 target.

## Design

`admin-api` is stateless by the same JWT-based design as `u1-backend-api` — no server-side session state exists to prevent horizontal scale-out, though nothing in this Unit's ops-only load profile is expected to ever require more than a single small instance. No load-based design decision beyond "stays stateless" is needed.

## Traceability

See `traceability.json`.
