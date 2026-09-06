# Functional Design — Plan & Questions — u2-admin-api

`u2-admin-api` hosts only `Admin` (per `domain-design/components.md`), which owns no entities of its own — every one of its four capabilities (POI curation, event management, account lookup, locality-brand management) is a delegated call into `u1-backend-api`'s internal API (Contract 1 in `contract-summary.md`). Almost every design decision here was already made at `domain-design` (ADR-004) and `contract-design`; this pass has one genuine question.

---

## Q1: How should a failed delegated call be surfaced to the ops caller?

When `admin-api` calls `backend-api`'s internal API and that call fails (validation error, conflict, or backend-api itself unreachable), should `admin-api` relay the underlying error as-is, or wrap it in its own error shape?

- A. Relay as-is — `admin-api` passes through `backend-api`'s `ErrorResponse` (code, message, details) unchanged. Simplest; the ops caller sees the real cause (e.g. `AC4.1.2`'s duplicate-POI error) without a translation layer that could lose information.
- B. Wrap in an admin-api-specific error shape — adds a layer of indirection with no story currently asking for it.
- X. Other (please specify)

[Answer]: A. Relay as-is — `admin-api` passes through `backend-api`'s `ErrorResponse` (code, message, details) unchanged. Simplest; the ops caller sees the real cause (e.g. `AC4.1.2`'s duplicate-POI error) without a translation layer that could lose information.

---

## Consolidated Summary Confirmation

- `admin-api` owns no entities of its own (`entities.md` documents this explicitly, per ADR-004 in `domain-design/decisions.md`)
- Every capability is a thin delegation to `u1-backend-api`'s internal API; the actual validation/business logic lives in `u1-backend-api`'s `rules.md` and is cross-referenced, not duplicated
- Failed delegated calls relay `backend-api`'s error as-is (Q1)
- `entities.md`, `rules.md`, `functional-spec.md`, and `traceability.json` will be generated reflecting all of the above, covering US4.1-US4.4 (12 acceptance criteria)

- Looks correct
- Request changes

[Answer]: Looks correct
