# Business Rules — `u2-design-system`

*Re-confirmed 2026-09-08 after the functional-design redo jump. Content
unchanged.*

This unit owns no business logic, so its rules are **constraints on what a
primitive may be and may know**. Most are negative: what must be impossible, what
must never be learned, what must not be reachable by omission.

## Source of truth

```yaml
rules:

  - id: BR1.1
    statement: A primitive carries no domain rule and knows nothing about the product.
    category: constraint
    applies_to: every primitive
    trigger: adding or changing any primitive
    logic: >
      IF a primitive would need to know what a subscription is, that a guide save
      can delete sections, that a stay token expires, or any other product fact,
      THEN it does not belong in this unit — the component belongs to the unit
      that owns the rule.
    violation: >
      Business rules migrate into a unit excluded from the coverage floor
      (ADR-007), where they are neither measured nor owned by anyone who
      understands them.
    source: Q1 (functional design), ADR-007

  - id: BR1.2
    statement: This unit consumes theme tokens and never resolves them.
    category: constraint
    applies_to: every primitive
    trigger: rendering with a brand applied
    logic: >
      IF a primitive needs a colour, spacing or typography value, THEN it reads a
      resolved token. It never reads a locality, never parses visualStyling, and
      never knows which brand is in force.
    violation: >
      visualStyling is unschematised and attacker-influenceable. A primitive
      reading it directly bypasses the single module that parses it into typed
      tokens with defaults, which is a security boundary and not a layering
      preference.
    source: Contract Design C4, team practices (untrusted-render rule)

  - id: BR1.3
    statement: Status colours and typography are never locality-overridable.
    category: constraint
    applies_to: TokenSet, DesignToken
    trigger: applying a brand
    logic: >
      IF a brand supplies values, THEN only the action accent and the
      header/accent-bar background change. Success, error and warning colours and
      the typographic scale stay fixed.
    violation: >
      A locality could otherwise make an error look like a success. Branding is
      scoped to colour, logo and name deliberately, and status meaning is not
      part of that scope.
    source: design-system-mapping.md

  - id: BR2.1
    statement: Every primitive is accessible with no configuration.
    category: constraint
    applies_to: every primitive
    trigger: a caller using a primitive without setting accessibility inputs
    logic: >
      IF an accessibility-relevant input is omitted, THEN the primitive falls
      back to its accessible default. It never renders without one.
    violation: >
      Accessibility that requires configuration is accessibility that is
      sometimes absent. The default has to be the correct behaviour, because the
      default is what most call sites will use.
    source: Q2 (functional design), NFR1

  - id: BR2.2
    statement: An accessibility override is named and explicit, never reachable by omission.
    category: constraint
    applies_to: AccessibilityContract
    trigger: a caller deviating from a primitive's default behaviour
    logic: >
      IF a caller needs to deviate, THEN it names the specific behaviour it is
      overriding, so the deviation appears in a diff.
    violation: >
      An override reachable by leaving something out is indistinguishable from a
      mistake. The CI accessibility check is advisory (NFR2), so a reviewer
      reading a diff is the only thing that would catch it.
    source: Q2 (functional design), NFR2

  - id: BR2.3
    statement: No state is signalled by colour alone.
    category: constraint
    applies_to: StatusBanner, Button, TabBar, and any stateful primitive
    trigger: rendering any state distinction
    logic: >
      IF a primitive distinguishes states visually, THEN the distinction carries
      an icon, a shape or text as well as a colour.
    violation: >
      WCAG 2.1 AA non-colour-dependent indicators. This is also the rule that
      makes the product usable under the per-locality accent colours, which this
      unit cannot validate.
    source: NFR1, accessibility-checklist.md

  - id: BR2.4
    statement: Nothing announces assertively.
    category: constraint
    applies_to: LiveRegion and every announcing primitive
    trigger: any dynamic content change
    logic: >
      IF a change is announced, THEN it is announced politely.
    violation: >
      An assertive announcement interrupts a screen-reader user mid-task. Nothing
      in this product is urgent enough to justify that.
    source: accessibility-checklist.md

  - id: BR2.5
    statement: A disabled control's reason is programmatically reachable.
    category: constraint
    applies_to: Button, and any disableable primitive
    trigger: rendering a control in a disabled state
    logic: >
      IF a control is disabled, THEN the reason is associated with it
      programmatically, not placed only as adjacent visual text.
    violation: >
      A disabled control whose reason a screen-reader user cannot reach is a dead
      end. The subscription screen has two distinct disabled scenarios and needs
      this in both: with no active subscription, upgrade, downgrade and cancel
      are all disabled with a "start a subscription first" explanation
      (AC1.14.4); and separately, upgrade and downgrade are disabled whenever
      only one tier exists, which is always the case today (unit-of-work.md
      § U6).
    source: accessibility-checklist.md, AC1.14.4, unit-of-work.md § U6

  - id: BR3.1
    statement: A value a user may need to copy is always present as selectable text.
    category: constraint
    applies_to: CopyableValue
    trigger: rendering any copyable value
    logic: >
      IF a value is offered for copying, THEN it is rendered as selectable text
      AND a copy control is offered. The control is never the only path.
    violation: >
      Clipboard access fails silently in more contexts than people expect —
      insecure origins, embedded webviews, denied permissions. An owner who
      cannot obtain a guest link cannot host their guest.
    source: AC1.9.6

  - id: BR3.2
    statement: A date field is fully operable without opening a picker.
    category: constraint
    applies_to: DateField
    trigger: entering a date
    logic: >
      IF a date is entered, THEN typing it into the field is always sufficient. A
      calendar grid, when present, is an additional affordance.
    violation: >
      A pointer-only calendar is a hard keyboard-accessibility failure, and this
      field is on the path an owner uses to create a guest link.
    source: accessibility-checklist.md, AC1.9.1

  - id: BR3.3
    statement: An empty container still carries its empty-state content.
    category: constraint
    applies_to: TabBar, and any list or panel primitive
    trigger: rendering with no content
    logic: >
      IF a panel or list has nothing to show, THEN it contains its empty-state
      text rather than being silent.
    violation: >
      A silent panel is invisible to a screen reader. This is load-bearing for
      the guest guide, where two of three tabs are empty by construction until
      AC4.1.9.
    source: AC2.3.3, accessibility-checklist.md

  - id: BR3.4
    statement: Dialog focus is trapped while open and returned on close.
    category: constraint
    applies_to: Dialog
    trigger: opening or closing any overlay
    logic: >
      IF a dialog opens, THEN focus moves into it and is trapped; on close focus
      returns to the element that opened it. Escape closes by default.
    violation: >
      Focus escaping an open dialog strands a keyboard user behind an overlay
      they cannot see past.
    source: accessibility-checklist.md
    note: >
      The Escape-closes default is the one behaviour in this unit designed to be
      overridden — SessionExpiredDialog inverts it, because a session that has
      ended has nothing to return to. That inversion is a domain decision and
      lives in u4-owner-shell (BR2.2 applies: the override is named).

  - id: BR3.5
    statement: A confirmation is announced and shown, and never replaces what it confirms.
    category: constraint
    applies_to: CopyableValue, StatusBanner
    trigger: any action completing successfully
    logic: >
      IF an action succeeds, THEN the confirmation is announced politely AND
      rendered visibly, alongside the value it confirms rather than in place of
      it. No confirmation self-dismisses on a timer.
    violation: >
      A confirmation that swaps out the value leaves someone who missed it with
      neither. A vanishing toast is a confirmation only for whoever was looking
      at that part of the screen at that moment.
    source: AC1.9.3, AC1.9.7

  - id: BR3.6
    statement: A tab set always has exactly one tab selected, reachable by arrow keys.
    category: constraint
    applies_to: TabBar
    trigger: rendering or navigating a tab set
    logic: >
      IF a tab set is rendered, THEN one tab is selected. Left/Right move between
      tabs and Home/End reach the ends; Tab moves into the panel rather than
      across the tabs.
    violation: >
      A tab set with nothing selected shows an empty region that is neither a
      panel nor an empty state. Tab-key traversal across tabs strands a keyboard
      user in the strip on a guide with three tabs and a long panel.
    source: AC2.3.1, accessibility-checklist.md

  - id: BR3.7
    statement: A tab strip scrolls at narrow widths; it never wraps or truncates.
    category: constraint
    applies_to: TabBar
    trigger: rendering below the tablet breakpoint
    logic: >
      IF the strip is wider than the viewport, THEN it scrolls horizontally and
      every tab stays reachable. Tabs are never dropped, collapsed into an
      overflow menu, or wrapped onto a second row.
    violation: >
      The guest guide is mobile-first and its tabs are the only navigation it
      has. A truncated strip removes a section of the guide with no indication
      it existed.
    source: AC2.3.5, NFR4
```

