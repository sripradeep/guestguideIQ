# Interaction Specification — Backend Services for GuestGuideIQ

Component-level specs use `.claude/knowledge/aidlc-design-agent/component-spec-template.md`'s format. Covers the components introduced across the 16 stories; shared/generic components (buttons, inputs) are specified once and reused.

> **Round 2 (confirmed)**: adds the StatusBanner usage entry for the marketing-site lead forms (R-01 fix), a tablet row on SideNav's responsive table (R-04 fix), and a new BrandTheme component covering locality-brand rendering (FR9) across every Property Owner and Guest surface.

## Text Input Field

| Field | Value |
|---|---|
| Component | TextInput |
| Description | Single-line text entry (username, email, search) |
| Category | input |

### States
| State | Description | Trigger |
|---|---|---|
| default | Empty, ready for input | page load |
| focus | Active cursor | click / Tab |
| filled | Has a value | after input |
| error | Failed validation | blur with invalid value (AC1.1.3, AC4.1.2) |
| disabled | Non-interactive | e.g. account-id field on AD-2 while a lookup is in flight |

### Props / Inputs
| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| label | string | yes | — | Visible label, always above the field (never placeholder-only, per `ux-guide.md`) |
| errorMessage | string | no | — | Specific, actionable text (e.g. "Username already taken", not "Invalid input") |

### Accessibility
| Requirement | Implementation |
|---|---|
| ARIA role | native `<input>`, no role override needed |
| Keyboard interaction | Tab to focus, standard text entry |
| Label | `<label for>` associated explicitly |
| Contrast ratio | WCAG AA 4.5:1 |
| Screen reader | error announced via `aria-describedby` pointing to the error text |
| Focus management | visible 2px focus outline, 3:1 contrast |

## Multi-Step Wizard (Onboarding, PO-3)

| Field | Value |
|---|---|
| Component | Wizard |
| Description | Sequential multi-step form with progress indicator and resume support |
| Category | layout |

### States
| State | Description | Trigger |
|---|---|---|
| in-progress | Current step shown, prior steps saved | normal flow |
| resumed | Reopened mid-way (AC1.3.3) | returning user with incomplete onboarding |
| complete | Onboarding finished | final step submitted |

