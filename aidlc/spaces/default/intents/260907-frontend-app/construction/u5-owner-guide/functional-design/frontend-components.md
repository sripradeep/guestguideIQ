# Frontend Components — `u5-owner-guide`

*Re-confirmed 2026-09-08 after the functional-design redo jump, and re-saved
following that confirmation. Content unchanged.*

The component hierarchy, each component's inputs and state, its interaction flow,
its validation rules and its integration points.

**Framework-neutral.** The framework is OQ4 and unchosen, so nothing here is
expressed as props, hooks or lifecycle. "Inputs" means values a component is
given; "state" means values it owns.

## Hierarchy

```
OnboardingFlow                  (this unit)  — PO-3
├── StepIndicator               (this unit)
├── PropertyBasicsStep          (this unit)
├── ContentSourceStep           (this unit)
├── ContentReviewStep           (this unit)
├── ConfirmStep                 (this unit)
└── StepReview                  (this unit)  — read-only prior steps

GuideAuthoring                  (this unit)  — PO-5
├── SectionEditor               (this unit)
│   └── SectionRow              (this unit)
├── ShrinkGuardDialog           (this unit)  — built from u2's Dialog
├── PublishControl              (this unit)
└── GuestPreviewFrame           (this unit)
    └── u9-guest-guide-view                  — NOT this unit's

OnboardingDraftStore            (this unit)  — Q1 = B
```

**Eleven components.** Three carry real logic: `OnboardingFlow` (the step
machine), `SectionEditor` (the save discipline) and `OnboardingDraftStore`
(persistence with three clear points, one of which is a trap).

---

## `OnboardingDraftStore` (Q1 = B)

Not a rendered component — the persistence boundary for unsubmitted wizard
entries. Isolated so the clear rules live in one place rather than scattered
across four step components.

| Aspect | Detail |
|---|---|
| Inputs | The account identity from the resolved session |
| State | Per-step unsubmitted entries |
| Storage | Browser storage, **namespaced per account** |
| Integration | None — it makes no request |

**What it may hold:** wizard entries and nothing else. **No token, no session, no
identity beyond the namespace key.** Those belong to `u3-foundation`, and its
BR1.1 keeps them out of this unit's reach entirely.

**Namespaced per account** so two owners on one machine cannot read each other's
draft.

### The three clear points

| Event | Clear? | Why |
|---|---|---|
| Step submitted | **Yes** | The entry is the backend's now; the draft is dead |
| Owner signs out | **Yes** | Deliberate, and the machine may be shared |
| **Session expires** | **No** | An expiry is an accident, not a decision |

**The third row is the trap, and getting it wrong inverts a control.**
`u3-foundation`'s BR1.5 preserves caller state on an expiry precisely so the owner
does not lose work, and `AC1.10.3` requires it. Clearing the draft on expiry would
make the session-expired state — which exists to protect in-progress work — the
thing that destroys it.

**Reading is conditional on freshness.** A draft is restored only for the step the
backend reports as current. A draft left over for a step already submitted is
discarded rather than shown, because `AC1.5.2` forbids prefilling from a stale
value — and on a permanent, unchangeable property name, a wrong prefill is worse
than an empty field.

---

## `OnboardingFlow` (PO-3)

| Aspect | Detail |
|---|---|
| Inputs | The provisional signal from `u4-owner-shell` |
| State | `currentStep` (from the backend, never derived locally), `submitting`, per-step errors |
| Emits | `onboarding-complete` → routes to the editor |
| Integration | `u3-foundation`'s onboarding read and the four step submissions |

**`currentStep` comes from `GET /v1/onboarding` and is never derived from local
state.** That is the backend's own instruction, and the reason is concrete: the
machine is strictly forward and `assertStep` throws `409 CONFLICT` on any
non-current step. A locally-derived step desynchronises and produces a `409` the
owner cannot act on.

**On `409`: re-read and re-open at what the server reports. Never retry the
submission.** A retry against a machine that has already moved produces the same
`409` forever.

