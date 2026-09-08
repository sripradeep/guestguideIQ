# Frontend Components — `u7-guest-links`

*Re-confirmed 2026-09-08 after the functional-design redo jump, and re-saved
following that confirmation. Content unchanged.*

The component hierarchy, each component's inputs and state, its interaction flow,
its validation rules and its integration points.

**Framework-neutral.** The framework is OQ4 and unchosen, so nothing here is
expressed as props, hooks or lifecycle.

## Hierarchy

```
GuestLinkManagement             (this unit)  — PO-7
├── NewLinkForm                 (this unit)
│   └── StayWindowFields        (this unit)  — built from u2's DateField
├── SessionScopeNotice          (this unit)  — Q3 = C
├── LinkList                    (this unit)
│   └── LinkRow                 (this unit)
│       ├── u2's CopyableValue
│       └── ExpiryLabel         (this unit)  — Q2 = A
└── EmptyLinkState              (this unit)
```

**Seven components.** Two carry real logic: `NewLinkForm` (range validation and
the no-partial-link rule) and `ExpiryLabel` (the expiry moment, and the liability
inside it).

---

## `GuestLinkManagement`

| Aspect | Detail |
|---|---|
| Inputs | The provisional signal from `u4-owner-shell` |
| State | This session's generated links |
| Integration | `u3-foundation`'s stay-creation method — **which does not exist yet** |

**The link list is state, not a fetch** (Q3 = C). There is no `GET /v1/stays`, so
nothing can be read back; the list holds what this visit created and is empty on
return.

**Link generation is suppressed while the shell reports provisional**, like every
other irreversible action in the Owner app. A stay link is not revocable, so
creating one on the strength of a routing guess is exactly the class of action the
provisional state exists to prevent.

---

## `NewLinkForm` and `StayWindowFields`

| Aspect | Detail |
|---|---|
| State | `checkIn`, `checkOut`, per-field errors, `generating` |
| Emits | `link-generated` |
| Integration | `u3-foundation`'s stay-creation method |
| Primitives | `u2`'s `DateField` ×2, `Button`, `StatusBanner` |

**It is a dated form, not a button** (AC1.9.1). The stay's validity window is
check-in and check-out.

**Both fields are fully operable by typing** — no picker need ever open (`u2`'s
BR3.2). A pointer-only calendar would be a hard keyboard-accessibility failure on
the path an owner uses to host a guest.

**Validation, on blur and on submit:**

| Rule | Error |
|---|---|
| Checkout precedes check-in | Inline, on the checkout field |
| Either date already past | Inline, on the offending field |

**A range error keeps the request unsent** (AC1.9.2). Partly to avoid spending a
rate-limit budget on something knowable locally, but mainly because of `AC1.9.8`:
a half-formed link is worse than none, since the owner may send it.

**On failure: a clear error, and the list gains nothing** (AC1.9.8). There is no
half-created state to display.

**What it sends is an assumption** (A1, Q1 = A): `{ propertyId, checkIn,
checkOut }`, taken from the internal `CreateStayInput` signature because the
endpoint is unwritten. This component never sees a request body —
`u3-foundation` owns that — so if the shape lands differently, the change here is
this one call site.

---

## `ExpiryLabel` (Q2 = A)

The component carrying this unit's sharpest problem.

| Aspect | Detail |
|---|---|
| Inputs | The link's `expiresAt` **if the response carried one**; otherwise the checkout date |
| State | None |
| Behaviour | Renders when the link stops working, in the owner's local time |

**Resolution order:**

1. **Server-supplied `expiresAt` → render it.** Authoritative. Displaying it in
   local time is a formatting concern.
2. **Absent → compute end-of-checkout-date UTC locally.** This mirrors the
   backend's rule and is therefore a coupling to an implementation detail.

**Path 2 is a recorded liability, not ordinary logic.** It exists only because the
endpoint is unwritten and we do not know whether it will return `expiresAt` (A3).

**Removal trigger:** when `AC4.1.1` lands with time-zone-correct expiry, path 2 is
**deleted**. If it survives that change it becomes actively wrong — it would keep
reporting a UTC end-of-day the backend no longer uses.

**The label states an observable fact.** "This link stops working at 6:59 PM on
14 March" is true and checkable. "Links expire at end of day" is a policy claim
that is false for most properties.

