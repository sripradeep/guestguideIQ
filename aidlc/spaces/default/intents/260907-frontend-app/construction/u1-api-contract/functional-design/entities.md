# Entities — `u1-api-contract`

*Re-confirmed 2026-09-08 after the functional-design redo jump. Content
unchanged.*

The wire shapes this unit types: what the backend sends and accepts, exactly as
it does today.

**These are not the frontend's domain entities.** `Session`, `Account`, `Guide`
and the rest belong to `u3-foundation` and the feature units, which map from
these shapes into their own. This unit owns only the boundary representation —
what comes off the wire before anything interprets it.

Only endpoints that are **actually deployed** are typed (Q1 = A). Absent
endpoints are listed at the end without shapes, so nothing can be written against
them until they exist.

## Provenance

Every shape below was transcribed from one specific revision of the contract of
record. Recording which one is what makes a later re-transcription checkable
rather than a fresh guess — and it is the interim form of the pin-and-verify
requirement, applied to the prose document that stands in for a machine-readable
contract until one exists.

| Field | Value |
|---|---|
| Source | `aidlc/spaces/default/codekb/guestguideiq-app/api-documentation.md` |
| Digest | `sha256:9a99b130676eb5fd8d70635d3510b7973119545fcdae8c981277e36480c49928` |
| Size | 26,899 bytes |
| Backend commit at transcription | `721b33c` (2026-09-07) |
| Transcribed | 2026-09-08 |

**When the digest changes, these shapes are stale until re-verified.** That is the
whole point of recording it: a re-transcription compares against this value
rather than starting from scratch, and a mismatch is a signal rather than a
surprise. Once a machine-readable contract exists, this table is replaced by the
generator's own pinned source and recorded checksum, at the same vendored path.

## Source of truth

