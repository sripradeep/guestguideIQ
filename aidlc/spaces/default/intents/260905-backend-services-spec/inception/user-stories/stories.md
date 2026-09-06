# User Stories — Backend Services for GuestGuideIQ

Stories are epic-level (per Q6) and will be decomposed further at `domain-design`/`units-generation`. Grouped by persona/journey (per Q4), Property Owner first (per Q7). Priority uses MoSCoW; the formal MVP boundary is set at Delivery Planning.

> **Integration note**: this version folds in the mob review (design, developer, quality — see `contributions/`) plus the human's resolution of one priority/dependency conflict (Q8): **US1.6 and US4.1 are promoted to Must Have** because US2.2 (Must Have) depends on their content; US4.2 remains Should Have with US2.2's acceptance criteria softened to tolerate a locality with no events yet. Confirmed correct by the human at the Consolidated Summary Confirmation checkpoint.
>
> **Round 2 (locality branding)**: Requirements Analysis was revised to add locality branding & multi-domain support (FR9, FR3.5, FR5.4, FR8.6). This added new story **US4.4** (Admin/Ops creates/manages a locality-brand identity) and locality-brand ACs on US1.1, US1.5, US2.1, and US2.2, per Q9 and the "Second Round" section of `user-stories-questions.md`. A focused round-2 mob delta review (design, developer, quality — see `contributions/`) covered only this addition; its findings (missing negative-path ACs, a fallback-rendering gap, an AC4.4.2 structural fix, a domain-uniqueness AC, and an FR5.4 duplicate-check scoping fix) are integrated below.

## UX & Accessibility Baseline

All Guest- and Property-Owner-facing surfaces target **WCAG 2.1 AA** (keyboard navigability, screen-reader support, non-color-dependent status indicators for states like link-expired, subscription status, and form errors). Flagged here per design-mob review so it isn't lost once decomposition starts at `domain-design`/`units-generation`.

## Property Owner Stories

### US1.1 — Create Account
**As a** Property Owner, **I want** to create an account with a username and password, **so that** I can start setting up my property guide.

- AC1.1.1: Given valid credentials, when I submit the signup form, then my account is created and I am authenticated.
- AC1.1.2: Given a username that already exists, when I try to sign up, then I see a clear error and no duplicate account is created.
- AC1.1.3: Given invalid input (e.g. malformed email or a password failing the not-yet-defined complexity rule), when I submit the signup form, then I see a clear validation error and no account is created.
- AC1.1.4: Given I sign up through a specific locality's domain or subdomain, when my account is created, then my account and property are assigned to that locality-brand, with no separate locality-selection step required. [FR3.5, FR9.6]
- AC1.1.5: Given I reach the signup form through a domain or subdomain that isn't mapped to any locality-brand (typo, deprovisioned subdomain, stray unbranded domain), when I try to sign up, then I see a clear "signups aren't available at this address" message rather than an error page or a signup form with no locality to assign. [FR3.5]

**Priority**: Must Have. **Dependencies**: US4.4 (a locality-brand must exist before signup through its domain is possible). **Traces**: FR2.1, FR3.5.

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
- AC1.5.3: Given I am logged into my dashboard, when I view any page, then it renders using my property's locality-brand (not a single generic GuestGuideIQ look). [FR9.3]
- AC1.5.4: Given my property's locality-brand has only the minimum identity saved (e.g. name/tagline, no full visual styling yet, per AC4.4.1), when I view my dashboard, then it renders using a clean default look plus that minimum identity, rather than a broken or half-styled page. [FR9.3]

**Priority**: Must Have. **Dependencies**: US1.3. **Traces**: FR4.1, FR9.3.

### US1.6 — Curate Favorite Locality Content
**As a** Property Owner, **I want** to browse curated points-of-interest and events for my locality and mark favorites, **so that** my guide reflects the local recommendations I trust most.

- AC1.6.1: Given my locality has curated POIs/events, when I browse them, then I can mark any as a favorite to feature in my guide.
- AC1.6.2: Given I have marked favorites, when a Guest views my guide, then those favorites appear in the guide content.
- AC1.6.3: Given a POI/event I previously favorited, when I unmark it, then it no longer appears in my guide's featured content.
- AC1.6.4: Given my locality has no curated POIs/events yet, when I visit the curation screen, then I see a clear message that content is being added for my area rather than an empty/broken list.

