<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
- 2026-09-06T06:20:00Z — Observability has no dedicated top-level inception NFR, so its detailed requirements (NFR2.6-NFR2.9) were anchored under NFR2 (Availability) rather than left unanchored — observability is the measurement mechanism for the availability SLO, a defensible parent.
- 2026-09-06T06:20:00Z — `tech-stack-decisions.md` is cross-cutting (language, DB, ORM, adapters) rather than tied to one inception NFR category, so its traceability coverage lives in the `reverse` array rather than forcing it under a single NFR{n}.

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->
- 2026-09-06T06:20:00Z — Derived NFR sub-IDs continue past inception's own already-used sub-numbers per category (e.g. NFR3.7 onward, since inception's requirements.md already used NFR3.1-NFR3.6) rather than restarting at .1, to avoid ID collision with the inception-level placeholders.

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->
- 2026-09-06T06:20:00Z — Chose JWT auth (stateless) over server-side sessions specifically to keep the app tier stateless, directly enabling the horizontal-scaling approach confirmed at Q6 — a security-layer decision made to serve a scalability requirement, recorded in both `security-requirements.md` and `scalability-requirements.md` to keep the cross-reference visible.
- 2026-09-06T06:20:00Z — The itinerary chat's LLM provider was deliberately left behind a provider-agnostic interface (Q4) rather than picked concretely — this keeps `performance-requirements.md`'s chat latency budget looser (p95 < 3s vs. the general 500ms API budget) since the real number depends on a vendor not yet chosen.

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
- 2026-09-06T06:20:00Z — Concrete rate-limiting numbers (requests/window) for the abuse-surface endpoints identified in `security-requirements.md` NFR3.10 are deferred to `infrastructure-design`, once the rate-limiting mechanism (gateway vs. app-level) is chosen — flagged so it isn't silently dropped.
- 2026-09-06T06:20:00Z — The `admin-api`/`backend-api` network isolation mechanism (NFR3.11) remains an explicit open item carried from `contract-summary.md`, now doubly dependent on `infrastructure-design`'s hosting choice.
