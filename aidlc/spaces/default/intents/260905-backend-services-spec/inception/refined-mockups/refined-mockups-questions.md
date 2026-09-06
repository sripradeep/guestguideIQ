# Refined Mockups — Clarifying Questions

No rough mockups exist (classic scope skips Ideation) — these mockups are designed directly from `user-stories/stories.md` and `requirements-analysis/requirements.md`.

---

## Q1: Visual brand alignment

The marketing site has a placeholder warm/earthy visual direction (per `docs/SPEC.md`). Should the Property Owner/Guest product UI reuse that same visual brand, or use a distinct, more functional visual design since this is a different context (a working dashboard/app, not a marketing page)?

- A. Reuse the marketing site's warm/earthy palette and typography for brand continuity
- B. Use a distinct, more functional/SaaS-style visual design — different context, different needs
- C. Reuse only specific elements (e.g. logo/color accent) but otherwise design freely for the product UI
- X. Other (please specify)

[Answer]: B. Use a distinct, more functional/SaaS-style visual design — different context, different needs

---

## Q2: Screen coverage for this pass

Should this pass mock up screens for all 16 stories, or focus on the highest-priority ones?

- A. Focus on the walking-skeleton path plus headline features: signup, onboarding wizard, minimal guide editor, guest guide view, and the itinerary chat
- B. Cover every Must Have story's primary screen (broader than the walking skeleton, narrower than all 16)
- C. Cover all 16 stories' screens now
- X. Other (please specify)

[Answer]: C. Cover all 16 stories' screens now

---

## Q3: Property Owner dashboard navigation

The Property Owner has several distinct areas (guide editor, POI curation, subscription/account). What navigation style fits best?

- A. Side navigation (persistent, suits multiple sections — per interaction-design-patterns.md's admin-dashboard guidance)
- B. Top navigation bar (suits fewer, flatter sections)
- X. Other (please specify)

[Answer]: A. Side navigation (persistent, suits multiple sections — per interaction-design-patterns.md's admin-dashboard guidance)

---

## Q4: Guest guide view structure

Should the Guest's property guide feel like a single scrollable "digital book," or a navigable multi-section app (tabs like Overview / POIs / Events / Chat)?

- A. Single scrollable page — simplest, matches a one-time, in-the-moment mobile visit
- B. Multi-section app with tabs/navigation
- X. Other (please specify)

[Answer]: B. Multi-section app with tabs (e.g. Overview / POIs / Events / Chat)

---

## Q5: Itinerary chat placement

Should the AI itinerary chat be a persistent widget/bubble accessible from anywhere in the guide view, or a dedicated screen/section the Guest navigates to?

- A. Persistent chat widget/bubble, accessible from anywhere in the guide
- B. Dedicated "Ask for an itinerary" screen/section
- X. Other (please specify)

[Answer]: A. Persistent chat widget/bubble, accessible from anywhere in the guide

---

## Round 1 Summary Confirmation (historical — superseded by the Consolidated Summary Confirmation below)

- Visual brand: distinct, functional/SaaS-style design (not the marketing site's warm/earthy brand)
- Screen coverage: all 16 user stories get mockups in this pass
- Property Owner dashboard: side navigation (guide editor, POI curation, subscription/account)
- Guest guide view: multi-section app with tabs (Overview / POIs / Events / Chat)
- Itinerary chat: persistent widget/bubble, accessible from anywhere in the guide

- Looks correct
- Request changes

[Answer]: Looks correct

---

## Second Round (locality branding, folded back from a Requirements Analysis revision)

Requirements Analysis and User Stories were both revised mid-workflow to add locality branding & multi-domain support (FR9, FR3.5, FR5.4, FR8.6): each locality has its own visual brand identity, a Property Owner's locality is set by the signup domain, and both the Guest guide and Property Owner dashboard render in that locality's brand. This redo also folds in fixes for the four findings (R-01 through R-04) left open on the prior NOT-READY review — see the updated `## Review` section at the end of `mockups.md`.

## Q6: How does a locality's visual brand manifest against the Q1 base design?

Q1 already committed to a distinct, functional/SaaS-style base design (not the marketing site's warm/earthy brand). Locality branding (FR9.1: name/tagline/visual styling) now layers on top of that. Should a locality's brand be a **themed accent layer** on the consistent functional shell (logo + name + one or two brand colors swapped in, layout/chrome unchanged), or should each locality be able to substantially restyle the product's look and feel?

- A. Themed accent layer only — logo, name/tagline, and a small brand-color palette (e.g. primary accent, header background) are swapped per locality; layout, typography, and component behavior stay identical across every locality. Simplest to build and keeps accessibility/contrast guarantees centrally enforceable.
- B. Deeper restyling — localities can also override typography and layout density, closer to a full white-label.
- X. Other (please specify)

[Answer]: A. Themed accent layer only — logo, name/tagline, and a small brand-color palette (e.g. primary accent, header background) are swapped per locality; layout, typography, and component behavior stay identical across every locality. Simplest to build and keeps accessibility/contrast guarantees centrally enforceable.

---

## Q7: What renders at a signup domain not mapped to any locality-brand (AC1.1.5)?

A Property Owner may reach the signup form through a domain/subdomain that isn't associated with any locality-brand (typo, deprovisioned subdomain, stray unbranded domain). What should that page look like?

- A. A neutral, unbranded error page (no locality theme applied, since none resolved) with a clear "signups aren't available at this address" message and no form
- B. The same signup page shell, but with a default/generic GuestGuideIQ theme instead of a locality theme, plus an inline banner explaining signups aren't available here
- X. Other (please specify)

[Answer]: A. A neutral, unbranded error page (no locality theme applied, since none resolved) with a clear "signups aren't available at this address" message and no form

---

## Consolidated Summary Confirmation

- Fixes to the four open findings from the prior NOT-READY review: PO-4 redrawn inside the SideNav dashboard shell (R-03); SideNav responsive table gets an explicit tablet row (R-04); interaction-spec.md gets a StatusBanner usage entry for the marketing-site lead forms covering AC3.2.1/AC3.2.2 (R-01); US3.1's duplicate-submission open item is now carried forward explicitly in mockups.md (R-02).
- New locality-branding delta: PO-1 (signup) reflects domain-based locality assignment and the unmapped-domain error page (AC1.1.4/AC1.1.5); PO-5 (dashboard) and G-2 (guest guide) render in the property's locality-brand, with a graceful minimal-identity fallback (AC1.5.3/AC1.5.4, AC2.2.3/AC2.2.4); a new AD-3 screen covers US4.4 (Admin/Ops creates/manages a locality-brand identity and its domains); brand manifests as a themed accent layer (Q6), not a deep restyle; an unmapped signup domain shows a neutral, unbranded error page (Q7).
- `mockups.md`, `interaction-spec.md`, `design-system-mapping.md`, and `accessibility-checklist.md` are being updated to reflect all of the above.

- Looks correct
- Request changes

[Answer]: Looks correct
