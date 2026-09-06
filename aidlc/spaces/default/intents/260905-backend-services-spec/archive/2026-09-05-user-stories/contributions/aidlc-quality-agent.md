**Collaborator:** aidlc-quality-agent

## Contribution

Reviewed `personas.md` and `stories.md` for testability of acceptance criteria: genuine pass/fail checks, missing error/edge-case ACs, and Given/When/Then correctness/consistency. Overall the draft is solid — every story has at least two GWT-formatted ACs, IDs are stable and traceable to FRs, and the epic-level granularity (Q6) is appropriately matched by epic-level (not implementation-level) test criteria. The findings below are gaps and refinements, organized by story, that the lead can fold directly into `stories.md`.

### 1. Traceability gap: US2.1 does not fully cover FR8.5

`requirements.md` FR8.5 requires a clear "no longer valid" message for a link that is **"expired or invalid."** `stories.md` AC2.1.2 only tests the **expired** case (checkout date passed). No AC exists for a link that is **invalid** — malformed, mistyped, or never issued in the first place (a distinct failure mode: "this token doesn't resolve to any stay" vs. "this token resolved but its window closed"). Recommend adding:

- **AC2.1.3**: Given a link token that does not correspond to any existing stay, when I try to open it, then I see the same (or an equivalent) "this link is no longer valid" message rather than an error page or a 404/stack trace.

This closes the traceability sensor gap and gives QA two independently testable negative paths instead of one.

### 2. Missing error/edge-case ACs by story

