# Bolt Plan — GuestGuideIQ Frontend

The ordered build sequence for Construction. A **Bolt** is one build pass over a
piece of the work that ends in something that runs; each has a definition of done
and a confidence hypothesis — the thing shipping it tells us that we do not
already know.

Four Bolts over eight units of work.

## Sequence at a glance

| Bolt | Units | Size | Gated | Startable |
|---|---|---|---|---|
| **B1 — Owner core** | `u1-api-contract`, `u2-design-system`, `u3-foundation`, `u4-owner-shell`, `u5-owner-guide` | XL | **Yes, solo** | Now, against a mocked network |
| **B2 — Owner completion** | `u6-owner-locality-billing` | M | Yes | Now (mocked); real value needs AC4.1.2 + AC4.1.9 |
| **B3 — The link** | `u7-guest-links` | M | Yes | **Blocked on AC4.1.1** — the endpoint does not exist |
| **B4 — Guest app** | `u8-guest-app` | L | Yes | Now (mocked); real value needs AC4.1.9 + AC4.1.6 |

Bolts are grouped by **which backend blocker releases them**, not by product
area. B2 and B4 look unrelated as products and are both "startable now against
mocks, hollow until content resolves"; B3 stands alone because it waits on an
endpoint that has no code anywhere.

---

## B1 — Owner core

**Units:** `u1-api-contract`, `u2-design-system`, `u3-foundation`,
`u4-owner-shell`, `u5-owner-guide`
**Built solo, gated on your approval before B2, B3 or B4 begin.**

### This is a deliberate override of an affirmed practice

`project.md` carries a stamped rule:

> *"ALWAYS run the walking-skeleton Bolt first for the frontend — a thin
> end-to-end slice proving the Owner path (signup through to a published guide),
> solo and gated, approved by the user before remaining Bolts run (Q2).
> (affirmed 2026-09-07)"*

and `org.md` defines the walking skeleton — a minimal end-to-end slice that
proves the architecture works before features are added — as running first when
the scope declares it on, which this one does.

**B1 keeps two-thirds of that mandate and drops one third.** It is still first,
still solo, still gated on explicit approval before anything else runs. It is
**not thin**: it builds all five units to completion, including the account
screen, password reset, session-expiry handling and every other non-skeleton
story those units own.

This was chosen by the human at this stage's gate (Q1 = C), with the conflict
stated, and is recorded here rather than planned around quietly.

**What the override costs.** A thin slice's whole purpose is to discover an
architecture that does not hang together after the smallest possible investment.
B1 defers that discovery until five complete units exist — and every one of them
is built against hand-written fixtures that have never met the real API (Q4 = A).
If the architecture is wrong, or the fixtures are wrong, both are found late and
against more code. The mitigation available inside this choice is ordering: build
the skeleton path **first within B1** and demo it before widening, so the
end-to-end question is at least answered early even though the Bolt does not end
there.

### Build order inside B1

1. `u2-design-system` — no dependencies, blocked by nothing, needed by everything.
2. `u1-api-contract` — hand-written types transcribed from `api-documentation.md`,
   at the path generated output will later occupy.
3. `u3-foundation` — session, transport, error translation, brand parsing.
4. **The skeleton path**: sign up → log in → onboard → author → publish
   (US1.1, US1.3, US1.5, US1.6, US1.7, US1.8) across `u4` and `u5`.
   **Demo here.** This is the moment the architecture question is answerable.
5. The rest of `u4` and `u5`: account screen, password reset, session expiry,
   logout, publication preview.

### Definition of done

- The skeleton path runs end to end against an intercepted network: an account is
  created, authenticated, onboarded, a guide is authored and published.
- The **shrink guard** on the guide save is built and tested — a payload with
  fewer sections than the last loaded state requires explicit confirmation naming
  the sections it removes. Tested with a network double implementing full-replace
  semantics, not a fixture that replays a canned response; against a naive
  fixture this test passes with the defect present.
- Concurrent `401`s collapse into exactly one refresh, and a `401` from the
  refresh call itself ends the session rather than looping.
- All five units' logic components meet the 80% line-coverage floor.
  `u2-design-system` is excluded by ADR-007.
- Build, lint, type-check, test and coverage are green in CI.
- The live-backend suite is **wired but skipped**, with its skip reason naming
  AC4.1.3.

### Confidence hypothesis

*Shipping B1 tells us whether the layering actually holds:* that exactly one
module reaching the network, one parsing errors, and one owning tokens survives
contact with five real units — and specifically whether the deliberate
`ApiClient`/`SessionManager` cycle resolves cleanly in the chosen framework or
turns into a circular-import problem.

*It does not tell us whether any of it matches the real API.* That question stays
open until AC4.1.3 lands.

### Expected demo

An owner signs up on a locality domain, logs in, completes onboarding, writes
guide sections, publishes, and sees the guest-facing preview. Unbranded — the
functional default renders until AC4.1.7 exists.

---

## B2 — Owner completion

**Units:** `u6-owner-locality-billing`

