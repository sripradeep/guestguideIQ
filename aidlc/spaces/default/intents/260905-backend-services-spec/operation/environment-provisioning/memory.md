<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
- 2026-09-07T16:45:00Z — treated this stage as formalizing/documenting an already-completed ad-hoc production deployment rather than driving a fresh provisioning process from scratch; the real AWS work (VPC/RDS/ECS/ALB/ACM/DNS, plus 5 genuine bug fixes) happened via direct execution earlier in the session, before this stage's formal ritual was resumed.

## Deviations
- 2026-09-07T16:45:00Z — the deployed production stack diverges from `infrastructure-specification.md` in four places (no WAF, no ECS auto-scaling, DNS via an external provider not Route 53, ACM cert requested manually not programmatically). All four were surfaced as explicit questions (Q2, Q3, Q4, Q5) and confirmed by the user as accepted deviations/deferrals, not silently absorbed.

## Tradeoffs
- 2026-09-07T16:45:00Z — for RDS deletion protection (Q7), chose to make the actual code fix + open a PR immediately rather than just recording "re-enable later" as a follow-up, since the user's answer was an explicit "yes, now" and the fix is a one-line, low-risk change with an existing PR workflow already established this session.

## Open questions
- 2026-09-07T16:45:00Z — WAF and ECS auto-scaling are both deferred pending real traffic; revisit before onboarding any real paying customers, not on a fixed calendar date.
