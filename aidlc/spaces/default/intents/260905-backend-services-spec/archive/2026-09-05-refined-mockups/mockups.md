# Refined Mockups — Backend Services for GuestGuideIQ

Text-based mid-fidelity wireframes (per `wireframing-guide.md`), covering all 16 user stories (Q2: full coverage). Visual brand is distinct/functional (Q1) — a clean, modern SaaS look, not the marketing site's warm/earthy brand. Property Owner surfaces use side navigation (Q3); the Guest guide is a tabbed multi-section app (Q4) with a persistent chat widget (Q5).

Screens are grouped by persona/journey, matching `stories.md`. Each screen names its primary (Success) state plus the alternate states that matter (Empty, Loading, Error, Partial) — not all five are repeated where a state doesn't materially differ.

## Property Owner Screens

### PO-1: Sign Up (US1.1)
```
┌─────────────────────────────────────┐
│  GuestGuideIQ [logo]                 │
│                                       │
│         Create your account          │
│  ┌─────────────────────────────┐    │
│  │ Username                     │    │
│  ├─────────────────────────────┤    │
│  │ Password                     │    │
│  └─────────────────────────────┘    │
│         [ Create Account ]           │
│  Already have an account? Log in     │
└─────────────────────────────────────┘
```
- **Success**: form submits, redirects to PO-3 (Onboarding).
- **Error**: inline validation below the offending field (AC1.1.2 duplicate username, AC1.1.3 invalid input) — red text + icon, field border highlighted, per `interaction-design-patterns.md` inline-validation-on-blur.

### PO-2: Reset Password (US1.2)
```
┌─────────────────────────────────────┐
│   Reset your password                │
│  ┌─────────────────────────────┐    │
│  │ Registered email             │    │
│  └─────────────────────────────┘    │
│         [ Send reset link ]          │
└─────────────────────────────────────┘
```
- **Success**: confirmation message "check your email."
- **Error (expired link, AC1.2.2)**: separate screen — "This link has expired." + [Request a new link] button.

### PO-3: Onboarding Wizard (US1.3, US1.4)
Multi-step wizard, per `interaction-design-patterns.md` Multi-Step Forms pattern: step indicator ("Step 2 of 4"), back navigation, autosave.

```
┌─────────────────────────────────────┐
│  ● ● ○ ○   Step 2 of 4: Guide setup  │
│                                       │
│  Have an existing property guide?    │
│  [ Upload PDF ]   [ Start from       │
│                     scratch ]        │
│                                       │
│              [ Back ]  [ Continue ]  │
└─────────────────────────────────────┘
```
- **Loading (PDF processing)**: skeleton content block + "Extracting your guide content..." (AC1.4.1).
- **Success (extraction done, AC1.4.3)**: shows extracted content in an **editable draft** — never auto-published — with [Edit] affordances on every section and a clear "Draft — not yet visible to guests" banner.
- **Error (bad file, AC1.4.2)**: inline error under the upload control + [Start from scratch] offered directly, not a dead end.
- **Resume (AC1.3.3)**: returning to an incomplete wizard reopens exactly at the last completed step, with prior entries preserved.
- **Repeat login (AC1.3.4)**: an account past onboarding never sees this screen again — routes straight to PO-5 (Guide Editor).

### PO-4: Start/Manage Subscription (US1.7, US1.8)
```
┌─────────────────────────────────────┐
│  Subscription                        │
│  ┌─────────────────────────────┐    │
│  │ Plan: [Starter ▾]            │    │
│  │ Status: Active               │    │
│  └─────────────────────────────┘    │
│  [ Upgrade ]  [ Downgrade ]  [Cancel]│
└─────────────────────────────────────┘
```
- **No active subscription (AC1.8.3)**: Upgrade/Downgrade/Cancel controls are disabled with a tooltip "Start a subscription first"; only [Start Subscription] is active.
- **Payment failure (AC1.7.2)**: inline banner "We couldn't process your payment — no changes were made to your account," account state unchanged.
- **Cancel confirmation (AC1.8.2)**: confirmation dialog per `interaction-design-patterns.md` Modal rules — states plainly "Your guide content stays intact; resubscribing restores full access" before the destructive action commits.

### PO-5: Guide Editor (US1.5)
Side-nav layout (Q3): left rail (Guide, Locality Content, Subscription, Account), main content area.
```
┌───────┬───────────────────────────────┐
│ Guide │  [Property Name]              │
│ Locality│ ┌───────────────────────┐   │
│ Subscr.│ │ Guide content sections │   │
│ Account│ │ (editable blocks)      │   │
│       │ └───────────────────────┘   │
│       │       [ Save ] [ Preview ]    │
└───────┴───────────────────────────────┘
```
- **Empty (no content published, AC1.5.2)**: main area shows a specific placeholder card: "Your guide isn't published yet — guests will see this exact message until you publish." (Not the vague "reasonable" state the reviewer flagged — one deterministic placeholder.)

