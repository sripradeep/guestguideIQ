# Accessibility Checklist — GuestGuideIQ Frontend

Target: **WCAG 2.1 AA** on every Owner and Guest surface (NFR1). This checklist
operationalises that commitment against the actual screens in `mockups.md` and
the component specs in `interaction-spec.md`.

**Enforcement is advisory, deliberately and temporarily.** NFR2 puts an automated
accessibility check in CI that **reports without blocking**, with a recorded
intent to make it blocking once the baseline is clean. That is a knowing,
time-boxed exception to the team's own enforcement-discipline principle — the
same principle that makes the linter and both security scanners blocking gates.
When it becomes blocking, and what counts as a clean baseline, is OQ6, assigned
to `ci-pipeline`.

## Perceivable

- [ ] Every icon is paired with text or an `aria-label` — StatusBanner icons, the
      FavoriteToggle star, the ChatWidget bubble, the PO-0 and G-1 error marks.
      Never icon-only.
- [ ] Text contrast ≥ 4.5:1; large text and UI component borders ≥ 3:1.
- [ ] **No state is signalled by colour alone.** FavoriteToggle's favourited and
      unfavourited states differ in **shape** (filled versus outline), not only
      in colour. StatusBanner always pairs an icon with text.
- [ ] The `● Published` / `○ Draft` indicator on PO-5 carries a text label, not
      only a coloured dot.
- [ ] The `● Valid` / `○ Expired` state on each PO-7 link carries a text label.
- [ ] PO-4's disabled Upgrade and Downgrade controls are distinguishable from
      enabled ones by more than colour, and their explanation is visible text
      rather than a hover-only tooltip.
- [ ] **Every locality's accent colour independently meets the contrast floor**
      (NFR3) — a per-brand validation, not one check of a single global token.
      **See the open problem below: this has no enforcement point.**

> **Removed from the prior checklist:** "Property photo on G-2 has descriptive
> alt text." There is no property photo anywhere in the system, and AC2.1.5
> requires that no placeholder image stands in for one. The item is gone because
> the element is gone — not because the requirement was relaxed.

## Operable

- [ ] Every interactive element is reachable and operable by keyboard alone:
      TextInput, Wizard steps, DateRangeField, CopyableLink's copy control,
      SectionEditor's per-section controls, FavoriteToggle, ChatWidget
      (open/close/send), TabNav, SideNav, PlanControls.
- [ ] **DateRangeField is fully operable without opening a picker** — typing a
      date into the field is always sufficient. A calendar grid that can only be
      driven by pointer is a hard failure for this component.
- [ ] SectionEditor exposes no drag-only interaction: any reorder affordance has
      a keyboard equivalent.
- [ ] Visible focus indicators (2px, 3:1 contrast) on every focusable element.
      No `outline: none` without a replacement.
- [ ] Logical tab order matching visual layout on every screen.
- [ ] Focus is trapped and returned correctly by every modal surface: ChatWidget,
      SectionEditor's shrink-guard confirmation, PlanControls' cancel
      confirmation, SessionExpiredDialog, and the mobile SideNav overlay.
- [ ] **SessionExpiredDialog does not dismiss on Escape** — there is nothing to
      return to, and the only exit is the log-in action. Every other modal
      surface does dismiss on Escape.
- [ ] TabNav supports arrow-key navigation between tabs.
- [ ] Touch targets ≥ 44×44px, including DateRangeField's day cells; 48×48px for
      primary actions (Continue, Save, Send, Generate link).
- [ ] No time limits on any interaction without an extend or disable option.

## Understandable

- [ ] Every form field has a visible label above the input. Never
      placeholder-only.
- [ ] Error messages are specific and actionable — "That username is already
      taken", not "Invalid input"; "Check-out must be after check-in", not
      "Invalid range".
- [ ] **A disabled control's reason is programmatically reachable**, associated
      via `aria-describedby` rather than presented as adjacent visual text only.
      This applies to PO-4's Upgrade and Downgrade (Q6) and to every control
      disabled in the no-subscription state. A disabled control whose reason a
      screen-reader user cannot reach is a dead end.
- [ ] A read-only Wizard review step **announces itself as read-only**, so a user
      is not left trying to edit an inert field.
