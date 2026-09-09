<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
- 2026-09-08T05:00:00Z — designed this spec unit security as a five-step pipeline and stated plainly that only the last step (human review of the diff) catches a compromise: pin and checksum prove provenance, never correctness, so a compromised-but-pinned source reproduces faithfully. Arranged the design so that step is unavoidable rather than diligent.
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->

## Deviations
- 2026-09-08T05:10:00Z — third review in a row found the same class of defect from me: a traceability row claiming OK coverage that the design document does not actually contain. Here NFR7.3 (record which revision of api-documentation.md the types were transcribed from) was marked covered by D1, but D1 only describes the future fetch-and-checksum flow and never mentions transcription at all. Root cause is writing traceability from intent rather than from the finished document. From u2 onward: before claiming an OK target, grep the design document for the thing being claimed.
- 2026-09-08T05:10:00Z — writing a produces artifact with a Bash heredoc does not fire the artifact hook, so the reviewer tool refuses with was-not-saved-after-confirmation even though the file changed on disk. Produces artifacts must be written with the Write or Edit tools.
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
- 2026-09-08T05:00:00Z — carried the corrected U1-SEC-n identifiers in this stage design document with the frozen NFR7.x labels noted alongside, since the requirements file could not be relabelled. The traceability enumerates the frozen IDs because that is what is actually on disk upstream; the design prose uses both so a reader is not misled about lineage.
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