- **US1.1 Create Account**: No AC covers rejecting malformed/invalid signup input (bad email format, empty fields) as distinct from the duplicate-username case in AC1.1.2. Add **AC1.1.3**: Given invalid input (e.g., malformed email or a password failing the not-yet-defined complexity rule), when I submit the signup form, then I see a clear validation error and no account is created. (The specific validation rule is rightly deferred to domain-design; the *existence* of an input-validation pass/fail boundary is not, and should be testable now.)
- **US1.3 Onboarding Wizard**: No AC covers repeat login after onboarding is already complete. Add **AC1.3.3**: Given an account that has already completed onboarding, when I log in again, then I am taken to my normal guide editor rather than back into the wizard.
- **US1.6 Curate Favorites**: Only "mark as favorite" is covered; there is no AC for removing a favorite. Add **AC1.6.3**: Given a POI/event I previously favorited, when I unmark it, then it no longer appears in my guide's featured content.
- **US1.7 Start a Subscription**: No failure-path AC exists for a subscription-start attempt that fails (e.g., payment declined — mechanism is OQ1/deferred, but the failure *behavior* should still have a placeholder). Add **AC1.7.2**: Given a subscription-start attempt fails, when the failure occurs, then I see a clear error and my account is left with no active subscription (no partial/inconsistent state).
- **US1.8 Manage Subscription**: No AC covers attempting upgrade/downgrade/cancel with no active subscription to act on. Add **AC1.8.3**: Given no active subscription, when I attempt to upgrade, downgrade, or cancel, then I see a clear error indicating there is nothing to modify.
- **US2.3 Itinerary Chat**: AC2.3.2 covers sparse *content*, but no AC covers the chat *service* failing (LLM provider timeout/outage) — a different, backend-reliability failure mode. Add **AC2.3.3**: Given the itinerary chat backend is unavailable or errors, when a Guest sends a message, then they see a clear error/fallback message rather than a silent hang or unhandled failure. (Flag for confirmation at `nfr-requirements` alongside OQ3, but recommend keeping a placeholder AC now so the case isn't lost before that stage.)
- **US4.1 Curate Initial POI Dataset**: AC4.1.1 verifies only the downstream effect (Property Owners can browse/favorite) and never directly verifies the admin's own action succeeded, nor what happens on bad input. Add **AC4.1.2**: Given I submit invalid or duplicate POI data, when I try to save it, then I see a clear validation error and the entry is not persisted. Consider also rephrasing AC4.1.1's "Then" to assert the POI is stored/visible in the admin's own view of that locality, with the Property-Owner-visibility effect kept as a secondary consequence or cross-reference to US1.6 rather than the sole assertion.
- **US4.2 Manage the Local Events Lifecycle**: No AC covers duplicate discovery of the same event (idempotent ingestion). Add **AC4.2.3**: Given the same event is discovered more than once by the monitoring module, when it runs, then no duplicate event record is created.
- **US4.3 Review a Property Owner Account**: No AC covers looking up an account identifier that does not exist — a one-line, easy-to-add negative path for a story that is otherwise entirely happy-path. Add **AC4.3.2**: Given an account identifier that does not match any existing account, when I look it up, then I see a clear "not found" result rather than an error or a blank/broken page.

### 3. Given/When/Then format notes

- **AC3.2.1** bundles two distinct preconditions ("a validation error **or** backend outage") into a single Given with one shared Then. The asserted outcome text is identical for both, so this isn't wrong, but it does mean one AC is standing in for two structurally different test setups (simulating a 4xx validation response vs. simulating a 5xx/network outage). Recommend splitting into **AC3.2.1** (validation error) and **AC3.2.2** (backend outage) so each becomes an independently runnable test case with its own precondition, and renumbering the current AC3.2.1 accordingly. Not blocking, but it will read cleaner when these become concrete test cases at `domain-design`.
- All other ACs reviewed use Given/When/Then consistently and correctly (single precondition, single trigger, single verifiable outcome) — no other structural issues found.

### 4. Non-measurable language flagged (Inception guardrail: avoid ambiguous terms unless paired with a measurable threshold)

- **AC1.5.2**: "the guide shows a **reasonable** 'not yet ready' state" — "reasonable" is not independently verifiable. Recommend concrete wording, e.g.: "the guide shows a specific placeholder page/message indicating the guide is not yet published" (the exact copy/UI can stay open, but the *existence of one deterministic placeholder state* should be the pass/fail criterion, not "reasonable").
- **AC2.3.1**: "then the chat returns a **relevant, personalized** itinerary" — for an AI/LLM-backed feature, "relevant" can't be asserted as a simple pass/fail without an evaluation method. This is inherent to the feature, not a drafting error, but it should be flagged now so `nfr-requirements`/`domain-design` defines how this gets tested (e.g., a structural check — itinerary only references POIs/events belonging to the requested locality — plus a golden-set or rubric-based evaluation for the qualitative "relevant" claim, rather than leaving "relevant" as the literal, unverifiable test assertion).

### 5. Minor observation (not a required change)

- **US3.1 AC3.1.1**: no AC addresses a duplicate submission (e.g., the same email submitting the waitlist form twice) — unclear if that's accept-silently, dedupe, or reject. Low priority given the story's Must-Have/simple scope, but worth a one-line open question if not already intentionally out of scope.

## Positions

- OBJECT: US2.1's ACs only test the "expired" half of FR8.5's "expired or invalid" requirement; AC2.1.3 (invalid/nonexistent link) should be added to close the traceability gap — see §1.
- OBJECT: Several stories are missing a natural negative-path or reverse-operation AC that would be low-cost to add now (US1.1 invalid input, US1.6 unfavorite, US1.7 payment failure, US1.8 no-active-subscription, US2.3 chat-service failure, US4.1 invalid POI data, US4.2 duplicate ingestion, US4.3 not-found) — see §2 for proposed AC text for each.
- OBJECT: AC1.5.2 and AC2.3.1 use non-measurable language ("reasonable", "relevant, personalized") that the Inception phase guardrail on ambiguous language flags — see §4 for suggested concrete rewording/evaluation approach.
- AGREE (minor, non-blocking): AC3.2.1 bundles two distinct failure preconditions under one Given/Then; recommend splitting into two ACs for cleaner independent test-case derivation — see §3.
- AGREE: Given/When/Then format is otherwise used correctly and consistently across all 20 stories reviewed; epic-level granularity (Q6) is appropriately matched by epic-level test criteria, with detailed validation rules correctly deferred to domain-design rather than invented here.
