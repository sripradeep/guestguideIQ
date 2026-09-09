# Functional Design — `u6-owner-locality-billing`

Three questions.

**What this unit is.** `LocalityCuration` and `SubscriptionManagement` — browsing
the locality's points of interest and events with favourite selection (PO-6), and
reading and changing the subscription (PO-4).

It is `kind: ui`, so this stage produces `functional-spec.md`,
`frontend-components.md` and `traceability.json`.

**Why these two are one unit, stated honestly.** Not domain affinity — they have
little in common — but delivery shape: both are self-contained Owner screens
outside the skeleton, both depend only on the shell, and both are individually too
small to justify their own boundary. `unit-of-work.md` records this as **the
weakest cohesion boundary in the decomposition**, and names the line it would
split along if either grows.

**Both screens work; neither yet does what the owner expects.** Nothing curated
here reaches any guest until `AC4.1.9`, and **nothing anywhere in the API gates a
feature on subscription status** — no route, service or middleware outside
`src/subscription/` reads it. Cancelling has no functional effect on the guide,
the guest link, or chat.

**What is already settled.** The `action` value is a closed typed set and never a
bare string — `u1-api-contract`'s BR3.3 makes anything else unconstructable and
`u3-foundation`'s BR3.3 refuses it at run time, because the endpoint's final
`else` branch **cancels the subscription** on anything unrecognised. Every
favourite request carries a complete body (`AC1.12.6`), because that handler is
the one in the file without a `?? {}` fallback and returns `500` rather than `400`
without one. No automatic retry on an indeterminate outcome, ever (`AC1.14.5`).

---

## Q1 — What happens when the owner toggles favourites quickly?

`AC1.12.2` requires a favourite to update **immediately** and revert with an
inline notice if the request fails. That is an optimistic update, and optimistic
updates race.

The specific hazard here: the favourites endpoints return **the whole
`OwnerGuideView`**, not just the toggled item. So two toggles in flight return two
full snapshots, and if they resolve out of order the older snapshot overwrites the
newer one — silently reverting a change the owner can see they made.

- **A. Serialise per item.** A given item's toggle is disabled while its own
  request is in flight; different items toggle freely in parallel. Simple, and the
  owner cannot create the race. Cost: a brief moment where the item they just
  clicked cannot be clicked again, which on a slow connection is visible.
- **B. Reconcile from the response, last response wins.** Toggles fire freely;
  each response replaces the local view. Cost: **this is the bug, not the fix** —
  out-of-order responses are exactly how the newer state gets overwritten. It is
  listed because it is what a straightforward implementation does by default, and
  it should be rejected explicitly.
- **C. Optimistic with a per-item sequence number.** Toggles fire freely; a
  response is applied only if it is not stale for that item. Correct under any
  ordering, and nothing is ever disabled. Cost: real bookkeeping in a screen that
  is otherwise simple, and it is the kind of logic that looks unnecessary until
  the day it isn't.
- **X. Other (please specify)**

[Answer]: B

---

## Q2 — What does the subscription screen show, when the state cannot be read?

**There is no `GET /v1/subscriptions`.** The API documentation states the
consequence directly: *"The current plan and status cannot be read without
mutating. A 'manage subscription' screen has no safe way to render current state;
the only value it can show is whatever the last mutation returned."*

So `AC1.14.1` — "I see my current plan and status" — is blocked on `AC4.1.2`. But
`AC1.14.4` also says that with **no** active subscription, upgrade, downgrade and
cancel are disabled and only Start is available — and the screen **cannot know
which case it is in.**

There is no safe probe. `PATCH` cancels on anything unrecognised. `POST` creates a
subscription, and returns `404` if no `SubscriptionRecord` row exists at all.

- **A. An explicit unreadable state.** The screen says plainly that the current
  plan and status cannot be shown yet, offers Start, and presents upgrade,
  downgrade and cancel as unavailable **for that reason** rather than implying the
  owner has no subscription. Honest, and it does not assert a state it cannot
  know. Cost: `AC1.14.4`'s specific "start a subscription first" explanation is
  replaced by a different one, so the criterion is met in shape but not in wording.
- **B. Remember the last mutation's response and render it as last-known state.**
  After any Start or change, the screen shows what came back, labelled as
  last-known rather than current. Cost: an owner who has never mutated sees
  nothing, an owner returning in a new session sees nothing, and a "last known"
  billing state that may be months stale is arguably worse than no state — this is
  billing, where a confident wrong answer costs more than an absent one.
- **C. Show the actions only, with no state at all.** No claim about plan or
  status anywhere on the screen. Cost: the screen's entire stated purpose is "see
  my plan and status", so this is `AC1.14.1` unmet without saying why — the gap
  becomes invisible rather than disclosed.
