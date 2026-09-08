# Functional Design — `u7-guest-links`

Three questions.

**What this unit is.** `GuestLinkManagement` (PO-7) — creating a stay link for a
validity window, listing links already generated, and presenting them copyably.

It is `kind: ui`, so this stage produces `functional-spec.md`,
`frontend-components.md` and `traceability.json`.

**It is the bridge between the two surfaces.** It creates the artifact the entire
Guest experience hangs off, and reads nothing the Guest side produces. It is also
the only Owner surface reasoning about time zones and validity windows.

**It is blocked differently from its siblings — on an endpoint that does not exist
at all.** `POST /v1/stays` is `AC4.1.1`, and nothing in the deployed API creates a
`Stay`. Every other unit is blocked on a *read* it cannot make; this one cannot
perform its central action.

**What is already settled.** The full link is always selectable text and the copy
control is never the only path (AC1.9.6) — `u2-design-system`'s BR3.1 makes that
structural. Copy confirmation announces through a polite live region, never by
colour or a vanishing toast alone (AC1.9.7, `u2`'s BR3.5). The date field is fully
operable by typing without opening a picker (AC1.9.1, `u2`'s BR3.2).

---

## Q1 — Do we design against an unfixed request shape?

`AC4.1.1` does not only require `POST /v1/stays` to exist. It requires that **its
exact request shape is fixed before US1.9 is designed** — and that has not
happened. The endpoint is unwritten and unspecified.

What exists is an internal service signature, `CreateStayInput`, taking
`{ propertyId, checkIn, checkOut }`. `refined-mockups` drew PO-7 provisionally
against it, with two items marked as assumptions to re-verify.

- **A. Design against the internal shape, marking the assumption.** The unit is
  specified now, in full, against `{ propertyId, checkIn, checkOut }`, with every
  place that depends on the unverified shape called out. If the endpoint lands
  differently, the rework is localised and identified in advance. Cost: it is a
  design against a contract nobody has agreed to, and `AC4.1.1` explicitly asked
  for the opposite order.
- **B. Specify the behaviour, defer the request shape.** The screen's states,
  validation, listing and copy behaviour are all specified — none of which depends
  on the wire shape — and the request itself is left as a named hole for whoever
  writes the endpoint. Cost: the unit cannot be built end to end from this
  document, and the deferral has to be picked up by someone at code generation.
- **X. Other (please specify)**

[Answer]: A

---

## Q2 — Does the screen tell the owner when the link actually expires?

There is a real defect in the deployed backend, and this project found it. Stay
expiry is computed as:

```
expiresAt = new Date(checkOut);
expiresAt.setUTCHours(23, 59, 59, 999);
```

**End of the checkout date in UTC**, regardless of where the property is. For a
property at UTC−5 the link stops working at **18:59:59 local time on checkout
day** — before a guest has finished checking out, on the day they most need the
door code. The design already records the fix as a backend requirement this
project generated: expiry must be computed in the property's time zone, which
means the endpoint must accept or resolve one.

But that fix is not built, and this screen ships before it.

- **A. Show the actual expiry moment, computed the way the backend computes it.**
  The owner sees "this link stops working at 6:59 PM on 14 March" rather than a
  date alone. Honest, and it makes a defect the owner can work around visible
  instead of silent. Cost: it surfaces a bug in the product's own UI, and the copy
  becomes wrong the day the backend fix lands — so it has to be removed then.
- **B. Show the checkout date, and let the backend's fix land before anyone
  notices.** The screen says the link is valid through 14 March. Simple, and it is
  what the owner expects to see. Cost: it is **inaccurate for every property not
  at UTC+0**, and the person who discovers the gap is a guest at a front door.
- **C. Show the date, plus a general caution that links expire at end of day
  UTC.** Accurate without computing a per-property local time, and it does not
  hard-code a defect into per-link copy. Cost: it asks the owner to reason about
  time zones, which is precisely the work the fix is meant to remove.
- **X. Other (please specify)**

[Answer]: A

---

## Q3 — Where does the list of previously generated links come from?

`AC1.9.5` requires that on returning to the dashboard **later**, every link the
owner has generated is still listed, still copyable, and shows which stay it
belongs to and whether it is still valid.

**There is no `GET /v1/stays`.** No endpoint lists an owner's stays. Whatever the
list contains, the client must have kept.

This is the same shape as `u5-owner-guide`'s onboarding draft, where browser
storage was chosen (its Q1 = B) — but the contents differ: a guest link is a live
credential. Anyone holding it can read the guide.

- **A. Browser storage, scoped to the account.** The list survives a reload, a new
  tab and a new session, which is what "return to the dashboard later" asks for.
  Cost: **live stay tokens are written to disk** on a possibly shared machine, and
  they are not revocable — nothing in the API invalidates a stay link early. A
  cleared browser also loses the list permanently, with no way to recover a link
  already sent.
- **B. In memory only.** The list holds links generated during this visit and is
  empty on return. Nothing is persisted. Cost: `AC1.9.5` is met only within a
  session, so an owner who generated a link yesterday cannot retrieve it — and
  since it cannot be re-derived either, it is genuinely unrecoverable unless they
  kept it elsewhere.
- **C. In memory only, and say so.** As above, with the screen stating plainly
  that links are shown for this session only and should be sent or saved now.
  Cost: it puts a limitation in front of the owner at the moment they are trying
  to do something simple.
- **X. Other (please specify)**

[Answer]: C

---

## Consolidated Summary Confirmation

- **Q1 = A** — Design against the internal `{ propertyId, checkIn, checkOut }`
  shape, marking the assumption.
- **Q2 = A** — Show the actual expiry moment, not the checkout date alone.
- **Q3 = C** — The link list is in memory only, and the screen says so.

**Q1 = A: the assumption is already containable, and that is why A is cheap.**
The wire shape is not this unit's to hold. `u1-api-contract` owns the typed shape
and `u3-foundation` owns the request, so this unit calls a typed method and knows
nothing about the body. If the endpoint lands differently, the rework is:

1. `u1-api-contract`'s `CreateStayInput` shape and its provenance record.
2. `u3-foundation`'s method signature.
3. Whatever this screen passes to it.

Point 3 is the only part in this unit, and it is one call site. The design will
name each of `refined-mockups`' two provisional items explicitly so they are
re-verified rather than inherited.

**Q2 = A: prefer the server's answer, compute only as a fallback.** Showing the
real expiry moment does **not** mean hard-coding the backend's UTC rule if the
response gives us the answer:

1. **If the create response carries `expiresAt`, render that.** It is the
   authoritative value, and rendering it in the owner's local time is a display
   concern rather than a duplicated rule.
2. **Only if it does not** does the screen compute end-of-checkout-date UTC
   locally — and that computation is a **recorded liability with a removal
   trigger**, not ordinary logic.
3. **Either way the label states when the link stops working**, an observable
   fact, rather than stating a policy.

Whether the response carries `expiresAt` is itself unknown, because the endpoint
is unwritten. That is now a **third thing this design asks of `AC4.1.1`**,
alongside the existing two: return the full absolute link, and accept or resolve a
time zone. Adding it now is cheaper than discovering it later.

**Q3 = C: what the notice must say, and what it must not.** The screen states that
links are shown for this session and should be sent or saved now.

1. **The notice appears with the link, not after it** — an owner who has already
   navigated away has already lost it.
2. **`AC1.9.6`'s selectable text matters more here than anywhere else.** With no
   recovery path, a copy control that silently fails is not an inconvenience; it
   is a permanently lost link. `u2`'s BR3.1 makes the value always selectable.
3. **The notice does not claim the link is fragile.** The link works fine — it is
   the *list* that is not kept. Wording that implies otherwise would make owners
   distrust links that are perfectly good.

**This design generates a second backend requirement**, and it should be tracked
like the first: **an owner-scoped `GET /v1/stays`**. Without it `AC1.9.5` cannot be
met at all beyond a single session, because a stay link cannot be re-derived from
anything the owner can reach. It joins the time-zone fix and the `expiresAt`
question in the `AC4.1.1` follow-up.

**Two backend requirements and one open question, all from this one screen.** That
is not scope creep — it is what happens when a unit's central action has no
endpoint behind it. `AC1.9.5` is recorded as `Deferred`, not as met.

[Answer]: Looks correct
