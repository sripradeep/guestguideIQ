# Contract Summary — Backend Services for GuestGuideIQ

Three formal contracts, per `contract-design-questions.md`'s Q1-Q4: one inter-unit boundary (the sole edge in `units-generation/unit-of-work-dependency.md`'s DAG) and two public/external boundaries from `backend-api` (U1). All three use REST/HTTP with JSON payloads, URI versioning (`/v1/...`), and baseline resilience (timeout + bounded idempotent retry) — concrete SLA numbers, circuit breakers, and bulkheads are deferred to `nfr-requirements`/`nfr-design` per NFR1.1.

## Contracts Table

| # | Provider Unit | Consumer | Mechanism | Owner |
|---|---|---|---|---|
| 1 | `backend-api` (U1) | `admin-api` (U2) | REST/HTTP + JSON (internal-only) | `backend-api` |
| 2 | `backend-api` (U1) | External: Property Owner/Guest web client (frontend not yet chosen) | REST/HTTP + JSON | `backend-api` |
| 3 | `backend-api` (U1) | External: marketing-site repository (lead-capture forms, FR1.3) | REST/HTTP + JSON | `backend-api` |

## Cross-Cutting Conventions (all three contracts)

- **Versioning**: URI-based, `/v1/...`. Additive/backward-compatible changes (new optional fields, new endpoints) may land within `v1`; any breaking change ships as `/v2/...` alongside `v1` until consumers migrate.
- **Error envelope** (all contracts, all error responses):
  ```yaml
  ErrorResponse:
    type: object
    required: [error]
    properties:
      error:
        type: object
        required: [code, message]
        properties:
          code: { type: string, description: "Stable machine-readable error code, e.g. VALIDATION_ERROR, NOT_FOUND, CONFLICT" }
          message: { type: string, description: "Human-readable, safe to display" }
          details: { type: object, description: "Optional field-level validation errors" }
  ```
- **Resilience baseline** (Q4): every endpoint below declares a request timeout; GET and other idempotent operations may be retried by the consumer up to 3 times with exponential backoff + jitter (100ms, 200ms, 400ms) on `502`/`503`/`504`/connection-timeout; non-idempotent POST/PATCH operations are NOT retried by contract default unless the endpoint explicitly documents idempotency-key support. Circuit breakers, bulkheads, and concrete latency/availability SLAs are deferred to `nfr-requirements`/`nfr-design`.
- **Locality-brand resolution is transparent to callers**: per `domain-design/components.md`'s `Locality` component, every public-facing request (contract 2 and, implicitly, contract 3) resolves its locality-brand server-side from the request's `Host` header — no client-supplied locality parameter exists anywhere in these contracts. A request whose `Host` doesn't resolve to any locality-brand returns `404 NOT_FOUND` with `code: LOCALITY_NOT_RESOLVED` (backing `refined-mockups.md`'s PO-0 "signups aren't available at this address" and AC1.1.5).

---

## Contract 1: `admin-api` → `backend-api` Internal API

Internal-only — never exposed on `backend-api`'s public listener/domain (per `units-generation/unit-of-work.md`'s `U2` isolation note; exact network mechanism deferred to `infrastructure-design`). Covers all four `Admin` capabilities (US4.1-US4.4), each implemented as a call into the owning component named in `domain-design/components.md`.

