# NFR Requirements — Plan & Questions — u1-backend-api

`u1-backend-api` carries the vast majority of this backend's non-functional surface: all authentication, the onboarding wizard, the property guide, locality-brand rendering and domain resolution, POI/event content, the itinerary chat, guest access, and lead capture. Several `requirements.md` items were explicitly deferred to this stage (NFR1.1/NFR2.1 concrete targets, NFR3.6's hashing algorithm, OQ1's billing provider, OQ2's event-source mechanism, OQ3's LLM provider) and `requirements.md` C3/C4 left the language/framework/database entirely open. This stage resolves all of that — it is also where the backend's tech stack gets chosen, since nothing built so far commits to one (the marketing site's stack is a static Astro site with no server runtime, per `technology-stack.md`, so nothing carries forward).

---

## Q1: Backend language and web framework?

Nothing in the existing codebase constrains this choice — the marketing site is a static Astro build with no server runtime.

- A. Node.js + TypeScript (e.g. Express/Fastify) — Recommended. Matches the marketing site's existing TypeScript familiarity (`code-structure.md`'s naming conventions carry forward per `team.md`'s Code Style note), single language across the org, mature ecosystem for REST APIs, first-class SDKs for both Anthropic and OpenAI's chat APIs, and straightforward Secrets Manager/SSM integration on AWS.
- B. Python + FastAPI — Also strong, especially if the itinerary-chat/LLM-orchestration surface grows; async-native, auto-generates OpenAPI docs matching `contract-summary.md`'s existing OpenAPI contracts.
- C. Go — Excellent performance and simplicity, but a heavier lift for the team given zero prior Go exposure anywhere in this codebase.
- X. Other (please specify)

[Answer]: A. Node.js + TypeScript (e.g. Express/Fastify) — Recommended. Matches the marketing site's existing TypeScript familiarity (`code-structure.md`'s naming conventions carry forward per `team.md`'s Code Style note), single language across the org, mature ecosystem for REST APIs, first-class SDKs for both Anthropic and OpenAI's chat APIs, and straightforward Secrets Manager/SSM integration on AWS.

---

## Q2: Primary database?

- A. PostgreSQL — Recommended. The domain model (`entities.md`: 11 related entities — Account, Property, SubscriptionRecord, GuideContent, POI, Event, Stay, ChatSession, LeadSubmission, LocalityEntity) is heavily relational (1:1, 1:N, N:M via `POI.localityIds`); Postgres's JSONB columns comfortably hold `GuideContent.sections` and `LocalityEntity.visualStyling`'s flexible/optional shape without forcing a second store.
- B. MongoDB — Viable for the content-heavy entities (GuideContent, POI) but the relational core (Account/Property/SubscriptionRecord/Stay) would fight a document model.
- C. DynamoDB — Attractive only if AWS serverless is confirmed as the hosting target; `requirements.md` C3 explicitly leaves hosting open, so committing to a DynamoDB access-pattern-first design now would be premature.
- X. Other (please specify)

[Answer]: A. PostgreSQL — Recommended. The domain model (`entities.md`: 11 related entities — Account, Property, SubscriptionRecord, GuideContent, POI, Event, Stay, ChatSession, LeadSubmission, LocalityEntity) is heavily relational (1:1, 1:N, N:M via `POI.localityIds`); Postgres's JSONB columns comfortably hold `GuideContent.sections` and `LocalityEntity.visualStyling`'s flexible/optional shape without forcing a second store.

---

## Q3: Password hashing algorithm (NFR3.6)?

- A. bcrypt — Recommended. Industry-standard, available as a mature, audited library in every mainstream backend language, sufficient work-factor tuning for this scale.
- B. argon2id — Stronger memory-hardness against GPU-based cracking; a reasonable choice if the team wants to start with the more modern default.
- X. Other (please specify)

[Answer]: A. bcrypt — Recommended. Industry-standard, available as a mature, audited library in every mainstream backend language, sufficient work-factor tuning for this scale.

---

## Q4: LLM provider for the itinerary chat (OQ3)?

Affects `performance-requirements.md` (latency budget for chat responses), `security-requirements.md` (third-party data-handling), and `tech-stack-decisions.md` directly.

- A. Anthropic Claude API — Recommended. Strong conversational quality for the itinerary use case; a real vendor decision now unblocks a concrete latency/cost NFR instead of leaving OQ3 open through Construction.
- B. OpenAI API — Comparable alternative; equally viable if there's an existing account/preference.
- C. Defer behind a provider-agnostic interface, pick the concrete vendor at Code Generation — keeps OQ3 open longer but avoids a premature lock-in.
- X. Other (please specify)

[Answer]: C. Defer behind a provider-agnostic interface, pick the concrete vendor at Code Generation — keeps OQ3 open longer but avoids a premature lock-in.

---

## Q5: Availability and performance SLO for this pre-launch phase (NFR1.1, NFR2.1)?

`requirements.md` explicitly defers concrete numbers to this stage, noting the product is pre-launch with low initial traffic.

- A. Conservative pre-launch targets: 99% availability (≈7.3 hours/month downtime budget), API p95 latency < 500ms, itinerary-chat p95 < 3s (LLM round-trip dominates) — Recommended. Matches NFR1.1's "low initial traffic" framing; avoids over-building reliability infrastructure (multi-AZ failover, etc.) before there's real usage to justify it.
- B. Stricter targets now: 99.9% availability, API p95 < 200ms — appropriate only if the team wants to build for scale from day one.
- X. Other (please specify)

[Answer]: A. Conservative pre-launch targets: 99% availability (≈7.3 hours/month downtime budget), API p95 latency < 500ms, itinerary-chat p95 < 3s (LLM round-trip dominates) — Recommended. Matches NFR1.1's "low initial traffic" framing; avoids over-building reliability infrastructure (multi-AZ failover, etc.) before there's real usage to justify it.

---

## Q6: Initial capacity/scale target (OQ5)?

No target currently exists for NFR5's "avoid architectural choices that would require a full rewrite to add a second locality or a modest increase in guests."

- A. Design for ~25-50 localities, a few hundred properties, and low-hundreds of concurrent guest sessions in year one; stateless app tier behind a load balancer so horizontal scale-out needs no rewrite when real usage arrives — Recommended.
- B. I have concrete numbers to give instead
- X. Other (please specify)

[Answer]: A. Design for ~25-50 localities, a few hundred properties, and low-hundreds of concurrent guest sessions in year one; stateless app tier behind a load balancer so horizontal scale-out needs no rewrite when real usage arrives — Recommended.

---

## Q7: Billing provider for subscriptions (OQ1)?

`contract-summary.md`'s subscription endpoints (`POST /subscriptions`, `PATCH /subscriptions`) are already shaped provider-agnostically; this only affects `security-requirements.md`'s compliance-scope framing and `tech-stack-decisions.md`.

- A. Stripe, using its tokenization/Checkout so the backend never touches raw card numbers — Recommended. Keeps PCI-DSS scope minimal (per the compliance guide's "scope reduction" pattern) and integrates cleanly with the placeholder `"standard"` plan tier already assumed at `functional-design` (Q3).
- B. Defer the concrete billing provider past this build — implement the subscription state machine (`active`/`cancelled`) without wiring a real payment processor yet; `startSubscription` would simulate success/failure for now.
- X. Other (please specify)

[Answer]: A. Stripe, using its tokenization/Checkout so the backend never touches raw card numbers — Recommended. Keeps PCI-DSS scope minimal (per the compliance guide's "scope reduction" pattern) and integrates cleanly with the placeholder `"standard"` plan tier already assumed at `functional-design` (Q3).

---

## Q8: Event-source mechanism for local-events monitoring (OQ2)?

Determines `security-requirements.md`'s third-party-integration authentication needs and `observability-requirements.md`'s ingestion-monitoring scope.

- A. Start with a manual/admin-curated feed (ops staff enter events via `admin-api`'s existing event endpoint), defer an automated third-party events API integration until a concrete source is chosen — Recommended. Avoids committing to an unvalidated external API's auth/rate-limit/cost profile before one is picked; `admin-api`'s `POST`-equivalent event path already exists in intent (Contract 1 lists `GET /internal/events`, and `BR6.1`'s dedup-by-`sourceRef` logic works identically whether ingestion is manual or automated).
- B. Commit to a specific third-party events API now (name it in your answer)
- X. Other (please specify)

[Answer]: A. Start with a manual/admin-curated feed (ops staff enter events via `admin-api`'s existing event endpoint), defer an automated third-party events API integration until a concrete source is chosen — Recommended. Avoids committing to an unvalidated external API's auth/rate-limit/cost profile before one is picked; `admin-api`'s `POST`-equivalent event path already exists in intent (Contract 1 lists `GET /internal/events`, and `BR6.1`'s dedup-by-`sourceRef` logic works identically whether ingestion is manual or automated).

---

## Q9: Observability stack?

- A. Structured JSON logging plus a metrics/tracing approach idiomatic to the chosen language runtime (e.g. an OpenTelemetry-compatible SDK), with the concrete hosting/aggregation platform (CloudWatch, Datadog, etc.) deferred to `infrastructure-design` once the hosting target is chosen — Recommended. Pinning a specific SaaS platform before `infrastructure-design` resolves hosting (`requirements.md` C3) risks a mismatch.
- B. Pick a concrete observability platform now (name it in your answer)
- X. Other (please specify)

[Answer]: A. Structured JSON logging plus a metrics/tracing approach idiomatic to the chosen language runtime (e.g. an OpenTelemetry-compatible SDK), with the concrete hosting/aggregation platform (CloudWatch, Datadog, etc.) deferred to `infrastructure-design` once the hosting target is chosen — Recommended. Pinning a specific SaaS platform before `infrastructure-design` resolves hosting (`requirements.md` C3) risks a mismatch.

---

## Consolidated Summary Confirmation

- Backend language/framework, database, password-hashing algorithm, LLM provider, billing provider, and event-source approach are all decided here (Q1-Q4, Q7-Q8) — resolving `requirements.md` C3/C4, NFR3.6, OQ1, OQ2, and OQ3 in one pass.
- Concrete pre-launch availability/performance targets (Q5) and an initial capacity target (Q6) replace NFR1.1/NFR2.1/NFR5's placeholder language with measurable numbers.
- Observability approach (Q9) is set at the idiomatic-tooling level, with the specific hosted platform deferred to `infrastructure-design`.
- `performance-requirements.md`, `security-requirements.md`, `scalability-requirements.md`, `reliability-requirements.md`, `observability-requirements.md`, `tech-stack-decisions.md`, and `traceability.json` will be generated reflecting all of the above, covering `u1-backend-api`'s applicable inception NFRs (NFR1-NFR6).

- Looks correct
- Request changes

[Answer]: Looks correct
