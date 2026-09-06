# Functional Design — Plan & Questions — u1-backend-api

Covers `u1-backend-api`'s full assigned scope: 10 components (Identity, Subscription, Onboarding, PropertyGuide, PointOfInterest, LocalEvent, ItineraryChat, GuestAccess, LeadCapture, Locality) and 13 stories (US1.1-US1.8, US2.1-US2.3, US3.1-US3.2). Most business logic is already pinned by `requirements.md`, `stories.md`, and `domain-design/components.md` — the questions below are the genuine design-level trade-offs those artifacts left open.

---

## Q1: Guide publish model

`stories.md`'s AC1.5.2 says an unpublished guide shows a specific placeholder to a Guest. Is publishing an explicit Property Owner action (a distinct draft → published transition), or is any saved content automatically "live" the moment it's saved (with "unpublished" meaning only "literally zero content saved yet")?

- A. Explicit publish action — `GuideContent` has its own `draft`/`published` state, separate from having content. A Property Owner can save edits privately and choose when to make them visible to Guests.
- B. Auto-live on save — there's no separate publish step; "unpublished" (AC1.5.2) means only "no content saved yet." The first save is also the first publish.
- X. Other (please specify)

[Answer]: A. Explicit publish action — `GuideContent` has its own `draft`/`published` state, separate from having content. A Property Owner can save edits privately and choose when to make them visible to Guests.

---

## Q2: Lead-form duplicate submissions

`stories.md`'s US3.1 carries an explicit open item: should the same email submitting a lead form (e.g. the waitlist) twice be accepted silently, deduplicated, or rejected?

- A. Accept silently (store both submissions) — simplest; duplicate handling, if ever needed, becomes a downstream reporting/cleanup concern rather than a validation rule. Matches a low-stakes, anonymous-visitor form where over-counting a double-click is harmless.
- B. Deduplicate (reject a second submission with the same email to the same form as a silent no-op success from the visitor's perspective)
- C. Reject with a visible error ("You're already on this list")
- X. Other (please specify)

[Answer]: A. Accept silently (store both submissions) — simplest; duplicate handling, if ever needed, becomes a downstream reporting/cleanup concern rather than a validation rule. Matches a low-stakes, anonymous-visitor form where over-counting a double-click is harmless.

---

## Q3: Subscription plan values

The billing provider and plan structure are still open (`requirements.md` OQ1). Should `SubscriptionRecord.plan` be modeled now with a placeholder single-tier value, or left as an open-ended string pending the real plan design?

- A. A single placeholder tier (`"standard"`) for now — `SubscriptionRecord.plan` is an enum of one value; upgrade/downgrade (US1.8) are modeled as no-op transitions until real tiers exist, but the state machine and API shape are already correct for when they arrive.
- B. Free-text/open string, no enum — avoids hardcoding a placeholder name that will need renaming later.
- X. Other (please specify)

[Answer]: A. A single placeholder tier (`"standard"`) for now — `SubscriptionRecord.plan` is an enum of one value; upgrade/downgrade (US1.8) are modeled as no-op transitions until real tiers exist, but the state machine and API shape are already correct for when they arrive.

---

## Q4: Itinerary chat session scoping

Should a Guest's itinerary chat be one continuous session for their entire stay (all messages in one `ChatSession`), or can they start a fresh session mid-stay (multiple `ChatSession` rows per `Stay`)?

- A. One continuous session per stay — simplest; matches `domain-design/components.md`'s entity relationship, and a guest's context (property, locality, prior questions) naturally persists for the length of their visit.
- B. Guest can reset/start a new session mid-stay — more flexible, but adds a "which session is active" concern with no story currently asking for it.
- X. Other (please specify)

[Answer]: A. One continuous session per stay — simplest; matches `domain-design/components.md`'s entity relationship, and a guest's context (property, locality, prior questions) naturally persists for the length of their visit.

---

## Consolidated Summary Confirmation

- Guide publish model: explicit draft/published state on `GuideContent`, separate from content existing (Q1)
- Lead-form duplicates: accepted silently, no dedup/reject logic (Q2)
- Subscription plan: single placeholder tier `"standard"` for now; upgrade/downgrade are no-ops until real tiers exist (Q3)
- Itinerary chat: one continuous `ChatSession` per `Stay` (Q4)
- Password hashing algorithm remains explicitly deferred to `infrastructure-design` (NFR3.6) — not decided here
- `entities.md`, `rules.md`, `functional-spec.md`, and `traceability.json` will be generated for all 10 components / 13 stories reflecting the above

- Looks correct
- Request changes

[Answer]: Looks correct
