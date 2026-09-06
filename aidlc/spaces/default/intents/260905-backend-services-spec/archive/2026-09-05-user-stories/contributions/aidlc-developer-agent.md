**Collaborator:** aidlc-developer-agent

## Contribution

Reviewed `personas.md` and `stories.md` for implementability and sizing. Overall the epic-level granularity called for by Q6 is mostly well-judged — stories map cleanly to separately-deliverable capabilities. Three stories hide meaningfully more implementation complexity than their single-paragraph shape suggests, and I found two dependency gaps and one priority/dependency inversion that Delivery Planning and domain-design should see now rather than discover mid-Bolt.

### 1. Complexity hidden inside named stories

**US1.4 — Import Existing Guide from PDF (Should Have)**
The two ACs cover "valid PDF in / seeded guide out" and "bad file → manual-entry fallback," but nothing addresses the step in between: turning unstructured PDF text into the guide's structured schema (sections, house rules, local tips, wifi info, etc.) is not a deterministic parse — it is realistically an LLM-assisted or heuristic extraction step, and extraction from a scanned/image-based PDF needs OCR, which is a materially different capability than text-layer parsing and isn't mentioned. Critically, there is no acceptance criterion for the owner **reviewing/editing the extracted content before it goes live** — given that PDF extraction is inherently lossy, publishing straight from import without a review step is a real product risk, not just an implementation detail. Recommend domain-design split this into at least: (a) PDF ingestion + text/OCR extraction, (b) content-to-schema mapping, (c) owner review/confirm-before-publish step. As written, "Should Have" sizing understates the effort; this is closer to two or three units of work than one.

**US2.3 — Get a Customized Itinerary via Chat (Should Have)**
This bundles several distinct technical concerns into one story: multi-turn session/conversation state (the guest is unauthenticated — how is a session scoped and for how long?), RAG-style grounding of the LLM against the property's POIs/events, the sparse-content fallback behavior (AC2.3.2), and — not covered by any AC — moderation/guardrails for LLM output shown to a guest with zero account friction (already flagged as an unresolved Minor finding R-05 in `requirements.md`, and it is still absent here). NFR7.3 in requirements defers provider/cost/latency to later stages, which is fine, but the *chat session lifecycle and moderation boundary* are functional-story-level concerns, not NFR-level ones, and belong in this story's scope or a sibling story now so they aren't silently dropped between stages. Recommend flagging moderation/guardrails and session-state handling explicitly as sub-scope of US2.3 (or a companion story) at domain-design/units-generation.

**US4.2 — Manage the Local Events Lifecycle (Should Have)**
This story fuses two operationally different concerns: (1) event **ingestion** (a scheduled/background monitoring module reaching an as-yet-undecided external source per OQ2 — third-party API, scraping, or manual feed each imply very different implementations, retry/rate-limit handling, and deduplication logic to avoid re-ingesting the same event), and (2) event **lifecycle/expiry** (a straightforward internal state-transition/cron concern with none of ingestion's external-integration risk). These have different risk profiles and different owners at implementation time — ingestion is blocked on OQ2 being resolved, expiry is not. Recommend splitting at domain-design into an "Event Ingestion" unit and an "Event Lifecycle/Expiry" unit so the lifecycle half isn't held hostage to the still-open sourcing decision. Also note: locality association (AC4.2.1) implies some form of geocoding/address-matching for ingested events, which isn't mentioned in scope.

### 2. Dependency gaps

- **US1.6** ("Curate Favorite Locality Content") lists only `US1.5` as a dependency, but its own AC1.6.1 ("given my locality has curated POIs/events, when I browse them...") requires that content to already exist. That content is produced by the Admin/Ops stories **US4.1** (POI curation) and **US4.2** (event ingestion) — neither is listed as a dependency of US1.6. Recommend adding `US4.1, US4.2` to US1.6's Dependencies so Delivery Planning sequences them correctly (an owner cannot favorite what Ops hasn't curated/ingested yet).
- **US2.2** ("View Property Guide Content") lists only `US2.1` as a dependency, but AC2.2.1 requires "current (non-expired) local events" to be visible, which depends on **US4.2**'s lifecycle/expiry logic actually running (otherwise "non-expired" has no enforcement mechanism behind it). Recommend adding `US4.2` (and, transitively via US1.6, `US4.1`) to US2.2's Dependencies.

### 3. Priority/dependency inversion (implementability blocker, not just a nit)

US2.2 is **Must Have**, but its own acceptance criteria are unsatisfiable without US1.6, US4.1, and US4.2 — all three **Should Have**. As sequenced today, a team could complete every Must Have story and still be unable to demonstrate AC2.2.1 (featured POIs/events showing in the guide) because the content pipeline that feeds it is lower priority and may not exist yet. Two ways to resolve, either is workable, but it needs an explicit call at Delivery Planning:
- (a) promote US1.6 + US4.1 to Must Have (US4.2 could stay Should Have if AC2.2.1's event-visibility clause is softened to "if any non-expired events exist"), or
- (b) explicitly soften AC2.2.1 to tolerate an empty-favorites/empty-events state as the Must Have bar, and treat "guide actually shows curated content" as the Should Have layer on top.

### 4. Sizing observations (epic-level granularity check)

- No story is too granular to justify a separate epic; even the smallest (**US4.3**, Could Have, "review a Property Owner account") is self-aware about being a thin supporting story and doesn't need merging.
- **US1.7/US1.8** (start vs. manage-existing subscription) are reasonably split — they mirror the FR2.2 scope-boundary concern the product-lead review raised (R-04) and have distinct flows (billing-provider checkout vs. plan-change/cancel logic); no change needed.
- The three stories flagged in §1 (US1.4, US2.3, US4.2) are correctly scoped as single **user-facing** epics — the risk is not that they're miscategorized as one story, but that their epic-level AC count (2 ACs each) undersells the number of implementation units domain-design/units-generation will need to carve out of them. Flagging so the decomposition stage budgets accordingly rather than being surprised mid-Bolt.
- **US3.1/US3.2** (lead-form capture) are, by a wide margin, the lowest-complexity/lowest-risk stories in the set — no auth, no external integrations beyond a data store, straightforward validation. Worth noting for delivery-planning sequencing even though the walking-skeleton slice (Q1/Q7) is correctly anchored on the Property Owner/Guest path instead.

## Positions

- OBJECT: US1.6's declared dependency (`US1.5` only) omits `US4.1`/`US4.2`, which its own acceptance criteria require content from — should be added before this artifact is finalized.
- OBJECT: US2.2's declared dependency (`US2.1` only) omits `US4.2` (event expiry enforcement), which AC2.2.1 relies on.
- OBJECT: US2.2 is Must Have while the stories that populate its acceptance criteria (US1.6, US4.1, US4.2) are all Should Have — this priority/dependency inversion should be resolved explicitly (see §3) rather than carried silently into Delivery Planning.
- OBJECT: US1.4 has no acceptance criterion for owner review/edit of extracted PDF content before publish — given PDF-to-structured-content extraction is inherently lossy, this is a functional gap, not just an implementation nuance.
- AGREE: Epic-level granularity (Q6) is well-applied elsewhere — no story needs merging or splitting purely for size (US1.7/US1.8, US4.3 sizing is appropriate as-is).
- AGREE: Persona-first breakdown and Property-Owner-first ordering (Q4/Q7) read correctly against the dependency graph once §2's gaps are patched.
