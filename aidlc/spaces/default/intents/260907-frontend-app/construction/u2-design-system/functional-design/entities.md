# Entities — `u2-design-system`

*Re-confirmed 2026-09-08 after the functional-design redo jump. Content
unchanged.*

This unit owns **no domain data**. Its entities are the things a design system
actually has: the token set every surface themes from, and the primitive
inventory every surface is built from.

Framework-neutral throughout. The framework is OQ4 and unchosen, so nothing here
is expressed as props in a language — states, inputs, events and accessibility
behaviour only. Contract Design deferred the component specification to this
stage precisely so it would not be written in a notation the eventual choice
would not survive.

## Source of truth

```yaml
entities:

  - name: DesignToken
    description: One named design value. The unit of theming.
    identifier: name
    attributes:
      - { name: name, type: string, required: true }
      - { name: category, type: enum, required: true, allowed: [spacing, colour-action, colour-status, colour-surface, typography, radius, elevation, touch-target, breakpoint] }
      - { name: value, type: string, required: true }
      - { name: localityOverridable, type: boolean, required: true }
    constraints:
      - "Only the action-accent and header/accent-bar tokens are locality-overridable. Status colours and typography are NEVER overridable — branding is scoped to colour, logo and name."
      - "The touch-target category carries TWO values: `touch-target` (44x44, the general minimum, including DateField's day cells) and `touch-target-primary` (48x48, for primary actions). accessibility-checklist.md requires both; a single value cannot express it."
      - "This unit CONSUMES resolved token values. It never resolves a brand, never parses visualStyling, and never knows which locality it is rendering."

  - name: TokenSet
    description: The complete set of token values in force for one render.
    identifier: setId
    attributes:
      - { name: setId, type: string, required: true }
      - { name: completeness, type: enum, required: true, allowed: [base, brand-partial, brand-full] }
      - { name: tokens, type: "list of DesignToken", required: true }
    constraints:
      - "A TokenSet is always complete: `base` is the functional default, `brand-partial` is base plus a locality name, `brand-full` adds accent values. There is no partial set with holes for a primitive to handle."
      - "Producing a TokenSet is u3-foundation's job. This unit only reads one."

  - name: Primitive
    description: One shared interaction or presentation component.
    identifier: name
    attributes:
      - { name: name, type: string, required: true }
      - { name: category, type: enum, required: true, allowed: [input, display, layout, navigation, feedback, overlay] }
      - { name: states, type: "list of string", required: true }
      - { name: inputs, type: "list of PrimitiveInput", required: true }
      - { name: events, type: "list of string", required: true }
      - { name: accessibilityDefaults, type: AccessibilityContract, required: true }
    constraints:
      - "A primitive carries NO domain rule. It does not know what a subscription is, that a guide save can delete sections, or that a stay token expires."
      - "Every primitive is usable correctly with no accessibility configuration — the default is the accessible behaviour."

  - name: PrimitiveInput
    description: One named input a primitive accepts.
    identifier: name
    attributes:
      - { name: name, type: string, required: true }
      - { name: required, type: boolean, required: true }
      - { name: purpose, type: string, required: true }
      - { name: accessibilityRelevant, type: boolean, required: true }
    constraints:
      - "An input marked accessibilityRelevant that is omitted causes the primitive to fall back to its accessible default, never to render without one."

  - name: AccessibilityContract
    description: What a primitive guarantees, and where a caller may deviate.
    identifier: primitiveName
    attributes:
      - { name: primitiveName, type: string, required: true }
      - { name: role, type: string, required: false }
      - { name: keyboardBehaviour, type: string, required: true }
      - { name: focusBehaviour, type: string, required: true }
      - { name: announcement, type: string, required: false }
      - { name: overridable, type: "list of string", required: true }
    constraints:
      - "Overrides are NAMED. A caller opts out of a specific behaviour explicitly; nothing is opted out of by omission (Q2 = B, with the compensating control)."
      - "An empty overridable list means the behaviour is fixed for that primitive."
```

## The primitive inventory

Nine primitives, derived from `interaction-spec.md` and bounded by Q1 = A —
generic only, nothing carrying a domain rule.

| Primitive | Category | Used by | Notable behaviour |
|---|---|---|---|
| `TextInput` | input | every form surface | Label above, never placeholder-only; validate on blur, never per keystroke |
| `Button` | input | everywhere | Primary/secondary/destructive variants; disabled state carries a reachable reason |
| `DateField` | input | the guest-link form | Operable by typing without opening a picker — a pointer-only calendar is a hard failure |
| `StatusBanner` | feedback | errors, successes, rate limits | Icon **and** text always; colour never carries meaning alone |
| `CopyableValue` | display | the generated guest link | The value is always selectable text; the copy control is an affordance, never the only path |
| `TabBar` | navigation | the guest guide | Arrow-key navigation; an empty panel still contains its empty-state text |
| `NavRail` | navigation | the owner shell | Collapses to overlay below 768px, icons-only 768–1023px, expanded above |
| `Dialog` | overlay | confirmations, blocking states | Focus trapped and returned; Escape closes **by default** and that default is overridable |
| `LiveRegion` | feedback | copy confirmation, save status, chat replies | Polite announcements; nothing here is ever assertive |

## What this unit does not own

Eight components specified in `interaction-spec.md` belong to feature units, per
Q1 = A. Each carries a domain rule the design system must not learn:

| Component | Owner | The rule that disqualifies it |
|---|---|---|
| `SectionEditor` | `u5-owner-guide` | The shrink guard — a save with fewer sections needs confirmation |
| `GuestPreview` | `u5-owner-guide` | Renders the guest-facing view inside an owner frame |
| `Wizard` | `u5-owner-guide` | The step machine is forward-only; back is review-only |
| `PlanControls` | `u6-owner-locality-billing` | The action is a closed enum; no automatic retry, ever |
| `FavoriteToggle` | `u6-owner-locality-billing` | Optimistic update with revert; complete body required |
| `ChatWidget` | `u8-guest-app` | Replies are untrusted text |
| `SessionExpiredDialog` | `u4-owner-shell` | Escape must **not** dismiss — there is nothing to return to |
| `BrandTheme` | `u3-foundation` | Parses `visualStyling`, which is a security boundary |

`SessionExpiredDialog` is the clearest illustration of why the line falls here.
It is built from `Dialog`, but it inverts `Dialog`'s Escape-closes default —
because a session that has ended has nothing behind it to return to. That
inversion is a domain decision. A design system that knew it would be a design
system that knew about sessions.

## The accessibility gap this boundary creates

**Stated here because it is a consequence of Q1 = A and Q2 = B together, and
because nothing automated will catch it.**

This unit was given WCAG 2.1 AA on the reasoning that meeting the standard is
"a property of the primitives, not a per-screen effort" (`unit-of-work.md` § U2;
the same framing appears in `contract-summary.md` § C4 and `components.md`).
`accessibility-checklist.md` then wrote the obligations themselves, item by item,
without naming an owner for each. Under Q1 = A, **eight of the fourteen specified
components are not primitives**, and under Q2 = B the nine that are can be
overridden.

So:

1. Primitives are correct by default. A caller that configures nothing gets
   accessible behaviour.
2. Overrides are **named**, so they appear in a diff. An override reachable by
   omission would be indistinguishable from a forgotten label.
3. **The five feature units own the accessibility of the components they build.**
   They inherit those obligations from `accessibility-checklist.md` directly, not
   by assuming this unit covered them.

Point 3 is the one that would otherwise be found late. The design system supplies
the parts; it does not supply the compliance. The CI accessibility check is
advisory (NFR2), so a unit that assumes otherwise will not be told.
