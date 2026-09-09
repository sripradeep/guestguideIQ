# Refined Mockups — Questions

Six decisions I need from you before drawing the screens.

**Where this stage starts from.** This is not a blank page. The
`260905-backend-services-spec` intent produced a reviewed-READY design set —
`mockups.md` (screens PO-0 through PO-6, G-1 through G-3, plus internal Admin
screens), `interaction-spec.md` (ten component specs), `design-system-mapping.md`
and `accessibility-checklist.md`. That design was drawn against what the system
was *specified* to do. This stage redraws it against what the deployed API
*actually* does, and adds the two screens that were never drawn.

**What changed underneath it**, from the User Stories mob review:

- No route returns a locality brand to the frontend, so every branded state is
  currently unbuildable (blocked on AC4.1.7).
- The Admin screens that *set* those brands (AD-1, AD-2, AD-3) are out of scope
  this intent — nothing issues the ops-role token they need.
- There is no property image anywhere in the system, so the guest trust cue on
  G-2 is the property **name**, not the photo the old mockup drew.
- The onboarding wizard cannot resume "with prior entries intact" — the API
  returns `{ currentStep, completed }` only, and the step machine is forward-only.
- Two of the guest guide's three tabs are empty by construction until AC4.1.9.
- The marketing-site lead-capture screens (US3.x in the old set) are done and
  out of scope here.

**What this stage owes**, per the User Stories dependency summary: **PO-7**
(generate a guest link) and **PO-8** (Account) — both named in the stories,
neither ever drawn.

---

## Q1 — PO-7 (generate a guest link): draw it now, or wait for the backend?

The stories say plainly that PO-7 "cannot be drawn until AC4.1.1's request shape
is fixed" — that is, until `POST /v1/stays` exists and its request and response
shapes are settled. That work is a separate piece of work you have running
(`post-stays-endpoint`), and it has not produced anything yet — it is still at
its first stage, so no shape exists.

What is already known: the internal, `127.0.0.1`-bound `createStay` takes
`{ propertyId, checkIn, checkOut }` and derives link expiry from checkout. So a
dated form is almost certainly right; what is genuinely unknown is what the
response returns (a full absolute link, or a bare token), and whether previously
generated links can be listed back — which AC1.9.5 requires.

- **A. Draw PO-7 in full now** against the known `{ propertyId, checkIn, checkOut }`
  shape, marked clearly as provisional, with the response-dependent parts
  (AC1.9.4's full link, AC1.9.5's list of past links) stated as assumptions to
  re-verify when the backend lands. Fastest, at the cost of a likely revision.
- **B. Draw PO-7's structure and states only** — the form, its validation, the
  empty/error/success states, its accessibility spec — and leave the
  response-shaped parts as explicitly named gaps rather than assumptions.
  Everything not blocked gets designed; nothing is guessed.
- **C. Defer PO-7 entirely** to a follow-up pass after `post-stays-endpoint`
  settles the shape. This stage records it as owed and moves on. Honest, but
  leaves the stage's own stated deliverable unmet.
- **D. Pause this stage** until the backend work settles the shape, and resume
  the whole of Refined Mockups afterwards.

[Answer]: A

---

## Q2 — Branded states: draw both, or only what ships?

