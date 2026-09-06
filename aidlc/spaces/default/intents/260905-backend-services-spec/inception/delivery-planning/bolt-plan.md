# Bolt Plan — Backend Services for GuestGuideIQ

A **Bolt** is one build pass over a slice of the work, ending in something that runs — the unit of delivery Construction executes against. Seven Bolts cover all 17 stories across the two Units (`u1-backend-api`, `u2-admin-api`). Ordering here is the chosen economic path through `units-generation`'s dependency DAG (per `risk-and-sequencing-rationale.md`), not the DAG itself.

| # | Bolt | Unit(s) | Stories | Walking Skeleton? |
|---|---|---|---|---|
| 1 | Signup, Guide & Guest Access (Walking Skeleton) | `u1-backend-api`, `u2-admin-api` | US4.4 (minimal), US1.1, US1.5 (minimal), US2.1 | **Yes** |
| 2 | Lead Capture (Formspree Replacement) | `u1-backend-api` | US3.1, US3.2 | No |
| 3 | Account & Subscription Completeness | `u1-backend-api` | US1.2, US1.7, US1.8 | No |
| 4 | Onboarding & Guide Authoring | `u1-backend-api` | US1.3, US1.4, US1.5 (completed) | No |
| 5 | Locality Content Pipeline | `u1-backend-api`, `u2-admin-api` | US4.1, US4.2, US1.6, US2.2 | No |
| 6 | Admin Account Support | `u2-admin-api` | US4.3 | No |
| 7 | Itinerary Chat | `u1-backend-api` | US2.3 | No |

## Bolt 1 — Signup, Guide & Guest Access (Walking Skeleton)

The **walking skeleton** — Cockburn's term for the first Bolt: a minimal end-to-end slice touching every architectural layer, proving the architecture actually works before feature work builds on top of it.

- **Units bundled**: `u1-backend-api` (Identity, PropertyGuide, GuestAccess, Locality — resolve/lookup path only), `u2-admin-api` (Admin — create-locality-brand only)
- **Stories**: US4.4 (minimal: name + at least one domain, no visual styling), US1.1 (signup via that domain), US1.5 (minimal: save and view guide content, no favoriting/publishing polish), US2.1 (guest opens a stay-scoped link and sees the guide with the trust-confirmation cue)
- **Definition of Done**:
  - An ops action through `admin-api` creates a locality-brand with a domain.
  - A Property Owner signs up through that domain; the account and property are assigned to the resolved locality-brand (AC1.1.4); signing up through an unmapped domain is refused (AC1.1.5).
  - The Property Owner saves minimal guide content and can view it.
  - A Guest opens a stay-scoped link and sees the guide with the property name/photo trust cue (AC2.1.1); an expired or invalid link shows the "no longer valid" message (AC2.1.2/AC2.1.3).
  - The network/auth isolation mechanism between `admin-api` and `backend-api` is a made decision, not an open question — even a minimal enforcement (e.g. a distinct deployment target with a documented access boundary) counts; the exact production-grade mechanics still belong to `infrastructure-design`, but this Bolt does not ship with the boundary purely conceptual.