```yaml
openapi: 3.0.3
info:
  title: backend-api Internal Admin API
  version: "1.0"
  description: >
    Internal-only surface called exclusively by admin-api. Not reachable from
    backend-api's public listener/domain.
servers:
  - url: https://internal.backend-api.guestguideiq.internal/v1
paths:
  /internal/pois:
    post:
      operationId: createPOI
      summary: Curate a new point-of-interest (US4.1, AC4.1.1)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, description, category, localityIds]
              properties:
                name: { type: string }
                description: { type: string }
                category: { type: string }
                localityIds:
                  type: array
                  items: { type: string }
                  minItems: 1
                  description: "One or more Locality IDs (FR5.4 many-to-many)"
      responses:
        "201": { description: "POI created" }
        "400": { description: "Invalid or duplicate-within-locality data (AC4.1.2)" , content: { application/json: { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
  /internal/events:
    get:
      operationId: listEvents
      summary: List events including expired/duplicate audit trail (US4.2)
      parameters:
        - name: localityId
          in: query
          schema: { type: string }
        - name: includeExpired
          in: query
          schema: { type: boolean, default: true }
      responses:
        "200": { description: "Event list with lifecycle status per event (active/expired)" }
  /internal/accounts/{accountId}:
    get:
      operationId: lookupAccount
      summary: Look up a Property Owner account for support/investigation (US4.3, AC4.3.1)
      parameters:
        - name: accountId
          in: path
          required: true
          schema: { type: string }
      responses:
        "200": { description: "Account and subscription status" }
        "404": { description: "No account found for that identifier (AC4.3.2)", content: { application/json: { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
  /internal/localities:
    post:
      operationId: createLocalityBrand
      summary: Create a locality-brand identity and its domain(s) (US4.4, AC4.4.1)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, domains]
              properties:
                name: { type: string }
                tagline: { type: string }
                visualStyling: { type: object, description: "Optional; minimal identity (name/tagline only) is valid, per AC1.5.4/AC2.2.4's fallback rendering" }
                domains:
                  type: array
                  items: { type: string }
                  minItems: 1
      responses:
        "201": { description: "Locality-brand created" }
        "400": { description: "Invalid/incomplete identity data (AC4.4.5)", content: { application/json: { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
        "409": { description: "A domain in the request is already bound to a different locality-brand (AC4.4.4)", content: { application/json: { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
  /internal/localities/{localityId}/domains:
    post:
      operationId: addLocalityDomain
      summary: Associate an additional domain with an existing locality-brand (AC4.4.2)
      parameters:
        - name: localityId
          in: path
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [domain]
              properties:
                domain: { type: string }
      responses:
        "200": { description: "Domain added" }
        "409": { description: "Domain already bound elsewhere (AC4.4.4)", content: { application/json: { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
components:
  schemas:
    ErrorResponse:
      # Shared shape across all three contracts — see "Cross-Cutting Conventions" above.
      # Repeated verbatim in each contract's own OpenAPI document rather than a cross-document
      # $ref (each block below is an independently valid, standalone OpenAPI document).
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message]
          properties:
            code: { type: string, description: "Stable machine-readable error code, e.g. VALIDATION_ERROR, NOT_FOUND, CONFLICT" }
            message: { type: string, description: "Human-readable, safe to display" }
            details: { type: object, description: "Optional field-level validation errors" }
```

**Idempotency note**: `POST /internal/pois` and `POST /internal/localities` are NOT automatically retried per the resilience baseline (non-idempotent); a future idempotency-key mechanism is a candidate for `functional-design` if `admin-api`'s retry needs grow.

---

## Contract 2: `backend-api` Public API (Property Owner / Guest Frontend)

The product's main public surface. A representative slice covering each story group's contract shape (auth, onboarding, guide, locality content, subscription, guest access, chat) — the complete endpoint inventory for all 13 `U1` stories is elaborated at `functional-design`/`build-and-test` once the frontend and backend tech stack are chosen (`requirements.md` C3/C4); this stage pins the shape and conventions, not an exhaustive endpoint list.

