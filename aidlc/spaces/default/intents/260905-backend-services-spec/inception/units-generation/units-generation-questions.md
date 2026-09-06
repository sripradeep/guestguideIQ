# Units Generation — Decomposition Plan & Questions

This stage groups the 11 components from `domain-design/components.md` into deployable **Units of Work** — it decides deployment topology, not implementation order (that's Delivery Planning's job). Team practices (`team-practices.md`) commit to: a single new backend repository, a walking-skeleton Bolt first, and no tech stack chosen yet.

---

## Q1: Unit boundary strategy — one deployable service, or split by trust boundary?

Per `architecture-patterns.md`'s decision framework ("start with a modular monolith unless you have proven reasons not to") and the team's small-scale, single-new-repo, walking-skeleton-first practices, the default is **one service unit** containing all 11 components as internal modules. The one genuine alternative worth naming: `Admin` operates under a materially different trust boundary (internal ops staff only — never reachable from the Property Owner or Guest-facing surface) from everything else, which is a real architectural reason to consider splitting it out.

- A. **One service unit** (`backend-api`) — all 11 components as internal modules of a single modular monolith. Simplest to build, deploy, and walk-skeleton first; matches the team's small scale. Admin's trust boundary is enforced at the application layer (routing/auth), not by physical deployment separation.
- B. **Two service units** — `backend-api` (public-facing: everything except `Admin`) and `admin-api` (internal-only: `Admin`, reachable only from an internal network/VPN or separate auth realm). Cleaner trust-boundary separation at the deployment level, at the cost of two things to build, deploy, and walking-skeleton instead of one, plus real inter-service dependencies (`admin-api` still needs to call into `backend-api`'s components' write paths for POI/Event/Locality/Identity operations).
- X. Other (please specify)

[Answer]: B. **Two service units** — `backend-api` (public-facing: everything except `Admin`) and `admin-api` (internal-only: `Admin`, reachable only from an internal network/VPN or separate auth realm). Cleaner trust-boundary separation at the deployment level, at the cost of two things to build, deploy, and walking-skeleton instead of one, plus real inter-service dependencies (`admin-api` still needs to call into `backend-api`'s components' write paths for POI/Event/Locality/Identity operations).

---

## Q2: Unit granularity within each service

Given Q1's two-service answer, should the unit-of-work catalogue enumerate each of the 10/1 components as their own sub-Units within their service, or keep it to one Unit per service (10 components as implementation notes inside `backend-api`, `Admin` alone as `admin-api`)?

- A. One Unit per service (2 Units total: `U1: backend-api`, `U2: admin-api`) — components are implementation notes inside their service's Unit; no component gets its own Unit. Simplest; matches this stage's own guidance to describe topology, not force artificial splits.
- B. Multiple Units within `backend-api` that all share that service's deployment target (`deployment model: shared`) — e.g. a separate `library`-kind Unit for the `Locality` domain-resolution capability every other `backend-api` component calls into.
- X. Other (please specify)

[Answer]: A. One Unit per service (2 Units total: `U1: backend-api`, `U2: admin-api`) — components are implementation notes inside their service's Unit; no component gets its own Unit. Simplest; matches this stage's own guidance to describe topology, not force artificial splits.

---

## Q3: Deployment model

- A. Independent — `backend-api` (`U1`) and `admin-api` (`U2`) each deploy independently as separate services, consistent with Q1's trust-boundary split
- X. Other (please specify)

[Answer]: A. Independent — `backend-api` (`U1`) and `admin-api` (`U2`) each deploy independently as separate services, consistent with Q1's trust-boundary split

---

## Q4: Integration points and contracts

With two services, `admin-api` (`U2`) has a real, non-optional integration point into `backend-api` (`U1`) — it calls `backend-api`'s `PointOfInterest`, `LocalEvent`, `Identity`, and `Locality` modules for every write operation `Admin` performs (per `components.md`'s `Admin.depends_on`). Should this stage name that integration point, or leave it fully to `contract-design`?

- A. Name the integration point now (an internal API `admin-api` calls on `backend-api`, covering POI/Event/Identity/Locality mutations), but leave its exact shape (REST/RPC/schema) to `contract-design` — this stage's job is topology (that a dependency exists and why), not the contract itself.
- X. Other (please specify)

[Answer]: A. Name the integration point now (an internal API `admin-api` calls on `backend-api`, covering POI/Event/Identity/Locality mutations), but leave its exact shape (REST/RPC/schema) to `contract-design` — this stage's job is topology (that a dependency exists and why), not the contract itself.

---

## Consolidated Summary Confirmation

- Two deployable service units (Q1: B, Q2: A):
  - `U1: backend-api` (`u1-backend-api`), kind `service` — 10 components as internal modules: Identity, Subscription, Onboarding, PropertyGuide, PointOfInterest, LocalEvent, ItineraryChat, GuestAccess, LeadCapture, Locality
  - `U2: admin-api` (`u2-admin-api`), kind `service` — `Admin` alone, internal-only (ops staff, never reachable from the Property Owner/Guest-facing surface)
- `U2` depends on `U1` (real inter-service dependency: `admin-api` calls `backend-api`'s `PointOfInterest`/`LocalEvent`/`Identity`/`Locality` modules for every mutation `Admin` performs) — `U1` has no dependency on `U2`
- Deployment model: both independent (Q3)
- Integration point named now (`admin-api` → `backend-api` internal API for POI/Event/Identity/Locality mutations); exact contract shape deferred to `contract-design` (Q4)
- Every `USx.y` from `stories.md` maps to `U1` or `U2` in the story map and traceability — US4.1-US4.4 (Admin's stories) map to `U2` (and, where they also touch owning-component data directly, cross-reference `U1`); all other stories map to `U1`

- Looks correct
- Request changes

[Answer]: Looks correct