- [ ] Destructive and irreversible actions state their consequences before
      committing, in the accessible text and not only visually:
      - SectionEditor's shrink guard **names the sections it will remove**.
      - PlanControls' cancel confirmation states that guide content survives.
- [ ] Consistent navigation placement — SideNav across Owner screens, TabNav plus
      the chat bubble across Guest screens.
- [ ] Page language is declared.

## Robust

- [ ] Native elements preferred over ARIA reconstructions — `<button>` for
      FavoriteToggle and the copy control, native date inputs where available.
- [ ] Heading hierarchy is logical and unbroken on every screen; no skipped
      levels.
- [ ] Dynamic changes are announced via `aria-live="polite"`: favourite toggled,
      chat reply arrived, save status changed, form error appeared, **and the
      PO-7 copy confirmation (AC1.9.7)** — which must never be signalled by a
      colour change or a vanishing toast alone.
- [ ] Nothing uses `aria-live="assertive"`. Nothing here is urgent enough to
      justify interrupting a screen-reader user mid-task.
- [ ] An empty TabNav panel contains its empty-state text, so the panel is never
      silent to a screen reader.

## Guest-surface specifics

Sam's context makes several of these load-bearing rather than routine: a phone,
often one-handed, frequently on hotel wifi, sometimes standing outside a door.

- [ ] The G-2 identity block (property name, locality name) is the first content
      painted and the first content announced — before tabs, chat affordance or
      theming assets, with no full-page spinner ahead of it (AC2.1.1).
- [ ] The rate-limited state is announced as its own distinct state, not as a
      generic error (AC2.5.3).
- [ ] Chat replies are rendered as untrusted text and never reach a raw-HTML sink
      (AC2.4.6) — a security requirement with an accessibility consequence, since
      injected markup would also corrupt the announced content.
- [ ] Zoom to 200% and 400% on G-2 without loss of content or function.

## Testing plan (carried to `build-and-test` and `ci-pipeline`)

1. **Automated scan** on every implemented screen. Catches roughly a third of
   issues — not a substitute for the rest, and specifically blind to most of the
   items above.
2. **Full keyboard-only pass** across the walking-skeleton flow (PO-1 → PO-9 →
   PO-3 → PO-5) and the whole guest surface.
3. **Screen-reader pass** on, at minimum: PO-9 (login's non-disclosing error),
   PO-3 (the read-only review step), PO-7 (the copy live region and the date
   field), and G-2 with G-3 (identity block ordering and chat announcements).
   These are the highest-stakes and most novel surfaces.
4. **Zoom testing** at 200% and 400%, G-2 in particular.
5. **Colour-blindness simulation** on FavoriteToggle, the published/draft
   indicator, the link valid/expired indicator and StatusBanner — every place
   where a state is carried partly by colour.

## Open problems

**The per-locality contrast requirement has no enforcement point.** NFR3 requires
each locality's accent to independently meet the contrast floor. The prior design
enforced this at save time on the Admin locality-brand screen, refusing to save a
failing brand with styling applied. **That screen is out of scope this intent**
and nothing issues the ops-role token it needed, so brands are seeded out of band
by ops (assumption A1) with no UI in the loop and no validation anywhere. The
requirement stands and cannot currently be met by anything this frontend builds.
Three candidate homes, none chosen here:

- a server-side check when a brand is written, wherever that write ends up living;
- a client-side check in the `BrandTheme` module that falls back to the base
  tokens when a brand's accent fails, degrading rather than rendering unreadable
  text;
- a scheduled audit over seeded brands.

The middle option is the only one this frontend can implement alone, and it is a
mitigation rather than enforcement — it prevents an unreadable render but does
not stop a bad brand being seeded. **Recommended for `domain-design` to decide,
with the client-side fallback adopted regardless of what else is chosen.**

**Deferred, unchanged from the prior design:**

- Exact colour token values and their measured contrast ratios →
  `domain-design`/`functional-design`.
- How much of a long generated itinerary a screen reader should read aloud versus
  summarise → `domain-design`. Genuinely open; a several-hundred-word itinerary
  announced in full is its own accessibility problem.
- When the CI accessibility check becomes blocking, and what defines a clean
  baseline (OQ6) → `ci-pipeline`.
