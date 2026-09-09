# Frontend Components — `u9-guest-guide-view`

*Revised 2026-09-08 under a human Request Changes decision: the guest-guide
theming misclassification is corrected. Every change is marked in place.*

**Framework-neutral.** The framework is OQ4 and unchosen, so nothing here is
expressed as props, hooks or lifecycle. "Inputs" means values a component is
given; "state" means values it owns.

## Hierarchy

```
GuestGuideView                  (this unit)  — the single entry point
├── IdentityBlock               (this unit)  — painted first, always
├── GuideTabs                   (this unit)  — built from u2's TabBar
│   ├── OverviewPanel           (this unit)
│   ├── PlacesPanel             (this unit)  — empty until AC4.1.9
│   └── EventsPanel             (this unit)  — empty until AC4.1.9
└── NotYetPublishedNotice       (this unit)  — AC1.8.3, guest-framed
```

**Six components, all presentation.** These moved here from `u8-guest-app`, whose
functional design was already written when the extraction was decided; that unit's
artifacts were revised in the same pass, dropping it from ten components to five.

**`GuestGuideView` is the single entry point, deliberately.** Both consumers name
one component rather than assembling the six themselves — a consumer that could
assemble the parts could assemble them differently, which is the drift this
extraction exists to prevent.

---

## `GuestGuideView`

The unit's single entry point, and the only component either consumer names.

| Aspect | Detail |
|---|---|
| Inputs | The `GuestGuideView` shape; the resolved `ThemeTokens` (optional) |
| State | `selectedTab` |
| Emits | Nothing |
| Integration | **None.** It makes no request of any kind |

**It owns the paint order**, and a caller cannot reorder it: identity first, then
tabs, then panel content, with theme tokens applied to accent surfaces whenever
they arrive (AC2.1.1). Guaranteeing that here rather than in each consumer is
half the reason the unit exists.

**`ThemeTokens` is optional, and its absence is a supported state rather than a
degraded one** — but it is the exception, not the norm. The guest stay payload
carries `locality: { id, name, tagline, visualStyling }` inline, so `u8-guest-app`
normally has tokens to pass down. Absence happens when `visualStyling` is `null`
or a brand carries only a name and tagline, which `AC2.1.3` requires to render the
clean default look plus that name — a finished design, not a placeholder.

> **Corrected 2026-09-08.** This previously said `AC4.1.7` does not exist "so no
> brand currently resolves", inherited from `u8-guest-app`'s functional design.
> `AC4.1.7` is the domain-keyed read the *owner* screens need; the guest surface
> has its brand inline. The unthemed rendering is a real supported case, not the
> only case.

**There is no preview-mode input, and none may be added.** The moment this
component knows whether it is inside an owner's preview, the two renderings can
diverge — which is the exact failure the extraction prevents. The frame and its
label belong to `u5-owner-guide`.

---

## `IdentityBlock`

| Aspect | Detail |
|---|---|
| Inputs | The property name, the locality name |
| State | None |
| Behaviour | Paints as the first content on screen, carrying the "this is your stay" confirmation |

**No image input, and none may be added** (AC2.1.5). No photo exists anywhere in
the system: the stay payload returns `property: { id, name }`, onboarding accepts
a name only, and there is no upload endpoint or object storage. A component with
an image input is a component someone eventually passes a placeholder to — and a
generic photo is worse than none, because it weakens exactly the specificity this
block exists to provide. `u1-api-contract`'s BR3.4 keeps the absence true at the
type boundary.

**Its layout is identical branded and unbranded.** The brand changes the accent
bar above it and the action colour within it; the box, the type and the spacing do
not move, so nothing reflows when tokens arrive.

**It is the page's first and most important content and must be reachable as
such** — a heading in the accessibility tree, not anonymous text.

---

## `GuideTabs`

| Aspect | Detail |
|---|---|
| Inputs | The guide's sections; the favourite id lists |
| State | `selectedTab` |
| Primitives | `u2`'s `TabBar` — arrow-key navigation, one tab always selected (`u2`'s BR3.6), horizontally scrollable at mobile widths (`u2`'s BR3.7) |

**Three tabs, always**: Overview, Places, Events (AC2.3.1), with **Overview
selected by default** so the guest lands on content rather than on a promise.

**Two of three panels are empty for every guest on every stay** until `AC4.1.9`.
The empty state uses `AC2.3.3`'s wording — "more local recommendations are being
added" — never a blank panel and never an error, and it carries in the
accessibility tree rather than being merely drawn (`u2`'s BR3.3). That rule's
load-bearing case is here: a screen-reader user meeting silence would meet it two
times out of three.

**No raw identifier is ever rendered** (AC2.3.2).

**Each panel owns its own empty state**, so an absent events list does not break
the page (AC2.3.4) — the page never branches on content presence.

---

## `NotYetPublishedNotice`

| Aspect | Detail |
|---|---|
| Inputs | The property name |
| State | None |
| Behaviour | A guest-framed statement that the host is still preparing the guide, and a prompt to contact them (AC1.8.3) |

**Guest-framed, and that is the whole point.** Never an error, never a blank page,
never owner-facing wording. The prior design's copy told the reader what "guests
will see until you publish", which is nonsense if a guest reads it — and this
component renders on **both** surfaces, so owner-framed wording here would reach
an actual guest.

**`IdentityBlock` still paints first.** A guest whose host has not finished still
needs to know the link is theirs.

---

## API integration points

**None.** This unit makes no request of any kind, and that is a boundary rather
than a coincidence: it renders inside the owner's preview as well as the guest's
page, so a fetch here would pull guest data from an owner's screen.

## Accessibility obligations this unit owns

Under `u2-design-system`'s Q1 = A boundary, a feature unit inherits its
obligations from `accessibility-checklist.md` directly. This unit's are inherited
by **both** consumers, which is one more thing the extraction buys — they are met
once rather than twice.

- **The empty panels' content in the accessibility tree**, not merely drawn. Two
  of three panels are empty by construction.
- **`IdentityBlock`'s heading structure** — the page's first and most important
  content, reachable as a heading.
- **The mobile tab strip** — reachable and scrollable at the narrowest supported
  width (AC2.3.5), which `u2`'s BR3.7 provides and this unit must not override.
- **Tab keyboard behaviour** — arrow keys between tabs, Tab into the panel
  (`u2`'s BR3.6), unchanged from the primitive.
