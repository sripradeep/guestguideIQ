# User Stories Assessment — GuestGuideIQ Frontend

**Decision: Execute.**

> Confirmed correct by the human at the Consolidated Summary Confirmation
> checkpoint (see `user-stories-questions.md`).

## Rationale

Every signal this stage tests for is present, and strongly:

- **User-facing features** — this intent is *entirely* user-facing. It builds the
  only two surfaces through which anyone touches GuestGuideIQ: the Property
  Owner dashboard and the Guest guide app. There is no non-user-facing portion.
- **Multiple personas with genuinely different contexts** — an authenticated,
  desktop-primary, returning Property Owner managing a subscription and
  authoring content, versus an anonymous, mobile-first, single-visit Guest on a
  possibly weak connection who never creates an account. Their needs, devices,
  trust requirements and failure tolerances diverge almost completely.
- **Complex business logic in the user's path** — locality-brand resolution by
  domain, minimal-identity theming fallback, stay-token validity, subscription
  state transitions, and an onboarding wizard that must resume mid-flow.

## Factors considered

| Factor | Reading |
|---|---|
| Project type | Brownfield frontend against a frozen, deployed API |
| User-facing scope | Total — both deliverable surfaces are user interfaces |
| Persona count | 2 in scope (Property Owner, Guest); Admin/Ops out of scope this intent |
| Complexity signals | Domain-based tenancy, themed rendering with fallback, wizard resume, token lifecycle |
| Cross-team coordination | Yes — the FR9 backend follow-up must land before Construction |

## Where stories will add the most value

1. **Making the FR9 backend prerequisite schedulable.** `requirements.md` OQ7
   records that the follow-up has no owner and no schedule, and names it the
   largest risk in the document. A story is the unit Delivery Planning can
   actually sequence; a requirement is not.
2. **The two screens with no design behind them.** Guest-link generation
   (FR6.4) and the Account rail item (reviewer finding R-02) both exist in the
   requirements with no mockup. Stories force their behaviour to be stated
   before Refined Mockups draws them.
3. **The undefined session-expiry flow** (reviewer finding R-01, accepted as
   risk at the requirements gate). Every Owner session eventually hits it and
   no acceptance criterion anywhere covers it. Story-level acceptance criteria
   are where that gap becomes visible rather than merely recorded.
4. **Separating what is buildable now from what is blocked.** Several stories
   depend on FR9 endpoints that do not exist yet. Story-level dependencies make
   that boundary explicit for the walking-skeleton Bolt.

## Relationship to the prior intent's stories

The `260905-backend-services-spec` intent produced a reviewed-READY set of 17
stories (`US1.x`–`US4.x`) covering these same journeys from the **backend's**
perspective. Those stories are upstream context, not a substitute: they describe
what the system must do, while this stage's stories describe what the *frontend*
must do to deliver it, against an API whose actual shape is now known.

Whether this stage reuses those IDs or mints new ones traced back to them was
put to the human as Q1 in `user-stories-questions.md`. **Resolved: new IDs.**
`stories.md` mints its own `US1.x`/`US2.x`/`US4.1` and each story names the prior
intent's story and acceptance criteria it realises, so no two intents own the
same ID.
