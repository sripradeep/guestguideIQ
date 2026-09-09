# Entities — `u3-foundation`

*Re-confirmed 2026-09-08 after the functional-design redo jump, and re-saved
following that confirmation. Content unchanged.*

This unit owns no product data. Its entities are the **resolved views** every
other unit consumes instead of the raw thing: a session instead of a token, a
typed error instead of a status code, design tokens instead of an unschematised
blob.

Framework-neutral throughout — the framework is OQ4 and unchosen. Wire shapes
belong to `u1-api-contract`; what follows is the shape of this unit's own state.

## Source of truth

```yaml
entities:

  - name: Session
    description: The resolved session object. The only session view any consumer sees.
    identifier: sessionId
    attributes:
      - { name: sessionId, type: identifier, required: true, constraints: "local, not a server value; changes on every successful authentication" }
      - { name: status, type: enum, required: true, allowed: [anonymous, authenticating, active, refreshing, ended] }
      - { name: account, type: Account, required: false, constraints: "present exactly when status is active or refreshing" }
      - { name: endedReason, type: enum, required: false, allowed: [signed-out, refresh-failed, refresh-rejected], constraints: "present exactly when status is ended" }
    constraints:
      - "NO token field. A consumer that could read a token would be a consumer that could leak one (NFR7). Tokens live in TokenStore and are reachable only from this unit."
      - "status is the whole of what a route guard needs. u4-owner-shell branches on it and on nothing else."
      - "endedReason distinguishes a deliberate sign-out from an expiry, because the two produce different screens: one returns to login, the other renders the session-expired state over whatever was open (AC1.10.3)."

  - name: Account
    description: The signed-in owner's identity, as far as the API exposes it.
    identifier: username
    attributes:
      - { name: accountId, type: identifier, required: true }
      - { name: propertyId, type: identifier, required: true }
      - { name: username, type: string, required: true }
      - { name: propertyName, type: string, required: false }
      - { name: localityName, type: string, required: false }
    constraints:
      - "No email. The API never collects one, so AccountView is thin by necessity rather than by choice."
      - "propertyName and localityName are optional because they are only known after onboarding has written them."

  - name: TokenStore
    description: The port behind which the access and refresh tokens live.
    identifier: storeId
    attributes:
      - { name: storeId, type: string, required: true }
      - { name: durability, type: enum, required: true, allowed: [persistent], constraints: "Q1 = A settled this: the session survives a reload, so an ephemeral implementation is no longer in the answer space" }
      - { name: mechanism, type: enum, required: true, allowed: [undecided], constraints: "OQ3. nfr-design/infrastructure-design chooses; see the OQ3 note below" }
    constraints:
      - "Exactly one module reads or writes this. Nothing above SessionManager can name it."
      - "The port exists so the OQ3 decision is a swap of one implementation rather than a change to every consumer — that reversibility is why this unit exists as a boundary at all."

  - name: RefreshFlight
    description: The single in-flight refresh that concurrent 401s collapse into.
    identifier: flightId
    attributes:
      - { name: flightId, type: identifier, required: true }
      - { name: state, type: enum, required: true, allowed: [in-flight, succeeded, failed] }
      - { name: waiters, type: "list of identifier", required: true, constraints: "the requests parked on this flight's result" }
    constraints:
      - "At most ONE RefreshFlight exists at a time. This is not an optimisation: the backend's refresh-token store is per-process across 2-6 tasks, so parallel refreshes race and revoke each other."
      - "A 401 from the refresh call itself NEVER starts another flight. Without that rule the client loops."

  - name: ReplayIntent
    description: What a failed-and-re-authenticated request is allowed to do next (Q2 = B).
    identifier: intentId
    attributes:
      - { name: intentId, type: identifier, required: true }
      - { name: kind, type: enum, required: true, allowed: [reissue-read, replay-write-fresh, no-replay] }
      - { name: originatingUnit, type: string, required: true }
      - { name: payloadSource, type: enum, required: false, allowed: [captured, caller-supplied], constraints: "replay-write-fresh REQUIRES caller-supplied" }
    constraints:
      - "A write is NEVER replayed from captured bytes. The originating unit supplies the current payload at replay time, because a guide save is a full replace and replaying stale bytes over a guide the owner changed in between is worse than losing the save."
      - "PATCH /v1/subscriptions is always no-replay. AC1.14.5 forbids retrying an indeterminate subscription change; the owner is returned to the subscription screen with state re-read."

  - name: ApiError
    description: The typed, exhaustive error every consumer branches on.
    identifier: code
    attributes:
      - { name: code, type: enum, required: true, allowed: [VALIDATION_ERROR, UNAUTHORIZED, PAYMENT_FAILED, FORBIDDEN, NOT_FOUND, LOCALITY_NOT_RESOLVED, CONFLICT, LINK_INVALID, RATE_LIMITED, CHAT_PROVIDER_TIMEOUT, INTERNAL_ERROR, TRANSPORT_FAILURE, UNRECOGNISED] }
      - { name: message, type: string, required: true, constraints: "server-supplied where an envelope was parsed; locally supplied for TRANSPORT_FAILURE" }
      - { name: details, type: "list of FieldError", required: false }
      - { name: httpStatus, type: integer, required: false, constraints: "absent for TRANSPORT_FAILURE. Recorded for diagnostics; no consumer may branch on it" }
    constraints:
      - "Eleven codes are the backend's catalogue. TRANSPORT_FAILURE and UNRECOGNISED are this unit's own additions and are what make the union total."
      - "TRANSPORT_FAILURE covers a response that is not envelope-shaped at all: a raw 500 with no body, a 502/504 from infrastructure, a network failure, a timeout."
      - "UNRECOGNISED covers a twelfth code the backend adds later. A future code must not crash the app."

  - name: FieldError
    description: One field-level validation detail, kept attached to its field.
    identifier: field
    attributes:
      - { name: field, type: string, required: true }
      - { name: reason, type: string, required: true }
    constraints:
      - "Details stay per-field so a form renders them per-field. Collapsing them into one banner is the failure mode the marketing site's lead form already demonstrates."
      - "The ONE deliberate exception is login (AC1.3.2), where a non-disclosing single banner is required. That is u4-owner-shell's presentation choice, not a change to this shape."

  - name: ThemeTokens
    description: The typed design tokens parsed from a locality brand.
    identifier: resolutionId
    attributes:
      - { name: resolutionId, type: identifier, required: true }
      - { name: completeness, type: enum, required: true, allowed: [base, brand-partial, brand-full] }
      - { name: localityName, type: string, required: false }
      - { name: accent, type: string, required: false, constraints: "absent when the parsed accent fails the contrast floor; the base accent is used instead" }
      - { name: headerBackground, type: string, required: false }
      - { name: contrastDegraded, type: boolean, required: true, constraints: "true when a supplied accent was rejected for contrast" }
    constraints:
      - "This is the ONLY place visualStyling is parsed. No component reads the raw blob or spreads it into a style object."
      - "Every field is optional except completeness and contrastDegraded, because a brand may carry only a name and tagline. The result is ALWAYS complete: u2-design-system receives a TokenSet with no holes."
      - "Parsing is total and cannot throw. visualStyling is an unschematised, attacker-influenceable Record<string, unknown> | null; a parse that can throw on hostile input is a denial-of-service on the guest guide."
```

