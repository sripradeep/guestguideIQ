<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
- 2026-09-06T06:45:00Z — NFR4 (Data Privacy) and NFR6 (Multi-Tenancy) are both marked N/A for this Unit rather than skipped silently — Admin owns no entities and renders no locality-branded surface, so neither category applies, and the justification is stated explicitly in security-requirements.md.
- 2026-09-06T06:45:00Z — A three-credential-type model emerged from Q2/Q3: customer JWT, ops-staff JWT (`ops` role), and a distinct internal-service JWT for admin-api's own calls into backend-api — genuinely three different credentials, not two, since neither existing token type could double as the machine-to-machine one without weakening the trust-boundary split Units Generation created.

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->
- 2026-09-06T06:45:00Z — Set a looser availability SLO (95%) than u1-backend-api's 99%, deliberately — this is an internal ops tool with no customer-facing dependency on its uptime, so matching the customer-facing SLO would be over-engineering.

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->
- 2026-09-06T06:45:00Z — Chose to reuse u1-backend-api's JWT infrastructure for ops-staff auth (Q2) rather than a separate identity provider — cheaper to build now, at the cost of not having a fully independent identity system; revisit if ops headcount or sensitivity grows.

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
- 2026-09-06T06:45:00Z — MFA for ops-staff auth was explicitly deferred (no story currently requires it) — flagged as a future hardening candidate once ops headcount grows.