```yaml
entities:

  - name: AccountCredentials
    description: Request body for signup and login.
    attributes:
      - { name: username, type: string, required: true, unique: true, constraints: "case-insensitive uniqueness enforced server-side; 409 CONFLICT on collision" }
      - { name: password, type: string, required: true }
    constraints:
      - "No email is collected anywhere in this product. Any design assuming an email field is wrong."

  - name: AuthResult
    description: Response to signup, login and refresh. The only source of tokens.
    attributes:
      - { name: accountId, type: identifier, required: true }
      - { name: propertyId, type: identifier, required: true }
      - { name: accessToken, type: string, required: true, constraints: "short-lived; exact lifetime not documented" }
      - { name: refreshToken, type: string, required: true, constraints: "rotating; up to 7 days; single-use rotation is NOT reliably enforced across instances" }
    relationships:
      - "AuthResult identifies exactly one Account and its one Property"

  - name: OnboardingState
    description: The entire readable onboarding state. Deliberately minimal.
    attributes:
      - { name: currentStep, type: enum, required: true, allowed: [property_basics, content_source, content_review, confirm] }
      - { name: completed, type: boolean, required: true }
    constraints:
      - "This is the WHOLE readable state. No submitted value is readable back — not the property name, not any content."
      - "The step machine is forward-only: any non-current step returns 409 CONFLICT."

  - name: OnboardingPropertyBasics
    description: Request body for the first onboarding step.
    attributes:
      - { name: name, type: string, required: true, constraints: "blank rejected with 400. Permanent once set — no endpoint edits it." }

  - name: OnboardingPdfImport
    description: Request body for the PDF content-source step. Typed but unused this release.
    attributes:
      - { name: succeeded, type: boolean, required: true }
      - { name: sections, type: "list of GuideSectionInput", required: false }

  - name: GuideSectionInput
    description: One section as written to the guide.
    attributes:
      - { name: title, type: string, required: true }
      - { name: body, type: string, required: true }

  - name: GuideUpdate
    description: Request body for the guide PATCH. The most dangerous shape in this unit.
    attributes:
      - { name: sections, type: "list of GuideSectionInput", required: true, constraints: "MUST be present and MUST carry the COMPLETE set" }
    constraints:
      - "A missing or misspelled `sections` key does not fail. The route defaults it to an empty list in front of the service's array guard, so the call returns 200 having deleted every section."
      - "This is a full replace, never a merge and never a patch."

  - name: OwnerGuideView
    description: Response to every owner-side guide operation — read, update, publish, unpublish, favourite, unfavourite.
    attributes:
      - { name: propertyId, type: identifier, required: true }
      - { name: publishStatus, type: enum, required: true, allowed: [draft, published] }
      - { name: sections, type: "list of GuideSectionInput", required: true }
      - { name: favoritedPOIIds, type: "list of identifier", required: true }
      - { name: favoritedEventIds, type: "list of identifier", required: true }
    constraints:
      - "Reading this via GET creates an empty draft guide on first read — a GET with a write side effect. Idempotent and non-destructive, but it makes refetch-on-focus costly."
      - "Returned identically by all six routes in the group, so a consumer can treat every owner-side guide operation as returning the same shape."

  - name: FavoriteSelection
    description: Request body for adding a favourite.
    attributes:
      - { name: itemType, type: enum, required: true, allowed: [poi, event] }
      - { name: itemId, type: identifier, required: true }
    constraints:
      - "A missing body returns 500, not 400 — the one handler in the file with no body fallback. Every request MUST carry a complete body."
      - "An item outside the property's own locality is rejected with 400 VALIDATION_ERROR."

  - name: LocalityPOIList
    description: Response to the owner-side points-of-interest list.
    attributes:
      - { name: items, type: "list of LocalityPOI", required: true }
      - { name: isEmptyLocality, type: boolean, required: true }
      - { name: emptyMessage, type: string, required: false, constraints: "server-supplied copy; render as-is rather than a hardcoded string" }

  - name: LocalityPOI
    description: One point of interest, owner-side.
    attributes:
      - { name: id, type: identifier, required: true }
      - { name: name, type: string, required: true }
      - { name: description, type: string, required: false }
      - { name: category, type: string, required: false }
      - { name: localityIds, type: "list of identifier", required: true }

  - name: LocalityEventList
    description: Response to the owner-side events list.
    attributes:
      - { name: items, type: "list of LocalityEvent", required: true }
      - { name: isEmptyLocality, type: boolean, required: true }
      - { name: emptyMessage, type: string, required: false }

  - name: LocalityEvent
    description: One event, owner-side.
    attributes:
      - { name: id, type: identifier, required: true }
      - { name: name, type: string, required: true }
      - { name: eventDate, type: date, required: true }
      - { name: localityId, type: identifier, required: true }
      - { name: expiryStatus, type: enum, required: true, allowed: [active, expired] }
      - { name: sourceRef, type: string, required: false }

  - name: SubscriptionAction
    description: Request body for a plan change. The highest-consequence shape in this unit.
    attributes:
      - { name: action, type: enum, required: true, allowed: [upgrade, downgrade, cancel] }
    constraints:
      - "MUST be a closed enum at the boundary, never a free-form string."
      - "The endpoint's final else branch CANCELS on any unrecognised action, and the body is read optionally — so a missing body reaches cancel. Every request MUST carry a body."

  - name: SubscriptionRecord
    description: Response to subscription create and change.
    attributes:
      - { name: id, type: identifier, required: true }
      - { name: accountId, type: identifier, required: true }
      - { name: plan, type: enum, required: true, allowed: [standard], constraints: "one tier exists; upgrade and downgrade change no plan field" }
      - { name: status, type: enum, required: true, allowed: [active, cancelled] }

  - name: GuestStayView
    description: The entire guest payload, resolved from a stay token. The whole Guest surface reads from this.
    attributes:
      - { name: property, type: PropertyIdentity, required: true }
      - { name: locality, type: LocalityIdentity, required: true }
      - { name: guide, type: GuestGuideView, required: true, constraints: "a NESTED OBJECT, not a bare section list" }
    constraints:
      - "There is NO property image field anywhere in this shape, and no upload endpoint or object storage exists to produce one."
      - "Four distinct failure modes collapse into one 410 LINK_INVALID. That is a deliberate information-leak defence."
    relationships:
      - "GuestStayView contains exactly one PropertyIdentity, one LocalityIdentity and one GuestGuideView"

  - name: GuestGuideView
    description: The guide as a guest receives it, nested inside the stay payload. Distinct from OwnerGuideView.
    attributes:
      - { name: propertyId, type: identifier, required: true }
      - { name: sections, type: "list of GuideSectionInput", required: false, constraints: "nullable — null and empty are both possible and must be handled" }
      - { name: notYetPublished, type: boolean, required: true, constraints: "drives the guest-framed placeholder state (AC1.8.3). Without this field that state has no source." }
      - { name: favoritedPOIIds, type: "list of identifier", required: true, constraints: "BARE IDS. The guest cannot resolve these into anything displayable — both list endpoints require an owner token." }
      - { name: favoritedEventIds, type: "list of identifier", required: true, constraints: "same — unresolvable guest-side" }
    constraints:
      - "Structurally similar to OwnerGuideView but NOT the same shape: it carries notYetPublished and no publishStatus. Per ADR-002 the owner and guest guides are separate bounded contexts and share no type."

  - name: PropertyIdentity
    description: The property as a guest sees it. Two fields, and one of them is the trust cue.
    attributes:
      - { name: id, type: identifier, required: true }
      - { name: name, type: string, required: true, constraints: "the guest's only proof the link is theirs" }

  - name: LocalityIdentity
    description: Locality identity as carried in the guest payload — the only place locality data leaves the system today.
    attributes:
      - { name: id, type: identifier, required: true }
      - { name: name, type: string, required: true }
      - { name: tagline, type: string, required: true, constraints: "present in the shape; may be an empty string" }
      - { name: visualStyling, type: "opaque map", required: false, constraints: "UNSCHEMATISED and attacker-influenceable. Typed as an opaque map here on purpose; exactly one module downstream parses it into typed tokens." }

  - name: ChatRequest
    description: Request body for the guest's itinerary chat.
    attributes:
      - { name: message, type: string, required: true, constraints: "empty rejected with 400" }

  - name: ChatResponse
    description: Response from the itinerary chat.
    attributes:
      - { name: reply, type: string, required: true, constraints: "UNTRUSTED. The guest's own message round-trips through a model; this never reaches a raw-HTML sink." }
      - { name: sparse, type: boolean, required: true }
      - { name: messages, type: "list of ChatMessage", required: true }

  - name: ChatMessage
    description: One turn of the conversation, as returned inline with a reply.
    attributes:
      - { name: role, type: enum, required: true, allowed: [guest, assistant] }
      - { name: text, type: string, required: true, constraints: "untrusted for the assistant role" }
      - { name: timestamp, type: timestamp, required: true }
    constraints:
      - "Returned only alongside a reply. There is no history read, so a reload loses the transcript unless the frontend holds it."

  - name: ApiError
    description: The error envelope, applied uniformly across every backend contract.
    attributes:
      - { name: code, type: string, required: true, constraints: "11 codes catalogued; an unrecognised future code must resolve to a defined default rather than crash" }
      - { name: message, type: string, required: true }
      - { name: details, type: "list of FieldError", required: false }
    constraints:
      - "Wrapped as { error: { ... } } on the wire."
      - "A response that is not envelope-shaped at all — a raw 500, or a 502/504 from infrastructure — is possible and needs a defined fallback."

  - name: FieldError
    description: One field-level validation detail.
    attributes:
      - { name: field, type: string, required: true }
      - { name: reason, type: string, required: true }
    constraints:
      - "Attaches to its own named field rather than collapsing into one banner."
```