## What every consumer sees instead of what exists

The point of this unit, in one table.

| The raw thing | Who can touch it | What a consumer sees instead |
|---|---|---|
| Access and refresh tokens | `SessionManager` only | `Session` — status, and an `Account` when there is one |
| An HTTP status code | `ApiErrorCatalog` only | `ApiError` — a code from a closed union |
| A response body | `ApiClient` only | A typed shape from `u1-api-contract` |
| `visualStyling` | `LocalityBrandResolver` only | `ThemeTokens` — parsed, defaulted, contrast-checked |
| `fetch`, or the framework's equivalent | `ApiClient` only | Typed methods per endpoint |

## The contained cycle (ADR-003)

`ApiClient` depends on `SessionManager` for the current token and the refresh
decision; `SessionManager` depends on `ApiClient` to perform the login, refresh
and logout calls themselves. That is a genuine cycle and it was accepted
deliberately, rather than inventing a third component whose only job is to make
a few calls.

What makes it containable is that **both ends are in this unit**, so the cycle
never crosses a unit boundary and no consumer can observe it. Whether it is
resolved at implementation time by an injected handler or by mutual import is
left to code generation; ADR-003 records that the choice is not architectural.

## The OQ3 note, restated because Q1 = A moved it

OQ3 — where tokens physically live — is still `nfr-design`/`infrastructure-design`'s
to answer, but its answer space is now smaller. `TokenStore.durability` is
`persistent`, so:

- **In-memory-only is off the table.** It was the option with no stored-credential
  exposure at all.
- **The exposure is a 7-day, non-revocable refresh token**, with no logout or
  revocation endpoint on the backend, sitting somewhere it survives a reload.
- **The same-origin-proxy constraint is now load-bearing rather than
  precautionary.** A same-origin `HttpOnly` cookie is the one persistent
  mechanism that keeps that token out of JavaScript's reach entirely. A hosting
  target that cannot sit behind or act as a same-origin proxy decides OQ3 against
  the safest remaining option, silently.

This is recorded here as a **requirement flowing to `nfr-design`**, not as a note:
persistence is decided, so the mechanism must minimise the exposure that decision
creates.
