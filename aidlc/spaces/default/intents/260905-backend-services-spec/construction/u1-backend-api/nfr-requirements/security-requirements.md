# Security Requirements — u1-backend-api

Concretizes `requirements.md` NFR3 (Security) and its already-Mandated `project.md` rules (secrets manager, dependency/secret scanning, blocking CI). Threat modelling below uses STRIDE against this Unit's real trust boundaries; `rules.md`'s BR1-BR10 already encode most business-level authorization logic — this file adds the cross-cutting security posture that sits underneath those rules.

## Authentication (NFR3.8)

```
NFR-AUTH: Property Owner Authentication
Method: JWT — short-lived access token + longer-lived refresh token
Token lifetime: access 15 minutes, refresh 7 days (per security-guide.md's JWT pattern)
MFA requirement: none for this phase (no story requires it; revisit if Admin/ops access grows in sensitivity)
Session management: refresh token stored HttpOnly/Secure/SameSite=Strict; access token held client-side in memory, never localStorage
Password policy: bcrypt-hashed (NFR3.7), minimum 8 characters + basic complexity check per BR1.5's "well-formed" requirement; no forced rotation (not justified at this scale)
```

Chosen over server-side sessions specifically because it requires no shared session store, which keeps the application tier stateless — a direct enabler of `scalability-requirements.md`'s NFR5.3 horizontal-scaling approach (Q6).

Guests never authenticate (BR8.1-BR8.4 govern stay-token-based access instead — a capability token, not an identity credential); `admin-api`'s ops-staff authentication is `u2-admin-api`'s own concern (its `rules.md` BR1.1), out of scope here beyond the internal-API isolation noted in NFR3.11 below.

## Authorization (NFR3.9)

| Actor | Model | Boundary |
|---|---|---|
| Property Owner | Object-level: every operation on `Property`/`GuideContent`/`SubscriptionRecord` verifies the authenticated account owns the target row (never trust a client-supplied ownership claim, per `security-guide.md`) | Enforced at every endpoint in Contract 2 that takes a `propertyId`/`accountId` |
| Guest | Capability-based via `Stay.token` — possession of a valid, unexpired, locality-matching token is the entire authorization model (BR8.1-BR8.3); no broader guest identity exists | `GET /stays/{token}`, `POST /stays/{token}/chat` |
| `admin-api` (internal caller) | Trusted-caller model — Contract 1 is reachable only from `admin-api`, never from the public listener (NFR3.11); this Unit does not re-authenticate the ops-staff identity a second time, matching `u2-admin-api/rules.md`'s BR1.1 statement that authorization happens once, at `admin-api`'s own entry point | `/internal/*` paths only |

## Threat Model (STRIDE)

| Flow | S | T | I | D | E |
|---|---|---|---|---|---|
| Signup (W1) | Duplicate-username / domain-spoofing mitigated by BR1.1, BR1.2 (server-resolved domain, never client-supplied) | Request body validated (BR1.5) before any write | Error responses never leak whether a username exists via timing or message wording differences beyond the documented `409` | Rate limit signup attempts per IP (NFR3.10) | N/A — no privilege tiers at signup |
| Guest stay-link resolution (W7) | Token possession is the identity; BR8.2 returns an identical message for malformed/expired/unknown tokens specifically to prevent an attacker from distinguishing a valid-but-expired token from a never-issued one (no enumeration oracle) | Token is opaque and unguessable (generation entropy: `infrastructure-design`) | Guest can only ever see the property/locality the token was minted for, enforced by BR8.3 | Rate limit token-lookup attempts per IP to blunt brute-force enumeration | N/A |
| `admin-api` → `backend-api` internal calls | Network/auth isolation mechanism (VPN, private subnet, mTLS, or IP allowlist) is explicitly deferred to `infrastructure-design` per `contract-summary.md`'s own open question — this Unit's contract assumes that isolation exists and never re-implements caller authentication | N/A (internal, isolated network) | Internal-only responses never traverse the public listener | Isolation itself is the primary DoS boundary — a compromised public surface cannot reach `/internal/*` | Elevation would require breaching the network isolation layer first; tracked as an `infrastructure-design` dependency, not resolved here |
| Itinerary chat (W9) | N/A (guest already authenticated via stay token) | Prompt-injection from guest input into the LLM call is a real risk once a concrete provider is chosen (Q4 deferred) — flagged as an open item for whichever adapter implementation lands at Code Generation | Grounding context is scoped to the stay's own locality only (BR7.1) — never another locality's content | Rate limit chat messages per stay to bound LLM-cost-driven DoS | N/A |
| Lead-form submission (W10) | N/A (unauthenticated by design) | Fields validated per formType schema (BR10.1) before persistence | No PII beyond what each form explicitly collects is stored | Rate limit per IP; no duplicate check exists by design (BR10.2), so this is the only abuse control on this path | N/A |

