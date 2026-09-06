# User Stories — Backend Services for GuestGuideIQ

Stories are epic-level (per Q6) and will be decomposed further at `domain-design`/`units-generation`. Grouped by persona/journey (per Q4), Property Owner first (per Q7). Priority uses MoSCoW; the formal MVP boundary is set at Delivery Planning.

> **Integration note**: this version folds in the mob review (design, developer, quality — see `contributions/`) plus the human's resolution of one priority/dependency conflict (Q8): **US1.6 and US4.1 are promoted to Must Have** because US2.2 (Must Have) depends on their content; US4.2 remains Should Have with US2.2's acceptance criteria softened to tolerate a locality with no events yet. Confirmed correct by the human at the Consolidated Summary Confirmation checkpoint.

## UX & Accessibility Baseline

All Guest- and Property-Owner-facing surfaces target **WCAG 2.1 AA** (keyboard navigability, screen-reader support, non-color-dependent status indicators for states like link-expired, subscription status, and form errors). Flagged here per design-mob review so it isn't lost once decomposition starts at `domain-design`/`units-generation`.

## Property Owner Stories

### US1.1 — Create Account
**As a** Property Owner, **I want** to create an account with a username and password, **so that** I can start setting up my property guide.

- AC1.1.1: Given valid credentials, when I submit the signup form, then my account is created and I am authenticated.
- AC1.1.2: Given a username that already exists, when I try to sign up, then I see a clear error and no duplicate account is created.
- AC1.1.3: Given invalid input (e.g. malformed email or a password failing the not-yet-defined complexity rule), when I submit the signup form, then I see a clear validation error and no account is created.

**Priority**: Must Have. **Dependencies**: None (walking-skeleton story). **Traces**: FR2.1.

### US1.2 — Reset Forgotten Password
**As a** Property Owner, **I want** to reset my password via email, **so that** I can regain access if I forget it.

- AC1.2.1: Given I request a reset with my registered email, when I follow the emailed link within its valid window, then I can set a new password and log in.
- AC1.2.2: Given a reset link has expired, when I try to use it, then I see a clear "link expired" message and can request a new one.

**Priority**: Must Have. **Dependencies**: US1.1. **Traces**: FR2.3.

### US1.3 — Complete Onboarding Wizard
**As a** Property Owner, **I want** to be guided through onboarding after signup, **so that** I know exactly what to do to get my guide live.

- AC1.3.1: Given a freshly created account, when I log in for the first time, then I am placed into the onboarding wizard.
- AC1.3.2: Given I have no existing guide to import, when I reach the content step, then I can create guide content manually.
- AC1.3.3: Given I exit onboarding partway through, when I log back in, then I resume where I left off rather than restarting.
- AC1.3.4: Given an account that has already completed onboarding, when I log in again, then I am taken to my normal guide editor rather than back into the wizard.

**Priority**: Must Have. **Dependencies**: US1.1. **Traces**: FR3.1, FR3.3. **Note**: step-by-step progress indication (step X of Y) is an interaction requirement to carry into domain-design, given AC1.3.3's resume behavior.

### US1.4 — Import Existing Guide from PDF
**As a** Property Owner, **I want** to upload a PDF of my existing guide during onboarding, **so that** I don't have to start from a blank page.

- AC1.4.1: Given a valid, readable PDF, when I upload it during onboarding, then its content seeds a draft version of my new digital guide.
- AC1.4.2: Given a corrupted or unsupported file, when I try to upload it, then I see a clear error and am offered the manual-entry path instead.
- AC1.4.3: Given a PDF import completes, when extraction finishes, then I see the extracted content in an editable draft state before any guest can view it — it is never published automatically.

**Priority**: Should Have. **Dependencies**: US1.3. **Traces**: FR3.2, FR3.4. **Note** (developer + design mob review, converged independently): PDF extraction is inherently lossy and is realistically multiple implementation units (text/OCR extraction, content-to-schema mapping, owner review-before-publish, plus a loading state for non-instant extraction) — domain-design should budget for this as more than a single unit of work despite its epic-level "Should Have" sizing here.

### US1.5 — Create and Edit Digital Property Guide
**As a** Property Owner, **I want** to create and edit my property's guide content, **so that** guests see accurate, current information about my property and area.

- AC1.5.1: Given I am past onboarding, when I edit guide content, then my changes are saved and visible the next time the guide is viewed.
- AC1.5.2: Given I have not yet published any content, when a Guest's link resolves, then the guide shows a specific placeholder page/message indicating the guide is not yet published, rather than an error.

