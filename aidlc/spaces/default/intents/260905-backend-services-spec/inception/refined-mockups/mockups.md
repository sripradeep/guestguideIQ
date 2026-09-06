# Refined Mockups — Backend Services for GuestGuideIQ

Text-based mid-fidelity wireframes (per `wireframing-guide.md`), covering all 16 user stories (Q2: full coverage). Visual brand is distinct/functional (Q1) — a clean, modern SaaS look, not the marketing site's warm/earthy brand. Property Owner surfaces use side navigation (Q3); the Guest guide is a tabbed multi-section app (Q4) with a persistent chat widget (Q5).

Screens are grouped by persona/journey, matching `stories.md`. Each screen names its primary (Success) state plus the alternate states that matter (Empty, Loading, Error, Partial) — not all five are repeated where a state doesn't materially differ.

> **Round 2 (locality branding + prior-review fixes, confirmed)**: This version (a) fixes the four findings left open on the prior NOT-READY review — PO-4 is redrawn inside the SideNav dashboard shell (R-03), the SideNav responsive table gets an explicit tablet row (R-04, see `interaction-spec.md`), the marketing-site lead forms get a StatusBanner usage entry in `interaction-spec.md` for AC3.2.1/AC3.2.2 (R-01), and US3.1's duplicate-submission open item is now carried forward below (R-02) — and (b) adds locality branding (FR9): each locality's brand renders as a **themed accent layer** (Q6) — logo, name/tagline, and a small brand-color palette — over the same functional shell and layout everywhere; a signup domain unmapped to any locality-brand shows a neutral, unbranded error page (Q7, AC1.1.5); and a new AD-3 screen covers US4.4 (Admin/Ops creates/manages a locality-brand identity and its domains).

## Property Owner Screens

### PO-1: Sign Up (US1.1)
```
┌─────────────────────────────────────┐
│  [Locality-brand logo] [Locality name]│
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
- **Success**: form submits, redirects to PO-3 (Onboarding). The account and property are silently assigned to the locality-brand resolved from the signup domain (AC1.1.4) — no locality-selection field appears anywhere on this form.
- **Error**: inline validation below the offending field (AC1.1.2 duplicate username, AC1.1.3 invalid input) — red text + icon, field border highlighted, per `interaction-design-patterns.md` inline-validation-on-blur.
- **Locality branding (AC1.1.4)**: the header logo, locality name, and the form's accent color (button, focus ring) are the resolved locality-brand's theme (Q6, themed-accent-layer) — everything else (layout, field order, validation behavior) is identical across every locality.
- **Unmapped domain (AC1.1.5, Q7)**: if the domain/subdomain doesn't resolve to any locality-brand, this entire screen is replaced by **PO-0: Signups Unavailable** — a neutral, unbranded page (no locality theme, since none resolved): a plain heading "Signups aren't available at this address" and no form at all, not a themed shell with an inline banner.

### PO-0: Signups Unavailable (US1.1 — AC1.1.5)
```
┌─────────────────────────────────────┐
│                                       │
│         [icon]                       │
│  Signups aren't available            │
│  at this address.                    │
│                                       │
└─────────────────────────────────────┘
```
Neutral GuestGuideIQ-default styling only — deliberately undressed, since no locality resolved to theme it with (Q7). Same StatusBanner-family treatment as G-1's "link no longer valid" message: plain language, no raw error code.

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
- **Locality branding (AC1.5.3)**: the account's locality-brand is already resolved at this point (assigned at signup, AC1.1.4), so the wizard renders with the same BrandTheme as PO-5/PO-6 rather than the plain functional default — AC1.5.3's "when I view any page" is read to include onboarding, not just the post-onboarding dashboard.

### PO-4: Start/Manage Subscription (US1.7, US1.8)
Lives inside the same persistent SideNav dashboard shell as PO-5/PO-6 (Guide, Locality Content, Subscription, Account rail) — not a standalone full-screen flow.
```
┌───────┬───────────────────────────────┐
│ Guide │  Subscription                 │
│ Locality│ ┌───────────────────────┐   │
│ Subscr.│ │ Plan: [Starter ▾]      │   │
│ Account│ │ Status: Active         │   │
│       │  └───────────────────────┘   │
│       │  [ Upgrade ] [ Downgrade ]    │
│       │  [ Cancel ]                   │
└───────┴───────────────────────────────┘
```
- **No active subscription (AC1.8.3)**: Upgrade/Downgrade/Cancel controls are disabled with a tooltip "Start a subscription first"; only [Start Subscription] is active.
- **Payment failure (AC1.7.2)**: inline banner "We couldn't process your payment — no changes were made to your account," account state unchanged.
- **Cancel confirmation (AC1.8.2)**: confirmation dialog per `interaction-design-patterns.md` Modal rules — states plainly "Your guide content stays intact; resubscribing restores full access" before the destructive action commits.

### PO-5: Guide Editor (US1.5)
Side-nav layout (Q3): left rail (Guide, Locality Content, Subscription, Account), main content area.
```
┌───────┬───────────────────────────────┐
│[Locality-brand logo/accent header]    │
│ Guide │  [Property Name]              │
│ Locality│ ┌───────────────────────┐   │
│ Subscr.│ │ Guide content sections │   │
│ Account│ │ (editable blocks)      │   │
│       │ └───────────────────────┘   │
│       │       [ Save ] [ Preview ]    │
└───────┴───────────────────────────────┘
```
- **Empty (no content published, AC1.5.2)**: main area shows a specific placeholder card: "Your guide isn't published yet — guests will see this exact message until you publish." (Not the vague "reasonable" state the reviewer flagged — one deterministic placeholder.)
- **Locality branding (AC1.5.3)**: the dashboard shell's header/accent renders in the property's locality-brand theme (Q6) across every screen behind this SideNav shell (PO-4, PO-5, PO-6) — not just the guide editor.
- **Minimal-identity fallback (AC1.5.4)**: if the locality-brand has only a name/tagline saved (no full visual styling yet, per AD-3/AC4.4.1), the shell renders the clean functional default (Q1's base tokens) plus that name/tagline — never a half-styled or broken header.

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
- **Domain resolution (AC2.1.4)**: this screen — like every other guest-facing screen — is only ever reached through the property's own locality-brand domain/subdomain; the guest never sees a separate, unbranded central GuestGuideIQ domain at any point in the flow.

### G-2: Property Guide (US2.1 success, US2.2, US2.3) — mobile-first, tabbed
```
┌─────────────────────────────────────┐
│ [Locality-brand accent bar]          │
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
- **Trust confirmation (AC2.1.1)**: property photo + name shown immediately on open, before any content loads, so Sam knows the link is legitimate for their actual stay. This cue is deliberately anchored to **property-specific content** (photo/name), never to the locality-brand domain itself — a guest has no prior familiarity with any given locality's domain name to judge legitimacy by, so the trust signal must not be weakened into "the domain/theme looks official."
- **Locality branding (AC2.2.3)**: the accent bar, and any locality-brand color/logo touches elsewhere on the page, reflect the property's locality-brand (Q6, themed accent layer) — consistent with the domain the guest accessed the link through (AC2.1.4).
- **Minimal-identity fallback (AC2.2.4)**: a locality-brand with only name/tagline saved renders the clean functional default plus that name/tagline, never a broken or half-styled page.
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