## Data Protection

Per the security guide's tiering and this project's already-Mandated `project.md` rules:

| Tier | Data | At Rest | In Transit | Notes |
|---|---|---|---|---|
| Restricted | Password hashes, JWT signing key, Stripe API key, database credentials | Secrets manager only (Mandated, `project.md`); password hashes use bcrypt (NFR3.7), never reversible encryption | TLS 1.2+ | Never logged (see `observability-requirements.md`'s logging exclusions) |
| Confidential | Account/Property/Stay data, lead submissions with PII (name, email, org) | Encrypted at rest (database-level encryption; specific mechanism at `infrastructure-design`) | TLS 1.2+ | Access restricted to the owning account or `admin-api`'s trusted-caller path |
| Internal | GuideContent, POI, Event | Standard database encryption | TLS 1.2+ | No confidentiality requirement beyond standard access control — this is business content, not personal data |
| Public | Locality-brand name/tagline/visualStyling | None required | TLS preferred | Rendered to any visitor resolving that domain |

## Requirements

| ID | Requirement |
|---|---|
| NFR3.7 | Password hashes use bcrypt (Q3) with a work factor tuned to keep hashing under ~250ms on the target compute instance — concretizes NFR3.6. |
| NFR3.8 | Property Owner authentication uses JWT (access 15min / refresh 7d) per the Authentication section above. |
| NFR3.9 | Authorization follows the object-level / capability-token / trusted-caller model per the Authorization table above. |
| NFR3.10 | Rate limiting applies to signup, password-reset request, guest-link resolution, chat messages, and lead-form submission — all unauthenticated or low-friction endpoints identified as abuse surfaces in the threat model above. Concrete limits (requests/window) are set at `infrastructure-design` once the rate-limiting mechanism (API gateway vs. application-level) is chosen. |
| NFR3.11 | The `admin-api` → `backend-api` internal API (Contract 1) must never be reachable from `backend-api`'s public listener/domain. The concrete isolation mechanism (VPN, private subnet, mTLS, IP allowlist) is deferred to `infrastructure-design` (carried forward from `contract-summary.md`'s open question) — this requirement fixes the *outcome*, not the mechanism. |
| NFR3.12 | Third-party data handling: Stripe (Q7) receives only tokenized payment data via Checkout/Elements — this backend never stores or transmits raw card numbers, keeping PCI-DSS scope to SAQ-A-equivalent. The itinerary-chat LLM provider (deferred, Q4) must not receive any PII beyond what's necessary for grounding (property/locality content only — never Property Owner account details or guest identity, since guests have none). |
| NFR3.13 | Every `admin-api`-initiated write into this Unit's data (POI, Event, LocalityEntity per Contract 1) is logged with the ops-staff identity, timestamp, and operation — supporting `u2-admin-api`'s own audit posture and this project's compliance-readiness baseline (`regulatory-frameworks.md`'s audit-trail requirement, applied proactively even though no specific regulatory regime is yet confirmed, per NFR4). |

## Data Privacy (NFR4)

No specific compliance regime (GDPR, CCPA, etc.) is confirmed as applicable yet (`requirements.md` NFR4.1) — the following baseline privacy controls apply regardless, so a regime confirmed later finds a head start rather than a gap:

