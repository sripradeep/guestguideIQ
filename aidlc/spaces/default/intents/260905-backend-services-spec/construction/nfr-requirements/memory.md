<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->


- 2026-09-06T06:20:00Z — Observability has no dedicated top-level inception NFR, so its detailed requirements (NFR2.6-NFR2.9) were anchored under NFR2 (Availability) rather than left unanchored — observability is the measurement mechanism for the availability SLO, a defensible parent.
<!-- aidlc-wave-memory:u1-backend-api:a0b0635099f4cac955823306a168f405f9a0b2355bdcc1bf5bd82f4ec0aad846 -->

- 2026-09-06T06:20:00Z — `tech-stack-decisions.md` is cross-cutting (language, DB, ORM, adapters) rather than tied to one inception NFR category, so its traceability coverage lives in the `reverse` array rather than forcing it under a single NFR{n}.
<!-- aidlc-wave-memory:u1-backend-api:d7041099d6c3e53d5fef42ee1e1b6a26bb63260303c4dfd6fd8413527c2a082c -->

- 2026-09-06T06:45:00Z — NFR4 (Data Privacy) and NFR6 (Multi-Tenancy) are both marked N/A for this Unit rather than skipped silently — Admin owns no entities and renders no locality-branded surface, so neither category applies, and the justification is stated explicitly in security-requirements.md.
<!-- aidlc-wave-memory:u2-admin-api:e79672c5a4f73ab1b804424cdb2a66d8a54dd122351bb53f9307802990080db6 -->

- 2026-09-06T06:45:00Z — A three-credential-type model emerged from Q2/Q3: customer JWT, ops-staff JWT (`ops` role), and a distinct internal-service JWT for admin-api's own calls into backend-api — genuinely three different credentials, not two, since neither existing token type could double as the machine-to-machine one without weakening the trust-boundary split Units Generation created.
<!-- aidlc-wave-memory:u2-admin-api:14fa46999edb77b4ccab934ea7633b922b98c9bd5e250dca81362b3f4ac9b902 -->
## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->


- 2026-09-06T06:20:00Z — Derived NFR sub-IDs continue past inception's own already-used sub-numbers per category (e.g. NFR3.7 onward, since inception's requirements.md already used NFR3.1-NFR3.6) rather than restarting at .1, to avoid ID collision with the inception-level placeholders.
<!-- aidlc-wave-memory:u1-backend-api:bfa1d18969f35a7b62e42503ddf26d430b23abd0c6e0413a0121659ef44c1b3a -->

- 2026-09-06T06:45:00Z — Set a looser availability SLO (95%) than u1-backend-api's 99%, deliberately — this is an internal ops tool with no customer-facing dependency on its uptime, so matching the customer-facing SLO would be over-engineering.
<!-- aidlc-wave-memory:u2-admin-api:db4ac2b99a7528d016d9add092bd281cebed94cc682cb93944b0b01db16e93fd -->
## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->


- 2026-09-06T06:20:00Z — Chose JWT auth (stateless) over server-side sessions specifically to keep the app tier stateless, directly enabling the horizontal-scaling approach confirmed at Q6 — a security-layer decision made to serve a scalability requirement, recorded in both `security-requirements.md` and `scalability-requirements.md` to keep the cross-reference visible.
<!-- aidlc-wave-memory:u1-backend-api:73141440189aafc8dc5bb1b625b3256e56ea8262802035cbb62b9669b32813c8 -->

- 2026-09-06T06:20:00Z — The itinerary chat's LLM provider was deliberately left behind a provider-agnostic interface (Q4) rather than picked concretely — this keeps `performance-requirements.md`'s chat latency budget looser (p95 < 3s vs. the general 500ms API budget) since the real number depends on a vendor not yet chosen.
<!-- aidlc-wave-memory:u1-backend-api:3889335d10dcaf3277ccfe1182c42a010e41a7f0acf33dc6842c4d8e45ba30f2 -->

- 2026-09-06T06:45:00Z — Chose to reuse u1-backend-api's JWT infrastructure for ops-staff auth (Q2) rather than a separate identity provider — cheaper to build now, at the cost of not having a fully independent identity system; revisit if ops headcount or sensitivity grows.
<!-- aidlc-wave-memory:u2-admin-api:0dcfd829377b31fb37f1995d435e1f526fb036b0ff68e1822bbfc7fc4e96353d -->
## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->

- 2026-09-06T06:20:00Z — Concrete rate-limiting numbers (requests/window) for the abuse-surface endpoints identified in `security-requirements.md` NFR3.10 are deferred to `infrastructure-design`, once the rate-limiting mechanism (gateway vs. app-level) is chosen — flagged so it isn't silently dropped.
<!-- aidlc-wave-memory:u1-backend-api:0cddfe03303a4a514d9b776953a693c172e1830b3548ef1d4adfad083b29855d -->

- 2026-09-06T06:20:00Z — The `admin-api`/`backend-api` network isolation mechanism (NFR3.11) remains an explicit open item carried from `contract-summary.md`, now doubly dependent on `infrastructure-design`'s hosting choice.
<!-- aidlc-wave-memory:u1-backend-api:7febfe0843e55245e9de8e9cf91c85dfec279162aabf5eebe3cbd3751611a1e1 -->

- 2026-09-06T06:45:00Z — MFA for ops-staff auth was explicitly deferred (no story currently requires it) — flagged as a future hardening candidate once ops headcount grows.
<!-- aidlc-wave-memory:u2-admin-api:0cf60a88c0892bbf9688810412757baece5af84bd5465f8a5ad0e1403bb806bd -->
