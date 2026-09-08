# Functional Specification — `u7-guest-links`

*Re-confirmed 2026-09-08 after the functional-design redo jump, and re-saved
following that confirmation. Content unchanged.*

Creating a stay link for a validity window, listing what has been generated this
session, and presenting each link copyably.

This unit is `kind: ui`, so it produces no `entities.md` or `rules.md`. **This
file is self-contained**: it is the source of truth for this unit's workflows and
state transitions.

Framework-neutral throughout — the framework is OQ4 and unchosen.

## What this unit does, and does not do

`GuestLinkManagement` (PO-7). It creates the artifact the entire Guest experience
hangs off, and reads nothing the Guest side produces.

**It is blocked differently from every other unit.** The others are blocked on a
*read* they cannot make; this one's central action has **no endpoint at all**.
`POST /v1/stays` is `AC4.1.1` and nothing in the deployed API creates a `Stay`.

**It is the only Owner surface reasoning about time zones**, which is where its
sharpest problem lives.

---

## The three assumptions, marked (Q1 = A)

Per Q1 = A this unit is designed against the internal service signature
`CreateStayInput` — `{ propertyId, checkIn, checkOut }` — because the endpoint is
unwritten and its shape is unagreed. `AC4.1.1` asked for the opposite order; this
is a deliberate departure, and every dependent point is named rather than
inherited.

| # | Assumption | Consequence if wrong |
|---|---|---|
| A1 | The request takes `{ propertyId, checkIn, checkOut }` | The `u1`/`u3` types change; this unit changes at one call site |
| A2 | The response returns the **full absolute link**, not a bare token | `AC1.9.4` cannot be met by this screen at all — it cannot construct the link itself |
| A3 | The response carries `expiresAt` | The screen must compute expiry locally instead (see Workflow 2) |

**A1 and A2 are `refined-mockups`' own `[assumed]` markers**, carried forward
rather than quietly absorbed. **A3 is new at this stage** and is the third thing
this design asks of `AC4.1.1`.

**Why A1 is cheap and A2 is not.** The wire shape is not this unit's to hold:
`u1-api-contract` owns the typed shape and `u3-foundation` owns the request, so
this screen calls a typed method and never sees a body. A1 landing differently
costs one call site here. **A2 is different** — if the endpoint returns a bare
token, no amount of client code can produce a full absolute link on the property's
own locality domain, because the frontend does not know that domain (`AC4.1.7`).

**A fourth gap, which is not an assumption but an absence.** The mockup displays
the property's time zone beneath the dates. **Nothing in the API returns a
property time zone.** There is no field for it on any response the owner can
reach. Until `AC4.1.1` provides one, the screen cannot display it, and every
date the owner reads is in their own browser's zone rather than the property's.

---

## Workflow 1 — Generating a link

