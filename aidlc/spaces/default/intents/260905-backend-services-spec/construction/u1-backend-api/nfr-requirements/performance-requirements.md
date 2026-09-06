# Performance Requirements — u1-backend-api

Concretizes `requirements.md` NFR1 ("low initial traffic volumes... to be set concretely once real usage data exists") now that this stage exists. Targets are deliberately conservative (Q5), matching the product's pre-launch phase, and sized against the capacity target in `scalability-requirements.md` (Q6: ~25-50 localities, low-hundreds of concurrent guest sessions).

## Requirements

| ID | Requirement | Target | Percentile | Load Condition | Measurement Method |
|---|---|---|---|---|---|
| NFR1.2 | Synchronous REST API response time (all `backend-api` public endpoints in `contract-summary.md` Contract 2, excluding chat) | < 500ms | p95 | Under the year-one capacity target (low-hundreds concurrent guest sessions, few-hundred properties) | Server-side request-duration metric, excluding network transit, tagged by route |
| NFR1.3 | Itinerary chat response time (W9, US2.3) | < 3s end-to-end | p95 | Single concurrent chat message per session; LLM round-trip dominates this budget | Server-side metric spanning request receipt to assistant-reply write, including the (as-yet-undetermined, Q4) LLM provider call |
| NFR1.4 | Guest-facing guide read (W8, US2.2) | < 300ms | p95 | Same load condition as NFR1.2 | Server-side metric; this path has no LLM dependency and should sit well inside the general API budget |
| NFR1.5 | Lead-form submission (W10, Contract 3 — waitlist/partner/investor) | < 300ms | p95 | Public, unauthenticated, low-complexity validate-and-insert path | Server-side metric |
| NFR1.6 | Sustained throughput | ≥ 50 requests/second across all public endpoints combined | Average | Steady-state, year-one capacity target | Load test against a staging environment mirroring production sizing (`nfr-validation-methods.md` steady-state pattern) |
| NFR1.7 | Application-tier resource footprint | A single small compute instance (or equivalent container sizing) comfortably serves the year-one load with headroom for the stateless horizontal-scaling approach in `scalability-requirements.md` (NFR5.3) to absorb any spike without a redesign | — | Year-one capacity target | CPU/memory utilization monitored per `observability-requirements.md` |

## Anti-Requirements (Explicitly Excluded)

Per the security/NFR guide's anti-requirements pattern, the following are explicitly NOT targets at this phase:
- "The system should be fast" — replaced by the concrete, percentile-qualified targets above.
- Sub-100ms API latency — inappropriate over-engineering for a pre-launch product per NFR1.1's own framing.
- A committed throughput ceiling beyond NFR1.6 — real usage data will refine this at the next NFR revision once the product has launched.

## Rationale

Q5's conservative pre-launch stance (99% availability, API p95 < 500ms) directly answers NFR1.1/NFR2.1's deferred targets. The itinerary chat's separate, looser budget (NFR1.3) reflects that its latency is dominated by an external LLM call whose concrete provider is deliberately deferred (Q4) — pinning a tight number now would be speculative. All targets are revisitable once real production traffic exists; this is a starting baseline, not a permanent ceiling.

## Traceability

See `traceability.json`. Upstream: `NFR1` (Performance).