**Priority**: Must Have (promoted from Should Have — Q8: US2.2's Must Have acceptance criteria depend on this content existing). **Dependencies**: US1.5, US4.1, US4.2 (event-expiry enforcement, when present — AC1.6.4 already handles the zero-content case). **Traces**: FR4.2, FR5.2.

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
- AC2.1.4: Given my property's link, when I open it, then it resolves through that property's own locality-brand domain/subdomain — I never see a separate, unbranded central domain. [FR8.6]

**Priority**: Must Have (walking-skeleton story). **Dependencies**: US1.5 (a guide must exist to view). **Traces**: FR8.1, FR8.2, FR8.3, FR8.5, FR8.6. **Open item** (design mob review, not yet resolved): behavior for a guest opening the link *before* their stay's check-in date is undecided — allow early access, or show a "your stay hasn't started yet" state. Carry to domain-design as an explicit open question. **Note** (developer mob review, round 2): AC2.1.4's domain-based resolution is Must Have for the walking skeleton, but the actual routing/TLS mechanism (NFR6.1/NFR6.2) is Deferred to domain-design/infrastructure-design in `traceability.json` — domain-design should explicitly scope how much multi-domain routing the walking-skeleton Bolt needs (even a single hardcoded locality-domain mapping would satisfy AC1.1.4/AC2.1.4) versus what waits for a later Bolt, so this Must Have story isn't silently blocked on NFR6's full design. **Note** (design mob review, round 2): AC2.1.1's "visible confirmation that the link belongs to my actual stay" trust cue must stay anchored to property-specific content (name/photo) — now that guests reach the guide through a locality-branded domain, domain-design should make sure that cue isn't weakened into "the domain looks legitimate," since a guest has no prior familiarity with any given locality's domain name to judge that by.

### US2.2 — View Property Guide Content
**As a** Guest, **I want** to browse my property's guide, including its featured local POIs and events, **so that** I can plan my time during my stay.

- AC2.2.1: Given my link resolves to a guide, when I view it, then I see the property owner's favorited POIs (per US1.6/US4.1, now Must Have) along with any current, non-expired local events if any exist — the guide must display correctly even if no events exist yet for the locality (softened per Q8, since event lifecycle enforcement, US4.2, remains Should Have).
- AC2.2.2: Given a locality with only a few curated POIs/events so far, when I view the guide, then I still see what exists rather than an empty/broken page.
- AC2.2.3: Given I am viewing the guide, when the page renders, then it uses my property's locality-brand (visual identity), consistent with the domain I accessed it from. [FR9.2]
- AC2.2.4: Given my property's locality-brand has only the minimum identity saved (e.g. name/tagline, no full visual styling yet, per AC4.4.1), when I view the guide, then it renders using a clean default look plus that minimum identity, rather than a broken or half-styled page. [FR9.2]

**Priority**: Must Have. **Dependencies**: US2.1, US1.6, US4.1, US4.2 (event-expiry enforcement, when present). **Traces**: FR4.3, FR5.2, FR6.2, FR6.3, FR9.2.

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
- AC4.1.2: Given I submit invalid POI data, or POI data that duplicates an existing POI already associated with that same locality, when I try to save it, then I see a clear validation error and the entry is not persisted — associating a POI that already exists in a *different* locality with this locality is not a duplicate and is allowed (per FR5.4, a POI may belong to more than one locality).

**Priority**: Must Have (promoted from Should Have — Q8: US2.2's Must Have acceptance criteria depend on this content existing). **Dependencies**: None. **Traces**: FR5.1, FR5.4.

### US4.2 — Manage the Local Events Lifecycle
**As a** GuestGuideIQ ops team member, **I want** the system to continuously ingest local events and retire expired ones, **so that** guides never show stale event information.

- AC4.2.1: Given a new local event becomes discoverable, when the monitoring module runs, then the event is ingested and associated with its locality.
- AC4.2.2: Given an event's date has passed, when the lifecycle process runs, then the event no longer appears in guest-facing content.
- AC4.2.3: Given the same event is discovered more than once by the monitoring module, when it runs, then no duplicate event record is created.

**Priority**: Should Have. **Dependencies**: None. **Traces**: FR6.1, FR6.2, FR6.3. **Note** (developer mob review): this story fuses two operationally different concerns with different risk profiles — event **ingestion** (blocked on OQ2's still-open sourcing decision; needs retry/rate-limit/dedup handling and locality association, which implies some form of geocoding/address-matching not yet scoped) and event **lifecycle/expiry** (a self-contained internal state-transition concern, not blocked on OQ2). Recommend domain-design split these into separate units so lifecycle/expiry isn't held hostage to the sourcing decision.

### US4.4 — Create and Manage a Locality-Brand Identity
**As a** GuestGuideIQ ops team member, **I want** to create and manage a locality's brand identity (name, tagline, visual styling) and its domain(s), **so that** Property Owners can sign up through that locality and see a consistent branded experience. [Q9: A]

- AC4.4.1: Given a new locality needs to be onboarded, when I create its brand identity, then it is stored with at least a name/tagline and is associated with one or more domains (custom or subdomain, per FR9.4). [FR9.1, FR9.4]
- AC4.4.2: Given an existing locality-brand's domain configuration, when I (ops) register or update it, then the change is persisted and takes effect for that locality-brand. [FR9.5]
- AC4.4.3: Given a locality-brand's domain configuration, when anyone other than GuestGuideIQ ops — a Property Owner or a third party — attempts to change it (e.g. via a Property Owner-facing interface or API), then the attempt is rejected and the domain configuration is unchanged. [FR9.5]
- AC4.4.4: Given a domain or subdomain that is already associated with a different locality-brand, when I try to associate it with this locality-brand as well, then I see a clear validation error and the existing association is unchanged. [FR9.4]
- AC4.4.5: Given I try to create a locality-brand with invalid or incomplete identity data, when I attempt to save it, then I see a clear validation error and nothing is persisted.

**Priority**: Must Have (a precondition for US1.1's domain-based signup — no Property Owner can sign up through a locality-brand that doesn't exist yet). **Dependencies**: None. **Traces**: FR9.1, FR9.4, FR9.5.

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
**Date:** 2026-09-06T03:35:45Z
**Iteration:** 2

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | stories.md > US1.6 ("Dependencies: US1.5, US4.1, US4.2 (event-expiry enforcement, when present — AC1.6.4 already handles the zero-content case)") | Confirmed resolved. The softening annotation is present on US1.6's dependency line, matching the treatment already used on US2.2, so the dependency graph no longer reads as a Must-Have-depends-on-Should-Have hard blocker. | None. | Resolved |
| R-02 | Minor | user-stories-questions.md > Consolidated Summary Confirmation | Confirmed resolved. The confirmation summary no longer states a story/AC count; the stale "24 stories" figure from an earlier draft is gone rather than left inconsistent with the actual 16 stories / 47 ACs in the current document. | None. | Resolved |
| R-03 | Major | stories.md > US1.1 (AC1.1.4, AC1.1.5), US1.5 (AC1.5.3, AC1.5.4), US2.1 (AC2.1.4 + two Notes), US2.2 (AC2.2.3, AC2.2.4), US4.1 (AC4.1.2), US4.4 (AC4.4.1–AC4.4.5) | Verified every FR9-family requirement (FR9.1–FR9.7) plus FR3.5, FR5.4, and FR8.6 from the current requirements.md has a genuine, testable AC behind it, not just a traceability.json claim: FR9.1/FR9.4 → AC4.4.1; FR9.2 → AC2.2.3 (positive) + AC2.2.4 (incomplete-brand fallback); FR9.3 → AC1.5.3 + AC1.5.4; FR9.4 also → AC4.4.4 (domain-uniqueness negative path); FR9.5 → AC4.4.2 (ops action) split from AC4.4.3 (non-ops rejection, independently testable); FR9.6 → AC1.1.4 (assignment is to exactly one locality-brand); FR9.7 → correctly has no AC, since it is a negative-scope statement (no reassignment feature exists to test), not a positive requirement; FR3.5 → AC1.1.4 + AC1.1.5 (unmapped-domain negative path); FR5.4 → the reworded AC4.1.2, which explicitly scopes "duplicate" to within-locality and states a cross-locality association is allowed; FR8.6 → AC2.1.4. NFR6.1/NFR6.2 are correctly Deferred in traceability.json to domain-design/infrastructure-design, with a note on US2.1 scoping how much of that the walking-skeleton Bolt actually needs. All three round-2 mob delta reviews' OBJECT findings (design: incomplete-brand fallback, unmapped-domain signup negative path; developer: the walking-skeleton domain-routing scope note, the AC4.1.2 duplicate-scoping fix; quality: AC1.1.4's missing negative path, the AC4.4.2 GWT split, the domain-uniqueness AC) are resolved in the artifact text itself, not just claimed in the contribution files — each new/changed AC was read individually and matches or improves on what was proposed. Design's one AGREE-with-forward-note (AC2.1.1's trust cue staying anchored to property-specific content, not domain familiarity) is also captured, as a Note on US2.1. | None. | Resolved |
| R-04 | Minor | stories.md — document body ordering (US4.1, US4.2, US4.4, US4.3) | US4.4 is inserted between US4.2 and US4.3 in the document body even though it is numbered higher than both. No ID collision or traceability defect results — every ID is unique (verified: no duplicate `### USx.y` headers, no duplicate `- ACx.y.z:` definition lines) and every traceability.json target resolves to a real story — but a reader scanning top-to-bottom for "US4.3" right after "US4.2" will pass over US4.4 first. Cosmetic only. | Consider moving US4.4 after US4.3 (or renumbering) at the next convenient edit; not required before engineering starts. | Accepted risk |

### Summary

This amendment is sound and ready for engineering to proceed from. Both findings from the stage's original terminal review are verified resolved as claimed (R-01, R-02). Every FR9-family requirement (FR9.1–FR9.7) and the newly-added FR3.5, FR5.4, and FR8.6 requirements have real, testable acceptance criteria behind their traceability.json claims, not just a row asserting coverage (R-03). All three round-2 mob delta reviews' OBJECT findings were spot-checked against the actual AC text (AC1.1.5, AC1.5.4, AC2.2.4, the AC4.4.2/AC4.4.3 split, the new AC4.4.4, the reworded AC4.1.2) and are genuinely resolved; design's AGREE-with-forward-note on AC2.1.1 is also captured as a Note rather than dropped. Story and AC IDs are unique with no gaps or collisions — the AC4.4 renumbering to accommodate the split and the new AC4.4.4 was done cleanly. traceability.json's coverage rows all name real story IDs, and the INVEST Compliance Notes section remains accurate for the amended set. The one open item (R-04) is a cosmetic document-ordering quirk (US4.4 placed before US4.3 despite its higher number) with no functional or traceability consequence — recorded as an accepted risk rather than a blocker.
