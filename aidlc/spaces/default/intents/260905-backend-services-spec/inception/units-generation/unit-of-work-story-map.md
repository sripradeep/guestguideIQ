# Unit Story Map — Backend Services for GuestGuideIQ

Every story from `user-stories/stories.md` mapped to its implementing Unit. Ordering below is the *natural* topological order derived from each story's own `Dependencies` field in `stories.md` — it is not an economic/value/risk sequencing recommendation (that is Delivery Planning's job).

## U1 — `u1-backend-api`

| Order | Story | Directory | Notes |
|---|---|---|---|
| 1 | US1.1 — Create Account | `u1-backend-api` | Depends on US4.4 (`U2`) — see Cross-Cutting Concerns below |
| 2 | US1.2 — Reset Forgotten Password | `u1-backend-api` | Depends on US1.1 |
| 3 | US1.7 — Start a Subscription | `u1-backend-api` | Depends on US1.1 |
| 4 | US1.8 — Manage an Existing Subscription | `u1-backend-api` | Depends on US1.7 |
| 5 | US1.3 — Complete Onboarding Wizard | `u1-backend-api` | Depends on US1.1 |
| 6 | US1.4 — Import Existing Guide from PDF | `u1-backend-api` | Depends on US1.3 |
| 7 | US1.5 — Create and Edit Digital Property Guide | `u1-backend-api` | Depends on US1.3 |
| 8 | US1.6 — Curate Favorite Locality Content | `u1-backend-api` | Depends on US1.5; also US4.1, US4.2 (`U2`, when present) — see Cross-Cutting Concerns |
| 9 | US2.1 — Access Property Guide via Stay-Scoped Link | `u1-backend-api` | Depends on US1.5 |
| 10 | US2.2 — View Property Guide Content | `u1-backend-api` | Depends on US2.1, US1.6; also US4.1, US4.2 (`U2`, when present) |
| 11 | US2.3 — Get a Customized Itinerary via Chat | `u1-backend-api` | Depends on US2.2 |
| 12 | US3.1 — Submit a Lead Form | `u1-backend-api` | No dependencies |
| 13 | US3.2 — See a Clear Error on Submission Failure | `u1-backend-api` | Depends on US3.1 |

## U2 — `u2-admin-api`

| Order | Story | Directory | Notes |
|---|---|---|---|
| 1 | US4.4 — Create and Manage a Locality-Brand Identity | `u2-admin-api` | No dependencies within `U2`; a precondition for `U1`'s US1.1 — see Cross-Cutting Concerns |
| 2 | US4.1 — Curate Initial POI Dataset for a Locality | `u2-admin-api` | No dependencies within `U2` |
| 3 | US4.2 — Manage the Local Events Lifecycle | `u2-admin-api` | No dependencies within `U2` |
| 4 | US4.3 — Review a Property Owner Account | `u2-admin-api` | Depends on US1.1, US1.7 (`U1`) — see Cross-Cutting Concerns |

## Cross-Cutting Concerns (stories spanning multiple Units)

| Story | Units Involved | Nature of the Cross-Cutting Dependency |
|---|---|---|
| US1.1 | `U1` (primary), `U2` (precondition) | Signup cannot succeed until a locality-brand exists for the signup domain to resolve to (US4.4, `U2`) — a genuine cross-Unit story dependency, distinct from the Unit-level DAG direction (which runs the other way: `U2` depends on `U1`, not the reverse). |
| US1.6 | `U1` (primary), `U2` (content source) | Favoriting POIs/events (`U1`, `PropertyGuide`) requires curated content that only exists once `U2`'s US4.1/US4.2 have run at least once; softened per the requirements/stories mob review to tolerate zero-content localities (AC1.6.4). |
| US2.2 | `U1` (primary), `U2` (content source) | Same content-availability relationship as US1.6, one hop further downstream (Guest-facing guide view). |
| US4.1 | `U2` (primary), `U1` (write target) | Curating a POI (`U2`, `Admin`) is implemented as a call into `U1`'s `PointOfInterest` write surface — the Unit-level dependency edge this story exercises. |
| US4.2 | `U2` (primary), `U1` (write target) | Same relationship as US4.1, against `U1`'s `LocalEvent`. |
| US4.3 | `U2` (primary), `U1` (read target) | Account lookup (`U2`, `Admin`) is implemented as a call into `U1`'s `Identity`. |
| US4.4 | `U2` (primary), `U1` (write target) | Locality-brand management (`U2`, `Admin`) is implemented as a call into `U1`'s `Locality`. |

## Coverage Verification

- Every story (US1.1–US4.4, 16 stories) is assigned to exactly one primary Unit — none unassigned.
- Both Units have at least one story: `U1` has 13, `U2` has 4.
- Every cross-cutting dependency identified above is also reflected in `unit-of-work-dependency.md`'s Unit-level DAG (`U2` → `U1`) or flagged as a story-level exception to it (US1.1's dependency on US4.4).