| Step | Actor | Action |
|---|---|---|
| 1 | Links | Render the dated form. **Check-in and check-out are dates, not a button** (AC1.9.1). |
| 2 | Owner | Type or pick both dates. Typing alone is always sufficient — no picker need open (`u2`'s BR3.2). |
| 3 | Links | Validate on blur and on submit: checkout must not precede check-in, and neither date may already be past. |
| 4 | Links | Invalid → a **specific inline error on the offending field**, and no request is sent (AC1.9.2). |
| 5 | Links | Valid → send `{ propertyId, checkIn, checkOut }` through `u3-foundation`. |
| 6a | Links | Success → add the link to this session's list, and show it with its expiry (Workflow 2). |
| 6b | Links | Failure → a clear error and **no partial link** (AC1.9.8). |

**Step 4 keeps the request unsent.** A range error is knowable locally, and
spending a rate-limit budget to be told so would be wasteful — but the real reason
is `AC1.9.8`: a half-formed link is worse than none, because the owner may send
it.

**Step 6b's "no partial link" is a rendering rule, not just an error rule.** The
list must not gain an entry for a link that was not created. There is no
half-created state to display.

---

## Workflow 2 — Showing when the link stops working (Q2 = A)

The backend computes stay expiry as **end of the checkout date in UTC**,
regardless of where the property is:

```
expiresAt = new Date(checkOut);
expiresAt.setUTCHours(23, 59, 59, 999);
```

For a property at UTC−5, the link stops working at **18:59:59 local time on
checkout day** — before a guest has finished checking out, on the day they most
need the door code.

| Step | Actor | Action |
|---|---|---|
| 1 | Links | **If the create response carries `expiresAt`, render that.** It is authoritative |
| 2 | Links | Only if it does not, compute end-of-checkout-date UTC locally |
| 3 | Links | Render the moment in the **owner's** local time, labelled as when the link stops working |

**Step 1 is what keeps this from being a duplicated rule.** Rendering a value the
server returned is a display concern. Recomputing the server's rule on the client
is a coupling to an implementation detail, and step 2 is exactly that — which is
why it is a **recorded liability with a removal trigger**, not ordinary logic.

**The label states an observable fact, not a policy.** "This link stops working at
6:59 PM on 14 March" is true and checkable. "Links expire at end of day" is a
policy statement that happens to be false for most properties.

**Removal trigger:** when `AC4.1.1` lands with time-zone-correct expiry, step 2
is deleted and step 1 becomes the only path. If step 2 survives that change it
becomes actively wrong.

**Why this is shown rather than hidden.** The alternative was a checkout date
alone, which is inaccurate for every property not at UTC+0 — and the person who
discovers that gap is a guest standing at a front door.

---

## Workflow 3 — The link list (Q3 = C)

| Step | Actor | Action |
|---|---|---|
| 1 | Links | List the links generated **during this visit**, with the stay window and validity for each (AC1.9.5, partially). |
| 2 | Links | Each entry shows the **full link as selectable text**, always, plus a copy control (AC1.9.6). |
| 3 | Links | State plainly, **with the link rather than after it**, that links are shown for this session and should be sent or saved now. |
| 4 | Owner | Copy. |
| 5 | Links | Confirm **visibly and via a polite live region** (AC1.9.3, AC1.9.7). Never colour alone, never a vanishing toast alone. |
| 6 | Links | Copy unavailable or failed → the control reflects it. The value is already visible, so nothing is lost (`u2`'s BR3.1). |
| 7 | Links | No links yet → the form alone, with "You haven't created any guest links yet." **No empty table.** |

**Step 2 matters more here than anywhere else in the product.** There is no
recovery path: a stay link cannot be re-derived from anything the owner can reach.
A copy control that silently fails — and clipboard access fails silently in more
contexts than people expect — would mean a permanently lost link, not an
inconvenience.

**Step 3's wording must not imply the link is fragile.** The link works fine; it
is the *list* that is not kept. Copy suggesting otherwise would make owners
distrust links that are perfectly good.

**Why the list is not persisted.** `AC1.9.5` asks for the list to survive a return
to the dashboard, and **there is no `GET /v1/stays`** — no endpoint lists an
owner's stays, so only the client could keep it. Browser storage was rejected
because a guest link is a **live, non-revocable credential**: nothing in the API
invalidates a stay link early, so writing them to disk on a possibly shared
machine trades a real security exposure for a convenience. `AC1.9.5` is recorded
as `Deferred` rather than met.

---

## Backend requirements this unit generates

Two requirements and one open question, all from one screen. That is not scope
creep; it is what happens when a unit's central action has no endpoint behind it.

| # | Requirement | Why |
|---|---|---|
| 1 | **Expiry computed in the property's time zone** | `POST /v1/stays` must accept or resolve one. Recorded at `refined-mockups`; restated here because this unit is where it bites |
| 2 | **An owner-scoped `GET /v1/stays`** | New at this stage. Without it `AC1.9.5` cannot be met beyond a session, because a link cannot be re-derived |
| 3 | **Does the response carry `expiresAt`?** | Open question, new at this stage. Determines whether Workflow 2 step 2 is ever needed |

A fourth, following from the time-zone fix: if the property's time zone becomes
known to the backend, **an owner-reachable read should expose it**, or this screen
still cannot show the owner dates in their property's zone.

---

## State machine — the form

| Current state | Event | Guard | Next state | Actions |
|---|---|---|---|---|
| `empty` | Dates entered | — | `ready` | — |
| `ready` | Blur or submit | Range invalid | `invalid` | Inline error on the offending field; **nothing sent** |
| `ready` | Submit | Range valid | `generating` | Send the create request |
| `generating` | Success | — | `ready` | Prepend the link to this session's list; clear the form |
| `generating` | Failure | — | `ready` | Clear error, **no list entry**, no partial link |
| `invalid` | Dates corrected | — | `ready` | Clear the error |

**`generating` never produces a partial entry**, on any path. The list gains an
entry only on a success carrying a full link.

---

## Traceability

This unit carries one story, US1.9, with eight criteria.

**Three are not plainly `OK`:**

| Criterion | Status | Why |
|---|---|---|
| `AC1.9.4` | `Deferred` | The full absolute link on the locality domain needs the endpoint to return it (A2) **and** `AC4.1.7` for the domain |
| `AC1.9.5` | `Deferred` | No `GET /v1/stays`; per Q3 = C the list is session-scoped and says so |
| Every other criterion | `OK` **in design** | But the whole screen is blocked on `AC4.1.1` — it cannot be built at all until the endpoint exists |

**The last row is the honest framing of this unit.** Its behaviour is fully
specified and every criterion but two is satisfiable by that specification. None
of it can be exercised until an endpoint exists. Marking them `OK` records that
the design work is done; it does not claim the screen works.

**A note on the traceability sensor.** As for the other `ui` units,
`produces_kinds` gives them no `rules.md` while the sensor requires one and a
`BRx.y` id in every `OK` target. It reports 7 findings here, every one of that
shape. Its substantive checks all pass: **no gaps, no orphans, nothing missing
from the table and no undeclared upstream id.**

## Verification performed for this unit

No reviewer subagent was dispatched — the human directed that `ui` units be
verified inline. Checked directly rather than assumed:

- **`POST /v1/stays` does not exist.** No stay-creation route appears in
  `api-documentation.md`; the only `/v1/stays/*` routes are the guest-side
  `GET /v1/stays/:token` and its chat sub-route.
- **The expiry computation**, read from
  `guestguideiq-app/src/guestaccess/repository.ts`:
  `expiresAt.setUTCHours(23, 59, 59, 999)` on the checkout date, with the code's
  own comment confirming it is derived from `checkOut`.
- **The internal shape**, read from `src/guestaccess/service.ts`:
  `CreateStayInput { propertyId, checkIn, checkOut }`.
- **No `GET /v1/stays` for owners**, and no property time-zone field on any
  owner-reachable response.
- **Every AC id cited** exists in `stories.md` and says what is claimed.
- **`u2` BR3.1, BR3.2 and BR3.5** exist in that unit's `rules.md` and say what is
  claimed here.

## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Iteration:** 1
**Date:** 2026-09-08
**Request Challenge:** review:4394b71043374f2114440db48bf88642

This unit was fully reviewed earlier in the stage. A redo jump then reset the
stage for bookkeeping reasons unrelated to the designs, clearing the receipts.
This pass re-verified that the recorded verdict still stands.

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| — | — | — | Nothing invalidates the verdict recorded below. The only changes since it were a disclosed provenance line and, in six units, the finding-status vocabulary remap. | None. | Resolved |

### What was re-verified

Every finding recorded as **Resolved** below has its fix genuinely present in
the artifacts, and every finding recorded as **Accepted risk** genuinely remains
unapplied and accurately described. Three highest-consequence claims were
spot-checked directly: ’s BR1.7 and BR3.6 with Workflow 1 steps 6
and 7;  citing ’s BR2.2 rather than BR3.3 for the
closed subscription-action enum; and ’s BR3.5–BR3.7 with both
touch-target tokens.

---

### The review this supersedes, retained in full

#### Review

**Recorded verdict (superseded):** READY
**Prior reviewer:** aidlc-architecture-reviewer-agent
**Prior iteration:** 2
**Prior request challenge:** review:d06a4dbf6ec4175b3809912f64677b3b
**Date:** 2026-09-08

##### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Minor | `functional-spec.md` > The three assumptions, marked | The text says "A1 and A2 are `refined-mockups`' own `[assumed]` markers". PO-7 carries exactly two `[assumed]` tags: one on the full-absolute-link bullet (A2) and one on the **link-list-persistence** bullet — not on the request shape. A1 is the mockup's stated baseline premise, not one of its `[assumed]` markers. The provenance claim is wrong even though every assumption itself is real. | Name the two actual `[assumed]` items — the full link, and the persisted-list gap — and describe A1 as the baseline the screen was drawn against. | Accepted risk |
| R-02 | Minor | `functional-spec.md` > Backend requirements this unit generates, item 1 | "this unit is where it bites" slightly overstates novelty for a reader skimming only this file; the prior origin is correctly disclosed two lines later. Wording nit, not a gap. | None required. | Accepted risk |

##### What the review confirmed

Every substantive claim verified against source. `A1`'s shape matches
`CreateStayInput` in `guestaccess/service.ts` exactly. The expiry defect —
`expiresAt.setUTCHours(23, 59, 59, 999)` on `checkOut` — was confirmed verbatim in
`repository.ts`. **No `timezone` field appears anywhere in `api-documentation.md`**,
confirming the fourth gap this design records.

The "A1 is cheap, A2 is not" argument was independently confirmed: `u3-foundation`
classifies `POST /v1/stays` as `replay-write-fresh`, so it owns the request, while
no owner-reachable response carries a locality or property domain — meaning a
bare-token response genuinely cannot be turned into a link client-side.

The Q2 = A removal trigger was judged **stated clearly enough to act on**: it names
the triggering event and the exact consequence of not acting.

The Q3 = C reasoning was checked against `u5-owner-guide`'s opposite choice and
found sound rather than inconsistent — a live, non-revocable credential is not a
half-typed property name.

Both `Deferred` rows are genuinely blocked: no route creates or lists stays for an
owner, so neither criterion is satisfiable by any client-side design. Of the three
backend requirements this unit records, the owner-scoped `GET /v1/stays` and the
`expiresAt` question are genuinely new; the time-zone fix is correctly disclosed as
a restatement.

##### Why R-01 is Open rather than Fixed

Correcting it would change bytes outside the reviewer-authored appendix after the
verdict, which the review freeze blocks. **The correction, stated here so no
reader is misled:** PO-7's two `[assumed]` markers are on the **full absolute
link** (A2) and on **link-list persistence** — the missing `GET /v1/stays`, which
this design records separately as `AC1.9.5`'s block and as a generated backend
requirement. A1 is the mockup's stated baseline, not an `[assumed]` marker.

Nothing about which assumptions exist, or what they cost if wrong, changes.
Carried to the approval gate.

##### Status vocabulary correction, 2026-09-08

The findings above were originally recorded with the status words `Open` and
`Accepted`, neither of which is in the engine's valid set (`New`, `Unresolved`,
`Resolved`, `Accepted risk`, `Rejected: …`). Both now read `Accepted risk`, which
is also the accurate disposition after the human approved the stage with them
outstanding. **No finding, severity or substance changed** — only the words.

##### Iteration 2 — status vocabulary verification

A narrow verification pass over the remap alone, not a fresh design review. It
confirmed every finding row now carries a status from the engine's valid set,
that no ID, severity, location, finding text or required action changed, and that
no design content outside this Review section was touched.

It also checked the one way the remap could have overstated progress: that every
finding now reading **Resolved** has its corrective action genuinely present in
the artifacts, and every finding now reading **Accepted risk** genuinely remains
unapplied. Both held. It returned no findings.