**Why this is shown at all.** The backend computes `expiresAt.setUTCHours(23, 59,
59, 999)` on the checkout date regardless of the property's location. At UTC−5
that is 18:59:59 on checkout evening — before the guest has finished checking out,
on the day they most need the door code. Showing a checkout date alone would hide
that from the one person who could work around it.

**It cannot show the property's time zone.** The mockup displays one beneath the
dates, but **no owner-reachable response carries a property time zone** — there is
no field for it anywhere. Every date this screen renders is in the owner's browser
zone until `AC4.1.1` provides the property's.

---

## `LinkRow`

| Aspect | Detail |
|---|---|
| Inputs | The link, its stay window, its validity, its expiry |
| State | None |
| Primitives | `u2`'s `CopyableValue`, `StatusBanner`, `LiveRegion` |

**The full link is always present as selectable text** (AC1.9.6), guaranteed
structurally by `u2`'s BR3.1 — the copy control is an addition, never the only
path.

**This matters more here than anywhere else in the product.** There is no recovery
path: a stay link cannot be re-derived from anything the owner can reach, and
clipboard access fails silently in more contexts than people expect — insecure
origins, embedded webviews, denied permissions. A copy control that quietly fails
would mean a permanently lost link.

**Copy confirms visibly and announces politely** (AC1.9.3, AC1.9.7) — never colour
alone, never a vanishing toast alone. `u2`'s BR3.5 requires the confirmation to
sit alongside the value rather than replace it.

**Each row shows its stay window and whether the link is still valid** — the
readable half of `AC1.9.5`, within this session.

**The link itself is an assumption** (A2): the endpoint must return the **full
absolute link** on the property's own locality domain. If it returns a bare token
instead, no client code can build the link, because the frontend does not know
that domain (`AC4.1.7`). This is the one assumption whose failure this unit cannot
absorb.

---

## `SessionScopeNotice` (Q3 = C)

| Aspect | Detail |
|---|---|
| Inputs | None |
| State | None |
| Behaviour | States that links are shown for this session and should be sent or saved now |

**It appears with the link, not after it.** An owner who has already navigated
away has already lost it.

**It does not imply the link is fragile.** The link works fine — it is the *list*
that is not kept. Wording that blurred the two would make owners distrust links
that are perfectly good.

**Why the list is not persisted.** A guest link is a **live, non-revocable
credential**: nothing in the API invalidates a stay link early. Browser storage
would put live credentials on disk on a possibly shared machine — a real exposure
traded for a convenience. `u5-owner-guide` reached the opposite conclusion for its
onboarding draft, and the difference is exactly this: a half-typed property name
is not a credential.

---

## `EmptyLinkState`

| Aspect | Detail |
|---|---|
| Behaviour | "You haven't created any guest links yet." The form alone — **no empty table** |

---

## API integration points

Every one goes through `u3-foundation`. This unit calls no endpoint directly.

| Component | Call | Notes |
|---|---|---|
| `NewLinkForm` | stay creation | **The endpoint does not exist** (`AC4.1.1`). Shape assumed (A1) |
| `LinkList` | **no read** | There is no `GET /v1/stays` to call |

**This is the only unit in the frontend whose central action has no endpoint.**
Everything specified here is buildable the day `AC4.1.1` lands and untestable
until then.

## Accessibility obligations this unit owns

Under `u2-design-system`'s Q1 = A boundary, a feature unit inherits its
obligations from `accessibility-checklist.md` directly. For this unit:

- **`StayWindowFields`' keyboard operability** — both dates typable without a
  picker, and any calendar grid arrow-navigable with Escape returning focus to the
  field (`u2`'s BR3.2). This is the concrete case that rule was written for.
- **The copy confirmation's announcement** — polite, via `LiveRegion` (`u2`'s
  BR2.4), and additive rather than replacing the value (`u2`'s BR3.5).
- **The inline range errors** — associated with their fields programmatically, not
  merely adjacent, so a screen-reader user learns which date is wrong.
- **`ExpiryLabel`'s text** — a full readable moment rather than an abbreviation or
  an icon, since it is the one place the UTC defect is visible.
- **`SessionScopeNotice`** — in reading order with the link it qualifies, not
  presented only as a visually adjacent aside. It changes what the owner should do
  next.