| ID | Requirement |
|---|---|
| NFR4.2 | Data minimization: `Account` collects only `username`/`password`/the email needed for password reset (FR2.3); `LeadSubmission` stores only the fields each form type explicitly requests (BR10.1) — no incidental PII collection beyond what each workflow requires. |
| NFR4.3 | A manual data-subject-deletion runbook exists (via `admin-api`'s account lookup, `u2-admin-api` W3) even though no automated DSAR self-service flow is built yet — honestly scoped as a manual process rather than an unstated gap, revisited once a specific regulatory regime is confirmed. |

## Traceability

See `traceability.json`. Upstream: `NFR3` (Security), `NFR4` (Data Privacy).

## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-09-06T06:29:36Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | traceability.json vs. all six artifacts | Verified programmatically: every derived `NFRx.y` id appearing in `performance-requirements.md`, `security-requirements.md`, `scalability-requirements.md`, `reliability-requirements.md`, and `observability-requirements.md` appears exactly once as a `traceability.json` coverage target, and every coverage target string resolves to a real id declared in one of those files — zero unlisted or dangling ids. | None. | Resolved |
| R-02 | Major | traceability.json > sub-numbering vs. requirements.md | Confirmed each derived id continues past inception's own already-used sub-numbers for that NFR category (e.g. `NFR3.7` onward, since inception's `requirements.md` already used `NFR3.1`-`NFR3.6`) rather than restarting at `.1` — no collision between an inception-level placeholder id and a construction-level concrete id. | None. | Resolved |
| R-03 | Major | security-requirements.md > Authentication vs. scalability-requirements.md > NFR5.3 | The JWT/stateless-auth decision is cross-referenced correctly in both directions: `security-requirements.md` states it was "chosen over server-side sessions specifically because it requires no shared session store," and `scalability-requirements.md`'s NFR5.3 cites the same decision as what "directly enables" its horizontal-scaling approach. No contradiction between the two artifacts' framing of the same decision. | None. | Resolved |
| R-04 | Major | observability-requirements.md > anchor to NFR2 | `requirements.md` has no dedicated top-level Observability NFR; anchoring the derived observability ids (`NFR2.6`-`NFR2.9`) under `NFR2` (Availability) rather than inventing an unanchored category is the correct call — observability is the measurement mechanism the reliability SLO (`NFR2.2`) depends on, and the file states this reasoning explicitly rather than silently borrowing the id space. | None. | Resolved |
| R-05 | Minor | security-requirements.md > NFR3.11 vs. contract-summary.md | The `admin-api`/`backend-api` network-isolation mechanism is correctly carried forward as an open item deferred to `infrastructure-design` (matching `contract-summary.md`'s own open question) rather than fabricated here — this requirement fixes the outcome (never reachable from the public listener) without inventing a mechanism the team hasn't chosen yet. | None. | Resolved |
| R-06 | Minor | tech-stack-decisions.md > LLM provider vs. performance-requirements.md > NFR1.3 | The deferred provider-agnostic LLM adapter (Q4) is consistently reflected in the looser chat-latency budget (`NFR1.3`, p95 < 3s vs. the general 500ms API budget) — the performance target correctly accounts for the vendor decision being deferred rather than assuming a specific provider's latency profile. | None. | Resolved |
| R-07 | Minor | security-requirements.md > Data Privacy (NFR4) | Baseline privacy controls (data minimization, a manual deletion runbook) are honestly scoped as present-but-manual rather than claiming an automated DSAR flow that doesn't exist — consistent with `requirements.md` NFR4.1's stance that no specific regime is yet confirmed. | None. | Resolved |

### Summary

This is a well-formed, internally consistent NFR Requirements pass for `u1-backend-api`. Traceability is complete with no dangling or unlisted ids (R-01), and the sub-numbering scheme correctly avoids colliding with inception's own already-used placeholder ids (R-02). The three cross-artifact decisions that had to stay coherent — stateless JWT auth enabling horizontal scaling (R-03), observability's anchor to the availability SLO it measures (R-04), and the LLM-provider deferral's effect on the chat latency budget (R-06) — are all consistently represented wherever they're referenced. Two items are correctly carried forward as open rather than fabricated: the internal-API network-isolation mechanism (R-05) and DSAR automation (R-07), both honestly deferred to a later stage rather than guessed at here. No blocking issues found; ready for NFR Design.
