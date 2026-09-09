# Interaction Specification — GuestGuideIQ Frontend

Component-level specs follow `.claude/knowledge/aidlc-design-agent/component-spec-template.md`.
Shared components are specified once and reused. Props are described in
framework-neutral terms — the frontend stack is not chosen (OQ4), so no spec here
names a framework, a library, or a lifecycle hook.

## What changed from the prior intent's spec

| Component | Change |
|---|---|
| `FileUpload` | **Removed** — the PDF import path is deferred (AC1.6.2), so the control is absent rather than disabled |
| `LocalityBrandForm` | **Removed** — its screen (AD-3) is out of scope; nothing issues the ops-role token it needs |
| `StatusBanner` | Marketing-site lead-form usage removed; rate-limit and session-expired variants added |
| `Wizard` | Backward navigation is now **review-only**; autosave-per-step replaced by a saved indication on forward transition |
| `ChatWidget` | Untrusted-reply rendering rule added (AC2.4.6) |
| `FavoriteToggle` | Complete-body requirement added (AC1.12.6) |
| `SideNav` | Admin rail variant removed; logout relocated to the shell header |
| `DateRangeField` | **New** — PO-7 |
| `CopyableLink` | **New** — PO-7 |
| `SectionEditor` | **New** — PO-5, carries the shrink guard |
| `GuestPreview` | **New** — PO-5, AC1.8.4 |
| `SessionExpiredDialog` | **New** — US1.10 |
| `PlanControls` | **New** — PO-4, carries the typed-action rule |

---

## TextInput

| Field | Value |
|---|---|
| Component | TextInput |
| Description | Single-line text entry (username, password, search) |
| Category | input |

### States

| State | Description | Trigger |
|---|---|---|
| default | Empty, ready for input | page load |
| focus | Active cursor | click / Tab |
| filled | Has a value | after input |
| error | Failed validation | blur with an invalid value (AC1.1.4) |
| disabled | Non-interactive | request in flight |

### Props / Inputs

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| label | string | yes | — | Visible label, always above the field — never placeholder-only |
| errorMessage | string | no | — | Specific and actionable ("That username is already taken"), never "Invalid input" |
| fieldName | string | yes | — | Used to attach a backend field-level detail to the right field (AC1.1.5) |

### Accessibility

| Requirement | Implementation |
|---|---|
| ARIA role | Native `<input>`; no role override |
| Keyboard | Tab to focus, standard text entry |
| Label | `<label for>` associated explicitly |
| Contrast | 4.5:1 text |
| Screen reader | Error announced via `aria-describedby` pointing at the error text |
| Focus | Visible 2px outline at 3:1 contrast |

### Interaction rules

- Validate **on blur**, never per keystroke.
- A backend field-level detail attaches to its own named field; it is never
  collapsed into a single banner (AC1.1.5).
- **One exception, deliberate**: login failure (AC1.3.2) renders in a
  `StatusBanner` above the form, not per-field. Per-field errors would disclose
  whether a username exists.

---

## DateRangeField — **new (PO-7)**

| Field | Value |
|---|---|
| Component | DateRangeField |
| Description | Captures a stay's check-in and check-out dates, displayed in the property's time zone |
| Category | input |

### States

| State | Description | Trigger |
|---|---|---|
| default | Both dates empty | page load |
| partial | One date chosen | first selection |
| valid | A well-formed forward range | both dates chosen |
| error-order | Check-out is on or before check-in | blur / submit (AC1.9.2) |
| error-past | The range is already in the past | blur / submit (AC1.9.2) |

### Props / Inputs

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| timeZone | string | yes | — | IANA zone of the property; every displayed date is rendered in it |
| minDate | date | no | today, in `timeZone` | Prevents selecting a range already past |

### Interaction rules