Every branded state in the old design (PO-1's brand header, the dashboard shell
accent on PO-3/PO-4/PO-5/PO-6, G-2's accent bar) depends on a locality-brand read
that does not exist. The stories resolve this consistently: render the branded
state "once AC4.1.7 exists; until then, the functional default."

So each affected screen has two looks, and only one of them can ship in the first
release.

- **A. Draw both states for every affected screen** — the functional default
  marked as what ships now, the branded state marked as blocked on AC4.1.7.
  Complete, and roughly doubles the branded screens' documentation.
- **B. Draw the functional default only**, and keep locality branding as a single
  documented component spec (the `BrandTheme` entry) that says where it will
  apply when it is unblocked. Leaner, and keeps the shipping design unambiguous.
- **C. Draw the branded state as primary** and the functional default as the
  fallback, as the old design did — treating the block as temporary.
- **X. Other (please specify)**

[Answer]: C

---

## Q3 — PO-8 (Account): how much screen is there, really?

The API constrains this screen sharply. No email is ever collected. There is no
password-change endpoint. There is no property-name edit endpoint — the name
typed once at onboarding is permanent, and it is the guest's trust cue. So the
Account screen can show a username, a property name, a locality name, a link to
Subscription, and a logout control. Nothing on it can be edited.

The story is `Should` priority, and logout is separately required to be reachable
from the persistent shell without going through Account (AC1.11.3), so Account is
not the only path to it.

- **A. A minimal read-only screen** — the three identity values, a link to
  Subscription, and logout. Honest about being thin; nothing implies editability.
- **B. Read-only, plus visibly disabled affordances** for the things a user will
  look for and not find (change password, edit property name), each with a short
  note that it is not available. Sets expectations, at the cost of showing the
  user several dead controls.
- **C. No separate Account screen.** Fold the identity display and logout into
  the persistent shell's user menu and drop "Account" from the rail. Removes a
  screen that has almost nothing on it.
- **X. Other (please specify)**

[Answer]: A

---

## Q4 — The guest link's date window and time zones

`POST /v1/stays` derives link expiry as `23:59:59.999` **UTC** on the checkout
date. For a host or guest in UTC+2, that link dies at 01:59 on the *following*
local morning; for UTC-5, it dies at 18:59 on the checkout evening — before the
guest has checked out. This is a correctness problem the owner will experience as
"my guest's link stopped working early."

This is a design decision because the screen is where it becomes visible or
invisible.

- **A. Show plain dates, and state the expiry explicitly** in the link's detail
  ("valid until the end of 14 March, UTC") so the owner can see the real boundary.
  No backend change needed.
- **B. Show plain dates and say nothing** about time zones, accepting that a
  small fraction of guests lose access early. Simplest screen; the problem stays
  invisible until someone complains.
- **C. Design the form to capture the property's time zone** and display the
  window in it, and record a backend requirement that expiry be computed in that
  zone. Correct, but adds scope to the backend follow-up.
- **X. Other (please specify)**

[Answer]: C

---

## Q5 — Saving the guide (PO-5), given that a bad save deletes everything

The guide save is a full replace. Worse: a request with a missing or misspelled
`sections` key does not fail — it returns **`200` with every section deleted**. A
destructive success is a much nastier failure than a rejected request, and the
old mockup simply drew a `[Save]` button.

- **A. Explicit Save only, no autosave**, with the editor always sending the
  complete section set, and a clear saved/unsaved indicator. The smallest number
  of chances to destroy content.
- **B. Autosave on a debounce**, with a visible save status. Matches the old
  design's onboarding-style autosave and loses less work — but every autosave is
  another full-replace write, so a bug in payload assembly destroys the guide
  repeatedly and silently.
- **C. Explicit Save, plus a confirmation step** whenever the outgoing payload
  has fewer sections than the last loaded state ("this will remove 2 sections").
  Catches the destructive case specifically, at the cost of an extra click in a
  legitimate delete.
- **X. Other (please specify)**

[Answer]: C

---

## Q6 — The subscription screen, when upgrade and downgrade do nothing

Only one plan tier (`standard`) exists, and the `upgrade` and `downgrade` actions
both set status to `active` and touch no plan field — so neither produces an
observable change. Separately, nothing anywhere in the API gates any feature on
subscription status, so cancelling costs the owner nothing functionally.

The old PO-4 mockup drew a plan dropdown and Upgrade / Downgrade / Cancel
buttons. Drawing controls that demonstrably do nothing is the kind of thing that
looks fine in a mockup and is discovered as a lie in use.

- **A. Show Start and Cancel only.** Hide upgrade/downgrade until more than one
  tier exists. The screen then reflects what the product actually does.
- **B. Show all four, with upgrade/downgrade visibly disabled** and a short note
  that a single plan is currently offered. Keeps the eventual shape visible.
- **C. Show all four as active**, as the old mockup did, and accept that two of
  them produce no visible result.
- **X. Other (please specify)**

[Answer]: B

---

## Consolidated Summary Confirmation

Answers recorded:

- **Q1 = A** — Draw PO-7 (guest link) in full now against the known
  `{ propertyId, checkIn, checkOut }` shape, marked provisional, with the
  response-dependent parts (full absolute link, list of past links) recorded as
  assumptions to re-verify when `POST /v1/stays` lands.
- **Q2 = C** — Draw the branded state as primary, with the functional default as
  the documented fallback.
- **Q3 = A** — PO-8 (Account) is a minimal read-only screen: username, property
  name, locality name, a link to Subscription, and logout.
- **Q4 = C** — PO-7 captures the property time zone and displays the stay window
  in it; a backend requirement is recorded that link expiry be computed in that
  zone rather than at `23:59:59.999` UTC.
- **Q5 = C** — Explicit Save on the guide editor, plus a confirmation whenever the
  outgoing payload carries fewer sections than the last loaded state.
- **Q6 = B** — The subscription screen shows all four controls, with upgrade and
  downgrade visibly disabled and a note that a single plan is currently offered.

Two consequences I will carry into the artifacts, stated here so they are not
silent:

1. **Q2 against the release reality.** The first release cannot render locality
   branding at all — no route returns a brand (blocked on AC4.1.7). Drawing the
   branded state as primary is therefore a statement about the intended design,
   not about what ships. Every branded screen will carry an explicit note that
   the functional default is what renders until that read exists, so no one reads
   these mockups as a description of release 1.
2. **Q4 adds scope to the backend follow-up.** Computing expiry in the property's
   time zone is a change to `POST /v1/stays`, which is being designed right now
   in the `post-stays-endpoint` work. I will record it as a named addition to
   AC4.1.1 so it reaches that work rather than being discovered later.

[Answer]: Looks correct