- **X. Other (please specify)**

[Answer]: C

---

## Q3 — Does the curation screen tell the owner that no guest can see any of this?

`US1.12`'s own note is blunt: **until `AC4.1.9` lands, nothing curated here is
visible to any guest.** The stay payload carries bare ids and both list endpoints
require an owner JWT, so a guest cannot render a name, a category or a date. The
story's stated benefit — "my guide carries the recommendations I actually trust" —
is deferred, not delivered.

The screen works. An owner can browse, favourite and unfavourite, and every one of
those actions persists. None of it reaches anybody.

- **A. Say so on the screen.** A persistent notice: these recommendations are
  saved, and will appear in guests' guides once the guest view supports them.
  Honest, and it matches how this project has handled every other gap — the
  unbranded default, the missing preview, the untestable reset flow. Cost: it
  advertises an incompleteness on a screen the owner might otherwise enjoy using,
  and the notice has to be removed when `AC4.1.9` lands or it becomes a lie in the
  other direction.
- **B. Say nothing.** The screen behaves correctly and the deferral is recorded in
  the artifacts, not in the UI. Cost: an owner curates recommendations believing
  their guests are seeing them, and finds out otherwise from a guest — which is
  the worst possible way to learn it.
- **X. Other (please specify)**

[Answer]: A

---

## Consolidated Summary Confirmation

- **Q1 = B** — Reconcile from the response; last response wins.
- **Q2 = C** — Show the actions only; make no claim about plan or status.
- **Q3 = A** — Say on the curation screen that these recommendations do not yet
  reach guests.

**Q1 = B: I flagged this option as the defect, so I am stating the concrete
failure once and then building it.** The scenario: the owner favourites item A,
then item B within about a second. A's response — a full `OwnerGuideView` snapshot
taken before B was applied — lands after B's. B's toggle visibly reverts. Nothing
the owner did was lost on the server; the *display* is wrong until the next read.

Three things make this less serious than the shape suggests, and they are why B is
defensible rather than merely chosen:

1. **It is recoverable and self-evident.** The owner sees the toggle flip back and
   clicks again. Unlike the guide save, no work is destroyed.
2. **The server state is correct throughout.** Only the local view is stale.
3. **Nothing downstream depends on it today.** Until `AC4.1.9`, no guest sees any
   of these favourites at all.

**What I am building to bound it**, none of which is a change to the answer:

- **A failure still reverts and notices inline** (AC1.12.2) — unchanged.
- **The screen re-reads on navigation back to it**, so a wrong display never
  outlives the visit.
- **The race is recorded in the artifact as a known limitation**, with the
  per-item fix named, so whoever meets it is not rediscovering it.

If you would rather have the safe version, "serialise per item" is a one-line
change and costs only a brief disabled moment on the item just clicked. Say so and
I will switch it.

**Q2 = C: what "actions only" actually resolves to.** No claim about plan or
status appears anywhere. That leaves the four controls, and each has a knowable
disposition even though the *state* is unknowable:

| Control | Disposition | Why it is knowable |
|---|---|---|
| Start | Available | It is always a valid attempt; `404` and `402` are handled |
| Upgrade | **Disabled** | Only one tier exists, so it changes no observable field. Not a state judgement |
| Downgrade | **Disabled** | Same |
| Cancel | Available | `409 CONFLICT` if there is no active subscription, handled inline |

The disabled reasons are programmatically reachable (`u2`'s BR2.5), and they say
*"only one plan exists"* — which is true regardless of subscription state — rather
than *"start a subscription first"*, which would be a claim the screen cannot make.

**`AC1.14.1` is recorded as `Deferred` on `AC4.1.2`**, so the gap is disclosed in
the artifacts even though the screen stays silent about it. That is what keeps
Q2 = C's stated cost — "the gap becomes invisible" — from being true of the
project as a whole.

**Q3 = A: the notice, and its removal condition.** A persistent notice on PO-6:
these recommendations are saved, and will appear in guests' guides once the guest
view supports them. It is tied explicitly to `AC4.1.9` in the artifact, so
"remove this when `AC4.1.9` lands" is a recorded obligation rather than a thing
someone has to remember.

**Q3 = A and Q2 = C point in opposite directions, and that is deliberate.** The
curation screen tells the owner about a gap; the subscription screen stays silent
about one. The difference is what the owner would otherwise conclude: on PO-6 they
would reasonably believe guests are seeing their choices, which is false. On PO-4
they are shown no state at all, so there is nothing false to correct — the screen
simply does less than it will.

[Answer]: Looks correct
