# Frontend Components — `u6-owner-locality-billing`

*Re-confirmed 2026-09-08 after the functional-design redo jump, and re-saved
following that confirmation. Content unchanged.*

The component hierarchy, each component's inputs and state, its interaction flow,
its validation rules and its integration points.

**Framework-neutral.** The framework is OQ4 and unchosen, so nothing here is
expressed as props, hooks or lifecycle.

## Hierarchy

```
LocalityCuration                (this unit)  — PO-6
├── DeferredReachNotice         (this unit)  — Q3 = A
├── ItemGrid                    (this unit)
│   └── ItemCard                (this unit)
│       └── FavoriteToggle      (this unit)
└── ServerEmptyState            (this unit)  — renders the backend's own copy

SubscriptionManagement          (this unit)  — PO-4
├── PlanControls                (this unit)
└── CancelConfirmDialog         (this unit)  — built from u2's Dialog
```

**Seven components.** Two carry real logic: `FavoriteToggle` (the optimistic
update and its known race) and `PlanControls` (the closed action set and the
no-retry rule).

---

## `LocalityCuration` (PO-6)

| Aspect | Detail |
|---|---|
| Inputs | The provisional signal from `u4-owner-shell` |
| State | The POI list, the event list, `loading`, per-list error |
| Integration | `u3-foundation`'s POI and event reads |

**It re-reads both lists on navigating back to the screen.** That is the bound on
Q1 = B's known race: a stale display never outlives the visit.

**There is nothing to page, filter or sort.** Both endpoints derive the locality
from the JWT's `propertyId` and take no query parameters — the full locality list
arrives every time. A control offering any of those would be a control the API
cannot serve.

---

## `DeferredReachNotice` (Q3 = A)

| Aspect | Detail |
|---|---|
| Inputs | None |
| State | None |
| Behaviour | A persistent notice: these recommendations are saved, and will appear in guests' guides once the guest view supports them |

**It exists because the owner would otherwise believe something false.** Every
favourite here persists correctly and reaches nobody — the stay payload carries
bare ids and both list endpoints require an owner JWT, so a guest cannot render a
name, a category or a date.

**It has a removal condition, and the condition is `AC4.1.9`.** When that lands,
this notice becomes false in the other direction and must be deleted. Recording
the trigger here is what makes that an obligation rather than something someone
has to remember.

---

## `ServerEmptyState`

| Aspect | Detail |
|---|---|
| Inputs | `isEmptyLocality`, `emptyMessage` |
| State | None |
| Behaviour | Renders the server's `emptyMessage`. **Carries no hardcoded copy of its own** (AC1.12.4) |

**The backend has real strings for both lists** —
`"Content is being added for this locality."` and
`"No events yet — check back soon."` — and the criterion is about whose words
appear. This component has no fallback string to compete with them.

**Never a blank grid.** An empty locality renders this; it does not render
nothing.

---

## `FavoriteToggle`

The one place in this unit where a correctness decision was made with its failure
named.

| Aspect | Detail |
|---|---|
| Inputs | The item, its current favourite state |
| State | `pending` |
| Emits | `favourited`, `unfavourited` |
| Integration | `u3-foundation`'s favourite and unfavourite methods |
| Primitives | `u2`'s `Button`, `StatusBanner`, `LiveRegion` |

**Single click, no confirmation** (AC1.12.1). The display updates **immediately**
(AC1.12.2), and unfavouriting stops the item appearing in the guide (AC1.12.3).

**Every request carries a complete body** (AC1.12.6). This is the one handler in
its file with no `?? {}` fallback, so a bodyless request returns `500` rather than
a well-shaped `400`; `u3-foundation`'s BR3.1 refuses it before it leaves.

**On failure: revert, with an inline notice** (AC1.12.2). On a `400` for an item
outside the locality: revert, with that inline error (AC1.12.5).

### The known race, recorded here because this is where it lives

Per Q1 = B, a `200` response — a **whole `OwnerGuideView` snapshot**, not the
toggled item — replaces the local view. Two toggles in flight can resolve out of
order, and the older snapshot then overwrites the newer state: **the second
toggle visibly reverts**, though the server holds both.

Chosen with the failure named, and bounded by three facts: it is recoverable and
self-evident (the owner clicks again; nothing is destroyed), the server state is
correct throughout, and until `AC4.1.9` no guest sees these favourites at all.

**The fix, if it is ever wanted:** a per-item sequence number, applying a response
only when it is not stale for that item. Serialising per item — disabling this
toggle while its own request is in flight — is the simpler variant. Both are local
to this component.

