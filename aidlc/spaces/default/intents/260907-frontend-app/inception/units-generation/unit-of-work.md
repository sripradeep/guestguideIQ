# Units of Work — GuestGuideIQ Frontend

> **Correction, 2026-09-08 — a ninth unit was added after this artifact was
> approved.** `u9-guest-guide-view` was created at Construction `functional-design`
> as a direct consequence of a human decision at `u5-owner-guide`'s gate (its
> Q2 = C). `AC1.8.4` requires the owner's preview to show the guest screen
> "exactly as a guest would see it"; the alternatives were a `u5` → `u8`
> dependency edge between two units deliberately kept independent, or a second
> implementation that would silently diverge. The shared rendering could not go
> into `u2-design-system`, because it renders guide sections and `u2`'s BR1.1
> forbids a primitive knowing what a guide is.
>
> This correction is disclosed in place rather than applied silently. The Unit
> Index, the dependency artifact, and `u8-guest-app`'s already-written functional
> design were all revised; `delivery-planning/bolt-plan.md` sequenced eight units
> and has **not** been revised — that is recorded as an open item for the
> functional-design approval gate.

Eight units grouping the fourteen components from `components.md`. Units are
build-time and ownership boundaries, not deployment targets: the affirmed
practice is that the Owner and Guest surfaces **deploy together, not split**, so
every unit ships in the same artifact.

**Unit numbers are identity, not order.** This stage describes what *may* depend
on what. Which unit is built first, and why, is Delivery Planning's decision.

## Unit Index

| Unit ID | Directory | Kind | Complexity | Deployment |
|---|---|---|---|---|
| U1 | `u1-api-contract` | spec | S | shared (consumed in place) |
| U2 | `u2-design-system` | library | L | embedded |
| U3 | `u3-foundation` | library | M | embedded |
| U4 | `u4-owner-shell` | ui | L | embedded |
| U5 | `u5-owner-guide` | ui | L | embedded |
| U6 | `u6-owner-locality-billing` | ui | M | embedded |
| U7 | `u7-guest-links` | ui | M | embedded |
| U8 | `u8-guest-app` | ui | M | embedded |
| U9 | `u9-guest-guide-view` | ui | S | embedded |

`U8` was sized **L** when it also owned the guest rendering. That rendering moved
to `U9` in the 2026-09-08 correction above, so `U8` is now **M**: it keeps the
route model, the stay resolution, the chat widget and the degraded states.

---

## U9 — `u9-guest-guide-view`

**Kind:** ui · **Complexity:** S · **Deployment:** embedded
*Added 2026-09-08 — see the correction note at the top of this file.*

**What it owns.** The rendering of a `GuestGuideView`: the identity block, the
three tabs and their empty states, and the not-yet-published placeholder. It is
handed a shape and draws it.

**Boundary.** Presentation only. It **makes no request, resolves no brand, holds
no session and owns no route.** Everything it renders arrives as an input.

**Why it exists.** `AC1.8.4` requires the owner's preview to show the guest screen
*"exactly as a guest would see it"* — a claim that has to stay true over time, not
only on the day it is written. Two units need the same rendering:
`u8-guest-app` serves it to guests, and `u5-owner-guide` shows it inside a
labelled preview frame. A second implementation would make the criterion false the
first time one copy changed and the other did not, silently and with no test that
would catch it.

**Why not in `u2-design-system`.** It renders guide sections, so it knows what a
guide is — and `u2`'s BR1.1 forbids exactly that. It is the rule that pushed eight
components out of `u2` in the first place, and bending it here to avoid a new unit
would have undone that boundary.

**Implementation notes and constraints.**

- Depends on `u2-design-system` alone. Neither consumer is reachable from it, so
  the graph stays acyclic.
- The **paint ordering** it must preserve is `AC2.1.1`'s: the property name and
  locality name first, before tab content or any theming asset.
- **No image input, and none may be added** (AC2.1.5). No photo exists anywhere in
  the system.
