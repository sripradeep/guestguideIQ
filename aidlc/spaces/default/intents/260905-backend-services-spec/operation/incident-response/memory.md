<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
- 2026-09-07T17:55:00Z — interpreted "escalation paths and on-call rotations" as requiring an honest single-responder statement rather than a fabricated multi-person rotation, since the team genuinely has one person.

## Deviations
- 2026-09-07T17:55:00Z — wrote every runbook as a manual, human-executed procedure with no SSM Automation documents, per the human's explicit Q3 choice — a real, deliberate scope reduction from the stage prose's "SSM Automation runbook library" language.

## Tradeoffs
- 2026-09-07T17:55:00Z — recommended lightweight Markdown runbooks over provisioning AWS Incident Manager (Q4), trading formal tooling integration for zero additional cost/setup at a team size where the tooling's value is not yet realized.

## Open questions
- 2026-09-07T17:55:00Z — a real disaster-recovery drill (restoring from an RDS snapshot end-to-end) has never been performed; RTO/RPO targets are design assumptions, not drill-verified numbers.