### Interaction rules (per `interaction-design-patterns.md` Multi-Step Forms)
- Step indicator always visible ("Step X of Y") with labels, not just dots.
- Backward navigation allowed without data loss.
- Data autosaved on each step transition (backs AC1.3.3's resume behavior) — status shown as "Saved" per `ux-guide.md` Autosave pattern.
- Final step shows a summary before submission.

### Accessibility
| Requirement | Implementation |
|---|---|
| ARIA role | `role="group"` per step, with `aria-current="step"` on the active step indicator |
| Keyboard interaction | Tab through fields, Enter to advance where a single primary action exists |
| Focus management | focus moves to the first field of the new step on transition |

## File Upload (PDF Import, PO-3)

| Field | Value |
|---|---|
| Component | FileUpload |
| Description | PDF upload with extraction preview |
| Category | input |

### States
| State | Description | Trigger |
|---|---|---|
| empty | No file selected | initial |
| loading | Extraction in progress (AC1.4.1) | after upload, before result |
| success | Extracted content shown as editable draft (AC1.4.3) | extraction completes |
| error | Corrupted/unsupported file (AC1.4.2) | extraction fails |

### Interaction rules
- Loading state uses a skeleton content block, not a spinner-only screen (per `wireframing-guide.md` Loading State guidance) — the guide editor's shape is already visible while content streams in.
- Error state offers [Start from scratch] as the very next action, not a dead end (Error Prevention pattern: recovery path, not just an alert).
- Success state is explicitly labeled "Draft — not yet visible to guests" — this is a hard requirement (AC1.4.3), not a styling choice.

## Star/Favorite Toggle (Locality Content, PO-6)

| Field | Value |
|---|---|
| Component | FavoriteToggle |
| Description | Non-destructive toggle to feature a POI/event in the property guide |
| Category | input |

### States
| State | Description | Trigger |
|---|---|---|
| unfavorited | Outline star | default |
| favorited | Filled star | click (AC1.6.1) |

### Interaction rules
- No confirmation dialog — reversible, low-stakes action (unfavoriting, AC1.6.3, is equally one click).
- Immediate optimistic UI update; failure (network error) reverts the toggle with a brief inline notice.

### Accessibility
| Requirement | Implementation |
|---|---|
| ARIA role | `<button aria-pressed="true|false">` |
| Screen reader | announces "Added to favorites" / "Removed from favorites" via `aria-live="polite"` |

## Chat Widget (Itinerary Chat, G-3)

| Field | Value |
|---|---|
| Component | ChatWidget |
| Description | Persistent conversational assistant for guests (Q5) |
| Category | feedback / input |

### States
| State | Description | Trigger |
|---|---|---|
| collapsed | Bubble icon only | default |
| open | Chat panel expanded | click bubble |
| loading | Assistant is composing a reply (AC2.3.3) | message sent |
| error | Assistant unavailable/timed out (AC2.3.3) | request fails |
| sparse-content-notice | Assistant's reply flags limited local content (AC2.3.2) | rendered as a normal assistant message, not a distinct UI state |

### Interaction rules
- Collapsed bubble is always reachable regardless of which guide tab (Overview/POIs/Events) the guest is viewing — genuinely persistent (Q5).
- Loading uses a typing-indicator animation (<300ms perceived latency per micro-interaction rules) that escalates to an explicit "still working..." note past ~5 seconds (per `ux-guide.md` Feedback & States timeout guidance).
- On error, chat history is preserved and a [Retry] action re-sends the last message.

### Accessibility
| Requirement | Implementation |
|---|---|
| ARIA role | `role="dialog"` `aria-label="Itinerary assistant"` when open |
| Keyboard interaction | Escape closes the widget; focus trapped inside while open |
| Screen reader | new assistant messages announced via `aria-live="polite"`; loading state announced once ("Assistant is typing"), not repeated |
| Focus management | focus returns to the bubble trigger on close |

## Tabbed Guide Navigation (G-2)

| Field | Value |
|---|---|
| Component | TabNav |
| Description | Overview / POIs / Events sections of the guest guide (Q4) |
| Category | navigation |

### Responsive Behaviour
| Breakpoint | Behaviour |
|---|---|
| mobile (<768px) | Tabs render as a horizontally scrollable bar, primary/default surface (Guests are primarily mobile per `personas.md`) |
| tablet/desktop (≥768px) | Same tab bar, more horizontal room — no structural change needed for this simple 3-tab case |

### Accessibility
| Requirement | Implementation |
|---|---|
| ARIA role | `role="tablist"` / `role="tab"` / `role="tabpanel"` |
| Keyboard interaction | Arrow keys move between tabs, Tab enters/exits the panel (per `accessibility-wcag.md` Tabs pattern) |

## Side Navigation (Property Owner Dashboard)

| Field | Value |
|---|---|
| Component | SideNav |
| Description | Persistent left-rail navigation across Guide, Locality Content, Subscription, Account (Q3) — also used by Admin/Ops (AD-1, AD-2, AD-3), whose rail lists POIs/Events/Accts/Localities instead |
| Category | navigation |

### Responsive Behaviour
| Breakpoint | Behaviour |
|---|---|
| mobile (<768px) | Collapses to a hamburger-triggered overlay (Priya's device context notes desktop-primary but not desktop-only, per `personas.md`) |
| tablet (768-1023px) | Collapses to icons-only rail (labels hidden, tooltip on hover/focus) rather than the mobile overlay or the full expanded desktop rail — enough room to stay persistent without the label width, per `interaction-design-patterns.md` Side Navigation guidance ("collapsible to icons-only for more content space") |
| desktop (≥1024px) | Persistent, expanded (icons + labels) |

### Accessibility
| Requirement | Implementation |
|---|---|
| ARIA role | `<nav>` landmark, current section marked `aria-current="page"` |
| Keyboard interaction | Tab through items in visual order |

## Error/Status Banner (used across PO-0, PO-1, PO-2, PO-4, G-1, marketing-site lead forms)

| Field | Value |
|---|---|
| Component | StatusBanner |
| Description | Inline error/success messaging, never color-only |
| Category | feedback |

### Interaction rules
- Every error state pairs an icon with text — never color alone (WCAG 2.1 AA Perceivable — non-color-dependent indicators), directly addressing the mob review's accessibility finding.
- Success and error banners use `aria-live="polite"`; nothing time-critical uses `assertive` (avoids interrupting screen-reader users mid-task).

### Marketing-site lead forms (US3.1, US3.2)
The existing marketing-site forms (waitlist, partner interest, investor/press) are reused as-is (no new mockup — see `mockups.md` "Visitor" section) but their error handling now routes through this same StatusBanner component instead of Formspree's own error UI:
- **Validation error (AC3.2.1)**: StatusBanner renders inline above the form, specific field-level errors also shown per-field (TextInput's `error` state); the visitor's entered data remains in every field — the form is never cleared.
- **Backend outage / network failure (AC3.2.2)**: StatusBanner renders the same "something went wrong, your information is safe — try again" message pattern used elsewhere (icon + text, `aria-live="polite"`); entered data remains in every field exactly as if the error were a validation error, so the visitor never has to distinguish the two failure modes from a data-loss standpoint.
- This is the one place StatusBanner appears without the product's SaaS-style visual system underneath it — it renders using the marketing site's own existing visual language, since "the current AJAX-with-fallback submission pattern should be preserved" (FR1.3) and no new page shell is being introduced here.

## Locality-Brand Theming (BrandTheme)

| Field | Value |
|---|---|
| Component | BrandTheme |
| Description | Applies a resolved locality-brand's identity (logo, name, accent color) as a themed layer over the product's functional base tokens (FR9.1-FR9.3) |
| Category | layout |

### States
| State | Description | Trigger |
|---|---|---|
| full-brand | Locality-brand has name/tagline + visual styling saved | normal rendering on any PO-3/PO-4/PO-5/PO-6, G-2 screen once a locality resolves |
| minimal-brand | Locality-brand has only name/tagline saved (no visual styling yet, per AD-3/AC4.4.1) | rendering falls back to the Q1 functional base tokens plus the name/tagline (AC1.5.4, AC2.2.4) |
| unresolved | No locality-brand resolves for the current domain | signup only (PO-0, AC1.1.5) — no theme applied at all, not even the functional default's accent color |

### Interaction rules (Q6 — themed accent layer, not deep restyling)
- Only logo, locality name/tagline, and a small brand-color palette (primary accent, header/accent-bar background) are swapped per locality (per Q6's "themed accent layer" decision).
- Layout, typography, spacing, and every component's behavior (SideNav, TabNav, ChatWidget, forms) stay byte-identical across every locality — BrandTheme only ever substitutes token *values*, never structure.
- Applies wherever a locality has been resolved: the onboarding wizard (PO-3, once past signup) and the Property Owner dashboard shell (PO-4/PO-5/PO-6, behind SideNav), plus the Guest guide (G-2). It never applies to Admin/Ops screens (AD-1/AD-2/AD-3), which are internal and always render in the plain functional default regardless of which locality is being managed.
- The `unresolved` state (PO-0) is the one place in the product with **no** BrandTheme applied — deliberately undressed, matching the neutral-error-page decision (Q7).

### Accessibility
| Requirement | Implementation |
|---|---|
| Contrast | Every locality's chosen accent color must independently meet the same 4.5:1 (text) / 3:1 (UI component) contrast ratios against the base tokens — this is a per-locality validation, not a one-time check of a single global token (see `accessibility-checklist.md`). |
| Screen reader | The theme swap itself is not announced (it's a visual-only change); the locality name in the header/logo alt text is read normally as part of page content. |

## Locality-Brand Form (Admin/Ops, AD-3)

| Field | Value |
|---|---|
| Component | LocalityBrandForm |
| Description | Create/edit a locality's brand identity and its domain associations (US4.4) |
| Category | input |

### States
| State | Description | Trigger |
|---|---|---|
| create | Blank form for a new locality-brand | "+ New Locality-Brand" |
| edit | Pre-filled with an existing locality-brand's data | selecting a locality from the list |
| error-invalid | Missing/invalid identity data (AC4.4.5) | validation failure on save |
| error-domain-conflict | Domain already bound elsewhere (AC4.4.4) | domain field validation on add/save |

### Interaction rules
- Name/tagline are required; visual styling fields are optional — a save with only name/tagline is valid (this exact case is what BrandTheme's `minimal-brand` state has to render gracefully elsewhere in the product).
- At least one domain must be present before the form can be saved (AC4.4.1).
- Domain add uses the same inline-validation-on-blur pattern as TextInput; a conflicting domain shows its error immediately, not only on final save.
- No control on this form (or anywhere else) allows a Property Owner or third party to reach it — it exists only inside the Admin/Ops SideNav shell (AC4.4.3's authorization boundary is enforced by this control's absence outside AD-3, not by a runtime permission prompt).

### Accessibility
| Requirement | Implementation |
|---|---|
| ARIA role | native `<form>` with `<fieldset>`/`<legend>` grouping identity fields separately from domain fields |
| Label | every field labeled per TextInput's convention (visible label above, never placeholder-only) |
| Screen reader | domain-conflict and invalid-data errors announced via `aria-describedby`, matching TextInput's error pattern |