### PO-6: Locality Content / Curate Favorites (US1.6)
```
┌───────┬───────────────────────────────┐
│ [nav] │  Locality: Downtown Springfield│
│       │  ┌───────┐ ┌───────┐          │
│       │  │ POI   │ │ POI   │  ...     │
│       │  │ ☆ Fav │ │ ★ Fav │          │
│       │  └───────┘ └───────┘          │
│       │  Events:  [ event cards ]      │
└───────┴───────────────────────────────┘
```
- **Favorite/unfavorite (AC1.6.1-1.6.3)**: star icon toggles filled/outline, immediate visual feedback (no confirmation needed — non-destructive, reversible).
- **Empty locality (AC1.6.4)**: "We're still building out content for your area — check back soon" message with an illustration, per `wireframing-guide.md` empty-state guidance, instead of a blank grid.

## Guest Screens

### G-1: Invalid/Expired Link (US2.1 — AC2.1.2, AC2.1.3)
```
┌─────────────────────────────────────┐
│                                       │
│         [icon]                       │
│   This link is no longer valid.      │
│                                       │
│   Contact your host for a new link.  │
└─────────────────────────────────────┘
```
Same screen serves both the expired-stay case and the never-existed/malformed-token case (per the reviewer-added AC2.1.3) — one consistent, non-technical message either way, never a raw 404.

### G-2: Property Guide (US2.1 success, US2.2, US2.3) — mobile-first, tabbed
```
┌─────────────────────────────────────┐
│  [Property photo] Property Name      │
│  Welcome, you're staying here! ✓     │
├─────────────────────────────────────┤
│ [Overview] [POIs] [Events]           │
├─────────────────────────────────────┤
│  (tab content area)                  │
│                                       │
│                              ┌─────┐ │
│                              │ 💬  │ │ ← persistent chat widget (Q5)
│                              └─────┘ │
└─────────────────────────────────────┘
```
- **Trust confirmation (AC2.1.1)**: property photo + name shown immediately on open, before any content loads, so Sam knows the link is legitimate for their actual stay.
- **Partial content (AC2.2.2)**: POIs/Events tabs render whatever exists; an empty tab shows "More local recommendations are being added" rather than a blank tab.
- **Pre-check-in access**: *(open item carried from US2.1 — not yet decided; flagged for domain-design rather than designed here.)*

### G-3: Itinerary Chat Widget (US2.3)
```
┌─────────────────────────────┐
│  Ask for a personalized      │
│  itinerary                   │
│  ┌─────────────────────┐    │
│  │ [chat history]        │    │
│  └─────────────────────┘    │
│  [ Type a message...  ] [→] │
└─────────────────────────────┘
```
- **Loading (AC2.3.3)**: typing-indicator animation, per `interaction-design-patterns.md` micro-interaction guidance (<300ms feedback, skeleton/pulse for longer waits).
- **Service failure (AC2.3.3)**: inline message "The itinerary assistant isn't responding right now" + [Retry] button, chat history preserved.
- **Sparse content (AC2.3.2)**: assistant's own reply text says content is limited for this area and offers general guidance — not a UI-level state change, a response-content behavior.

## Admin/Ops Screens (Internal)

### AD-1: POI/Event Curation (US4.1, US4.2)
```
┌───────┬───────────────────────────────┐
│ POIs  │  Locality: [dropdown]          │
│ Events│  [ + Add POI ]                 │
│ Accts │  ┌───────────────────────┐    │
│       │  │ POI list (editable)   │    │
│       │  └───────────────────────┘    │
└───────┴───────────────────────────────┘
```
- **Invalid/duplicate data (AC4.1.2)**: inline validation on the add/edit form, same pattern as PO-1.
- **Event lifecycle (AC4.2.2, AC4.2.3)**: expired events are visually distinguished (greyed, "Expired" tag) rather than silently vanishing from the ops view — ops can audit what was retired; duplicates are prevented at save time with an inline "This event already exists" notice.

### AD-2: Account Lookup (US4.3)
```
┌───────┬───────────────────────────────┐
│ [nav] │  Search: [ account id/email ] │
│       │  ┌───────────────────────┐    │
│       │  │ Account details        │    │
│       │  │ Subscription: Active    │    │
│       │  └───────────────────────┘    │
└───────┴───────────────────────────────┘
```
- **Not found (AC4.3.2)**: "No account found for that identifier" inline message, search field remains editable for retry.

## Visitor (Marketing-Site Lead Capture) — No New UI

US3.1/US3.2 reuse the **existing marketing-site forms as-is** (waitlist, partner, investor) — only their submission target changes (Formspree → new backend). No new mockups are needed; `interaction-spec.md` documents the behavioral change (error/retry handling, AC3.2.1/AC3.2.2) without altering the current visual design.

## Review