```yaml
openapi: 3.0.3
info:
  title: GuestGuideIQ Backend API
  version: "1.0"
servers:
  - url: https://{locality-domain}/v1
    description: "{locality-domain} varies per locality-brand (FR9.4) — resolved server-side from the Host header, never a client parameter"
paths:
  /accounts:
    post:
      operationId: createAccount
      summary: Property Owner signup (US1.1, AC1.1.1-AC1.1.5)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [username, password]
              properties:
                username: { type: string }
                password: { type: string }
      responses:
        "201": { description: "Account and property created, assigned to the resolved locality-brand (AC1.1.4)" }
        "400": { description: "Invalid input (AC1.1.3)", content: { application/json: { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
        "404": { description: "Signup domain does not resolve to any locality-brand (AC1.1.5, code LOCALITY_NOT_RESOLVED)", content: { application/json: { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
        "409": { description: "Username already exists (AC1.1.2)", content: { application/json: { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
  /guides/{propertyId}:
    get:
      operationId: getGuide
      summary: Property Owner reads/edits their guide; Guest reads a published guide via a separate stay-scoped path (US1.5, US2.2)
      parameters:
        - name: propertyId
          in: path
          required: true
          schema: { type: string }
      responses:
        "200": { description: "Guide content, rendered/annotated with the property's locality-brand (AC1.5.3/AC2.2.3) or its minimal-identity fallback (AC1.5.4/AC2.2.4)" }
    patch:
      operationId: updateGuide
      summary: Edit guide content (US1.5, AC1.5.1)
      parameters:
        - name: propertyId
          in: path
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema: { type: object }
      responses:
        "200": { description: "Guide updated" }
  /guides/{propertyId}/favorites:
    post:
      operationId: favoritePOIOrEvent
      summary: Favorite a curated POI or event to feature in the guide (US1.6, AC1.6.1)
      parameters:
        - name: propertyId
          in: path
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [itemType, itemId]
              properties:
                itemType: { type: string, enum: [poi, event] }
                itemId: { type: string }
      responses:
        "200": { description: "Favorited" }
  /stays/{token}:
    get:
      operationId: resolveGuestStay
      summary: Guest access via stay-scoped link (US2.1, AC2.1.1-AC2.1.4)
      parameters:
        - name: token
          in: path
          required: true
          schema: { type: string }
      responses:
        "200": { description: "Guide content plus property name/photo trust confirmation (AC2.1.1)" }
        "410": { description: "Link expired or never valid (AC2.1.2/AC2.1.3) — same message either way" , content: { application/json: { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
  /stays/{token}/chat:
    post:
      operationId: sendItineraryChatMessage
      summary: Guest itinerary chat (US2.3, AC2.3.1-AC2.3.3)
      parameters:
        - name: token
          in: path
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [message]
              properties:
                message: { type: string }
      responses:
        "200": { description: "Assistant reply, grounded in the property's locality content, or a limited-content notice (AC2.3.2)" }
        "504": { description: "Assistant backend timed out (AC2.3.3) — retryable" }
  /subscriptions:
    post:
      operationId: startSubscription
      summary: Start a subscription (US1.7)
      responses:
        "201": { description: "Subscription active" }
        "402": { description: "Payment failed, no account state change (AC1.7.2)", content: { application/json: { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
    patch:
      operationId: changeSubscription
      summary: Upgrade, downgrade, or cancel (US1.8)
      responses:
        "200": { description: "Subscription changed" }
        "409": { description: "No active subscription to modify (AC1.8.3)", content: { application/json: { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
components:
  schemas:
    ErrorResponse:
      # Shared shape across all three contracts — see "Cross-Cutting Conventions" above.
      # Repeated verbatim in each contract's own OpenAPI document rather than a cross-document
      # $ref (each block below is an independently valid, standalone OpenAPI document).
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message]
          properties:
            code: { type: string, description: "Stable machine-readable error code, e.g. VALIDATION_ERROR, NOT_FOUND, CONFLICT" }
            message: { type: string, description: "Human-readable, safe to display" }
            details: { type: object, description: "Optional field-level validation errors" }
```