## Summary

Twenty-two shapes across five groups: authentication and account, onboarding,
guide authoring, locality content, subscription, and the guest surface — plus the
error envelope, which spans all of them.

**Three shapes carry a constraint that is a live hazard rather than a note.**

- **`GuideUpdate`** — a missing or misspelled `sections` key returns success
  having deleted everything. The type must make the field non-optional so that
  omitting it cannot compile.
- **`SubscriptionAction`** — a closed enum, because any other value cancels the
  subscription and a missing body reaches that same branch.
- **`FavoriteSelection`** — a missing body returns `500` rather than `400`, so
  optionality here is not a convenience.

In all three cases the type is the enforcement point. If the shape allows the
dangerous request to be constructed, no amount of care downstream reliably
prevents it.

**One shape is deliberately opaque.** `LocalityIdentity.visualStyling` is typed
as an unschematised map rather than given a structure it does not have. Giving it
a shape here would be inventing a contract the backend does not honour, and would
let a component read it directly — which the design forbids. Exactly one module
downstream parses it into typed tokens with defaults.

**One shape is honest about being useless.** `GuestGuideView`'s
`favoritedPOIIds` and `favoritedEventIds` carry bare identifiers a guest cannot
resolve into a name, a category or a date, because both list endpoints require an
owner token. They are typed as identifiers rather than as content, so nothing
downstream can accidentally treat them as displayable.

**Two guide shapes exist, and the difference is load-bearing.** `OwnerGuideView`
carries `publishStatus`; `GuestGuideView` carries `notYetPublished` instead, and
nests inside the stay payload rather than standing alone. They are not the same
shape and neither is derived from the other — which is exactly what ADR-002
decided when it made the owner's guide and the guest's guide separate bounded
contexts. `notYetPublished` in particular is the only source for the guest-framed
placeholder state (AC1.8.3); a design that flattened the guest guide into a bare
section list would leave that state with nothing to read.

*Corrected in revision: the first version of this file typed `guide` as a bare
list of sections, hoisted the favourite arrays to the top level, and omitted
`notYetPublished` and `guide.propertyId` entirely. Review caught it against
`api-documentation.md` before any consuming unit was designed against it.*

## Not typed — endpoints that do not exist

Per Q1 = A, these have no shapes in this unit. Code calling them will not
compile until the endpoints are deployed and this unit is refreshed.

| Endpoint | Status | Blocks |
|---|---|---|
| `POST /v1/stays` | Documented, no route registration | All of `u7-guest-links` |
| `GET /v1/subscriptions` | Documented; the doc marks it Missing | Plan and status display |
| `GET /v1/accounts/me` | Documented, not deployed | Session restore on reload |
| logout / token revocation | Named in AC4.1.5, documented nowhere | Server-side logout |
| chat history read | Named in AC4.1.6, documented nowhere | Transcript across a reopen |
| locality brand read | Named in AC4.1.7, documented nowhere | Every branded state |
| guest-resolvable POI/event | Named in AC4.1.9, documented nowhere | Real content in the guest guide |

When one is deployed, its shapes are added here and the units blocked on it can
be written. Until then the absence is a compile error rather than a runtime one.
