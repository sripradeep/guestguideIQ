# Functional Design — `u2-design-system`

Two questions.

**What this unit is.** The shared visual and interaction primitives every surface
is built from, with their states, keyboard behaviour, focus management and
live-region announcements built in. It is `kind: library`: no domain state, no
network access, no knowledge of where theme tokens came from. It carries no user
stories, because no story is delivered by a primitive alone.

**Why its contracts land here.** Contract Design deferred the component
specification to this stage deliberately (Q4 = A there), to avoid writing a spec
in a notation the unchosen framework would not survive. That constraint still
holds — the framework is OQ4 and `infrastructure-design` has not run — so what
this stage produces is framework-neutral: states, inputs, events and
accessibility behaviour, not props in a language.

**What is already settled:** this unit is excluded from the 80% coverage floor
(ADR-007), it consumes theme tokens and never resolves them, and WCAG 2.1 AA is
its responsibility rather than each screen's.

---

## Q1 — Where is the line between a primitive and a feature component?

`interaction-spec.md` specifies fourteen components without separating the two.
Some are plainly generic — a text input, a banner, a tab bar. Others are
domain-shaped: the guide's section editor with its shrink guard, the subscription
plan controls with their typed-action rule, the guest preview frame.

The line decides what gets built once and shared, versus built inside the unit
that needs it. Drawn wrongly in either direction it is expensive: too generous
and the design system absorbs business rules it should not know; too mean and
five units reimplement the same dialog.

- **A. Generic primitives only.** The design system owns `TextInput`,
  `StatusBanner`, `TabNav`, `SideNav`, `DateRangeField`, `CopyableLink`, and the
  dialog and button primitives. Everything carrying a domain rule —
  `SectionEditor`, `PlanControls`, `GuestPreview`, `SessionExpiredDialog`,
  `Wizard`, `FavoriteToggle`, `ChatWidget`, `BrandTheme` — belongs to the unit
  that owns the rule. Cleanest boundary; the design system stays ignorant of the
  product. Cost: some visual consistency work happens in five places.
- **B. Primitives plus generic composites.** As above, but the design system also
  owns the *shells* of the domain components — a generic modal that
  `SessionExpiredDialog` configures, a generic stepper the `Wizard` drives — with
  the rules staying in the feature units. More is shared; the boundary needs
  policing, because a shell tends to grow rules.
- **C. Everything in `interaction-spec.md`.** The design system owns all
  fourteen. Maximum consistency and a single place to meet the accessibility
  bar. Cost: the design system ends up knowing that a subscription action is a
  closed enum and that a guide save can delete everything — business rules in a
  unit that is excluded from the coverage floor.
- **X. Other (please specify)**

[Answer]: A

---

## Q2 — Does the design system enforce accessibility, or provide it?

`accessibility-checklist.md` puts WCAG 2.1 AA on this unit — its Operable and
Robust sections are almost entirely this unit's responsibility, on the reasoning
that meeting the standard should be a property of the primitives rather than a
per-screen effort.

That reasoning supports two quite different designs.

- **A. Enforce — the primitive is unusable without what it needs.** A text input
  cannot be constructed without a label. An icon-only control cannot be
  constructed without an accessible name. A dialog manages its own focus trap and
  return, and the caller cannot opt out. Accessibility failures become
  build-time errors in the consuming unit. Cost: rigidity, and a caller with a
  legitimate exception has to change this unit to express it.
- **B. Provide — correct behaviour is the default, and overridable.** The
  primitives do the right thing unless told otherwise, and a caller can override
  where it genuinely needs to. Flexible, and every override is a place the
  standard can quietly slip. The CI accessibility check is advisory (NFR2), so
  nothing else would catch it.
- **X. Other (please specify)**

[Answer]: B

---

## Consolidated Summary Confirmation

- **Q1 = A** — Generic primitives only. Anything carrying a domain rule belongs
  to the unit that owns the rule.
- **Q2 = B** — Provide rather than enforce: correct accessibility behaviour by
  default, overridable where a caller genuinely needs to.

**The two answers pull against each other, and the tension is worth naming.**

Q1 = A keeps this unit ignorant of the product, which is the right boundary — the
design system should not know that a subscription action is a closed enum, or
that a guide save can delete everything. But it also means the eight
domain-shaped components (`SectionEditor`, `PlanControls`, `Wizard`,
`ChatWidget`, `SessionExpiredDialog`, `GuestPreview`, `FavoriteToggle`,
`BrandTheme`) are built **inside five different feature units**.

Q2 = B then makes accessibility overridable in exactly those places. The
checklist's reasoning was that meeting WCAG should be a property of the
primitives rather than a per-screen effort — but under Q1 = A, eight of the
fourteen specified components are not primitives, and under Q2 = B the primitives
they are built from can be overridden.

**Neither answer is wrong. The combination needs a compensating control**, and
this design will state one rather than leave the gap:

1. The primitives' accessibility behaviour is the **default** and needs no
   configuration to be correct — a caller gets the right thing by doing nothing.
2. **Every override is explicit and named at the call site**, so it appears in a
   diff. An override reachable by omission is indistinguishable from someone
   forgetting a label.
3. The five feature units **inherit their accessibility obligations from
   `accessibility-checklist.md` directly**, not by assuming the design system
   covered them.

The third point is the one that would otherwise be discovered late. With a
generic-primitives-only boundary, a unit building its own domain component owns
that component's keyboard behaviour, focus management and announcements. The
design system supplies the parts; it does not supply the compliance. Since the CI
accessibility check is advisory (NFR2), nothing automated will catch a unit that
assumes otherwise.

[Answer]: Looks correct