**Not yet pinned here** (deferred to `functional-design`/`build-and-test`, tracked in Open Questions below): password reset flow endpoints (US1.2), onboarding wizard step endpoints (US1.3/US1.4), full locality-content browse endpoints (US1.6's read side beyond favoriting). Their contract shape follows the same conventions established above (REST, `/v1`, `ErrorResponse` envelope) — they are omitted from this representative slice, not undecided in mechanism.

---

## Contract 3: `backend-api` Public API (Marketing-Site Lead Capture)

Consumed by the *existing* marketing-site repository once its three forms are repointed from Formspree (FR1.3). Preserves the field sets from `api-documentation.md` per FR1.1.

```yaml
openapi: 3.0.3
info:
  title: GuestGuideIQ Lead Capture API
  version: "1.0"
servers:
  - url: https://api.guestguideiq.com/v1
paths:
  /leads/waitlist:
    post:
      operationId: submitWaitlist
      summary: Waitlist email capture (US3.1, FR1.1)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email]
              properties:
                email: { type: string, format: email }
      responses:
        "201": { description: "Submission stored (FR1.2 — backend is now the system of record, not Formspree)" }
        "400": { description: "Validation error; the marketing site keeps the visitor's entered data client-side (AC3.2.1)", content: { application/json: { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
  /leads/partner:
    post:
      operationId: submitPartnerInterest
      summary: Partner interest form (US3.1, FR1.1)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, company, role, organizationType, email, message]
              properties:
                name: { type: string }
                company: { type: string }
                role: { type: string }
                organizationType: { type: string }
                email: { type: string, format: email }
                message: { type: string }
      responses:
        "201": { description: "Submission stored" }
        "400": { description: "Validation error", content: { application/json: { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
  /leads/investor:
    post:
      operationId: submitInvestorPress
      summary: Investor/press form (US3.1, FR1.1)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, org, email, message]
              properties:
                name: { type: string }
                org: { type: string }
                email: { type: string, format: email }
                message: { type: string }
      responses:
        "201": { description: "Submission stored" }
        "400": { description: "Validation error", content: { application/json: { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
components:
  schemas:
    ErrorResponse:
      # Shared shape across all three contracts — see "Cross-Cutting Conventions" above.
      # Repeated verbatim in each contract's own OpenAPI document rather than a cross-document
      # $ref (each block below is an independently valid, standalone OpenAPI document).
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message]
          properties:
            code: { type: string, description: "Stable machine-readable error code, e.g. VALIDATION_ERROR, NOT_FOUND, CONFLICT" }
            message: { type: string, description: "Human-readable, safe to display" }
            details: { type: object, description: "Optional field-level validation errors" }
```

**On backend outage/network failure** (AC3.2.2), this contract behaves identically to a `400` from the marketing site's perspective: the form's own client-side error handling (unchanged from today's Formspree-era `[data-form-error]` pattern, per `architecture.md`) shows an error and retains entered data regardless of whether the failure was a validation error or a network/5xx failure — this contract does not need a distinct error shape for that case, only a reliable non-2xx/timeout signal.

---

## Contract Ownership Rules

- Each spec above is owned by `backend-api` (the provider in all three contracts) — `backend-api`'s own team maintains the authoritative OpenAPI documents, versioned alongside its code.
- **Breaking changes**: any change that removes/renames a field, changes a field's type, removes an endpoint, or changes a success/error status code requires a new version path (`/v2/...`) published alongside the existing version until every consumer has migrated. `admin-api` (Contract 1) and the marketing-site repository (Contract 3) are both consumers `backend-api` must coordinate with directly before retiring an old version.
- **Additive changes stay safe**: new optional request fields, new response fields, and new endpoints may land within the current version. Every consumer (per this stage's REST/JSON convention) MUST ignore unknown response fields rather than fail on them — this is a consumer-side contract obligation, not something the provider can enforce at the wire level.
- **`ErrorResponse` is shared** across all three contracts (defined once under Cross-Cutting Conventions) — a change to its shape is a breaking change across every contract simultaneously, not just one.

## Open Questions

| Contract | Question | Blocks |
|---|---|---|
| 2 (public API) | Full endpoint inventory for password reset (US1.2), onboarding wizard steps (US1.3/US1.4), and locality-content browse (US1.6 read side) — this stage pinned the conventions and a representative slice, not every endpoint. | `functional-design` for `U1` |
| 1 (internal API) | Exact network/auth isolation mechanism keeping this surface unreachable from `backend-api`'s public listener (VPN, private subnet, separate IdP realm, IP allowlist) — `units-generation` established the requirement; this stage assumes REST/HTTP but not the isolation mechanics. | `infrastructure-design`, `nfr-requirements` |
| All three | Concrete timeout durations, retry counts beyond "baseline", and any SLA/availability numbers — deliberately deferred per NFR1.1 and Q4. | `nfr-requirements`, `nfr-design` |
| 2 (public API) | LLM provider/prompt-grounding approach for the itinerary chat endpoint (OQ3 in `requirements.md`) affects that endpoint's request/response shape (streaming vs. single response) but is not yet chosen. | `domain-design` (already noted there), `functional-design` |

## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-09-06T04:52:51Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | contract-summary.md > all four fenced yaml blocks | Verified programmatically: all four fenced blocks (the shared `ErrorResponse` schema fragment plus the three full OpenAPI documents) parse as valid YAML. Each of the three OpenAPI documents is self-contained — the earlier draft's cross-document `$ref: "#/../ErrorResponse"` (which does not resolve within an independent OpenAPI document) has been replaced with the schema inlined in each document's own `components.schemas.ErrorResponse`, consistent with the stated intent that each block stands alone. | None. | Resolved |
| R-02 | Major | contract-summary.md > Contracts Table vs. unit-of-work-dependency.md | The one inter-unit contract (row 1) matches the DAG's sole edge exactly (`admin-api` depends on `backend-api`); the two public/external contracts (rows 2, 3) match `unit-of-work.md`'s stated external consumers (a not-yet-chosen PO/Guest frontend, and the marketing-site repository's lead forms) with no invented or missing boundary. | None. | Resolved |
| R-03 | Major | Contract 1 vs. domain-design/components.md > Admin.depends_on | All four of `Admin`'s capabilities (POI curation, event management, account lookup, locality-brand management) have a corresponding endpoint calling into the correct owning component's data (`PointOfInterest`, `LocalEvent`, `Identity`, `Locality` respectively) — no capability is missing and no endpoint calls a component `Admin` doesn't actually depend on. | None. | Resolved |
| R-04 | Major | Contract 3 vs. requirements.md > FR1.1 | Verified the three lead-form request schemas exactly match FR1.1's documented field sets: waitlist (email only), partner interest (name, company, role, organizationType, email, message), investor/press (name, org, email, message) — no field added, dropped, or renamed. | None. | Resolved |
| R-05 | Minor | Contract 2 > "Not yet pinned here" note | Contract 2 is explicitly and honestly scoped as a representative slice, not the full endpoint inventory for all 13 `U1` stories — it names exactly which story groups are deferred (password reset, onboarding wizard steps, locality-content browse) and carries them into the Open Questions table with the correct blocking stage (`functional-design`). This avoids the failure mode of a contract that silently under-specifies while claiming completeness. | None — disclosed scope, not a gap. | Resolved |
| R-06 | Minor | contract-summary.md > "Locality-brand resolution is transparent to callers" | Correctly identifies that locality resolution happens server-side from the `Host` header with no client-supplied locality parameter anywhere in Contracts 2 or 3, consistent with `domain-design/components.md`'s `Locality` component and `refined-mockups.md`'s PO-0 (unmapped-domain) treatment — the `404 LOCALITY_NOT_RESOLVED` response on `POST /accounts` is the concrete manifestation of AC1.1.5 at the contract level. | None. | Resolved |

### Summary

This is a well-formed, internally consistent set of contracts. All four fenced YAML blocks parse cleanly, with the shared `ErrorResponse` schema correctly inlined per-document after fixing an invalid cross-document reference in the working draft (R-01). The contracts table maps exactly onto the Units Generation DAG's one real edge plus the two genuine external consumers, with no invented or dropped boundary (R-02). Contract 1's internal API faithfully covers all four of `Admin`'s declared dependencies from `domain-design/components.md` (R-03), and Contract 3's lead-form schemas are a byte-for-byte match against `requirements.md`'s FR1.1 field sets (R-04). Contract 2 is honestly scoped as a representative slice rather than falsely claiming exhaustive coverage, with the deferred story groups correctly tracked in Open Questions (R-05). The transparent, server-side locality-resolution convention is applied consistently and its failure mode (unresolved domain) is given a concrete status code and error code (R-06). Versioning, error envelope, and resilience-baseline conventions (Q1-Q4) are applied uniformly across all three contracts. Ready for Delivery Planning.
