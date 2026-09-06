# Personas — Backend Services for GuestGuideIQ

> Confirmed correct by the human at the Consolidated Summary Confirmation checkpoint (see `user-stories-questions.md`), including the round-2 locality-branding delta.

## Property Owner

- **Name**: Priya, the Property Owner
- **Role**: Short-term-rental host or vacation-rental property manager — the paying customer of the future SaaS product.
- **Goals**: Get a polished, guest-ready digital property guide live quickly without writing local recommendations from scratch; keep her account/subscription simple to manage; give guests a great local experience that lifts her review scores.
- **Pain Points**: No time to research and write deep local content herself; existing digital guide tools (if she has one) are hard to migrate away from; doesn't want a steep technical learning curve.
- **Tech Comfort**: Medium — comfortable with web apps and file uploads, not a developer.
- **Frequency**: Occasional, bursty use — heavy during onboarding/guide setup, then light touch-ups between guest stays.
- **Device/Context**: Primarily desktop for guide editing, but onboarding (including a PDF upload of an existing guide) should not assume a desktop-only device — a scanned or exported guide is plausibly uploaded from a phone.
- **Context**: Signs up, verifies her identity is enough to trust with an account, is guided through an onboarding wizard, imports or builds her guide, and manages her subscription over time.

## Guest

- **Name**: Sam, the Guest
- **Role**: A traveler staying at a property whose owner uses GuestGuideIQ.
- **Goals**: Get instant, trustworthy local recommendations for their stay without downloading an app or creating an account; get a personalized itinerary quickly.
- **Pain Points**: Generic tourist-trail content; friction (accounts, logins) getting in the way of quick answers while traveling; wariness of clicking an unfamiliar link — needs immediate visual confirmation (property name/photo) that the link is legitimate and belongs to their actual stay.
- **Tech Comfort**: Variable — the experience must work with zero setup, since a Guest may only interact with it once per stay.
- **Device/Context**: Primarily mobile, first visit to the link, may have weak/roaming connectivity at the property; likely opens the link once, in the moment (e.g. standing at the front door), not in advance.
- **Frequency**: One-time or a few times, entirely within the bounds of a single stay.
- **Context**: Receives a link (from the property owner, likely alongside check-in details), opens it with no login, browses the guide, and can chat for a customized itinerary.

## Admin / Ops (internal)

- **Name**: The GuestGuideIQ Ops Team
- **Role**: Internal GuestGuideIQ staff who curate the locality content that makes every property guide useful from day one.
- **Goals**: Get a new locality's POI dataset seeded quickly and correctly; keep the events feed accurate and free of stale/expired entries; occasionally review a Property Owner account; stand up a new locality's brand identity and domain before Property Owners can sign up through it (Q9).
- **Pain Points**: No dedicated tooling yet — this persona and its stories exist specifically to define what that tooling needs to do (per Q5, scoped in for this pass).
- **Tech Comfort**: High — internal staff, comfortable with an admin-style interface.
- **Frequency**: Regular, ongoing — this is operational, not one-time setup.
- **Context**: Lower priority than Property Owner/Guest per the walking-skeleton decision; included so the events-lifecycle and POI-curation requirements (FR5, FR6) have concrete owner-facing stories rather than being invisible background behavior. Note: POI curation (US4.1) was promoted to Must Have during mob review (see stories.md) since the Guest guide-viewing experience depends on it.

## Persona Relationships & Priority Ranking

1. **Property Owner** (highest priority — walking skeleton and Must Have stories center here; per Q7, built first)
2. **Guest** (second priority — depends on a Property Owner's guide existing; the walking skeleton's end-to-end slice includes a minimal Guest path)
3. **Admin/Ops** (supporting priority — enables Property Owner/Guest content to exist and stay fresh; its POI-curation story (US4.1) was promoted to Must Have during mob review because the Guest guide-viewing story depends on it, and its locality-brand-creation story (US4.4) is Must Have because it's a hard precondition for Property Owner signup (US1.1) — even though Admin/Ops as a persona remains lower priority overall)
