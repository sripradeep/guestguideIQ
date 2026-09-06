# Entity Model — u1-backend-api

The entity model for all 10 components hosted by `u1-backend-api` (per `domain-design/components.md`): Identity, Subscription, Onboarding, PropertyGuide, PointOfInterest, LocalEvent, ItineraryChat, GuestAccess, LeadCapture, Locality. Technology-agnostic — no SQL, no ORM, no framework types.

## Source of Truth

```yaml
entities:
  - name: Account
    description: A Property Owner's authentication credentials
    attributes:
      - { name: id, type: uuid, required: true, unique: true, defaults: system-generated }
      - { name: username, type: string, required: true, unique: true, constraints: "3-50 chars" }
      - { name: passwordHash, type: string, required: true, constraints: "never returned by any read API" }
      - { name: createdAt, type: datetime, required: true, defaults: system-generated }
    entity_constraints:
      - "username is case-insensitively unique (AC1.1.2)"
    relationships:
      - { to: Property, cardinality: "1:1", direction: owns }
      - { to: SubscriptionRecord, cardinality: "1:1", direction: owns }
      - { to: OnboardingProgress, cardinality: "1:1", direction: owns }

  - name: Property
    description: The physical property a Property Owner manages, and its locality-brand assignment
    attributes:
      - { name: id, type: uuid, required: true, unique: true, defaults: system-generated }
      - { name: accountId, type: uuid, required: true, references: Account.id }
      - { name: name, type: string, required: true, constraints: "max 200 chars" }
      - { name: localityBrandId, type: uuid, required: true, references: LocalityEntity.id, constraints: "immutable after creation (FR9.7)" }
    entity_constraints:
      - "localityBrandId is set exactly once, at creation (AC1.1.4), and has no update operation (FR9.7)"
    relationships:
      - { to: Account, cardinality: "1:1", direction: "belongs to" }
      - { to: LocalityEntity, cardinality: "N:1", direction: "belongs to" }
      - { to: GuideContent, cardinality: "1:1", direction: owns }
      - { to: Stay, cardinality: "1:N", direction: owns }

  - name: SubscriptionRecord
    description: An account's subscription status and plan
    attributes:
      - { name: id, type: uuid, required: true, unique: true, defaults: system-generated }
      - { name: accountId, type: uuid, required: true, unique: true, references: Account.id }
      - { name: plan, type: enum, allowed_values: ["standard"], required: true, defaults: "standard", constraints: "single placeholder tier pending OQ1's billing-provider/plan-structure decision" }
      - { name: status, type: enum, allowed_values: ["none", "active", "cancelled"], required: true, defaults: "none" }
    entity_constraints:
      - "status transitions only through defined state changes (see functional-spec.md's Subscription Lifecycle state machine)"
    relationships:
      - { to: Account, cardinality: "1:1", direction: "belongs to" }

  - name: OnboardingProgress
    description: Tracks a Property Owner's progress through the onboarding wizard
    attributes:
      - { name: id, type: uuid, required: true, unique: true, defaults: system-generated }
      - { name: accountId, type: uuid, required: true, unique: true, references: Account.id }
      - { name: currentStep, type: enum, allowed_values: ["property_basics", "content_source", "content_review", "confirm"], required: true, defaults: "property_basics" }
      - { name: completedAt, type: datetime, required: false, defaults: null, constraints: "null until the wizard finishes" }
    entity_constraints:
      - "currentStep only advances forward except explicit backward navigation (AC1.3.3's resume is idempotent re-entry at the same step, not a step change)"
    relationships:
      - { to: Account, cardinality: "1:1", direction: "belongs to" }

  - name: GuideContent
    description: A property's digital guide content and its publish state
    attributes:
      - { name: id, type: uuid, required: true, unique: true, defaults: system-generated }
      - { name: propertyId, type: uuid, required: true, unique: true, references: Property.id }
      - { name: sections, type: "array of { title: string, body: string }", required: false, defaults: "[]" }
      - { name: publishStatus, type: enum, allowed_values: ["draft", "published"], required: true, defaults: "draft" }
      - { name: favoritedPOIIds, type: "array of uuid", required: false, defaults: "[]", references: POI.id }
      - { name: favoritedEventIds, type: "array of uuid", required: false, defaults: "[]", references: Event.id }
    entity_constraints:
      - "a Guest-facing read only ever returns this entity when publishStatus is published (AC1.5.2); an owner-facing read always returns it regardless of publishStatus"
    relationships:
      - { to: Property, cardinality: "1:1", direction: "belongs to" }
      - { to: POI, cardinality: "N:M", direction: favorites }
      - { to: Event, cardinality: "N:M", direction: favorites }

  - name: POI
    description: A curated point-of-interest, possibly shared across localities
    attributes:
      - { name: id, type: uuid, required: true, unique: true, defaults: system-generated }
      - { name: name, type: string, required: true, constraints: "max 200 chars" }
      - { name: description, type: string, required: true, constraints: "max 2000 chars" }
      - { name: category, type: string, required: true, constraints: "free-form; no fixed enum defined at this stage" }
      - { name: localityIds, type: "array of uuid", required: true, constraints: "at least 1 entry", references: LocalityEntity.id }
    entity_constraints:
      - "the (name, description) pair need not be unique globally, but must not duplicate an existing POI already associated with any of the same localityIds (AC4.1.2) — a duplicate check scoped per-locality, not global"
    relationships:
      - { to: LocalityEntity, cardinality: "N:M", direction: "associated with" }
      - { to: GuideContent, cardinality: "N:M", direction: "favorited by" }

  - name: Event
    description: A continuously-ingested local event with lifecycle state
    attributes:
      - { name: id, type: uuid, required: true, unique: true, defaults: system-generated }
      - { name: name, type: string, required: true, constraints: "max 200 chars" }
      - { name: eventDate, type: date, required: true }
      - { name: localityId, type: uuid, required: true, references: LocalityEntity.id }
      - { name: expiryStatus, type: enum, allowed_values: ["active", "expired"], required: true, defaults: "active" }
      - { name: sourceRef, type: string, required: false, constraints: "external-source identifier used for de-duplication on re-ingestion (AC4.2.3); null for manually-entered events" }
    entity_constraints:
      - "expiryStatus becomes expired once eventDate has passed (see functional-spec.md's Event Lifecycle state machine); expired events are excluded from Guest-facing reads but retained for the ops audit trail (AD-1's expired/duplicate view)"
      - "sourceRef, when present, is unique — a re-ingested event with a matching sourceRef updates the existing row rather than creating a duplicate"
    relationships:
      - { to: LocalityEntity, cardinality: "N:1", direction: "belongs to" }
      - { to: GuideContent, cardinality: "N:M", direction: "favorited by" }

  - name: ChatSession
    description: A guest's itinerary-chat conversation for their stay
    attributes:
      - { name: id, type: uuid, required: true, unique: true, defaults: system-generated }
      - { name: stayId, type: uuid, required: true, unique: true, references: Stay.id, constraints: "one continuous session per stay" }
      - { name: messages, type: "array of { role: enum[guest, assistant], text: string, timestamp: datetime }", required: false, defaults: "[]" }
      - { name: createdAt, type: datetime, required: true, defaults: system-generated }
    entity_constraints:
      - "created lazily on the guest's first chat message, not at stay creation"
    relationships:
      - { to: Stay, cardinality: "1:1", direction: "belongs to" }

  - name: Stay
    description: A stay-scoped guest access link and its validity window
    attributes:
      - { name: id, type: uuid, required: true, unique: true, defaults: system-generated }
      - { name: propertyId, type: uuid, required: true, references: Property.id }
      - { name: checkIn, type: date, required: true }
      - { name: checkOut, type: date, required: true, constraints: "must be >= checkIn" }
      - { name: token, type: string, required: true, unique: true, constraints: "opaque, unguessable; embedded in the guest access link" }
      - { name: expiresAt, type: datetime, required: true, defaults: "derived: end of checkOut date" }
    entity_constraints:
      - "expiresAt is derived from checkOut at creation and not independently editable"
    relationships:
      - { to: Property, cardinality: "N:1", direction: "belongs to" }
      - { to: ChatSession, cardinality: "1:1", direction: owns }

  - name: LeadSubmission
    description: A marketing-site lead-form submission (waitlist, partner interest, investor/press)
    attributes:
      - { name: id, type: uuid, required: true, unique: true, defaults: system-generated }
      - { name: formType, type: enum, allowed_values: ["waitlist", "partner", "investor"], required: true }
      - { name: fields, type: object, required: true, constraints: "shape depends on formType — see contract-summary.md's three request schemas" }
      - { name: submittedAt, type: datetime, required: true, defaults: system-generated }
    entity_constraints:
      - "no uniqueness constraint on (formType, email) — duplicate submissions are accepted and stored as separate rows (Q2)"
    relationships: []

  - name: LocalityEntity
    description: A locality's brand identity and the domain(s) it is served from
    attributes:
      - { name: id, type: uuid, required: true, unique: true, defaults: system-generated }
      - { name: name, type: string, required: true, constraints: "max 100 chars" }
      - { name: tagline, type: string, required: false, constraints: "max 300 chars" }
      - { name: visualStyling, type: object, required: false, defaults: null, constraints: "optional; absence renders as the minimal-identity fallback (AC1.5.4/AC2.2.4)" }
      - { name: domains, type: "array of string", required: true, constraints: "at least 1 entry; each domain string is globally unique across every LocalityEntity (AC4.4.4)" }
    entity_constraints:
      - "a domain value may appear in at most one LocalityEntity's domains list at a time"
    relationships:
      - { to: Property, cardinality: "1:N", direction: "assigned to" }
      - { to: POI, cardinality: "M:N", direction: "associated with" }
      - { to: Event, cardinality: "1:N", direction: "scoped to" }
```

## Summary

Eleven entities across ten components. Two entities belong to `Identity` (`Account`, `Property`); every other component owns exactly one. Three entities carry an explicit lifecycle state machine (documented in `functional-spec.md`, not here): `SubscriptionRecord.status`, `GuideContent.publishStatus`, and `Event.expiryStatus`. `LocalityEntity` and `POI` are the two entities with many-to-many relationships (`Property`→`LocalityEntity` is many-to-one, not many-to-many — only `POI`↔`LocalityEntity` and `GuideContent`↔`POI`/`Event` are many-to-many). `LeadSubmission` is the only fully standalone entity, consistent with `LeadCapture`'s isolated component boundary.
