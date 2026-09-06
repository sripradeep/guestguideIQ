# Logical Components — u1-backend-api

Bridges this stage's NFR design decisions to `infrastructure-design`'s provisioning work — a component-level view of where each pattern above actually lives, independent of the concrete AWS (or other) services that will host them.

## Component Inventory

| Component | Owns | Failure Domain | Blast Radius if Down |
|---|---|---|---|
| **AuthModule** | Signup, login, password reset, JWT issuance/verification | Shares the app process; a bug here can affect all authenticated routes | High — no Property Owner can authenticate, though Guest access (capability-token, not JWT) is unaffected |
| **DomainResolutionModule** | LRU cache + fallback DB lookup for `LocalityEntity.domains` (NFR6.3) | In-process cache; a cold cache still falls back to DB, degrading latency not correctness | Low — a cache miss costs latency, never correctness |
| **OnboardingModule** | Wizard state machine, PDF extraction integration | Shares the app process | Medium — blocks new Property Owner onboarding only; existing properties unaffected |
| **PropertyGuideModule** | Guide CRUD, favoriting, publish/unpublish | Shares the app process | High if DB-dependent path fails; this is on the critical path |
| **LocalityContentModule** | POI/Event reads for Property Owner curation and Guest guide rendering | Shares the app process | Medium — degrades to the "content is being added" empty-state message (BR5.2/BR6.4), never a broken page |
| **GuestAccessModule** | Stay-token resolution, guest guide rendering | Shares the app process | High — this is the entire Guest-facing surface; on the critical tier |
| **ChatModule (isolated bulkhead, Q4)** | Itinerary chat, `ChatProvider` adapter, its own connection/concurrency limit | **Isolated** — a dedicated worker pool / concurrency limit distinct from the rest of the app, so LLM slowness cannot starve other request handling | Low to the rest of the system by design; high to Guests actively chatting, contained per NFR2.4's "important, degrades first" tier |
| **SubscriptionModule** | Stripe integration, `SubscriptionRecord` lifecycle | Shares the app process; Stripe itself is an external dependency with its own SLA | Medium — BR2.3's fail-clean guarantee means a Stripe outage blocks new subscription changes but corrupts nothing |
| **LeadCaptureModule** | The three marketing-site lead forms (Contract 3) | Shares the app process; simplest, most independent module (no auth, no other module dependency) | Low — isolated failure here doesn't touch any authenticated or Guest-facing path |
| **InternalAdminAPI (separate listener, NFR3.11)** | Contract 1's `/internal/*` routes | **Isolated at the network/listener level** — the one boundary this design deliberately separates for security, not just reliability, reasons | Contained to `admin-api`'s own capabilities (see that Unit's own logical-components view); never touches the public listener |

## Shared Resources

| Resource | Shared By | Contention Risk |
|---|---|---|
| PostgreSQL connection pool | Every module except ChatModule's external LLM call | The primary shared-resource contention point — sized per `performance-design.md`'s formula specifically to avoid this |
| Rate-limit storage adapter (Q3) | AuthModule, GuestAccessModule, ChatModule, LeadCaptureModule | In-memory today (single point of contention only within one instance); becomes a genuinely shared resource across instances once the Redis-backed implementation lands |

## Component Isolation Strategy Summary

Two isolation boundaries are deliberately drawn in this design, for two different reasons:
1. **ChatModule** — isolated for *reliability* (an external, variable-latency dependency must not starve the rest of the system).
2. **InternalAdminAPI listener** — isolated for *security* (a distinct trust boundary, per Units Generation's original rationale for splitting `Admin` into its own Unit in the first place).

Every other module shares the same process and connection pool — deliberately, since introducing more isolation boundaries than the actual failure/trust analysis calls for would be exactly the "aggressively minimize inter-component dependencies... but don't over-decompose" trade-off `architecture-guide.md` warns against at this scale.

## Traceability

This artifact is a structural/infrastructure-bridging document rather than a per-NFR requirement mapping — see `traceability.json`'s coverage of the `NFRx.y` ids whose designs reference specific components above (NFR1.3, NFR2.4, NFR3.11, NFR5.5, NFR6.3).
