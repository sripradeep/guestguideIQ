# Accessibility Checklist — Backend Services for GuestGuideIQ

Target: **WCAG 2.1 AA** across all Guest- and Property-Owner-facing surfaces, per the baseline already established in `user-stories/stories.md`'s "UX & Accessibility Baseline" section (a mob-review finding). This checklist operationalizes that commitment against the actual screens and components in `mockups.md`/`interaction-spec.md`.

## Perceivable

- [ ] All icons paired with text or `aria-label` (StatusBanner icons, FavoriteToggle star, ChatWidget bubble) — never icon-only.
- [ ] Color contrast 4.5:1 minimum for all text, 3:1 for large text and UI component borders (design tokens in `design-system-mapping.md` must be contrast-checked once finalized).
- [ ] Error states never rely on red color alone (StatusBanner pairs icon + text, per `interaction-spec.md`).
- [ ] Property photo on G-2 (trust confirmation, AC2.1.1) has descriptive alt text (property name), not decorative-only.

## Operable

- [ ] Every interactive element reachable and operable via keyboard alone: TextInput, Wizard steps, FileUpload trigger, FavoriteToggle, ChatWidget (open/close/send), TabNav, SideNav.
- [ ] Visible focus indicators (2px, 3:1 contrast) on every focusable element — no `outline: none` without a replacement.
- [ ] Logical tab order matching visual layout on every screen.
- [ ] ChatWidget traps focus while open and returns focus to the trigger bubble on close (Modal-pattern rules apply even though it's not a full-screen modal).
- [ ] TabNav (G-2) supports arrow-key navigation between tabs per the WCAG Tabs pattern.
- [ ] Touch targets minimum 44×44px on Guest-facing (mobile-primary) surfaces; 48×48px for primary actions (Continue, Send, Save).
- [ ] No time limits on any interaction (onboarding wizard, chat) without an extend/disable option.

## Understandable

- [ ] Every form field has a visible label above the input (never placeholder-only) — TextInput spec enforces this.
- [ ] Error messages are specific and actionable (e.g. "Username already taken," not "Invalid input") — applies to AC1.1.2, AC1.1.3, AC4.1.2.
- [ ] Destructive actions (subscription cancellation, AC1.8.2) require explicit confirmation and state consequences plainly before commit.
- [ ] Consistent navigation placement across all Property Owner/Admin screens (SideNav) and all Guest screens (TabNav + chat bubble).
- [ ] Page/app language declared (`lang` attribute) — carries into implementation, not screen-specific.

## Robust

- [ ] Native HTML elements preferred over ARIA-only constructs wherever possible (e.g. `<button>` for FavoriteToggle, not a styled `<div>`).
- [ ] Heading hierarchy is logical and unbroken on every screen (no skipped levels).
- [ ] Dynamic content changes (favorite toggled, chat reply arrives, form error appears) are announced via `aria-live="polite"` regions — specified per-component in `interaction-spec.md`.

## Testing Plan (carried to build-and-test / domain-design)

1. Automated scan (axe DevTools or equivalent) on every implemented screen — catches roughly a third of issues per `accessibility-wcag.md`, not a substitute for the rest.
2. Full keyboard-only pass across all 16 stories' primary flows (unplug the mouse).
3. Screen reader pass (VoiceOver/NVDA) on at minimum: PO-1 (signup), PO-3 (wizard), G-2 (guest guide + chat) — the highest-stakes and most novel interaction surfaces.
4. Zoom testing at 200%/400% on G-2 in particular, given its mobile-first, one-shot usage pattern (Sam's persona).
5. Color-blindness simulation pass on StatusBanner and FavoriteToggle states, where color differentiates meaning alongside icon/text.

## Known Gaps Deferred (not resolved at this stage)

- Exact color token values and their measured contrast ratios — deferred to `domain-design`/`functional-design` once the visual design is finalized beyond this stage's token placeholders.
- Screen-reader-specific copy for the itinerary chat's AI-generated responses (how much of a long generated itinerary gets read aloud vs. summarized) — a genuine open question for `domain-design`, not decided here.