- **Confidence hypothesis**: the two-service architecture (one unit calling another's internal API across a real deployment boundary) works end-to-end without an integration surprise, and the chosen isolation approach is something that can actually be enforced, not just described.
- **Owning mob**: `aidlc-developer-agent` (no Team Formation ran for this `classic`-scope intent — see `team-allocation.md`)
- **Expected demo**: create a locality-brand via `admin-api`; sign up as a Property Owner through that locality's domain; save guide content; open the guide via a guest link on a different device/session.

## Bolt 2 — Lead Capture (Formspree Replacement)

- **Units bundled**: `u1-backend-api` (LeadCapture)
- **Stories**: US3.1, US3.2
- **Definition of Done**: all three marketing-site lead forms (waitlist, partner interest, investor/press) submit to `backend-api` and are persisted, preserving the field sets in `api-documentation.md` (FR1.1); a validation error or backend outage leaves the visitor's entered data intact (AC3.2.1/AC3.2.2).
- **Confidence hypothesis**: Formspree can be fully retired (FR1.2) with zero visible behavior change for marketing-site visitors.
- **Owning mob**: `aidlc-developer-agent`
- **Expected demo**: submit each of the three forms successfully; simulate a validation error and a backend outage and show data retained both times.

## Bolt 3 — Account & Subscription Completeness

- **Units bundled**: `u1-backend-api` (Identity's remaining surface, Subscription)
- **Stories**: US1.2, US1.7, US1.8
- **Definition of Done**: password reset via emailed link works, including the expired-link path; a subscription can be started, upgraded, downgraded, and cancelled; a failed payment leaves the account state unchanged (AC1.7.2); attempting to modify a non-existent subscription is rejected cleanly (AC1.8.3).
- **Confidence hypothesis**: the account lifecycle beyond signup is fully usable on its own, without needing guide or locality-content context.
- **Owning mob**: `aidlc-developer-agent`
- **Expected demo**: reset a password; start, upgrade, downgrade, and cancel a subscription, including one simulated payment failure and one attempted action with no active subscription.

## Bolt 4 — Onboarding & Guide Authoring

- **Units bundled**: `u1-backend-api` (Onboarding, PropertyGuide — completed beyond Bolt 1's minimal slice)
- **Stories**: US1.3, US1.4, US1.5 (completed: publish-state placeholder, full editing)
- **Definition of Done**: the onboarding wizard tracks step progress and resumes exactly where a Property Owner left off (AC1.3.3), and routes a completed account straight to the guide editor on repeat login (AC1.3.4); PDF import extracts into an editable, never-auto-published draft (AC1.4.1/AC1.4.3) and falls back cleanly to manual entry on failure (AC1.4.2); the guide editor's not-yet-published placeholder (AC1.5.2) is in place.
- **Confidence hypothesis**: the onboarding wizard — already flagged in `stories.md`'s mob review and `unit-of-work.md` as hiding more implementation surface than its epic-level sizing suggests (extraction, mapping, review-before-publish, loading states) — fits within the complexity actually budgeted for it.
- **Owning mob**: `aidlc-developer-agent`
- **Expected demo**: complete onboarding via PDF upload, via manual entry after a simulated extraction failure, and by resuming a deliberately interrupted session.

## Bolt 5 — Locality Content Pipeline

- **Units bundled**: `u1-backend-api` (PointOfInterest, LocalEvent, PropertyGuide, GuestAccess read paths), `u2-admin-api` (Admin's POI/event curation)
- **Stories**: US4.1, US4.2, US1.6, US2.2
- **Definition of Done**: ops can curate POIs (with the FR5.4-aware duplicate check scoped to within-locality) and see the event lifecycle audit trail (active vs. expired, duplicates prevented); Property Owners browse and favorite curated content, with a clear message when their locality has none yet (AC1.6.4); Guests see featured content or the equivalent empty-state message (AC2.2.2), including the locality-brand rendering and its minimal-identity fallback (AC2.2.3/AC2.2.4).
- **Confidence hypothesis**: content flows correctly end-to-end — ops curation through owner favoriting to guest consumption — including every zero-content and expired-content path already specified, not just the happy path.
- **Owning mob**: `aidlc-developer-agent`
- **Expected demo**: curate a POI and an event as ops; favorite both as a Property Owner; view the guide as a Guest showing the favorited content; show the zero-content locality state and an expired event no longer appearing.

## Bolt 6 — Admin Account Support

- **Units bundled**: `u2-admin-api` (Admin's account-lookup path only)
- **Stories**: US4.3
- **Definition of Done**: ops can look up a Property Owner account by identifier and see account/subscription status; a non-existent identifier returns a clean "not found" result.
- **Confidence hypothesis**: `admin-api`'s account-lookup capability composes correctly against `backend-api`'s `Identity` data using only the foundation Bolt 1 already built — no new cross-service infrastructure needed.
- **Owning mob**: `aidlc-developer-agent`
- **Expected demo**: look up an existing account and a non-existent identifier.

## Bolt 7 — Itinerary Chat

- **Units bundled**: `u1-backend-api` (ItineraryChat)
- **Stories**: US2.3
- **Definition of Done**: a Guest can converse with the assistant and receive an itinerary grounded in their property's locality content (AC2.3.1); a sparse-content locality gets a clear "limited content" message plus general guidance instead (AC2.3.2, Q3); a backend timeout shows a clear waiting/retry state, never a silent hang (AC2.3.3).
- **Confidence hypothesis**: this is the highest-uncertainty story in the product — LLM provider (OQ3), prompt-grounding approach, cost/latency implications, and output moderation (R-05) are all still open. Shipping it is what actually tells the team whether the chosen approach is viable, not further planning.
- **Owning mob**: `aidlc-developer-agent`
- **Expected demo**: request an itinerary in a content-rich locality and in a sparse one; simulate an assistant timeout and show the retry path.
