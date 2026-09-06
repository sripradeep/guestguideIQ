# Interaction Specification — Backend Services for GuestGuideIQ

Component-level specs use `.claude/knowledge/aidlc-design-agent/component-spec-template.md`'s format. Covers the components introduced across the 16 stories; shared/generic components (buttons, inputs) are specified once and reused.

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
| Description | Persistent left-rail navigation across Guide, Locality Content, Subscription, Account (Q3) |
| Category | navigation |

### Responsive Behaviour
| Breakpoint | Behaviour |
|---|---|
| mobile (<768px) | Collapses to a hamburger-triggered overlay (Priya's device context notes desktop-primary but not desktop-only, per `personas.md`) |
| desktop (≥1024px) | Persistent, expanded |

### Accessibility
| Requirement | Implementation |
|---|---|
| ARIA role | `<nav>` landmark, current section marked `aria-current="page"` |
| Keyboard interaction | Tab through items in visual order |

## Error/Status Banner (used across PO-1, PO-2, PO-4, G-1)

| Field | Value |
|---|---|
| Component | StatusBanner |
| Description | Inline error/success messaging, never color-only |
| Category | feedback |

### Interaction rules
- Every error state pairs an icon with text — never color alone (WCAG 2.1 AA Perceivable — non-color-dependent indicators), directly addressing the mob review's accessibility finding.
- Success and error banners use `aria-live="polite"`; nothing time-critical uses `assertive` (avoids interrupting screen-reader users mid-task).