### Definition of done

- Favourites toggle optimistically and revert with an inline notice on failure.
  Every favourite request carries a complete body — the one handler with no
  fallback returns `500`, not `400`, on a bodyless request.
- The subscription screen shows all four controls with upgrade and downgrade
  **visibly disabled** and a reachable explanation.
- **Every plan-change action comes from a fixed typed set and every request
  carries a body**, with a test proving an unrecognised action can never be sent.
- **No automatic retry on an indeterminate outcome** — the app re-reads
  subscription state and asks. Tested.
- The empty-locality state renders the backend's own message, not a competing
  hardcoded string.

### Confidence hypothesis

*Shipping B2 tells us whether the typed-action boundary actually holds under a
real screen* — whether a control can reach the subscription endpoint with
anything other than one of three known values. That is the only thing standing
between a mis-click and a silent cancellation.

### Expected demo

An owner browses locality content, favourites places, starts a subscription and
cancels it with the consequences stated first. **Two things will look wrong and
are correct:** favourites reach no guest (AC4.1.9), and cancelling changes
nothing functional, because nothing in the API gates on subscription status.

---

## B3 — The link

**Units:** `u7-guest-links`

**Blocked on AC4.1.1.** `POST /v1/stays` does not exist in any form — not a stub,
not an internal route. This Bolt cannot start, and no amount of mocking changes
that: the screen was drawn provisionally against an internal function signature,
and two of its behaviours are marked as assumptions to re-verify.

### Definition of done

- A dated form creates a stay link; an invalid range shows a specific inline
  error and creates nothing.
- The property's **time zone** is captured and every displayed date rendered in
  it — and the backend computes expiry in that zone. *This is a requirement this
  project generated: expiry is currently `23:59:59.999` UTC on the checkout date,
  which kills a UTC−5 property's link before the guest has left.*
- The full link is always present as selectable text, never only behind a copy
  control.
- Copy success is announced through a polite live region.
- Previously generated links are listed with their validity state.

### Confidence hypothesis

*Shipping B3 tells us whether the guest-link contract as designed survives the
real endpoint* — specifically whether it returns a full absolute link on the
locality's domain, and whether past stays can be listed back. Both are assumptions
today; AC1.9.4 and AC1.9.5 fail without them.

### Expected demo

An owner picks a stay window, generates a link, and copies it. **The link is not
yet openable** — that is B4.

---

## B4 — Guest app

**Units:** `u8-guest-app`

Independent of `u4-owner-shell`: the guest surface has its own entry point, no
authentication and no dashboard frame. It is the largest genuinely parallel
branch in the topology.

### Definition of done

- The property name and locality name paint **before** tab content, chat
  affordance or theming asset, with no full-page spinner ahead of them.
- No image, and **no placeholder standing in for one**.
- One message for every invalid-link case, with no raw status code.
- Chat replies render as **untrusted text** and never reach a raw-HTML sink,
  with a test proving markup in a reply does not execute.
- The rate-limited state is distinct from the generic error state.
- **Real content resolves.** Places and Events show names and categories from a
  live payload — not from a fixture.

### That last criterion is the point of this Bolt, and it is deliberate

Your stated worry at this stage's gate was that *nothing built yet proves
anything to a guest*, and this Bolt is where that risk concentrates. Built
against mocks (Q4 = A), the Guest app will **demo as complete while the real one
is hollow**: the payload carries bare identifiers the guest cannot resolve, both
list endpoints require an owner token, and the chat provider is `null` in the
deployed configuration.

So B4's definition of done deliberately depends on **live** content resolving,
not on the mocked version rendering. A mocked demo of this Bolt proves the UI and
proves nothing about the product. Marking B4 done on a mock would be the single
most misleading thing this plan could permit.

### Confidence hypothesis

*Shipping B4 tells us whether a guest opening a link gets something worth having.*
Everything upstream is a means to this. If AC4.1.9 never lands, B4 can be
complete and the product still has nothing to show a guest — which is the honest
form of the worry, and the reason this Bolt's done-criteria are written the way
they are.

### Expected demo

A guest opens a stay link on a phone, sees the property name immediately, browses
recommendations with real names and categories, and asks the assistant for an
itinerary.

---

## Sequencing constraints

- **B1 is solo and gated.** Nothing else starts until it is approved.
- **B2, B3 and B4 are independent of each other** and the plan permits them to
  run concurrently where the graph allows (Q3 = B). In practice there is one
  builder and no team-formation stage ran, so parallelism is recorded as
  permitted rather than planned.
- **B3 cannot start at all** until AC4.1.1 exists.
- The topology is respected throughout: no Bolt begins before the units it
  depends on. The full DAG is in `unit-of-work-dependency.md`; the reasoning
  behind this order is in `risk-and-sequencing-rationale.md`.

## Way of working

Short-lived branches off `main`, squash-merged back, one commit per Bolt named by
its slug. Green build, lint, type-check, test and coverage required before merge.
Staging deploy first; production requires manual approval.