**Priority**: Must Have. **Dependencies**: US1.3. **Traces**: FR4.1.

### US1.6 — Curate Favorite Locality Content
**As a** Property Owner, **I want** to browse curated points-of-interest and events for my locality and mark favorites, **so that** my guide reflects the local recommendations I trust most.

- AC1.6.1: Given my locality has curated POIs/events, when I browse them, then I can mark any as a favorite to feature in my guide.
- AC1.6.2: Given I have marked favorites, when a Guest views my guide, then those favorites appear in the guide content.
- AC1.6.3: Given a POI/event I previously favorited, when I unmark it, then it no longer appears in my guide's featured content.
- AC1.6.4: Given my locality has no curated POIs/events yet, when I visit the curation screen, then I see a clear message that content is being added for my area rather than an empty/broken list.

**Priority**: Must Have (promoted from Should Have — Q8: US2.2's Must Have acceptance criteria depend on this content existing). **Dependencies**: US1.5, US4.1, US4.2. **Traces**: FR4.2, FR5.2.

### US1.7 — Start a Subscription
**As a** Property Owner, **I want** to start a paid subscription, **so that** I can access GuestGuideIQ's full property-guide functionality.

- AC1.7.1: Given I have an account, when I start a subscription, then my account reflects an active subscription status.
- AC1.7.2: Given a subscription-start attempt fails, when the failure occurs, then I see a clear error and my account is left with no active subscription (no partial/inconsistent state).

**Priority**: Must Have. **Dependencies**: US1.1. **Traces**: FR2.2.

### US1.8 — Manage an Existing Subscription
**As a** Property Owner, **I want** to upgrade, downgrade, or cancel my subscription, **so that** I can adjust my plan as my needs change.

- AC1.8.1: Given an active subscription, when I upgrade or downgrade, then my account reflects the new plan going forward.
- AC1.8.2: Given an active subscription, when I cancel, then my account reflects the cancellation and I am informed what happens to my guide's visibility. **Assumption**: guide content remains intact (not deleted) on cancellation, so resubscribing instantly restores it rather than requiring re-onboarding — carry forward to domain-design for confirmation.
- AC1.8.3: Given no active subscription, when I attempt to upgrade, downgrade, or cancel, then I see a clear error indicating there is nothing to modify.

**Priority**: Must Have (per Q2 — all four subscription actions in scope now). **Dependencies**: US1.7. **Traces**: FR2.2.

## Guest Stories

### US2.1 — Access Property Guide via Stay-Scoped Link
**As a** Guest, **I want** to open my property guide using a link tied to my stay, **so that** I can see relevant information without creating an account.

- AC2.1.1: Given a valid, unexpired link for my stay, when I open it, then I see the property's guide, with visible confirmation (property name/photo) that the link belongs to my actual stay.
- AC2.1.2: Given the link is for a stay whose checkout date has passed, when I try to open it, then I see a clear "this link is no longer valid" message rather than the guide or an error page.
- AC2.1.3: Given a link token that does not correspond to any existing stay (malformed, mistyped, or never issued), when I try to open it, then I see the same "this link is no longer valid" message rather than an error page or a raw 404.

**Priority**: Must Have (walking-skeleton story). **Dependencies**: US1.5 (a guide must exist to view). **Traces**: FR8.1, FR8.2, FR8.3, FR8.5. **Open item** (design mob review, not yet resolved): behavior for a guest opening the link *before* their stay's check-in date is undecided — allow early access, or show a "your stay hasn't started yet" state. Carry to domain-design as an explicit open question.

### US2.2 — View Property Guide Content
**As a** Guest, **I want** to browse my property's guide, including its featured local POIs and events, **so that** I can plan my time during my stay.

- AC2.2.1: Given my link resolves to a guide, when I view it, then I see the property owner's favorited POIs (per US1.6/US4.1, now Must Have) along with any current, non-expired local events if any exist — the guide must display correctly even if no events exist yet for the locality (softened per Q8, since event lifecycle enforcement, US4.2, remains Should Have).
- AC2.2.2: Given a locality with only a few curated POIs/events so far, when I view the guide, then I still see what exists rather than an empty/broken page.

**Priority**: Must Have. **Dependencies**: US2.1, US1.6, US4.1, US4.2 (event-expiry enforcement, when present). **Traces**: FR4.3, FR5.2, FR6.2, FR6.3.

### US2.3 — Get a Customized Itinerary via Chat
**As a** Guest, **I want** to chat with an AI assistant about my interests and time available, **so that** I get a personalized itinerary using local recommendations.

- AC2.3.1: Given a locality with sufficient curated content, when I describe my interests and available time, then the chat returns an itinerary that references only POIs/events belonging to my property's locality (the structural, verifiable half of "relevant"); the qualitative "well-personalized" claim is deferred to a golden-set/rubric evaluation defined at `nfr-requirements`, not asserted here as a literal pass/fail.
- AC2.3.2: Given a locality with little or no curated content yet, when I use the chat, then it tells me content is limited for this area and offers general travel guidance instead (per Q3).
- AC2.3.3: Given the itinerary chat backend is slow to respond or unavailable, when I send a message, then I see a clear loading/waiting state and, on failure, a message that lets me retry rather than a silent hang or generic error.

**Priority**: Should Have (not required for the walking skeleton, per Q1). **Dependencies**: US2.2. **Traces**: FR7.1, FR7.2, FR7.3. **Note** (developer mob review): this story bundles multi-turn session/conversation state for an unauthenticated guest, RAG-style grounding against the property's content, and output moderation/guardrails (the last still an unresolved Minor finding, R-05, from Requirements Analysis) — domain-design/units-generation should treat session-state handling and moderation as explicit sub-scope of this story, not assume they're implied by "chat."

## Visitor Stories (Marketing-Site Lead Capture)

These carry over the current marketing site's three lead forms onto the new first-party backend; the actor here is an anonymous site visitor (traveler, prospective STR operator/experience provider, or investor/press), not the Property Owner/Guest personas above.

### US3.1 — Submit a Lead Form
**As a** site visitor, **I want** to submit the waitlist, partner interest, or investor/press form, **so that** GuestGuideIQ can follow up with me.

- AC3.1.1: Given I fill in a valid form, when I submit it, then my submission is received and stored by the backend (not Formspree).
- AC3.1.2: Given my submission succeeds, when the backend confirms receipt, then I am taken to the existing thank-you experience, unchanged from today.

**Priority**: Must Have. **Dependencies**: None. **Traces**: FR1.1, FR1.2, FR1.3. **Open item**: duplicate-submission handling (e.g. the same email submitting the waitlist twice) is not yet decided — accept silently, dedupe, or reject. Low priority given this story's simple scope; carry as an open question if not already intentionally out of scope.

### US3.2 — See a Clear Error on Submission Failure
**As a** site visitor, **I want** to see an error and keep my entered information if my submission fails, **so that** I don't lose my input and can retry.

- AC3.2.1: Given a validation error, when I submit the form, then I see an error message and my entered data remains in the form.
- AC3.2.2: Given a backend outage or network failure, when I submit the form, then I see an error message and my entered data remains in the form.

**Priority**: Must Have. **Dependencies**: US3.1. **Traces**: FR1.4.

## Admin/Ops Stories (Internal)

### US4.1 — Curate Initial POI Dataset for a Locality
**As a** GuestGuideIQ ops team member, **I want** to enter an initial set of points-of-interest for a new locality, **so that** Property Owners in that area have content to work with from day one.

- AC4.1.1: Given a new locality has no POIs yet, when I add curated POIs for it, then they are stored and visible in my own view of that locality, and Property Owners in that locality can browse and favorite them (US1.6).
- AC4.1.2: Given I submit invalid or duplicate POI data, when I try to save it, then I see a clear validation error and the entry is not persisted.

**Priority**: Must Have (promoted from Should Have — Q8: US2.2's Must Have acceptance criteria depend on this content existing). **Dependencies**: None. **Traces**: FR5.1.

### US4.2 — Manage the Local Events Lifecycle
**As a** GuestGuideIQ ops team member, **I want** the system to continuously ingest local events and retire expired ones, **so that** guides never show stale event information.

- AC4.2.1: Given a new local event becomes discoverable, when the monitoring module runs, then the event is ingested and associated with its locality.
- AC4.2.2: Given an event's date has passed, when the lifecycle process runs, then the event no longer appears in guest-facing content.
- AC4.2.3: Given the same event is discovered more than once by the monitoring module, when it runs, then no duplicate event record is created.

**Priority**: Should Have. **Dependencies**: None. **Traces**: FR6.1, FR6.2, FR6.3. **Note** (developer mob review): this story fuses two operationally different concerns with different risk profiles — event **ingestion** (blocked on OQ2's still-open sourcing decision; needs retry/rate-limit/dedup handling and locality association, which implies some form of geocoding/address-matching not yet scoped) and event **lifecycle/expiry** (a self-contained internal state-transition concern, not blocked on OQ2). Recommend domain-design split these into separate units so lifecycle/expiry isn't held hostage to the sourcing decision.

### US4.3 — Review a Property Owner Account
**As a** GuestGuideIQ ops team member, **I want** to look up and review a Property Owner's account, **so that** I can support them or investigate an issue.

- AC4.3.1: Given a Property Owner's account identifier, when I look it up, then I can see their account and subscription status.
- AC4.3.2: Given an account identifier that does not match any existing account, when I look it up, then I see a clear "not found" result rather than an error or a blank page.

**Priority**: Could Have. **Dependencies**: US1.1, US1.7. **Traces**: (supporting story for FR2.1/FR2.2 operability — not a distinct FR).

## INVEST Compliance Notes

At this epic level, stories satisfy Independent (each is separately deliverable), Negotiable (implementation details open), Valuable (each ties to a clear persona benefit), and Testable (every story has Given/When/Then criteria, including at least one negative/edge-case path per the mob quality review). Estimable and Small are intentionally deferred — per Q6, these epics will be sized and split into implementation-ready stories at `domain-design`/`units-generation`, where the actual data model and API shape exist to estimate against. Three stories (US1.4, US2.3, US4.2) are flagged above as hiding more implementation surface than their epic-level AC count suggests; domain-design should budget decomposition accordingly.

## Review

**Verdict:** READY
**Reviewer:** aidlc-product-lead-agent
**Date:** 2026-09-05T21:29:23Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | stories.md > US1.6 ("Dependencies: US1.5, US4.1, US4.2") | Q8 promoted US1.6 and US4.1 to Must Have specifically to fix a Must-Have-depends-on-Should-Have inversion, and the fix was applied consistently to US2.2 (whose dependency line explicitly softens the Should-Have leg: "US4.2 (event-expiry enforcement, when present)"). The same inversion still exists one level down, undocumented: US1.6 is now Must Have but its own Dependencies line lists US4.2, which remains Should Have, with no equivalent softening note — even though AC1.6.4 (added during mob review) already handles the zero-content case gracefully, showing the Must Have bar for US1.6 does not actually require US4.2 to exist. As written, a reader (especially at Delivery Planning, which sequences Bolts from these dependency lines) has no way to tell that this Must Have depends on a Should Have without cross-referencing AC1.6.4 themselves. | Add the same "(when present)" or equivalent softening annotation to US1.6's US4.2 dependency that US2.2 already carries, so the dependency graph is self-consistent and Delivery Planning doesn't misread it as a hard blocker. | New |
| R-02 | Minor | user-stories-questions.md > Consolidated Summary Confirmation | The confirmation summary states "24 stories' worth of ACs," but `stories.md` contains 16 stories (US1.1–US4.3) totaling 42 acceptance criteria — neither figure matches the "24" cited in the human-facing confirmation the user approved. | Correct the count in the confirmation summary (or note it referred to an earlier draft) so the approval record accurately reflects what was approved. | New |

### Summary

The three mob contributions (design, developer, quality) were integrated faithfully and completely: all three OBJECT-level findings from design (US1.3 save-and-resume, zero-content-locality UX, accessibility) are resolved in the draft; all four OBJECT-level findings from developer (US1.6/US2.2 dependency gaps, the US2.2 priority/dependency inversion, and the missing PDF-review-before-publish AC) are resolved; and all of quality's findings (the US2.1/FR8.5 traceability gap, all 8 missing negative-path ACs, both non-measurable AC phrasings, and the AC3.2.1 split) are resolved with wording matching or improving on what was proposed. Traceability.json enumerates every FR/NFR group and every `OK` target names a real story ID present in stories.md; story and AC IDs are well-formed and non-duplicated. The one substantive gap (R-01) is that Q8's priority/dependency fix, applied cleanly at the US2.2 level, was not carried one level further down to US1.6's own dependency on the still-Should-Have US4.2 — a real but narrow inconsistency, not a fundamental defect, and it does not block engineering from starting at this epic-level granularity.
