# Functional Design — `u5-owner-guide`

Three questions.

**What this unit is.** `OnboardingFlow` and `GuideAuthoring` — the forward-only
onboarding wizard with its client-held draft, and the guide editor with its save
discipline, publication state and guest-view preview. Everything between "the
owner has an account" and "a guest could read something".

It is `kind: ui`, so this stage produces `functional-spec.md`,
`frontend-components.md` and `traceability.json`.

**It contains the highest-risk write path in the product.** The guide save is a
full replace, and a request whose `sections` key is missing or misspelled returns
**`200` with every section deleted** rather than an error — the route defaults it
to `[]` in front of the service's array guard. `u1-api-contract`'s BR3.2 makes the
bad request unconstructable at the type level and `u3-foundation`'s BR3.2 refuses
it at run time; the shrink guard here is the third layer, and the only one the
owner sees.

**An input carried from `u4-owner-shell`, not a question.** When the shell's
onboarding read fails it routes the owner to `/guide` in a **provisional** state
and retries in the background. This unit **must honour that signal**: while
provisional, saving, publishing and unpublishing are suppressed; reading and
navigating are not. Without it the compensating control does not exist — the shell
can decline to route, but it cannot decline to save on this unit's behalf.

**What is already settled.** The step machine is strictly forward — `assertStep`
throws `409 CONFLICT` on any non-current step and no route moves it back — so
backward movement is review-only. No PDF upload control is rendered (AC1.6.2).
Save is explicit; there is no autosave. The editor never clears itself on a failed
write (AC1.7.4). Refetch-on-focus and prefetch are off (AC1.7.5), because the
guide `GET` creates an empty draft row as a side effect.

---

## Q1 — Where does the onboarding draft live?

`AC1.5.2` leaves this open in as many words, and `user-stories`' own reviewer
raised it as finding **R-02**: an owner who leaves partway through resumes at the
step the backend reports, and "any entry I had typed but not submitted is restored
from client-held draft state — or, where it was not retained, the field is empty
and visibly so, never silently prefilled with a stale or wrong value."

The API gives nothing back. `GET /v1/onboarding` returns `{ currentStep,
completed }` and no owner route reads a submitted property name. So whatever is
not held on the client is gone.

