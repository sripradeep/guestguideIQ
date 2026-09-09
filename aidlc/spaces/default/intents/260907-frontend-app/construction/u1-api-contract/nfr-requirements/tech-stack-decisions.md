# Technology Stack — `u1-api-contract`

## This unit does not choose the stack

The frontend's framework, language and hosting target are **OQ4**, deferred to
`infrastructure-design`. Nothing here selects them, and a selection made here
would foreclose a decision that stage owns.

What this unit does is state the **constraints it places on that choice** — the
things that must be true of whatever is picked, for this unit to do its job. They
are stated as requirements on the stack rather than as preferences, because each
one has a consequence if it is not met.

## Constraints on the eventual choice

| # | Constraint | Consequence if unmet |
|---|---|---|
| **TS1** | The language has a **static type system** capable of expressing non-optional fields, closed enumerations, and nullable-but-present values as distinct from absent ones. | This unit's entire value is compile-time. Without it, BR2.1, BR2.2 and BR2.3 have no enforcement point, and the three destructive backend behaviours they guard become runtime hazards with no error to catch. |
| **TS2** | The type system distinguishes **"key absent"** from **"key present, value null"**. | `GuestGuideView.sections` is always present and may be null; `ApiError.details` may be absent entirely. Collapsing the two produces code that checks the wrong condition on the guest's main payload. |
| **TS3** | The build **fails on a type error** rather than warning. A distinct type-check step exists, separate from the build. | The affirmed practice already requires this — it fixes the `astro build` versus `astro check` gap the marketing site never closed. Q1 = A at functional design also depends on it: "code calling a missing endpoint does not compile" is only true if a type error stops the build. |
| **TS4** | Generated or vendored source can be **committed and imported like ordinary source**, with no build-time fetch required. | Vendoring is the delivery mechanism (Contract Design Q5). A stack that can only consume a published package would force a different mechanism and reopen that decision. |
| **TS5** | A **code generator exists** that produces types for that language from OpenAPI or JSON Schema. | Otherwise the transcribed types can never become generated ones, and ADR-006's whole benefit is unreachable regardless of whether the backend publishes anything. |

**TS5 is a soft constraint with a real fallback.** If no generator exists for the
chosen stack, this unit continues in its current transcribed form indefinitely.
That is strictly worse — hand-written types against a prose document — but it is
survivable, and it should not by itself veto an otherwise good stack choice.

**TS1, TS2 and TS3 are hard.** A stack failing any of them makes this unit
pointless: its output would be documentation rather than enforcement, and the
three destructive-request guards would have to be reimplemented as runtime
checks in every consuming unit, where they can be forgotten one call site at a
time.

## Decisions this unit does make

| Decision | Choice | Rationale |
|---|---|---|
| Delivery mechanism | **Vendored** — output committed to this repository, refreshed by a script | Contract Design Q5. No publishing infrastructure exists and this needs none; the diff is visible in review. |
| Source of truth, today | **`api-documentation.md`**, transcribed by hand | Contract Design Q1. No machine-readable contract exists. |
| Source of truth, target | A **published OpenAPI or JSON Schema document**, generated from | ADR-006. Unowned and unscheduled. |
| Endpoint coverage | **Deployed endpoints only** | Functional design Q1 = A. An absent endpoint is a compile error rather than a runtime 404. |
| Unknown-field handling | **Tolerant** — ignored | Functional design Q2 = A. An additive backend change cannot break the frontend. |
| Source integrity | **Pinned and checksum-verified** | NFR7.1, NFR7.2. |
| Freshness | **Scheduled CI regeneration check** | NFR7.6. Addresses vendoring's recorded weakness. |

## What is deliberately not decided here

- **The framework, language and hosting target** — OQ4, `infrastructure-design`.
  The constraints above are inputs to that decision, not a substitute for it.
- **The vendored directory's exact path** — an implementation detail for
  code-generation. What matters at this level is that transcribed and generated
  output occupy the **same** path, so the provenance migration moves no imports.
- **Which generator** — depends on TS5 and therefore on the stack choice.
- **Where the scheduled check runs** — `ci-pipeline` owns that. This unit
  specifies that it must exist and what it must compare.

## A note for `infrastructure-design`

TS1 through TS3 are worth carrying into that stage explicitly. They are easy to
satisfy — most modern frontend stacks meet all three — but they are also easy to
lose sight of when the decision is being made on hosting, bundle size or
developer familiarity.

The specific thing to avoid: a stack where type checking is **advisory**, or
where it runs only in an editor rather than in the build. This project has three
backend endpoints that respond to a malformed request by doing something
destructive and returning success. The types are the only thing standing between
a typo and a deleted guide or a cancelled subscription, and a type system that
does not fail the build is not standing there at all.
