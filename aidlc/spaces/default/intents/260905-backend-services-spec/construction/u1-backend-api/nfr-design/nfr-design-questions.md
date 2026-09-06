# NFR Design — Plan & Questions — u1-backend-api

`nfr-requirements` already fixed the substantive technology decisions (Node.js/TS/Fastify, PostgreSQL, bcrypt, JWT, Stripe, a deferred LLM adapter, a manual event-curation feed, OpenTelemetry). This stage designs the concrete *patterns* those decisions run through — caching, resilience, rate limiting, and logical failure-domain boundaries — so Infrastructure Design has a component-level blueprint to provision against.

---

## Q1: Caching strategy?

`security-requirements.md`'s NFR6.3 already commits to a <10ms domain-resolution budget; the question is what else, if anything, gets a caching tier at this stage.

- A. In-process in-memory cache for domain-to-locality resolution only (an LRU cache over `LocalityEntity.domains`, ~25-50 entries, invalidated on `admin-api`-initiated writes); no broader caching layer for guide/POI/event reads yet — Recommended. Matches the pre-launch, low-traffic posture (`performance-requirements.md` NFR1.6: ≥50 RPS) — a distributed cache adds real operational cost (a Redis cluster to run/monitor) that isn't yet justified by read volume, and the domain-resolution cache is the one path with an explicit sub-10ms budget that a database round-trip could jeopardize under any load.
- B. Add a distributed cache (Redis/ElastiCache) now for guide-content reads too, ahead of demonstrated need
- X. Other (please specify)

[Answer]: A. In-process in-memory cache for domain-to-locality resolution only (an LRU cache over `LocalityEntity.domains`, ~25-50 entries, invalidated on `admin-api`-initiated writes); no broader caching layer for guide/POI/event reads yet — Recommended. Matches the pre-launch, low-traffic posture (`performance-requirements.md` NFR1.6: ≥50 RPS) — a distributed cache adds real operational cost (a Redis cluster to run/monitor) that isn't yet justified by read volume, and the domain-resolution cache is the one path with an explicit sub-10ms budget that a database round-trip could jeopardize under any load.

---

## Q2: Resilience pattern for the itinerary-chat LLM dependency?

This is the one call in the system to a genuinely external, variable-latency, deferred-vendor dependency (Q4 at `nfr-requirements`).

- A. Circuit breaker wrapping the `ChatProvider` adapter interface (failure threshold 5, open duration 30s, per `nfr-design-guide.md`'s defaults), plus the timeout/retry-with-backoff BR7.3 already requires — Recommended. The adapter-interface boundary (`tech-stack-decisions.md`) is exactly where a circuit breaker belongs: it protects the rest of the system from a slow/failing LLM provider regardless of which concrete vendor lands at Code Generation, and BR7.3's "retry-able waiting state" becomes the circuit's open-state fallback behavior.
- B. Timeout + retry only, no circuit breaker yet — simpler, revisit if the LLM dependency proves unreliable in practice
- X. Other (please specify)

[Answer]: B. Timeout + retry only, no circuit breaker yet — simpler, revisit if the LLM dependency proves unreliable in practice.

---

## Q3: Rate-limiting design pattern?

`nfr-requirements`'s NFR3.10 fixed the *outcome* (rate limit signup, password-reset, guest-link resolution, chat, lead-form submission) and deferred the *mechanism* (gateway vs. app-level) to `infrastructure-design`. This question is about the pattern's shape, independent of that mechanism choice.

- A. Token-bucket rate limiting (per-IP for unauthenticated endpoints, per-account for authenticated ones), implemented behind a storage-adapter interface — in-memory for the current single/few-instance deployment, swappable to a shared store (Redis) without redesign once horizontal scale-out (NFR5.3) actually happens — Recommended. Applies the same adapter/port pattern already used for the LLM provider (Q2/Q4), and honestly acknowledges that an in-memory limiter stops being correct the moment a second instance is added, without blocking on that day-one.
- B. Design directly against a shared store (Redis) from day one, even though the year-one capacity target doesn't yet require horizontal scale-out
- X. Other (please specify)

[Answer]: A. Token-bucket rate limiting (per-IP for unauthenticated endpoints, per-account for authenticated ones), implemented behind a storage-adapter interface — in-memory for the current single/few-instance deployment, swappable to a shared store (Redis) without redesign once horizontal scale-out (NFR5.3) actually happens — Recommended. Applies the same adapter/port pattern already used for the LLM provider (Q2/Q4), and honestly acknowledges that an in-memory limiter stops being correct the moment a second instance is added, without blocking on that day-one.

---

## Q4: Logical isolation for the itinerary-chat dependency?

Feeds `logical-components.md`'s blast-radius mapping.

- A. Isolate the chat capability as its own logical module/bulkhead within the service, so an LLM-provider outage or slowdown cannot degrade the signup, guide-read, or lead-capture paths — Recommended. Directly implements the priority-tiering already established at `nfr-requirements` (`reliability-requirements.md` NFR2.4: chat degrades first, critical paths must always work) as an actual architectural boundary, not just a stated intention.
- B. No special isolation — chat runs inline with everything else in the same request-handling pool
- X. Other (please specify)

[Answer]: A. Isolate the chat capability as its own logical module/bulkhead within the service, so an LLM-provider outage or slowdown cannot degrade the signup, guide-read, or lead-capture paths — Recommended. Directly implements the priority-tiering already established at `nfr-requirements` (`reliability-requirements.md` NFR2.4: chat degrades first, critical paths must always work) as an actual architectural boundary, not just a stated intention.

---

## Consolidated Summary Confirmation

- Caching is scoped to domain-resolution only for now (Q1), matching the pre-launch traffic posture.
- The itinerary-chat LLM adapter uses timeout + retry (BR7.3) without a circuit breaker for now — a deliberate simplification the human chose over the recommended circuit-breaker default (Q2); revisit if the LLM dependency proves unreliable in practice.
- Rate limiting is designed as token-bucket behind a swappable storage adapter, in-memory today, Redis-ready later (Q3).
- The chat capability is isolated as its own bulkhead so an LLM outage cannot degrade the critical-path workflows (Q4).
- `performance-design.md`, `security-design.md`, `scalability-design.md`, `reliability-design.md`, `observability-design.md`, `logical-components.md`, and `traceability.json` will be generated reflecting all of the above, covering every `NFRx.y` from `u1-backend-api`'s NFR Requirements.

- Looks correct
- Request changes

[Answer]: Looks correct
