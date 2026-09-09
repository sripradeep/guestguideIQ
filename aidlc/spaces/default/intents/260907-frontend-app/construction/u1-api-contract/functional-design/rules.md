# Business Rules — `u1-api-contract`

*Re-confirmed 2026-09-08 after the functional-design redo jump. Content
unchanged.*

The rules governing this unit. It has no user-facing behaviour, so these are
rules about **fidelity and provenance** — what the types must reflect, who may
change them, and what must be impossible to express.

The most important ones are of a kind worth naming: several backend endpoints
treat a malformed request as a *successful destructive action* rather than an
error. For those, **the type is the only enforcement point available**. If the
shape lets the dangerous request be constructed, nothing downstream reliably
prevents it.

## Source of truth

```yaml
rules:

  - id: BR1.1
    statement: Only endpoints that are actually deployed are typed.
    category: constraint
    applies_to: the whole typed surface
    trigger: authoring or regenerating the types
    logic: >
      IF an endpoint appears in api-documentation.md but has no route registration
      in the running service, THEN it is listed in the not-typed table and given
      no shapes.
    violation: >
      Code calling an absent endpoint compiles, ships, and fails at runtime with a
      404 — moving a knowable failure past every check that could have caught it.
    source: Q1 (functional design), Contract Design C1

  - id: BR1.1a
    statement: The transcribed shapes record the exact revision of the contract of record they came from.
    category: constraint
    applies_to: entities.md
    trigger: transcribing or re-transcribing any shape
    logic: >
      IF shapes are transcribed, THEN entities.md carries a provenance block
      naming the source document, its digest, and the backend commit current at
      transcription time.
    violation: >
      Without it a re-transcription cannot tell whether the source changed, so
      every refresh is a fresh guess rather than a comparison, and staleness is
      undetectable by inspection. This is the interim form of the pin-and-verify
      requirement, applied to the prose document standing in for a
      machine-readable contract.
    source: Q1 (functional design), NFR7.3

  - id: BR1.2
    statement: The contract of record is api-documentation.md, and divergence from it is a backend defect.
    category: policy
    applies_to: every typed shape
    trigger: any discrepancy between a type and observed API behaviour
    logic: >
      IF the deployed API behaves differently from api-documentation.md, THEN the
      type follows the DOCUMENT and the difference is raised as a backend defect —
      it is not silently absorbed by changing the type to match reality.
    violation: >
      Absorbing the difference makes the frontend the place the contract lives,
      which is exactly the drift this unit exists to prevent, and hides a backend
      defect nobody else will find.
    source: Contract Design Q1

  - id: BR1.3
    statement: Nothing outside this unit hand-edits a type at the vendored path.
    category: authorization
    applies_to: the vendored type directory
    trigger: any change to a file under that path
    logic: >
      IF a type at the vendored path needs to change, THEN it changes here — by
      re-transcription now, by regeneration once a machine-readable contract
      exists — never by an edit from a consuming unit.
    violation: >
      A hand-edited generated type is silently destroyed by the next refresh, and
      the behaviour it was patching returns without warning.
    source: Contract Design C2

  - id: BR1.4
    statement: Unknown response fields are ignored.
    category: policy
    applies_to: every response shape
    trigger: a response carrying a field the type does not declare
    logic: >
      IF a response contains an unrecognised field, THEN it is ignored and the
      known fields are read normally.
    violation: >
      Rejecting the response would take the frontend down on a purely additive
      backend change — a safe change punished as a breaking one.
    source: Q2 (functional design), Contract Design ownership rules

  - id: BR1.5
    statement: An unrecognised error code resolves to a defined default rather than a crash.
    category: constraint
    applies_to: ApiError
    trigger: a response whose error.code is not among the catalogued codes
    logic: >
      IF error.code is unrecognised, THEN it maps to a defined default case that
      downstream code can handle exhaustively.
    violation: >
      An unhandled code crashes the surface it reached, turning a backend addition
      into a frontend outage.
    source: Contract Design C1

  - id: BR1.6
    statement: A response that is not envelope-shaped at all has a defined fallback.
    category: constraint
    applies_to: ApiError
    trigger: a raw 500 with no body, or a 502/504 from infrastructure
    logic: >
      IF a failure response cannot be parsed as { error: { code, message } },
      THEN it resolves to a defined non-envelope failure rather than a parse
      exception.
    violation: >
      A parse exception at the error boundary means the error handler is itself
      the thing that fails, which is the worst possible place for it.
    source: Contract Design C1

  - id: BR2.1
    statement: GuideUpdate.sections is non-optional and carries the complete set.
    category: validation
    applies_to: GuideUpdate
    trigger: constructing a guide update
    logic: >
      IF a guide update is constructed, THEN `sections` MUST be present and MUST
      be the complete section set. The type makes omission impossible to express.
    violation: >
      A missing or misspelled key does NOT fail. The route defaults it to an empty
      list in front of the service's array guard, so the call returns 200 having
      deleted every section — a destructive success, which no error handling
      catches because there is no error.
    source: AC1.7.2, api-documentation.md §A.4

  - id: BR2.2
    statement: SubscriptionAction.action is a closed enum, never a free-form string.
    category: validation
    applies_to: SubscriptionAction
    trigger: constructing a plan change
    logic: >
      IF a plan change is constructed, THEN `action` MUST be one of exactly
      upgrade, downgrade, cancel. No other value is expressible.
    violation: >
      The endpoint's final else branch cancels the subscription on ANY
      unrecognised action. A typo becomes a silent billing event.
    source: AC1.14.6, api-documentation.md §A.6

  - id: BR2.3
    statement: Every request that carries a body declares that body as required.
    category: validation
    applies_to: SubscriptionAction, FavoriteSelection, GuideUpdate
    trigger: constructing any request with a body
    logic: >
      IF a request type has a body, THEN the body is non-optional, so a bodyless
      request cannot be constructed.
    violation: >
      A missing subscription body reaches the cancel branch. A missing favourites
      body returns 500 rather than 400 — the one handler with no body fallback.
    source: AC1.12.6, AC1.14.6, Contract Design C1

  - id: BR3.1
    statement: visualStyling is typed as an opaque map, never as a structure.
    category: constraint
    applies_to: LocalityIdentity
    trigger: typing the locality identity shape
    logic: >
      IF visualStyling is typed, THEN it is an unschematised map. It is NOT given
      a field structure, because the backend does not honour one.
    violation: >
      A fabricated structure invites components to read it directly and asserts a
      contract that does not exist. The value is attacker-influenceable; exactly
      one module downstream parses it into typed tokens with defaults.
    source: Contract Design C3, team practices (untrusted-render rule)

  - id: BR3.2
    statement: Guest favourite identifiers are typed as identifiers, never as content.
    category: constraint
    applies_to: GuestStayView
    trigger: typing the guest payload
    logic: >
      IF favoritedPOIIds or favoritedEventIds are typed, THEN they are lists of
      opaque identifiers, with no name, category or date field.
    violation: >
      Typing them as content implies a guest can resolve them. A guest cannot —
      both list endpoints require an owner token — so the type would licence
      rendering something that will always be empty.
    source: AC2.3.2, AC4.1.9

  - id: BR3.3
    statement: Chat reply text is marked untrusted at the boundary.
    category: constraint
    applies_to: ChatResponse, ChatMessage
    trigger: typing a model-generated reply
    logic: >
      IF reply text is typed, THEN it is carried in a form that marks it as
      untrusted, so a consumer reaching for a raw-HTML sink is visible in review.
    violation: >
      The guest's own message round-trips through a model, so a reply is
      attacker-influenceable. Untyped, it looks like any other string.
    source: AC2.4.6, team practices (untrusted-render rule)

  - id: BR3.4
    statement: No property image field is invented.
    category: constraint
    applies_to: PropertyIdentity
    trigger: typing the guest property identity
    logic: >
      IF PropertyIdentity is typed, THEN it carries id and name only. No image,
      photo or media field is added, optional or otherwise.
    violation: >
      There is no image anywhere in the system — no upload endpoint, no object
      storage, no field. An optional image field would licence a placeholder, and
      a generic placeholder is worse than none: it weakens exactly the
      specificity the property name exists to provide.
    source: AC2.1.5
```

