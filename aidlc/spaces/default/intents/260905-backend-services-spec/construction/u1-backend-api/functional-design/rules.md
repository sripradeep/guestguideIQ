# Business Rules — u1-backend-api

Numbered `BRx.y` per component group (BR1=Identity, BR2=Subscription, BR3=Onboarding, BR4=PropertyGuide, BR5=PointOfInterest, BR6=LocalEvent, BR7=ItineraryChat, BR8=GuestAccess, BR9=Locality, BR10=LeadCapture).

## Source of Truth

```yaml
rules:
  - id: BR1.1
    statement: A username must be unique across all accounts
    category: validation
    applies_to: Account
    trigger: account creation
    logic: "IF the submitted username already exists (case-insensitive) THEN reject with a duplicate-username error"
    violation_behaviour: "reject creation; no account or property row is created (AC1.1.2)"
    source: FR2.1, AC1.1.2

  - id: BR1.2
    statement: A property's locality-brand is resolved from the signup domain and assigned once, immutably
    category: policy
    applies_to: Property
    trigger: account/property creation
    logic: "IF the signup request's domain resolves to a LocalityEntity THEN assign Property.localityBrandId to it ELSE reject the signup"
    violation_behaviour: "signup fails with a LOCALITY_NOT_RESOLVED error; no account or property row is created (AC1.1.5)"
    source: FR3.5, FR9.6, AC1.1.4, AC1.1.5

  - id: BR1.3
    statement: A property's locality-brand assignment cannot be changed after creation
    category: constraint
    applies_to: Property
    trigger: any attempted update to localityBrandId
    logic: "no operation in this component's contract accepts a change to localityBrandId"
    violation_behaviour: "N/A — enforced by omission, not a runtime rejection path"
    source: FR9.7

  - id: BR1.4
    statement: A password-reset link is valid only within its issued time window
    category: validation
    applies_to: Account
    trigger: password-reset link use
    logic: "IF the link's window has elapsed THEN show 'link expired' and allow requesting a new one ELSE allow setting a new password"
    violation_behaviour: "reject the reset attempt; the account's password is unchanged (AC1.2.2)"
    source: FR2.3, AC1.2.2

  - id: BR1.5
    statement: Signup input must be well-formed
    category: validation
    applies_to: Account
    trigger: account creation
    logic: "IF username or password fails basic format/complexity checks THEN reject with a field-level validation error"
    violation_behaviour: "reject creation; no account or property row is created (AC1.1.3)"
    source: FR2.1, AC1.1.3

  - id: BR2.1
    statement: A subscription action requires an existing account
    category: authorization
    applies_to: SubscriptionRecord
    trigger: create/upgrade/downgrade/cancel
    logic: "IF the referenced accountId does not exist THEN reject the request"
    violation_behaviour: "reject with a not-found error"
    source: FR2.2

  - id: BR2.2
    statement: Upgrade, downgrade, or cancel requires an active subscription
    category: constraint
    applies_to: SubscriptionRecord
    trigger: upgrade/downgrade/cancel
    logic: "IF status != active THEN reject the request"
    violation_behaviour: "reject with 'nothing to modify' error; state unchanged (AC1.8.3)"
    source: FR2.2, AC1.8.3

  - id: BR2.3
    statement: A failed subscription create/change leaves no partial state
    category: constraint
    applies_to: SubscriptionRecord
    trigger: payment failure during create or change
    logic: "IF the payment step fails THEN status and plan remain exactly as they were before the attempt"
    violation_behaviour: "the failed attempt is reported to the caller; no field on SubscriptionRecord is mutated (AC1.7.2)"
    source: FR2.2, AC1.7.2

  - id: BR3.1
    statement: Onboarding always begins at property_basics for a freshly created account
    category: policy
    applies_to: OnboardingProgress
    trigger: first login after account creation
    logic: "IF no OnboardingProgress row exists for the account THEN create one at currentStep=property_basics and route there"
    violation_behaviour: "N/A"
    source: FR3.1, AC1.3.1

  - id: BR3.2
    statement: An account with completed onboarding never re-enters the wizard
    category: policy
    applies_to: OnboardingProgress
    trigger: login
    logic: "IF completedAt is set THEN route to the guide editor, not the wizard"
    violation_behaviour: "N/A"
    source: AC1.3.4

  - id: BR3.3
    statement: Resuming onboarding reopens exactly at the last completed step
    category: policy
    applies_to: OnboardingProgress
    trigger: login with completedAt unset
    logic: "route to currentStep as stored, with any prior step's entered data intact"
    violation_behaviour: "N/A"
    source: AC1.3.3

  - id: BR3.4
    statement: A failed PDF extraction falls back to manual entry rather than blocking onboarding
    category: policy
    applies_to: OnboardingProgress, GuideContent
    trigger: PDF upload extraction failure
    logic: "IF extraction fails (corrupted/unsupported file) THEN show an error and offer the manual-entry path ELSE seed GuideContent.sections from the extracted content, in draft"
    violation_behaviour: "N/A — this rule defines the fallback, not a rejection"
    source: FR3.2, FR3.4, AC1.4.2

  - id: BR3.5
    statement: PDF-imported content is never auto-published
    category: constraint
    applies_to: GuideContent
    trigger: PDF extraction completion
    logic: "extracted content is written with publishStatus=draft, never published"
    violation_behaviour: "N/A — enforced by the write path itself"
    source: AC1.4.3

  - id: BR3.6
    statement: Manual guide-content creation is a first-class path, not merely a fallback
    category: policy
    applies_to: GuideContent
    trigger: content_source step, "Start from scratch" chosen
    logic: "when no existing guide is being imported, the wizard advances directly to content_review with empty sections available for manual entry"
    violation_behaviour: "N/A"
    source: FR3.3, AC1.3.2

  - id: BR4.1
    statement: A Guest-facing read of GuideContent only ever returns published content
    category: authorization
    applies_to: GuideContent
    trigger: guest-facing guide read
    logic: "IF publishStatus != published THEN return the not-yet-published placeholder instead of sections"
    violation_behaviour: "N/A — this rule defines the substitution, not a rejection"
    source: AC1.5.2

  - id: BR4.2
    statement: Favoriting a POI or event requires it to belong to the property's own locality
    category: validation
    applies_to: GuideContent
    trigger: favorite action
    logic: "IF the target POI's localityIds or the target Event's localityId does not include/equal the property's localityBrandId THEN reject the favorite"
    violation_behaviour: "reject with a validation error; favoritedPOIIds/favoritedEventIds unchanged"
    source: FR4.2, US1.6

  - id: BR4.3
    statement: Guide edits are saved and visible immediately
    category: policy
    applies_to: GuideContent
    trigger: content edit
    logic: "a saved edit to sections is durable and reflected on the next read, regardless of publishStatus"
    violation_behaviour: "N/A"
    source: FR4.1, AC1.5.1

  - id: BR5.1
    statement: A POI's (name, description) must not duplicate an existing POI already associated with any shared locality
    category: validation
    applies_to: POI
    trigger: POI creation (via Admin's call into this component)
    logic: "IF an existing POI with the same (name, description) has at least one localityId in common with the submitted localityIds THEN reject as duplicate; a POI already used by a DIFFERENT, non-overlapping locality is not a duplicate"
    violation_behaviour: "reject creation; no POI row is created or modified (AC4.1.2)"
    source: FR5.4, AC4.1.2

  - id: BR5.2
    statement: A locality with no curated POIs/events yet shows a clear message, not a blank list
    category: policy
    applies_to: POI
    trigger: Property Owner browses curated content for a locality with zero POIs/Events
    logic: "IF the locality has no POI/Event rows THEN render an explicit 'content is being added' message instead of an empty grid"
    violation_behaviour: "N/A"
    source: US1.6, AC1.6.4

  - id: BR6.1
    statement: An event is deduplicated by its external source reference on re-ingestion
    category: constraint
    applies_to: Event
    trigger: event ingestion
    logic: "IF an Event with a matching sourceRef already exists THEN update that row instead of creating a new one"
    violation_behaviour: "N/A — this rule defines the merge, not a rejection"
    source: FR6.1, AC4.2.3

  - id: BR6.2
    statement: An event's expiryStatus becomes expired once its eventDate has passed
    category: policy
    applies_to: Event
    trigger: scheduled lifecycle sweep (or lazy check on read)
    logic: "IF current date > eventDate THEN expiryStatus = expired"
    violation_behaviour: "N/A"
    source: FR6.3, AC4.2.2

  - id: BR6.3
    statement: Expired events are excluded from Guest- and Property-Owner-facing content
    category: authorization
    applies_to: Event
    trigger: any Guest- or owner-facing read that lists events
    logic: "IF expiryStatus == expired THEN exclude from the result set (but retain for the ops audit view)"
    violation_behaviour: "N/A"
    source: FR6.3, AC4.2.2

  - id: BR6.4
    statement: The guide displays correctly whether or not any events currently exist for the locality
    category: policy
    applies_to: Event
    trigger: guide content assembly, zero non-expired events for the locality
    logic: "an empty event set is a valid, correctly-rendered state, not an error"
    violation_behaviour: "N/A"
    source: AC2.2.1

  - id: BR7.1
    statement: Itinerary suggestions are grounded only in the guest's own property's locality content
    category: constraint
    applies_to: ChatSession
    trigger: chat message
    logic: "the assistant's grounding context is restricted to POI/Event rows whose localityIds/localityId matches the stay's property's localityBrandId"
    violation_behaviour: "N/A — this is a grounding constraint on the assistant's context, not a rejection"
    source: FR7.2, AC2.3.1

  - id: BR7.2
    statement: A locality with little or no curated content gets a limited-content notice instead of an empty or fabricated itinerary
    category: policy
    applies_to: ChatSession
    trigger: chat message in a sparse-content locality
    logic: "IF the grounding context has fewer than a defined minimum of POIs/Events THEN the assistant's reply states content is limited and offers general guidance"
    violation_behaviour: "N/A"
    source: FR7.1, AC2.3.2

  - id: BR7.3
    statement: A chat backend failure preserves history and offers retry rather than hanging silently
    category: policy
    applies_to: ChatSession
    trigger: assistant backend timeout or error
    logic: "on failure, show a clear waiting/error state with a retry action; do not drop existing messages"
    violation_behaviour: "N/A"
    source: FR7.1, AC2.3.3

  - id: BR8.1
    statement: A stay-scoped link is valid only up to its checkout date
    category: validation
    applies_to: Stay
    trigger: link resolution
    logic: "IF current time > expiresAt THEN show the 'no longer valid' message"
    violation_behaviour: "reject access; no guide content is returned (AC2.1.2)"
    source: FR8.2, FR8.3, AC2.1.2

  - id: BR8.2
    statement: A malformed or never-issued token shows the same message as an expired link
    category: validation
    applies_to: Stay
    trigger: link resolution
    logic: "IF the token does not match any Stay THEN show the identical 'no longer valid' message used for expiry — never a raw 404"
    violation_behaviour: "reject access; no guide content is returned (AC2.1.3)"
    source: FR8.5, AC2.1.3

  - id: BR8.3
    statement: A guest link only resolves through its property's own locality-brand domain
    category: authorization
    applies_to: Stay
    trigger: link resolution
    logic: "IF the incoming request's domain does not resolve to the same LocalityEntity as the linked Property's localityBrandId THEN reject as an invalid link"
    violation_behaviour: "reject access (AC2.1.4)"
    source: FR8.6, AC2.1.4

  - id: BR8.4
    statement: The guest view confirms link legitimacy with property-specific content before anything else
    category: policy
    applies_to: Stay
    trigger: successful link resolution (W7)
    logic: "render the property's name/photo immediately, anchored to the property itself, never to the locality-brand domain/theme as the trust signal"
    violation_behaviour: "N/A"
    source: AC2.1.1

  - id: BR9.1
    statement: A request's domain resolves to at most one locality-brand
    category: policy
    applies_to: LocalityEntity
    trigger: any incoming request
    logic: "look up the request's Host value against every LocalityEntity.domains array; at most one match is possible given BR9.2's uniqueness rule"
    violation_behaviour: "N/A — see BR1.2/BR8.3 for what happens when no match is found"
    source: NFR6.1

  - id: BR9.2
    statement: A domain may be associated with only one locality-brand at a time
    category: validation
    applies_to: LocalityEntity
    trigger: locality-brand creation or domain addition (via Admin's call into this component)
    logic: "IF the submitted domain already appears in a different LocalityEntity's domains array THEN reject"
    violation_behaviour: "reject the operation; no domain is added or moved (AC4.4.4)"
    source: FR9.4, AC4.4.4

  - id: BR9.3
    statement: Locality-brand identity and domain configuration are managed only through Admin
    category: authorization
    applies_to: LocalityEntity
    trigger: any write to name/tagline/visualStyling/domains
    logic: "no Property Owner- or Guest-facing operation in this component's contract accepts a write to these fields"
    violation_behaviour: "N/A — enforced by omission (AC4.4.3), not a runtime rejection path"
    source: FR9.5, AC4.4.3

  - id: BR9.4
    statement: A locality-brand may be created with only a name/tagline and no visual styling
    category: validation
    applies_to: LocalityEntity
    trigger: locality-brand creation
    logic: "visualStyling is optional; only name and at least one domain are required"
    violation_behaviour: "IF name or domains is missing THEN reject with a validation error (AC4.4.5)"
    source: FR9.1, AC4.4.1, AC4.4.5

  - id: BR9.5
    statement: Property Owner and Guest surfaces render using the resolved locality-brand
    category: policy
    applies_to: LocalityEntity
    trigger: any authenticated Property Owner page render, or a resolved Guest guide view
    logic: "apply the resolved LocalityEntity's name/tagline/visualStyling as the themed accent layer (per refined-mockups.md's Q6 decision)"
    violation_behaviour: "N/A"
    source: FR9.2, FR9.3, AC1.5.3, AC2.2.3

  - id: BR9.6
    statement: Locality-brand rendering falls back gracefully when visual styling is absent
    category: policy
    applies_to: LocalityEntity
    trigger: BR9.5's render, visualStyling is null
    logic: "render the clean functional default plus the locality's name/tagline — never a broken or half-styled page"
    violation_behaviour: "N/A"
    source: AC1.5.4, AC2.2.4

  - id: BR10.1
    statement: Lead-form submissions preserve the exact field set per form type
    category: validation
    applies_to: LeadSubmission
    trigger: form submission
    logic: "validate fields against the schema for the submitted formType (waitlist/partner/investor), per contract-summary.md"
    violation_behaviour: "reject with a validation error; the visitor's entered data is not lost client-side (AC3.2.1)"
    source: FR1.1, AC3.2.1

  - id: BR10.2
    statement: Duplicate lead submissions are accepted, not deduplicated or rejected
    category: policy
    applies_to: LeadSubmission
    trigger: a submission whose fields match a prior submission
    logic: "no uniqueness check is performed; every valid submission is stored as its own row"
    violation_behaviour: "N/A"
    source: US3.1 (Q2)
```

## Summary

| Group | Component | Rule Count |
|---|---|---|
| BR1 | Identity | 5 |
| BR2 | Subscription | 3 |
| BR3 | Onboarding | 6 |
| BR4 | PropertyGuide | 3 |
| BR5 | PointOfInterest | 2 |
| BR6 | LocalEvent | 4 |
| BR7 | ItineraryChat | 3 |
| BR8 | GuestAccess | 4 |
| BR9 | Locality | 6 |
| BR10 | LeadCapture | 2 |

38 rules total. Three rules (BR1.3, BR9.3, BR3.5) are enforced by the absence of a corresponding write operation rather than a runtime rejection — a deliberate modeling choice consistent with `domain-design/components.md`'s statement that FR9.5's authorization boundary is "enforced by there being no mutation operation reachable" from the wrong caller, not by a permission check.