The stakes rose when the session was made to survive a reload (`u3`'s Q1 = A): a
returning owner is now signed in, lands back in the wizard, and either sees their
half-typed entry or does not.

- **A. In memory only.** The draft lives for the life of the page. A reload or a
  new tab loses it, and the field renders visibly empty. Simplest, and nothing
  about a half-finished property name is written anywhere. Cost: the session now
  survives a reload but the draft does not, so an owner who reloads is signed in
  and looking at an empty field they had already filled — the exact mismatch
  `AC1.5.2`'s second clause exists to make honest rather than to prevent.
- **B. Browser storage, scoped to the account and cleared on submit.** The draft
  survives a reload and a new tab, and is discarded the moment the step is
  submitted or the owner signs out. Matches what a returning owner expects. Cost:
  it writes owner-typed content to disk on a possibly shared machine, and it needs
  an explicit clear on logout, on session end and on step completion — three
  places, any of which leaking leaves a stale draft that `AC1.5.2` forbids
  prefilling from.
- **C. No draft at all; the field is always empty on return.** `AC1.5.2`'s second
  clause becomes the only behaviour. Nothing is retained and nothing can go stale.
  Cost: an owner interrupted mid-entry retypes, every time — and onboarding is the
  one flow where the entry is permanent, so retyping is where a typo enters.
- **X. Other (please specify)**

[Answer]: B

---

## Q2 — How does the owner preview what a guest sees?

`AC1.8.4` requires the editor to show "a preview of that guest-facing screen
**exactly as a guest would see it**, labelled as a preview" — because the owner
needs to know what is currently served under links they have already sent.

`u8-guest-app` owns the guest rendering. `unit-of-work-dependency.md` gives this
unit edges to `u2`, `u3` and `u4` — **not** to `u8`. So "exactly as a guest would
see it" has to come from somewhere.

- **A. Add a dependency on `u8-guest-app` and render its components.** The preview
  is literally the guest surface, so it cannot drift. Cost: a new edge in the
  dependency graph between two units deliberately kept apart — `u8` is described as
  the largest genuinely parallel branch precisely because nothing Owner-side
  depends on it, and this would end that.
- **B. Reimplement the guest view inside this unit.** No new edge; the preview is
  this unit's own component. Cost: two renderings of the same screen, and
  `AC1.8.4` says "exactly as a guest would see it" — a claim that becomes false the
  first time one changes and the other does not, silently and with no test that
  would catch it.
- **C. Extract the guest rendering into a component both units consume.** The
  shared piece moves down — into `u2-design-system` or a new shared unit — and both
  `u5` and `u8` render it. No cycle, no duplication. Cost: it puts a
  domain-shaped component into a boundary that `u2`'s Q1 = A deliberately kept
  generic, or it adds a ninth unit late in the decomposition.
- **X. Other (please specify)**

[Answer]: C

---

## Q3 — Does the wizard confirm the property name before submitting it?

`AC1.5.3` records a product gap rather than hiding it: the step machine is
strictly forward, so **an owner who mistypes their property name cannot correct it
during onboarding at all** — and there is no property-name edit endpoint anywhere,
so they cannot correct it afterwards either.

That name is the guest's trust cue. `AC2.1.1` makes it the first thing painted on
the guest surface and the proof the link is theirs. A typo in it is permanent and
visible to every guest, forever.

The wizard is the only place a guard could go.

- **A. Confirm the property name before submitting the step.** A single
  confirmation naming the value and stating plainly that it cannot be changed
  later. Cheap, and it puts the warning where the decision is. Cost: an extra
  interaction on the walking-skeleton path, and it advertises a limitation the
  team may prefer to fix in the backend instead.
- **B. Accept the gap; no confirmation.** The wizard submits what was typed, and
  the permanence is recorded as a product gap for the backend to close with an
  edit endpoint. Cost: every owner who mistypes between now and then has a
  permanently wrong trust cue, and the frontend knew and said nothing.
- **X. Other (please specify)**

[Answer]: B

---

## Consolidated Summary Confirmation

- **Q1 = B** — The onboarding draft lives in browser storage, scoped to the
  account, cleared on submit.
- **Q2 = C** — The guest rendering is extracted into a component both `u5` and
  `u8` consume.
- **Q3 = B** — No confirmation on the property name; the permanence is recorded as
  a product gap.

**Q1 = B: the three clears, and the one that must NOT clear.** The cost named in
the option was three clear points, any of which leaking leaves a stale draft that
`AC1.5.2` forbids prefilling from. Two of them are obvious. The third is a trap:

1. **On step submit** — the entry is now the backend's; the draft is dead.
2. **On sign-out** — deliberate, and the machine may be shared. Clear it.
3. **On session expiry — do NOT clear it.** `u3-foundation`'s BR1.5 preserves
   caller state on an expiry precisely so the owner does not lose work, and
   `AC1.10.3` requires it. An expiry is an accident; a sign-out is a decision.
   Clearing on both would make the shell's session-expired state — which exists to
   protect in-progress work — the thing that destroys it.

Two further constraints follow from writing owner-typed content to disk:

4. **Namespaced per account**, so two owners on one machine cannot read each
   other's draft.
5. **Nothing but wizard entries**, ever. No token, no session, no identity — those
   are `u3-foundation`'s and BR1.1 keeps them out of reach of this unit entirely.

**Q2 = C: this adds a ninth unit, and that is a change to an approved artifact.**
The shared piece cannot go into `u2-design-system`: it renders guide sections, so
it knows what a guide is, and `u2`'s BR1.1 forbids exactly that — it is the rule
that pushed eight components out of that unit in the first place. So the extraction
is a new unit:

> **`u9-guest-guide-view`** — `kind: ui`, complexity S. Owns the rendering of a
> `GuestGuideView`: the identity block, the tabs and their empty states. Depends on
> `u2-design-system` only. Makes no request and resolves nothing. Consumed by
> `u8-guest-app` (as the guest surface) and by `u5-owner-guide` (inside the preview
> frame). Acyclic.

**What this costs, stated plainly rather than discovered later:**

- `unit-of-work.md` and `unit-of-work-dependency.md` are approved artifacts and now
  describe eight units. They need a disclosed correction, not a silent edit.
- **`u8-guest-app`'s functional design is already complete** and specifies
  `IdentityBlock`, `GuideTabs` and the three panels as its own. Those move. Its
  `functional-spec.md`, `frontend-components.md` and `traceability.json` need
  revising, and its unit-stage is already marked complete.
- The delivery plan's Bolt sequencing assumed eight units.

None of that is a reason to reverse the answer — C is the only option under which
`AC1.8.4`'s "exactly as a guest would see it" stays true over time. But it is
rework on already-finished work, and it is better to say so now than to let it
surface at the stage gate.

**Q3 = B: what "accept the gap" means concretely.** No confirmation step is added.
The permanence is recorded as a named product gap for the backend follow-up — a
property-name edit endpoint — alongside the existing `AC4.1.x` items, so it is
tracked rather than remembered.

One thing I am doing without asking, because it is ordinary form design rather
than the guard you declined: **the property-name field's own label will say the
name is what guests see.** That is a label, not a confirmation, and it costs no
interaction. Say so if you would rather it were bare.

[Answer]: Looks correct