## Rules summary

| ID | Statement | Category | Enforced by |
|---|---|---|---|
| BR1.1 | Only deployed endpoints are typed | constraint | Absence of the shape |
| BR1.1a | Transcribed shapes record their source revision | constraint | The provenance block in `entities.md` |
| BR1.2 | The document is the contract; divergence is a backend defect | policy | Review discipline |
| BR1.3 | No hand-editing at the vendored path | authorization | Review discipline |
| BR1.4 | Unknown response fields are ignored | policy | Parsing behaviour |
| BR1.5 | Unrecognised error codes have a defined default | constraint | The error union's shape |
| BR1.6 | Non-envelope failures have a defined fallback | constraint | The error union's shape |
| BR2.1 | `sections` is non-optional and complete | validation | **The type** |
| BR2.2 | `action` is a closed enum | validation | **The type** |
| BR2.3 | Bodies are non-optional | validation | **The type** |
| BR3.1 | `visualStyling` is opaque | constraint | The type |
| BR3.2 | Guest favourite ids are identifiers, not content | constraint | The type |
| BR3.3 | Chat replies are marked untrusted | constraint | The type |
| BR3.4 | No property image field is invented | constraint | Absence of the field |

## Why three rules are marked "the type" in bold

`BR2.1`, `BR2.2` and `BR2.3` guard the three places where the backend treats a
malformed request as a **successful destructive action**: a guide save that
deletes everything, a subscription change that cancels, and a favourites call
that returns `500`.

For those, there is no error to handle and no response to check. By the time a
result comes back, the damage is done. The only defence that works is making the
dangerous request **impossible to construct** — which is a property of the type,
not of the code using it.

This is why this unit, which delivers nothing a user sees, is a genuine
dependency of every other unit rather than a formality.