---

## `StepIndicator`

| Aspect | Detail |
|---|---|
| Inputs | `currentStep`, the step list |
| State | None |
| Behaviour | "Step X of Y" **plus the named steps** — Property, Guide, Content, Done — not dots alone (AC1.5.1) |

**Labels are the criterion, not decoration.** Dots tell an owner how far they are;
labels tell them what is left.

---

## `PropertyBasicsStep`

| Aspect | Detail |
|---|---|
| Inputs | The restored draft entry, if any |
| State | `name` |
| Primitives | `u2`'s `TextInput`, `Button` |
| Validation | Non-blank on blur and on submit. The backend returns `400` on a blank name |

**Its label states that the name is what guests see.** A label, not a guard — per
Q3 = B no confirmation step is added.

**This is the field the product's sharpest constraint sits on.** The name cannot
be corrected during onboarding (the machine is forward-only) or afterwards (no
route edits it), and it is the first thing painted on every guest's screen as
proof their link is real (`AC2.1.1`). The permanence is recorded as a named
product gap for the backend follow-up rather than guarded here.

---

## `ContentSourceStep`

| Aspect | Detail |
|---|---|
| State | `submitting` |
| Primitives | `u2`'s `Button` |
| Behaviour | One action: "Start from scratch", which advances to content review (AC1.6.1) |

**No PDF upload control renders — absent, not disabled** (AC1.6.2). Absent is the
right shape for a stronger reason than the criterion states: **the server does not
parse PDFs at all.** `/content-source/pdf` accepts a `succeeded` flag plus
*already-extracted* sections. There is no upload endpoint, no multipart plugin, no
object storage and no size limit anywhere — so client-side extraction, size limits
and error handling would all be unowned frontend work. A disabled control would
advertise a feature whose entire implementation is missing.

**Section authoring does not happen here.** The only way to write sections
anywhere in the system is the guide `PATCH`, which is `GuideAuthoring`'s.

---

## `StepReview`

| Aspect | Detail |
|---|---|
| Inputs | The completed steps |
| State | None |
| Behaviour | Prior steps, **read-only** (AC1.5.3) |

**There is no Back button that returns to an editable step**, because there is no
route that would accept the resubmission. Review-only is the honest affordance for
a forward-only machine.

**It is what makes a mistake visible before the final step commits.** It cannot
make it fixable.

---

## `SectionEditor` and `SectionRow`

| Aspect | Detail |
|---|---|
| Inputs | The loaded guide; the provisional signal |
| State | `sections`, `lastLoadedSections` (the shrink baseline), `dirty` |
| Emits | `save-requested` |
| Integration | `u3-foundation`'s guide read and save |
| Primitives | `u2`'s `TextInput`, `Button`, `StatusBanner`, `LiveRegion` |

**Save is explicit — there is no autosave**, and every save sends the **complete**
section set under the exact expected key (AC1.7.2).

**It never clears itself on a failed write** (AC1.7.4). On failure the error shows
and every edit stays on screen.

**`lastLoadedSections` is the shrink baseline** and is updated only on a
successful save. It is what `ShrinkGuardDialog` compares against.

**It supplies the fresh payload for `u3`'s replay path.** After a session expiry
and re-authentication, `u3-foundation`'s BR2.2 replays a write with a payload the
caller supplies **at replay time** — never the captured bytes. This component is
that caller, and it supplies the editor's current state rather than what was in
flight when the session died.

---

## `ShrinkGuardDialog`

Built from `u2-design-system`'s `Dialog`, using its defaults unchanged —
**including Escape-closes**. Cancelling is the safe outcome here, unlike
`u4-owner-shell`'s `SessionExpiredDialog`, which inverts that default because
there is nothing behind it to return to.

| Aspect | Detail |
|---|---|
| Inputs | The removed sections' titles and count |
| State | None |
| Emits | `confirmed`, `cancelled` |