## Rules summary

| ID | Statement | Enforced by |
|---|---|---|
| BR1.1 | No primitive carries a domain rule | Review of what a primitive needs to know |
| BR1.2 | Tokens are consumed, never resolved | The unit's dependency set — it cannot reach a brand |
| BR1.3 | Status colours and typography are not overridable | The token category, which marks overridability |
| BR2.1 | Accessible with no configuration | Each primitive's default behaviour |
| BR2.2 | Overrides are named, never by omission | The shape of the override input |
| BR2.3 | No state signalled by colour alone | Each primitive's state design |
| BR2.4 | Nothing announces assertively | `LiveRegion`'s only mode |
| BR2.5 | Disabled reasons are reachable | The disabled state's contract |
| BR3.1 | Copyable values are always selectable text | `CopyableValue`'s structure |
| BR3.2 | Dates are typable without a picker | `DateField`'s input handling |
| BR3.3 | Empty containers carry empty-state content | `TabBar`'s panel contract |
| BR3.4 | Dialog focus trapped and returned | `Dialog`'s focus behaviour |
| BR3.5 | Confirmations are announced, shown, and additive | `CopyableValue`'s success state |
| BR3.6 | Exactly one tab selected, arrow-key reachable | `TabBar`'s selection invariant |
| BR3.7 | Tab strips scroll rather than wrap or truncate | `TabBar`'s narrow-width behaviour |

## The two rules that do the most work

**BR1.1** is what keeps this unit small. Every component that failed it —
eight of the fourteen in `interaction-spec.md` — went to the unit owning its
rule. Without it, the design system accumulates the product's business logic in
the one unit excluded from the coverage floor.

**BR2.2** is the compensating control for the gap Q1 and Q2 create together.
With generic primitives only, eight components are built in feature units; with
overridable accessibility, the primitives they are built from can deviate. Named
overrides are what makes a deviation visible in review — and since the CI
accessibility check is advisory, review is the only thing that will see it.