---

## `PlanControls` (PO-4)

| Aspect | Detail |
|---|---|
| Inputs | The provisional signal |
| State | `submitting`, the last mutation's outcome |
| Emits | `start`, `cancel` |
| Integration | `u3-foundation`'s subscription methods |

**It shows no plan and no status** (Q2 = C). There is no `GET /v1/subscriptions`,
so any such claim would be invented.

| Control | Disposition | Reason shown |
|---|---|---|
| Start | Available | — |
| Upgrade | **Disabled** | "Only one plan exists" |
| Downgrade | **Disabled** | "Only one plan exists" |
| Cancel | Available | — |

**The disabled reason is knowable; a state-based one would not be.** Only one tier
— `standard` — exists, so upgrade and downgrade change no observable field. Saying
"start a subscription first" instead would assert something this screen cannot
see.

**Both reasons are programmatically reachable** (`u2`'s BR2.5). Two permanently
disabled controls whose reasons a screen-reader user cannot reach would be two
dead ends.

**The action value comes from a closed typed set and is never a bare string**
(AC1.14.6). `u1-api-contract`'s BR2.2 makes anything else unconstructable;
`u3-foundation`'s BR3.3 refuses it at run time. The endpoint's final `else` branch
**cancels the subscription** on anything unrecognised, and the body is read as
`request.body?.action`, so a missing body reaches `cancel`.

**No automatic retry on an indeterminate outcome, ever** (AC1.14.5). A timeout or
transport failure **asks the owner**, and cannot do the criterion's other half:
`AC1.14.5` says the app "re-reads my subscription state", and there is no
`GET /v1/subscriptions` to re-read it with. Asking is the whole of what this
screen can do. A speculative retry
here is a silent billing event — and `u3-foundation`'s BR2.3 additionally excludes
this endpoint from the post-re-authentication replay path for the same reason.

**On `402 PAYMENT_FAILED`: a banner stating plainly that no changes were made to
the account** (AC1.13.2). On `404`: no `SubscriptionRecord` row exists — an inline
explanation, and no retry.

**Suppressed entirely while the shell reports provisional**, like every other
irreversible action in the Owner app.

---

## `CancelConfirmDialog`

Built from `u2-design-system`'s `Dialog` with its defaults unchanged, **including
Escape-closes** — cancelling the cancellation is the safe outcome.

| Aspect | Detail |
|---|---|
| Inputs | None |
| State | None |
| Emits | `confirmed`, `dismissed` |

**It states plainly that guide content stays intact and that resubscribing
restores access** (AC1.14.3).

**That reassurance is verified rather than hopeful.** `cancel` only sets status and
never touches guide content — `stories.md` records that assumption A4 became a
property of the code. Saying it without having checked would have been the kind of
comforting sentence that turns out to be wrong.

---

## API integration points

Every one goes through `u3-foundation`. This unit calls no endpoint directly.

| Component | Call | Notes |
|---|---|---|
| `LocalityCuration` | POI list | No parameters; full locality list every time |
| `LocalityCuration` | event list | Same. Expired events are excluded server-side |
| `FavoriteToggle` | favourite / unfavourite | Complete body always; returns a whole guide view |
| `PlanControls` | start | `404` if no `SubscriptionRecord` row; `402` on payment failure |
| `PlanControls` | cancel | `409` if there is no active subscription |
| `PlanControls` | **no read** | There is no `GET /v1/subscriptions` to call |

## Accessibility obligations this unit owns

Under `u2-design-system`'s Q1 = A boundary, a feature unit inherits its
obligations from `accessibility-checklist.md` directly. For this unit:

- **The two permanently disabled controls' reasons** — programmatically reachable,
  not adjacent visual text (`u2`'s BR2.5). This is the concrete case that rule was
  written for.
- **`FavoriteToggle`'s state changes** — announced politely via `LiveRegion`, and
  the favourited state conveyed by more than colour (`u2`'s BR2.3). A revert in
  particular must be announced, or a screen-reader user has no signal that their
  action was undone.
- **`CancelConfirmDialog`'s focus behaviour** — trapped while open, returned to
  the Cancel control on close, Escape closes. `u2`'s defaults unchanged, so
  nothing is named at the call site.
- **`DeferredReachNotice`** — reachable in reading order rather than presented only
  as a visually adjacent aside, since it changes what the owner should conclude
  about everything else on the screen.