- **Two of three tabs are empty** for every guest until `AC4.1.9`, and the empty
  state must carry in the accessibility tree (`u2`'s BR3.3) rather than being
  merely drawn.
- Sized **S**: it is presentation over `u2` primitives with no logic of its own
  beyond which panel is selected.

---

## U1 — `u1-api-contract`

**Kind:** spec · **Complexity:** S · **Deployment:** shared, consumed in place

**What it owns.** The frontend's typed view of the backend API: the generated
request and response types, and the generation step that produces them from the
contract the backend publishes.

**Boundary.** It owns types and the generation wiring. It owns no runtime
behaviour, makes no requests, and holds no state. Nothing in it is
hand-written — a hand-edited type here is the exact drift this unit exists to
prevent.

**Why it is separate.** A different lifecycle from everything else: it
regenerates when the backend publishes a new contract, not when any frontend
feature changes. Making it a unit puts the one external blocker where the
topology can show it.

**Implementation notes and constraints.**

- Blocked on the backend publishing a machine-readable contract (ADR-006), which
  is an addition to a follow-up that already has no owner and no schedule.
- Consumed across a repository boundary, so it arrives as a published package or
  a git dependency, not a shared folder. That plumbing is part of this unit.
- **A fallback exists and should be planned for**: if the contract does not
  arrive, the frontend falls back to hand-written types reviewed against
  `api-documentation.md`, and the thin live-backend suite becomes the only drift
  detector. That is the pre-ADR-006 position, and it is strictly worse — but it
  is not a stopped project, and Delivery Planning should know the unit degrades
  rather than blocks.

---

## U2 — `u2-design-system`

**Kind:** library · **Complexity:** L · **Deployment:** embedded

**What it owns.** `DesignSystem` — the product's visual and interaction
primitives: inputs, buttons, banners, dialogs, tabs, navigation, date fields,
copyable values, with their states, keyboard behaviour, focus management and
live-region announcements built in.

**Boundary.** It owns presentation and interaction. It owns no domain state, no
network access, and no knowledge of where theme tokens came from — it consumes
tokens, it never resolves them.

**Why it is separate.** Three reasons that reinforce each other: a different
change rate from any feature, zero dependencies (so it can be built first or last
without blocking anything), and ADR-007's coverage exclusion, which is only
robust if the boundary is structural rather than a path pattern inside another
unit.

**Implementation notes and constraints.**

- This unit is where WCAG 2.1 AA lives. `accessibility-checklist.md`'s Operable
  and Robust sections are almost entirely this unit's responsibility — meeting
  the standard is a property of the primitives, not a per-screen effort.
- Excluded from the 80% coverage floor (ADR-007). It is still exercised by the
  scenario tests that mount it; it simply does not inflate the metric.
- Sized L not because any one primitive is hard, but because there are many and
  each carries real keyboard, focus and announcement behaviour. The date field
  and the modal surfaces are the two with genuine complexity.

---

## U3 — `u3-foundation`

**Kind:** library · **Complexity:** M · **Deployment:** embedded

**What it owns.** The four components at the bottom of the dependency graph:
`ApiClient`, `SessionManager`, `ApiErrorCatalog` and `LocalityBrandResolver`.

**Boundary.** Everything that talks to the backend or interprets what it returns.
Nothing above this unit calls the network, reads a token store, reads a raw HTTP
status, or touches the unparsed `visualStyling` blob.

**Why it is separate.** It is the reversibility boundary. Where tokens live
(OQ3) and whether the app eventually sits behind a same-origin proxy are both
undecided, and confining transport and token handling here is what keeps those
decisions cheap.

**It renders nothing.** Like `u1-api-contract` and `u2-design-system`, this unit
has no screens and carries no stories: its behaviour is what every story's
acceptance criteria depend on, not something a user sees directly. The session
logic behind signup, login and session expiry lives here; those **screens** are
owned by `u4-owner-shell`.

**Implementation notes and constraints.**

- Contains the design's one **deliberate dependency cycle** — `ApiClient` and
  `SessionManager` depend on each other (ADR-003). Both being in the same unit
  makes that containable: the cycle never crosses a unit boundary.
- The single-flight refresh is the most intricate logic in the frontend. The
  backend's refresh-token store is per-process across 2–6 tasks, so parallel
  refreshes race and revoke each other, and a `401` from the refresh call itself
  must end the session rather than trigger another refresh or the client loops.
- `ApiErrorCatalog` must define both a non-envelope fallback and an
  unrecognised-code default. Eleven codes are catalogued today; a twelfth must
  not crash the app.
- Enforces two invariants that exist because of specific backend behaviour: every
  request carries a complete body, and `PATCH /v1/subscriptions`' action comes
  from a fixed typed set.
- Blocked on `u1-api-contract` for its types, and on AC4.1.8 (cross-origin
  tenancy) before any request can succeed at all.

---

## U4 — `u4-owner-shell`

**Kind:** ui · **Complexity:** L · **Deployment:** embedded

**What it owns.** `AppShell` and `AccountView`, and **every Owner screen that is
not a feature**: the owner route table across both its unauthenticated and
authenticated halves, route guards, the persistent navigation frame, the header
user menu, and the read-only account screen.

Concretely, the screens in this unit are:

| Screen | Story | Authenticated |
|---|---|---|
| PO-1 Sign Up | US1.1 | no |
| PO-0 Signups Unavailable | US1.2 | no |
| PO-9 Log In | US1.3 | no |
| PO-2 Reset Password | US1.4 | no |
| Session-expired state | US1.10 | yes |
| Logout control (header user menu) | US1.11 | yes |
| PO-8 Account | US1.15 | yes |

**Boundary.** The frame and the doors. It owns routing, the surfaces by which a
session is created or ended, and identity display. It owns no feature's business
rules; every feature unit renders inside the frame it provides.

The **logic** behind the access screens is not here — session lifecycle,
single-flight refresh and error-envelope translation all live in
`u3-foundation`, and this unit consumes a resolved session object and typed
errors like every other consumer. The forms themselves are thin, assembled from
`u2-design-system` primitives.

**Why it is separate.** A different lifecycle from any feature — routing changes
when navigation structure changes, not when a business rule does — and it is the
common dependency of all three Owner feature units, so keeping features out of it
keeps them independent of each other.

**Why the unauthenticated screens are here and not in the foundation.** The
substance of the auth stories is session behaviour, which is why it was tempting
to place them with `SessionManager`. But `u3-foundation` renders nothing: putting
those stories there left the signup and login screens with no owning unit at all,
on the walking-skeleton path — the defect this revision fixes. Routing already
belongs to this unit, and "which screens are reachable without a session" is a
routing concern, so the access screens sit with the route table that admits them.

**Implementation notes and constraints.**

- **The login error is non-disclosing** (AC1.3.2): a wrong password and an unknown
  username produce one identical message, in a banner above the form rather than
  per-field. Per-field errors would disclose which usernames exist. This is the
  one deliberate exception to the per-field validation rule everywhere else.
- **No locality selection appears on signup** (AC1.1.1). The locality is resolved
  from the address and assigned silently; a visible picker would contradict the
  tenancy model.
- **PO-0 replaces the signup screen entirely** rather than showing a banner over
  it, and carries no theme of any kind — nothing resolved, so nothing is claimed.
- Carries the shell-level **logout control** (AC1.11.3). US1.11 is Must and
  US1.15 is Should, so routing the only logout through the Account screen would
  leave the Must story with no reachable trigger.
- Presents the **session-expired state** over whatever screen is open, preserving
  that screen's in-progress state behind it (AC1.10.3).
- Routes a just-authenticated owner by onboarding state rather than asking them
  to choose.
- `AccountView` is deliberately thin: three read-only values, a link to
  subscription, and logout. The API allows nothing else — no email is collected,
  and there is no password-change or property-name-edit endpoint.
- **Password reset cannot be completed end to end**: the route discards the token
  it generates and there is no mailer. The request and expired-link screens are
  buildable and testable; the middle of the flow is not.
- Resized **S → L** in revision. It was sized S when it held only the frame and
  the account screen; it now carries four additional screens and the product's
  entire authentication surface.

---

## U5 — `u5-owner-guide`

**Kind:** ui · **Complexity:** L · **Deployment:** embedded

**What it owns.** `OnboardingFlow` and `GuideAuthoring` — the forward-only
onboarding wizard with its client-held draft, and the guide editor with its save
discipline, publication state and guest-view preview.

**Boundary.** Everything between "the owner has an account" and "a guest could
read something". It owns the guide's content model and every write to it.

**Why these two are one unit.** They are the walking skeleton's content, they
hand directly from one to the other (onboarding completes into the editor), and
they share the constraint that shapes both: an API that cannot read back what was
submitted.

**Implementation notes and constraints.**

- **This unit contains the highest-risk write path in the product.** The guide
  save is a full replace, and a request whose `sections` key is missing or
  misspelled returns **`200` with every section deleted** rather than an error.
  The shrink guard (Q5 at Refined Mockups) is not a nicety.
- Owns `OnboardingDraft`, the design's only client-side entity with no backend
  counterpart (ADR-004). It exists because `GET /v1/onboarding` returns
  `{ currentStep, completed }` and nothing else.
- The step machine is strictly forward, so backward movement is **review-only**.
  An owner who mistypes the property name cannot correct it here or anywhere —
  and that name is the guest's trust cue.
- No PDF upload control is rendered; that path is deferred (AC1.6.2).
- Sized L: two substantial surfaces, a destructive-write guard, a draft model
  with no server counterpart, and a preview that renders another unit's view.

---

## U6 — `u6-owner-locality-billing`

**Kind:** ui · **Complexity:** M · **Deployment:** embedded

**What it owns.** `LocalityCuration` and `SubscriptionManagement` — browsing the
locality's points of interest and events with favourite selection, and reading
and changing the subscription.

**Boundary.** The two Owner surfaces that are neither authoring nor navigation.

**Why these two are one unit.** Not domain affinity — they have little in common
— but delivery shape: both are self-contained Owner screens outside the skeleton,
both depend only on the shell, and both are individually too small to justify
their own boundary at the granularity chosen. **This is the weakest cohesion
boundary in the decomposition and is recorded as such**; if either grows, it
splits cleanly along the component line.

**Implementation notes and constraints.**

- **`SubscriptionManagement` carries billing consequences.** The endpoint's final
  `else` branch cancels the subscription on any unrecognised action, and a
  missing body reaches that branch. No automatic retry on an indeterminate
  outcome, ever — re-read state and ask the owner.
- Upgrade and downgrade render **disabled with an explanation**: only one tier
  exists and neither action changes an observable field.
- `LocalityCuration`'s favourite requests must carry a complete body — this is
  the one backend handler without a body fallback, so a bodyless request returns
  `500` rather than `400`.
- **This unit's user-facing value is deferred, not delivered.** Nothing curated
  here reaches any guest until AC4.1.9, and nothing anywhere in the API gates a
  feature on subscription status. Both screens work; neither yet does what the
  owner expects it to do.

---

## U7 — `u7-guest-links`

**Kind:** ui · **Complexity:** M · **Deployment:** embedded

**What it owns.** `GuestLinkManagement` — creating a stay link for a validity
window, listing previously generated links, and presenting them copyably.

**Boundary.** The bridge between the Owner and Guest surfaces. It creates the
artifact the entire Guest experience hangs off, and owns nothing the Guest side
reads.

**Why it is separate.** The only component reasoning about time zones and
validity windows, and the only Owner surface whose output another surface
consumes. It is also blocked differently from its siblings — on an endpoint that
does not exist at all rather than on a missing read.

**Implementation notes and constraints.**

- **Blocked on AC4.1.1**: `POST /v1/stays` does not exist. Its screen was drawn
  provisionally against the known internal `createStay` shape, with two items
  marked as assumptions to re-verify.
- Carries a **backend requirement this project generated**: link expiry is
  computed as `23:59:59.999` UTC on the checkout date, which kills a UTC−5
  property's link before the guest has left. Expiry must be computed in the
  property's time zone, which means the endpoint must accept or resolve one.
- The full link is always selectable text, never only behind a copy control —
  clipboard access fails silently in more contexts than people expect, and an
  owner who cannot get the link cannot host their guest.
- Copy confirmation announces through a polite live region, never by colour or a
  vanishing toast alone.

---

## U8 — `u8-guest-app`

**Kind:** ui · **Complexity:** L · **Deployment:** embedded

**What it owns.** `GuestGuide` and `ItineraryChat` — the guest's read-only stay
view resolved from a link token, and the conversational assistant scoped to it.

**Boundary.** Everything a guest sees. No authentication, no account, no
dashboard frame, and no shared model with the Owner's guide (ADR-002).

**Why it is separate, and independent.** It is a distinct bounded context with
its own entry point. It does **not** depend on the Owner shell — making it wait
on Owner routing would encode a dependency that does not exist. This is the
largest genuinely parallel branch in the topology.

**Implementation notes and constraints.**

- **Identity-first render ordering is a hard requirement, not a preference.** The
  property name and locality name paint before tab content, the chat affordance
  or any theming asset, with no full-page spinner ahead of them. Sam is often
  standing at a front door with a bag; the first thing on screen is proof the
  link is theirs.
- **No image, and no placeholder standing in for one** (AC2.1.5). A generic photo
  is worse than none — it weakens exactly the specificity the cue exists for.
- **Two of three tabs are empty for every guest, on every stay, until AC4.1.9.**
  The payload carries unresolvable ids, so Places and Events render empty states
  and no raw identifier is ever displayed.
- Chat replies are **untrusted text** and never reach a raw-HTML sink (AC2.4.6):
  the guest's own message round-trips through a model.
- The deployed chat provider is `null`, so the success path is not demonstrable
  end to end. Every failure state is testable; the happy path is not.
- Renders the invalid-link screen **branded** (ADR-005) — which cannot take
  effect until AC4.1.7's unauthenticated branch exists, because a `410` carries
  no payload to resolve a brand from.
- Sized L: two surfaces, strict render ordering, degraded-connectivity and
  rate-limited states, and untrusted-content handling.

---

## Coverage boundary (ADR-007)

The 80% line-coverage floor applies to `u3-foundation` in full, and to the
view-state and validation logic inside `u4` through `u8`. **`u2-design-system` is
excluded**, as are presentational components inside the `ui` units, generated
route files, story files and mock-service definitions. `u1-api-contract` is
generated code and is excluded by the same rule.

The floor is enforced in the test runner's own configuration, not only in CI, so
the same gate fires locally.

## External prerequisite — not a unit

`US4.1` is the backend follow-up. It is not a unit of this frontend: it is
another team's work, in another repository, and nobody here can estimate, build
or complete it. Recording it as a unit would put unownable work in this list.

Each blocked unit names the specific acceptance criterion it waits on:

| Blocked unit | Waits on | What is missing |
|---|---|---|
| `u1-api-contract` | AC4.1.10 (extended by ADR-006) | A published machine-readable contract |
| `u3-foundation` | AC4.1.8 | Cross-origin tenancy resolution — today every call fails |
| `u3-foundation` | AC4.1.4, AC4.1.5 | Current-account read and logout/revocation |
| `u4-owner-shell` | AC4.1.4, AC4.1.5 | Session restore on reload; server-side logout, without which logout is a client-side discard leaving a valid refresh token alive for up to seven days |
| `u4-owner-shell` | AC4.1.7 | The locality brand read, for branded signup and login; and to determine that a domain maps to nothing before showing a form at all (PO-0 is otherwise unreachable in practice) |
| `u5-owner-guide` | AC4.1.7 | The locality brand read, for branded rendering |
| `u6-owner-locality-billing` | AC4.1.2, AC4.1.9 | Plan/status read; guest-resolvable locality content |
| `u7-guest-links` | AC4.1.1 | `POST /v1/stays` does not exist |
| `u8-guest-app` | AC4.1.6, AC4.1.7 | Chat history, brand read |
| `u9-guest-guide-view` | AC4.1.9 | Resolvable favourites — until then two of its three tabs are empty for every guest |

**Only `u2-design-system` and `u9-guest-guide-view` are unblocked today.** `u9` is
unblocked in the narrow sense that it can be built and tested against a supplied
shape; what it renders is still two-thirds empty until `AC4.1.9`. Seven of nine
units wait on work that has no owner and no schedule, and the follow-up grew three
times during Inception without being re-scoped — and twice more at Construction:
`u7-guest-links` added an owner-scoped `GET /v1/stays` and an `expiresAt` question
to `AC4.1.1`, and `u5-owner-guide` added a property-name edit endpoint.

## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-09-08T02:44:26Z
**Iteration:** 2

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Critical | `unit-of-work.md` § U4, § U3; `unit-of-work-story-map.md` "Where the auth and session stories sit" | US1.1/US1.2/US1.3/US1.4/US1.10/US1.11 (and US1.15) are now assigned to `u4-owner-shell`, which explicitly owns PO-1, PO-0, PO-9, PO-2, the session-expired state, the logout control and PO-8. `u3-foundation` now states plainly "It renders nothing" and carries zero stories/screens. Verified against `refined-mockups/mockups.md`: PO-1, PO-0, PO-9, PO-2, PO-8 all exist there and map to exactly these stories, and the walking-skeleton path (PO-1 → PO-9 → PO-3 → PO-5) is fully covered — PO-1/PO-9 by `u4`, PO-3/PO-5 by `u5-owner-guide`. No unit both claims "renders nothing" and owns a screen. | None — resolved. | Resolved |
| R-02 | Major | `unit-of-work-dependency.md` § Edge block, § Dependency graph, § Why each edge exists, § Integration points | The `yaml` block now gives `u5`, `u6`, `u7` direct `depends_on` edges to both `u2-design-system` and `u3-foundation` in addition to `u4-owner-shell`. The mermaid diagram, its text fallback, the "why each edge exists" table (explicitly labelled "Direct, not transitive" with a components.md citation), and the prose "Integration points" table all agree with the edge block. Re-ran the graph programmatically with the new edges: acyclic, confirmed. The "Parallel development opportunities" section was also updated to explain the added edges don't change any parallelism set (they were already transitively implied), which is accurate. | None — resolved. | Resolved |
| R-03 | Minor | `unit-of-work.md` § U1 — `u1-api-contract` | `kind: spec` may still understate the codegen and cross-repo packaging/publishing plumbing this unit owns. Deliberately left unaddressed in this revision, per the dispatch brief, to be settled by the human at the gate rather than resolved unilaterally. | Confirm with the human at the gate whether `spec` is the right `kind`, or whether `packaging` (or `spec` plus an explicit note on which construction artifacts still apply) fits better. | Unresolved |

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| Manual DAG cycle check (Python, edges from `unit-of-work-dependency.md`'s yaml block) | No cycle detected | Confirms R-02's acyclicity claim after the added edges |
| Cross-reference check: components.md vs. unit ownership | All 14 components (`ApiClient`, `SessionManager`, `ApiErrorCatalog`, `LocalityBrandResolver`, `AppShell`, `AccountView`, `OnboardingFlow`, `GuideAuthoring`, `LocalityCuration`, `SubscriptionManagement`, `GuestLinkManagement`, `GuestGuide`, `ItineraryChat`, `DesignSystem`) found and consistently assigned | No orphaned or duplicated component ownership across units |
| Cross-reference check: mockups.md screen IDs (PO-0, PO-1, PO-2, PO-8, PO-9) referenced in revised U4 table | All five screens found in `mockups.md`, mapped to the same stories | The revised U4 screen table is accurate, not fabricated |
| traceability.json vs. story-map/unit-of-work.md | All 20 frontend stories `OK` with matching targets; US4.1 `Deferred` with an explicit external-prerequisite rationale | Consistent with the disclosed, not-for-relitigation US4.1 gap |

### Summary

Both prior blocking findings are genuinely closed by this revision, not merely asserted closed: R-01's fix gives every walking-skeleton screen an owning unit while keeping the session-logic delegation as an explicit cross-cutting note, and R-02's fix makes the yaml edges, diagram, text fallback and prose consistent, with acyclicity holding under the added edges. The widened `u4-owner-shell` (L, seven stories) and the three-story-less-unit shape are both explicitly named and justified in the artifacts rather than glossed over, so they read as disclosed trade-offs rather than defects. R-03 remains open by design, carried forward for the human to settle at the gate. No new Critical or Major findings surfaced.