**Verdict:** NOT-READY
**Reviewer:** aidlc-product-lead-agent
**Date:** 2026-09-05T21:42:22Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | mockups.md > "Visitor (Marketing-Site Lead Capture) — No New UI" (line 180) vs. interaction-spec.md (entire file) | mockups.md tells the reader that "`interaction-spec.md` documents the behavioral change (error/retry handling, AC3.2.1/AC3.2.2)" for US3.1/US3.2, but `interaction-spec.md` contains zero reference to US3.1, US3.2, AC3.1.x, or AC3.2.x anywhere in the document — the StatusBanner component spec (the only component that could plausibly cover this) lists its usages as "PO-1, PO-2, PO-4, G-1" only, omitting the marketing-site lead forms entirely. Two Must Have stories (US3.1, US3.2) are left with no actual interaction specification for their error/retry states, despite the artifact's own cross-reference claiming one exists. | Add a StatusBanner (or equivalent) usage entry in interaction-spec.md for the marketing-site lead forms, specifying how AC3.2.1 (validation error, data retained) and AC3.2.2 (backend outage, data retained) actually render — or correct the false cross-reference in mockups.md if this is intentionally deferred elsewhere. | New |
| R-02 | Major | mockups.md > "Visitor (Marketing-Site Lead Capture) — No New UI" vs. stories.md > US3.1 Open item | stories.md's US3.1 carries an explicit, unresolved open item: "duplicate-submission handling (e.g. the same email submitting the waitlist twice) is not yet decided — accept silently, dedupe, or reject." This open item is not carried forward anywhere in mockups.md, interaction-spec.md, design-system-mapping.md, or accessibility-checklist.md — it is silently dropped. This is inconsistent with how the design correctly carried forward US2.1's own open item (pre-check-in guest access, explicitly flagged in the G-2 screen spec as "not yet decided; flagged for domain-design"). A developer or reviewer reading only the refined-mockups artifacts would have no signal that duplicate-submission behavior is still an open decision. | Add an explicit open-item note for US3.1's duplicate-submission question in mockups.md's Visitor section (or interaction-spec.md), flagged for domain-design, matching the treatment already given to US2.1's pre-check-in open item. | New |
| R-03 | Major | design-system-mapping.md > Component Inventory ("SideNav ... Used By: PO-4, PO-5, PO-6, AD-1, AD-2") vs. mockups.md > PO-4 (Start/Manage Subscription) | design-system-mapping.md states SideNav is used on PO-4, and PO-5's own side-nav rail lists "Subscr." as one of its persistent nav items — implying Subscription is a section reached through the same dashboard shell. But the PO-4 wireframe in mockups.md is drawn as a standalone, full-width centered screen (matching PO-1/PO-2's auth-screen layout) with no side-nav rail at all. This is a direct contradiction: is PO-4 inside the persistent Property Owner dashboard shell (as PO-5/PO-6/AD-1/AD-2 are, and as the SideNav component inventory claims) or a separate full-screen flow? An implementer cannot tell which layout to build from these artifacts as they stand. | Redraw the PO-4 wireframe with the same side-nav shell used by PO-5/PO-6 (consistent with the SideNav component inventory claim), or if Subscription is deliberately a full-screen flow outside the dashboard shell, correct design-system-mapping.md's SideNav "Used By" list to remove PO-4 and explain the exception. | New |
| R-04 | Minor | design-system-mapping.md > Design Tokens (Breakpoints: mobile/tablet/desktop/large-desktop, 4 tiers) vs. interaction-spec.md > TabNav and SideNav Responsive Behaviour tables (2-tier: mobile <768px / tablet+desktop ≥768px for TabNav; mobile <768px / desktop ≥1024px for SideNav, with no distinct tablet row) | The design-system-mapping.md token table defines four breakpoint tiers, but neither component spec that actually needs responsive behavior (TabNav, SideNav) references the tablet tier as a distinct case — SideNav's table has no tablet (768-1023px) row at all, leaving that range's behavior for the Property Owner dashboard unspecified (does it get the mobile hamburger overlay or the persistent desktop rail?). Not a contradiction, but an implementer would have to guess. | Add an explicit tablet-range row to the SideNav responsive behaviour table (or state which of the two rules 768-1023px falls under). | New |

### Summary

Screen coverage of all 16 stories is genuinely present (Q2's "cover all 16 stories" is honored, including a deliberate and reasonable "no new UI" call for US3.1/US3.2), edge/error states go well beyond the happy path throughout, and the accessibility checklist is concrete and testable rather than generic boilerplate. The design correctly carries forward US2.1's pre-check-in open item, but not US3.1's duplicate-submission open item (R-02), and it makes an unfulfilled cross-reference to interaction-spec.md for the lead-form error/retry behavior it claims to specify (R-01). A genuine layout contradiction between the SideNav component inventory and the PO-4 wireframe (R-03) would leave an implementer guessing at Subscription's page shell. None of these block understanding the bulk of the design, but three Major findings mean a developer would hit real ambiguity on these specific points before starting.