**It names what will be lost, specifically:** *"This will remove 2 sections:
'House rules', 'Getting around'. They can't be recovered."* A count alone is not
enough to recognise a mistake by.

**It is the third of three layers and the only one the owner sees.**
`u1-api-contract`'s BR3.2 makes a malformed save unconstructable; `u3-foundation`'s
BR3.2 refuses one at run time. Both catch a *malformed* request. This catches a
**well-formed one that deletes work the owner did not realise it would**.

**What it cannot catch.** It compares against the last loaded state, so a stale
load — another tab, or a guide changed elsewhere — defeats it. It guards the
owner's own mistake, not concurrency. `AC1.7.5`'s no-refetch-on-focus rule makes
staleness *more* likely, and that trade was deliberate: the alternative is a `GET`
that creates a draft row every time the window regains focus.

**No baseline, no guard.** On a first save there is nothing to shrink from.

---

## `PublishControl`

| Aspect | Detail |
|---|---|
| Inputs | `publishStatus`; the provisional signal |
| State | `submitting` |
| Behaviour | A persistent indicator beside the property name — `● Published` or `○ Draft` — with publish and unpublish (AC1.8.1, AC1.8.2) |

**Suppressed while provisional**, with the reason programmatically reachable
(`u2`'s BR2.5).

---

## `GuestPreviewFrame`

| Aspect | Detail |
|---|---|
| Inputs | The `GuestGuideView` shape a guest would receive |
| State | None |
| Renders | `u9-guest-guide-view`, inside a labelled frame |

**It renders the shared unit rather than its own copy** (Q2 = C). `AC1.8.4` says
"exactly as a guest would see it" — a claim that has to stay true over time, which
a second implementation would break silently the first time one copy changed.

**When nothing is published it shows the guest-facing placeholder exactly**: the
property name, a plain statement that the host is still preparing the guide, and a
prompt to contact the host. **Never owner-framed wording.** The prior design's
copy — "guests will see this exact message until you publish" — is nonsense if a
guest reads it.

**The frame is labelled as a preview**, so the owner is never unsure whether they
are looking at their editor or a guest's view.

---

## API integration points

Every one goes through `u3-foundation`. This unit calls no endpoint directly.

| Component | Call | Notes |
|---|---|---|
| `OnboardingFlow` | onboarding read | Drives navigation. Re-read on `409` |
| `PropertyBasicsStep` | property-basics submit | `400` on a blank name |
| `ContentSourceStep` | content-source/scratch | Takes no body |
| `ContentReviewStep` | content-review/confirm | Takes no body |
| `ConfirmStep` | finish | Takes no body |
| `SectionEditor` | guide read | Refetch-on-focus and prefetch **off** — the `GET` creates a draft row |
| `SectionEditor` | guide save | The complete section set, always |
| `PublishControl` | publish / unpublish | |
| `GuestPreviewFrame` | **none** | It is handed a shape, not a request |

## Accessibility obligations this unit owns

Under `u2-design-system`'s Q1 = A boundary, a feature unit inherits its
obligations from `accessibility-checklist.md` directly. For this unit:

- **`ShrinkGuardDialog`'s focus behaviour** — trapped while open, returned to the
  save control on close, Escape closes. It uses `u2`'s defaults unchanged, so this
  is inheritance rather than an override, and there is nothing to name at the call
  site.
- **The suppressed save's reason** — programmatically reachable while provisional
  (`u2`'s BR2.5), not adjacent visual text. A disabled Save whose reason a
  screen-reader user cannot reach is a dead end on the walking-skeleton path.
- **The saved indication** (AC1.5.4) and the unsaved-changes indicator — announced
  politely via `LiveRegion`, not signalled by colour alone (`u2`'s BR2.3).
- **`StepIndicator`'s progress** — the current step conveyed programmatically, not
  by the filled/empty dot shape alone.
- **`StepReview`'s read-only fields** — presented as read-only rather than as
  disabled inputs, so a screen-reader user is told the content is final rather
  than that it is temporarily unavailable.