### AD-3: Locality-Brand Management (US4.4)
```
┌───────┬───────────────────────────────┐
│ POIs  │  Localities                   │
│ Events│  [ + New Locality-Brand ]      │
│ Accts │  ┌───────────────────────┐    │
│ Localities│ │ Locality list        │    │
│       │  └───────────────────────┘    │
│       │                                │
│       │  Editing: Downtown Springfield │
│       │  ┌─────────────────────────┐  │
│       │  │ Name / Tagline           │  │
│       │  ├─────────────────────────┤  │
│       │  │ Visual styling (optional)│  │
│       │  ├─────────────────────────┤  │
│       │  │ Domains: [ + Add domain ]│  │
│       │  │  • springfield.gg.io     │  │
│       │  └─────────────────────────┘  │
│       │        [ Save ]                │
└───────┴───────────────────────────────┘
```
- **Create (AC4.4.1)**: name/tagline is required; visual styling is optional (can be saved with just the minimum identity — this is exactly the case PO-5/G-2's minimal-identity fallback, AC1.5.4/AC2.2.4, has to render gracefully). At least one domain must be associated before saving.
- **Update domain config (AC4.4.2)**: only reachable from this internal Admin/Ops screen — there is no equivalent control anywhere in the Property Owner-facing product (PO-4/PO-5/PO-6), which is how AC4.4.3's authorization boundary is enforced at the UI layer (no surface to attempt it from, not just a permission check).
- **Domain conflict (AC4.4.4)**: adding a domain already bound to a different locality-brand shows an inline validation error on the domain field ("This domain is already in use by [other locality]") and does not save.
- **Invalid/incomplete data (AC4.4.5)**: same inline-validation-on-blur treatment as every other form in the product (PO-1, AD-1).

## Visitor (Marketing-Site Lead Capture) — No New UI

US3.1/US3.2 reuse the **existing marketing-site forms as-is** (waitlist, partner, investor) — only their submission target changes (Formspree → new backend). No new mockups are needed; `interaction-spec.md`'s StatusBanner usage entry documents the behavioral change (error/retry handling, AC3.2.1/AC3.2.2) without altering the current visual design.

**Open item carried forward (US3.1)**: duplicate-submission handling (the same email submitting the waitlist twice) is not yet decided — accept silently, dedupe, or reject. Not designed here; flagged for `domain-design`, matching the treatment already given to US2.1's pre-check-in open item above.

## Review

**Verdict:** READY
**Reviewer:** aidlc-product-lead-agent
**Date:** 2026-09-06T04:03:19Z
**Iteration:** 2

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | interaction-spec.md > Error/Status Banner ("Marketing-site lead forms" subsection) | Confirmed resolved. `interaction-spec.md` now specifies AC3.2.1 and AC3.2.2's actual rendering (StatusBanner, data retained in every field) and mockups.md's cross-reference now points at real content rather than an empty one. | None. | Resolved |
| R-02 | Major | mockups.md > "Visitor (Marketing-Site Lead Capture)" | Confirmed resolved. US3.1's duplicate-submission open item is now stated explicitly, with the same "flagged for domain-design" treatment already given to US2.1's pre-check-in open item. | None. | Resolved |
| R-03 | Major | mockups.md > PO-4 vs. design-system-mapping.md's SideNav "Used By" | Confirmed resolved. PO-4 is now drawn inside the same SideNav shell as PO-5/PO-6, matching the component inventory's claim; no remaining contradiction. | None. | Resolved |
| R-04 | Minor | interaction-spec.md > SideNav Responsive Behaviour | Confirmed resolved. An explicit tablet (768-1023px) row is now present (icons-only collapsed rail), closing the previously unspecified range. | None. | Resolved |
| R-05 | Major | mockups.md > PO-1, PO-0, PO-5, PO-6, G-1, G-2, AD-3; interaction-spec.md > BrandTheme, LocalityBrandForm; design-system-mapping.md > Design Tokens, Component Inventory | Verified every FR9-family requirement plus FR3.5/FR8.6 has genuine screen/component coverage, not just a claim: FR9.1/FR9.4 → AD-3/LocalityBrandForm (AC4.4.1); FR9.2 → G-2 (AC2.2.3, AC2.2.4 fallback); FR9.3 → PO-5/PO-6 and, correctly, PO-3 (onboarding) since AC1.5.3 says "any page" and the locality is already resolved by that point; FR9.5 → AD-3's AC4.4.2/AC4.4.3 split, enforced at the UI layer by the control's absence from every Property Owner-facing screen; FR3.5/AC1.1.5 → PO-1's branded state and PO-0's neutral unmapped-domain page; FR8.6 → G-1's domain-resolution note. Q6 (themed accent layer) and Q7 (neutral unmapped-domain page) are both honored consistently everywhere they apply — no screen shows deeper restyling or a themed-but-generic unmapped-domain page. Accessibility coverage extends correctly to the new locality-configurable accent color (per-locality contrast check, not a one-time global check). | None — verified present and coherent. | Resolved |
| R-06 | Minor | mockups.md > G-1 (Invalid/Expired Link) | G-1 is reached through a domain that itself resolves to a locality-brand (only the specific stay/link is invalid, not the domain) — by BrandTheme's own stated rule ("applies wherever a locality has been resolved"), G-1 could arguably render branded rather than neutral. The artifact doesn't address this either way; PO-0's neutral treatment is for a genuinely *unresolvable* domain, which is a materially different case from G-1's resolvable-domain-but-invalid-link case. Not a contradiction — BrandTheme's component spec doesn't list G-1 either way — just an unaddressed edge case. | Decide and note explicitly at `domain-design`: does G-1 render in the resolved locality's brand (consistent with reaching it through a real locality domain) or stay neutral like PO-0 (simpler, treats "no valid content to show" uniformly)? Low stakes either way — a guest here is not looking at branded content, just an error message. | Accepted risk |

### Summary

This amendment is sound and ready for engineering to proceed from. All four findings from the stage's original NOT-READY review are verified resolved (R-01 through R-04): the false cross-reference to a non-existent interaction spec is fixed, US3.1's duplicate-submission open item is carried forward, the PO-4/SideNav layout contradiction is resolved by redrawing PO-4 inside the dashboard shell, and the SideNav responsive table now covers the tablet range explicitly. The locality-branding delta is complete and internally consistent (R-05): every FR9-family requirement, FR3.5, and FR8.6 has a genuine screen or component behind its claim, Q6's "themed accent layer" scope is honored everywhere (no screen over- or under-brands relative to that decision), Q7's neutral-unmapped-domain treatment is correctly distinguished from the minimal-identity fallback case, and the accessibility checklist correctly extends contrast checking to the new per-locality accent color. The onboarding wizard (PO-3) correctly picks up locality branding since the locality already resolves by that point in the flow — an easy gap to have missed, and it wasn't. The one new observation (R-06) is a genuinely low-stakes, unaddressed edge case (should the invalid-link screen brand itself, given its domain does resolve to a locality) that doesn't block engineering and is recorded as accepted risk with a concrete question for domain-design to settle.