- The zone in use is **stated on screen** beneath the fields ("Times shown in
  Europe/Lisbon"), not left implicit. An owner cannot reason about a link's
  validity without knowing which day boundary applies.
- Errors are specific and name the offending field, not the pair: "Check-out must
  be after check-in", "That range has already passed."
- Dates are dates, not timestamps, in the UI. The **boundary** is a backend
  concern — see the requirement below.

### Accessibility

| Requirement | Implementation |
|---|---|
| ARIA role | Native date inputs where available; a custom picker must expose `role="dialog"` with a labelled grid and `aria-selected` on the chosen day |
| Keyboard | Fully operable without a picker — typing a date into the field is always sufficient; arrow keys navigate the grid when one is open, Escape closes it |
| Label | Visible label per field ("Check-in", "Check-out") |
| Screen reader | The active time zone is part of the field's accessible description, not decorative text |
| Touch | 44×44px minimum on the picker's day cells |

> **Backend requirement carried from Q4.** Link expiry is currently
> `23:59:59.999` **UTC** on the checkout date. In UTC−5 that kills the link at
> 18:59 on checkout evening, before the guest has left; in UTC+2 it survives to
> 01:59 the following local morning. **Expiry must be computed in the property's
> time zone**, which means `POST /v1/stays` must accept or resolve one. This is a
> named addition to AC4.1.1 originating at this stage. Without it, this component
> can display a zone but cannot make the underlying boundary correct — it would
> only be labelling the bug accurately.

---

## CopyableLink — **new (PO-7)**

| Field | Value |
|---|---|
| Component | CopyableLink |
| Description | Displays a generated guest link and offers a copy control |
| Category | display / input |

### States

| State | Description | Trigger |
|---|---|---|
| default | Link shown as selectable text with a copy control | render |
| copied | Copy succeeded | copy control activated (AC1.9.3) |
| copy-unavailable | Clipboard access failed or is unavailable | copy attempt fails (AC1.9.6) |

### Interaction rules

- **The full link is always rendered as selectable text.** The copy control is an
  affordance, never the only path — clipboard access fails silently in more
  contexts than people expect (insecure origins, embedded webviews, permission
  denials), and an owner who cannot get the link cannot host their guest.
- On `copy-unavailable`, the copy control is replaced with a short instruction to
  select and copy manually. No error dialog — the link is right there.
- The link is a **full absolute URL on the property's own locality domain**
  (AC1.9.4), never a bare token.

### Accessibility

| Requirement | Implementation |
|---|---|
| ARIA role | `<button>` for the copy control; the link itself is selectable text, not a control |
| Keyboard | Copy control is tabbable and activates on Enter or Space |
| Screen reader | Success is announced through a polite live region (AC1.9.7) — **never by a colour change or a vanishing toast alone** |
| Contrast | The `copied` confirmation pairs an icon with text; colour never carries the meaning |

---

## SectionEditor — **new (PO-5)**

| Field | Value |
|---|---|
| Component | SectionEditor |
| Description | Edits the guide's sections and owns the full-replace save discipline |
| Category | input |

### States

| State | Description | Trigger |
|---|---|---|
| clean | No unsaved changes | load, or successful save |
| dirty | Unsaved changes present | any edit |
| confirming-shrink | Save would remove sections | save with fewer sections than last loaded (Q5) |
| saving | Write in flight | save confirmed |
| error | Save failed | non-2xx response (AC1.7.4) |

### Interaction rules — the reason this component exists

The guide save is a **full replace**, and a request whose `sections` key is
missing or misspelled does not fail: the route defaults it to `[]` in front of
the service's array guard, so the call returns **`200` with every section
deleted**. A destructive success is a far nastier failure than a rejected
request, and no amount of error handling catches it — it is not an error.

- **Every save sends the complete section set under the exact expected key**
  (AC1.7.2). This is the component's single most important invariant.
- **Shrink guard (Q5, AC1.7.3)**: before any save whose payload carries fewer
  sections than the last loaded state, show a confirmation naming the count and
  the section titles — *"This will remove 2 sections: 'House rules', 'Getting
  around'. They can't be recovered."* A legitimate delete costs one extra click.
- **No autosave.** Each autosave would be another full-replace write; a
  payload-assembly bug would then destroy the guide repeatedly, silently, without
  the owner ever pressing anything.
- **A failed save never clears the editor** (AC1.7.4). Edits stay on screen and
  nothing is silently discarded.
- **No refetch on window focus or route revisit** (AC1.7.5). That read creates an
  empty draft row as a side effect. It is idempotent and never overwrites
  content, so the cost is a spurious row rather than data loss — but the
  constraint belongs on the API-client module's fetching configuration, where
  refetch-on-focus is commonly on by default.
- A visible **saved / unsaved indicator** is always present. The owner should
  never have to guess.

### Accessibility

| Requirement | Implementation |
|---|---|
| ARIA role | The shrink-guard confirmation is `role="alertdialog"` with focus trapped and Escape to cancel |
| Keyboard | Every section's edit, reorder and delete affordance is keyboard-operable; no drag-only interaction |
| Screen reader | Save status changes announced via `aria-live="polite"`; the shrink-guard names the sections in its accessible text, not only in visual copy |
| Focus | On cancel, focus returns to the Save control; on confirm, to the saved indicator |

---

## GuestPreview — **new (PO-5)**

| Field | Value |
|---|---|
| Component | GuestPreview |
| Description | Shows the owner exactly what a guest currently sees under any link already sent |
| Category | display |

### Interaction rules

- Renders **the real guest view** (G-2, including its unpublished placeholder
  state), inside a labelled frame that makes it unmistakably a preview
  (AC1.8.4).
- The previewed content is **guest-framed** — never owner-framed copy. The prior
  design put "guests will see this exact message until you publish" on the guest
  screen itself, which is nonsense if a guest ever reads it. The instinct — show
  Priya what Sam sees — is preserved; the framing is moved to the wrapper.
- Available whether or not anything is published; the unpublished case is
  precisely when it matters most.

### Accessibility

| Requirement | Implementation |
|---|---|
| ARIA role | `role="region"` with an accessible name ("Preview of the guest view") |
| Keyboard | The preview is not a focus trap; Tab passes through it and out |
| Screen reader | The frame's label is announced before the previewed content, so a screen-reader user is never misled about which surface they are hearing |

---

## Wizard (Onboarding, PO-3)

| Field | Value |
|---|---|
| Component | Wizard |
| Description | Sequential multi-step onboarding with a forward-only step machine |
| Category | layout |

### States

| State | Description | Trigger |
|---|---|---|
| in-progress | Current step shown | normal flow |
| resumed | Reopened at the backend-reported step (AC1.5.2) | return with incomplete onboarding |
| reviewing | A prior step shown **read-only** (AC1.5.3) | Review action |
| complete | Onboarding finished | final step submitted |

### Interaction rules — corrected from the prior spec

The prior spec promised "backward navigation without data loss" and
"autosave on each step transition backing resume". Neither is achievable:
`GET /v1/onboarding` returns `{ currentStep, completed }` and nothing else, no
owner route reads back a submitted property name, and `assertStep` throws
`409 CONFLICT` on any non-current step.

- **Step indicator carries labels, not just dots** — "Step 2 of 4" plus the named
  steps (AC1.5.1).
- **Backward movement is review-only.** Prior steps open read-only; there is no
  control that returns the user to an editable completed step, because no route
  would accept the resubmission.
- **Resume restores unsubmitted entries from client-held draft state, or shows
  the field visibly empty** (AC1.5.2). It never prefills from a stale guess. On a
  permanent, unchangeable property name, a wrong prefill is worse than a blank.
- **A saved indication is shown on each forward transition** (AC1.5.4).
- **No PDF upload control is rendered** (AC1.6.2).

### Accessibility

| Requirement | Implementation |
|---|---|
| ARIA role | `role="group"` per step; `aria-current="step"` on the active indicator |
| Keyboard | Tab through fields; Enter advances where a single primary action exists |
| Screen reader | A read-only review step announces itself as read-only, so the user is not left trying to edit an inert field |
| Focus | Focus moves to the first field of the new step on transition; to the step heading when entering review |

> **Product gap this component surfaces but cannot fix.** An owner who mistypes
> the property name cannot correct it during onboarding or afterwards — no route
> edits it — and that name is the guest's trust cue on G-2. Read-only review
> makes the mistake visible before the final step commits. It cannot make it
> fixable.

---

## PlanControls — **new (PO-4)**

| Field | Value |
|---|---|
| Component | PlanControls |
| Description | Start, upgrade, downgrade and cancel actions for a subscription |
| Category | input |

### States

| State | Description | Trigger |
|---|---|---|
| no-subscription | Only Start is enabled (AC1.14.4) | status is absent or cancelled |
| active-single-tier | Start hidden; Upgrade/Downgrade **disabled with an explanation**; Cancel enabled (Q6) | status active |
| confirming-cancel | Cancellation confirmation open | Cancel activated |
| indeterminate | Outcome unknown after a timeout or network failure (AC1.14.5) | request neither succeeded nor cleanly failed |

### Interaction rules — the highest-consequence component in the product

The endpoint's final `else` branch **cancels the subscription on any unrecognised
action**, and the body is read as `request.body?.action` — so a request with a
missing body reaches `cancel`.

- **Every action value comes from a fixed typed set at the API-client boundary,
  never a free-form string** (AC1.14.6). This is a hard requirement, not a
  preference.
- **Every request carries a body.** A bodyless request is a cancellation.
- **No automatic retry, ever** (AC1.14.5). On an indeterminate outcome the
  component re-reads subscription state and asks the owner what to do. A
  speculative retry here is a silent billing event.
- **Upgrade and Downgrade render disabled with a visible explanation** (Q6) —
  "Only one plan is offered at present." Both actions set status to `active` and
  touch no plan field, so neither can produce an observable change. Drawing them
  as working controls would be drawing a lie.
- **Cancellation confirmation states the consequences before committing**
  (AC1.14.3): guide content stays intact and resubscribing restores access.
  Verified against the code — `cancel` only sets status.
- **Payment failure states plainly that no changes were made** (AC1.13.2).

### Accessibility

| Requirement | Implementation |
|---|---|
| ARIA role | `role="alertdialog"` for the cancel confirmation, focus trapped, Escape cancels |
| Disabled controls | `aria-disabled` with the explanation associated via `aria-describedby` — a disabled control with no reachable reason is a dead end for a screen-reader user |
| Keyboard | Every control tabbable; the confirmation's default focus is the non-destructive action |
| Screen reader | Status changes announced via `aria-live="polite"` |

---

## SessionExpiredDialog — **new (US1.10)**

| Field | Value |
|---|---|
| Component | SessionExpiredDialog |
| Description | Surfaces an unrecoverable session end without destroying in-progress work |
| Category | feedback |

### Interaction rules

- **Explicit state, never a silent redirect and never a generic error**
  (AC1.10.1).
- **Local session state is cleared** (AC1.10.2), but **editor state stays on
  screen behind the dialog and no success indication is shown for the failed
  save** (AC1.10.3).
- **Concurrent auth failures collapse into exactly one in-flight refresh**
  (AC1.10.4); all other waiters retry against its result. This lives in the
  API-client module, not in this component — the dialog is what the user sees
  when that single refresh has already failed.
- **A `401` from the refresh call itself ends the session** rather than
  triggering another refresh (AC1.10.5). Without this the client loops.

### Accessibility

| Requirement | Implementation |
|---|---|
| ARIA role | `role="alertdialog"`, focus trapped, labelled by its heading |
| Keyboard | Escape does **not** dismiss — there is nothing to return to; the only exit is the log-in action |
| Screen reader | Announced on appearance; the message states explicitly that unsaved work is still on screen |
| Focus | Moves to the dialog on appearance; the log-in action is the default focus |

> **Committed reading, marked revisitable.** Whether the app blocks and preserves
> the buffer (this spec) or re-authenticates in place and replays the save is a
> product decision raised at the User Stories gate and accepted as risk rather
> than settled. Block-and-preserve is the safer of the two and cannot silently
> double-write. Cross-tab behaviour depends on where tokens live (OQ3).

---

## FavoriteToggle (PO-6)

| Field | Value |
|---|---|
| Component | FavoriteToggle |
| Description | Marks a locality POI or event as featured in the property's guide |
| Category | input |

### States

| State | Description | Trigger |
|---|---|---|
| unfavourited | Outline star | default |
| favourited | Filled star | activation (AC1.12.1) |
| reverting | Optimistic update rolled back | request failed (AC1.12.2) |

### Interaction rules

- **No confirmation** — reversible and low-stakes in both directions.
- **Optimistic, with revert and an inline notice on failure** (AC1.12.2).
- **Every request carries a complete body** (AC1.12.6). This is the one handler
  in the file without a `?? {}` fallback, so a bodyless request returns
  `500 INTERNAL_ERROR` rather than `400`.
- **Out-of-locality rejection shows an inline error** (AC1.12.5).

### Accessibility

| Requirement | Implementation |
|---|---|
| ARIA role | `<button aria-pressed="true\|false">` — a real button, not a styled container |
| Screen reader | "Added to favourites" / "Removed from favourites" via `aria-live="polite"` |
| Contrast | Filled and outline states differ in **shape**, not only colour |
| Touch | 44×44px minimum |

---

## ChatWidget (G-3)

| Field | Value |
|---|---|
| Component | ChatWidget |
| Description | Persistent conversational assistant on the guest guide |
| Category | feedback / input |

### States

| State | Description | Trigger |
|---|---|---|
| collapsed | Bubble only | default |
| open | Panel expanded | bubble activated |
| composing | Assistant is replying (AC2.4.2) | message sent |
| waiting-long | Explicit note past ~5s (AC2.4.2) | elapsed time |
| error | Failed or timed out (AC2.4.3) | request fails |

### Interaction rules

- **Reachable from every tab** (AC2.4.1) — genuinely persistent.
- **Typing indicator escalating to an explicit note past roughly five seconds**
  (AC2.4.2, NFR5).
- **Failure preserves history and offers a retry of the last message**
  (AC2.4.3) — never a silent hang.
- **Sparse-content messaging is the assistant's own reply text** (AC2.4.4), not a
  distinct UI state.
- **Replies are rendered as untrusted text (AC2.4.6).** The guest's own message
  round-trips through a model, so a reply is attacker-influenceable. It never
  reaches a raw-HTML sink. A blocking lint rule bans raw-HTML injection APIs,
  with any exception requiring a named sanitizer.

### Accessibility

| Requirement | Implementation |
|---|---|
| ARIA role | `role="dialog"` `aria-label="Itinerary assistant"` when open |
| Keyboard | Escape closes; focus trapped while open |
| Screen reader | New replies announced via `aria-live="polite"`; the composing state announced **once**, not repeatedly |
| Focus | Returns to the bubble on close |

---

## TabNav (G-2)

| Field | Value |
|---|---|
| Component | TabNav |
| Description | Overview / Places / Events sections of the guest guide |
| Category | navigation |

### Responsive behaviour

| Breakpoint | Behaviour |
|---|---|
| mobile (<768px) | Horizontally scrollable bar — the primary surface (AC2.3.5) |
| ≥768px | Same bar with more room; no structural change for three tabs |

### Accessibility

| Requirement | Implementation |
|---|---|
| ARIA role | `role="tablist"` / `role="tab"` / `role="tabpanel"` |
| Keyboard | Arrow keys move between tabs; Tab enters and exits the panel |
| Screen reader | An empty tab's panel contains its empty-state text, so the panel is never silent |

> **Two of three tabs are empty for every guest until AC4.1.9.** Places and
> Events render the empty state, and **no raw id is ever displayed** (AC2.3.2).

---

## SideNav (dashboard shell)

| Field | Value |
|---|---|
| Component | SideNav |
| Description | Persistent left rail across Guide, Locality Content, Subscription, Account |
| Category | navigation |

### Responsive behaviour (NFR4)

| Breakpoint | Behaviour |
|---|---|
| mobile (<768px) | Hamburger-triggered overlay |
| tablet (768–1023px) | Icons-only rail, labels on hover/focus |
| desktop (≥1024px) | Persistent and expanded |

### Interaction rules

- **Logout is in the shell header's user menu, not the rail** (AC1.11.3), so it
  is reachable from every dashboard screen without visiting Account. US1.11 is
  Must and US1.15 is Should; routing the only logout through Account would leave
  the Must story with no reachable trigger.
- The Admin/Ops rail variant from the prior spec is **removed** — those screens
  are out of scope.

### Accessibility

| Requirement | Implementation |
|---|---|
| ARIA role | `<nav>` landmark; current section marked `aria-current="page"` |
| Keyboard | Tab through items in visual order; the mobile overlay traps focus and closes on Escape |
| Screen reader | In icons-only mode each item retains an accessible name — the visual label is hidden, not the accessible one |

---

## StatusBanner

| Field | Value |
|---|---|
| Component | StatusBanner |
| Description | Inline error, warning and success messaging |
| Category | feedback |

### Variants

| Variant | Used by | Notes |
|---|---|---|
| error | PO-9 login failure, PO-1, PO-4 payment failure, G-1 | Icon + text always |
| success | PO-2 reset request, PO-7 copy confirmation | Polite live region |
| rate-limited | Guest surface (AC2.5.3) | **Its own state**, never a generic error |
| session-expired | Authenticated surfaces | Escalates to `SessionExpiredDialog` |

### Interaction rules

- **Every state pairs an icon with text — never colour alone.**
- `aria-live="polite"` throughout; nothing here uses `assertive`, which would
  interrupt a screen-reader user mid-task.
- **The rate-limited variant carries no countdown.** `Retry-After` is unreadable
  cross-origin because the backend sets no `exposedHeaders`, so the copy says
  "shortly" rather than inventing a number.
- **Error copy is keyed on `error.code`**, parsed by the single error module —
  never on a raw HTTP status. `410 LINK_INVALID` is the guest app's central
  navigational state and `402 PAYMENT_FAILED` routes to billing recovery; both
  would be lost by a single generic message.

---

## BrandTheme

| Field | Value |
|---|---|
| Component | BrandTheme |
| Description | Applies a resolved locality-brand as a themed layer over the product's base tokens |
| Category | layout |

### States

| State | Description | Trigger |
|---|---|---|
| full-brand | Name, tagline and visual styling present | a brand resolves with styling |
| minimal-brand | Name and tagline only | a brand resolves without styling |
| unresolved | No brand resolves | PO-0 only |
| **unavailable** | **No brand read exists** | **every screen, today** |

### Interaction rules

- **Token values only, never structure.** Logo, locality name/tagline, and a
  small accent palette are swapped per locality. Layout, typography, spacing and
  every component's behaviour stay identical across localities.
- **Applies wherever a locality has resolved**: PO-1, PO-3, the dashboard shell
  (PO-4/PO-5/PO-6/PO-7/PO-8), PO-9, and G-2.
- **PO-0 is the one screen with no theme in any state** — nothing resolved, so
  nothing is claimed.
- **`visualStyling` is parsed into typed design tokens with defaults by exactly
  one module before any component reads it.** It arrives as an unschematised
  `Record<string, unknown> | null` and is attacker-influenceable; no component
  reads the raw blob or spreads it into a style object.

> **The `unavailable` state is what ships (Q2).** No route returns a locality
> brand to the frontend — locality data leaves the system only through the guest
> stay payload and internal `127.0.0.1`-bound create routes. Every screen renders
> the functional default until AC4.1.7 lands. The branded states above describe
> the intended design, not release 1.

### Accessibility

| Requirement | Implementation |
|---|---|
| Contrast | Every locality's accent must independently meet 4.5:1 (text) and 3:1 (UI) against the base tokens — a per-brand validation, not one global check (NFR3) |
| Screen reader | The theme swap is not announced; the locality name is read as ordinary page content |

> **Where the per-locality contrast check now happens is an open problem.** The
> prior design validated it at save time on the Admin screen (AD-3). That screen
> is out of scope and nothing issues the token it needed, so brands are seeded
> out of band by ops (assumption A1) with no UI in the loop. The requirement
> stands; its enforcement point does not exist. See `accessibility-checklist.md`.
