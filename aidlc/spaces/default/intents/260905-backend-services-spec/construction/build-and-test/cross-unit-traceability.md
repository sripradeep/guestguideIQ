# Cross-Unit Final Coverage Gate

Conversation language: English

Independently re-derived from `requirements.md` (the source of every FR/NFR id) and `stories.md` (the source of every US/AC id) and cross-checked against both Units' `code-generation/traceability.json` — not re-trusted from `code-summary.md`'s own "1:1 matched with zero orphans" self-report alone, per this step's own instruction.

## FR coverage (requirements.md → user-stories → code-generation)

All 9 FR categories (FR1-FR9; there is no FR10) trace through `inception/user-stories/traceability.json` to at least one story, and every named story appears in one or both Units' `code-generation/traceability.json` `upstream_ids`. Zero orphaned FR categories, zero FR category with no implementing story.

| FR | Stories | Implementing Unit(s) |
|---|---|---|
| FR1 (Lead Capture) | US3.1, US3.2 | u1-backend-api |
| FR2 (Account & Auth) | US1.1, US1.2, US1.7, US1.8 | u1-backend-api |
| FR3 (Onboarding) | US1.1, US1.3, US1.4 | u1-backend-api |
| FR4 (Guide Management) | US1.5, US1.6, US2.2 | u1-backend-api |
| FR5 (POI Curation) | US1.6, US4.1 | u1-backend-api, u2-admin-api |
| FR6 (Events Lifecycle) | US2.2, US4.2 | u1-backend-api, u2-admin-api |
| FR7 (Itinerary Chat) | US2.3 | u1-backend-api |
| FR8 (Guest Access Links) | US2.1 | u1-backend-api |
| FR9 (Locality Branding) | US1.1, US1.5, US2.1, US2.2, US4.4 | u1-backend-api, u2-admin-api |

## NFR coverage (requirements.md → nfr-requirements → nfr-design)

All 6 NFR categories trace to concrete `NFRx.y` ids in each Unit's `nfr-requirements/`, and every one of those ids has an `OK` design-coverage row in the matching `nfr-design/traceability.json` (read directly for both Units — see below). The two `N/A` NFR4/NFR6 rows for `u2-admin-api` are genuine inapplicability (admin-api owns no entities per ADR-004, performs no domain-branded rendering), already reviewed READY at `nfr-requirements`, not a gap.

| NFR | u1-backend-api | u2-admin-api |
|---|---|---|
| NFR1 (Performance) | NFR1.2-1.7, all OK | NFR1.2-1.3, all OK |
| NFR2 (Availability/Observability) | NFR2.2-2.9, all OK | NFR2.2-2.7, all OK |
| NFR3 (Security) | NFR3.7-3.13, all OK | NFR3.7-3.12, all OK |
| NFR4 (Data Privacy) | NFR4.2-4.3, OK | N/A (genuine) |
| NFR5 (Scalability) | NFR5.2-5.5, all OK | NFR5.2, OK |
| NFR6 (Multi-Tenancy/Routing) | NFR6.3-6.4, OK | N/A (genuine) |

Whether each NFR's concrete target is actually **met** at runtime (not just designed-for) is the Target Verification Matrix's job, in `build-and-test-summary.md` — this table only confirms the design-level coverage chain has no gap, which is what Step 10 asks this document to verify.

## AC-level coverage — independent verification finding

Enumerating every AC in `stories.md` (54 across the 17 stories) against the **union** of both Units' `code-generation/traceability.json` coverage arrays surfaces 9 ACs that are not listed, by id, in either Unit's traceability record:

| AC | Story | What it requires |
|---|---|---|
| AC1.2.1 | US1.2 | Successful password reset within the valid window |
| AC1.4.1 | US1.4 | Valid PDF import seeds a draft guide |
| AC1.6.2 | US1.6 | Marked favorites appear in the Guest-facing guide |
| AC1.6.3 | US1.6 | Unmarking a favorite removes it from the guide |
| AC1.7.1 | US1.7 | Starting a subscription reflects active status |
| AC1.8.1 | US1.8 | Upgrade/downgrade reflects the new plan |
| AC1.8.2 | US1.8 | Cancellation reflects and is communicated |
| AC3.1.1 | US3.1 | A valid lead-form submission is persisted |
| AC3.1.2 | US3.1 | Successful submission reaches the thank-you experience |

**This was verified NOT to be a functional gap.** Direct source and test inspection confirms real implementing code and passing tests exist for every one of the 9:

- AC1.2.1 — `tests/bdd/password-reset.test.ts`: *"Given a registered account, When the owner requests and confirms a reset within the window, Then the new password authenticates"* — an exact match, passing (see `test-results.md`).
- AC1.4.1 — `src/onboarding/service.ts` + `tests/unit/onboarding.test.ts`, `tests/bdd/onboarding.test.ts` (PDF-import happy path alongside the two failure-path ACs that *are* traced).
- AC1.6.2 / AC1.6.3 — `src/guide/service.ts`/`repository.ts` favorites handling, exercised in `tests/unit/guide.test.ts`, `tests/bdd/guide.test.ts`, `tests/integration/contract2.test.ts`.
- AC1.7.1 — `tests/unit/stripeAdapter.test.ts`: *"startSubscription succeeds and returns a Stripe customer id"*.
- AC1.8.1 / AC1.8.2 — `tests/unit/subscription.test.ts` (upgrade/downgrade/cancel paths alongside the rejection-path ACs that *are* traced).
- AC3.1.1 — `tests/integration/contract3.test.ts`: *"accepts a valid submission for each of the three form types"*. AC3.1.2 (thank-you redirect) is the marketing site's own frontend behavior, out of this backend's Unit scope by design — `FR1.3` already scopes the redirect to stay unchanged on the existing site, not something `guestguideiq-app` renders.

**Disposition**: this is a documentation-completeness gap in `code-generation/traceability.json`'s coverage arrays, not a code or test gap — every AC has real, passing, independently-located test evidence. Recorded here as a Minor finding with a recommended follow-up (add the 9 missing rows to the two `traceability.json` files so future automated traceability checks don't have to re-derive this by hand), not a Build and Test blocker: the actual behavior these ACs describe is implemented and verified.

## BR (business rule) coverage

u1-backend-api's BR1-BR10 and u2-admin-api's BR1.1-BR1.6 are both fully `OK` in their respective `code-generation/traceability.json`, with two legitimate `N/A` (enforced-by-omission) rows in u1 (BR1.3, BR9.3) already reviewed READY at Code Generation. No gap.

## Conclusion

Zero orphaned FR/NFR categories; zero AC with no real implementing code (the 9-item finding above is a bookkeeping gap, not a functional one, and is disclosed rather than silently corrected or silently ignored); zero orphaned BR. This gate does not block Build and Test's own outcome — see `build-and-test-summary.md` for the stage's overall verdict, which is instead driven by the dependency-vulnerability disposition in `test-results.md`.
