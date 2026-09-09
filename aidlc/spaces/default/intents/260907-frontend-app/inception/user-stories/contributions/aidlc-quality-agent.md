**Collaborator:** aidlc-quality-agent

## Contribution

### The standard I applied

An acceptance criterion is testable when three things hold: the **Given** is
reachable by test setup at the affirmed substitution boundary (the network); the
**Then** names an observable a test can query and that differs between pass and
fail; and the criterion has a **fail** condition, not just a pass one. Under the
affirmed posture the scenario is written first, so an AC that cannot be turned
into a scenario before implementation exists is not a specification — it is a
note. I read every AC against that, plus `api-documentation.md` for whether the
observable exists in the contract at all.

Headline: the set is better than most. The three explicitly caveated criteria
are **not** the weakest ones. Five others are worse, and four of those fail for
the same reason — the thing the criterion asserts has no source in the API.

---

### 1. Criteria that cannot be tested because the observable does not exist

These are not design gaps or sequencing risks. A developer writing the scenario
first would stop on each of them.

**AC2.1.1 — there is no property photo anywhere in the API.**
`GET /v1/stays/:token` returns `property: { id: string; name: string }`. No
photo, no image, no URL, in that payload or any other; `photo`/`image` do not
appear in `api-documentation.md`. FR7.2 carries the same defect upstream. The
second half fails too: the property name, the guide, the locality and the
branding all arrive in **one** response, so there is no partial ordering for
"before any other content loads" to assert against. Both halves of the trust cue
are currently unbuildable.

> **AC2.1.1** (proposed): Given the stay request is in flight, when the page
> renders, then a skeleton is shown with no error state and no generic product
> branding. Given the `200` arrives, when the view renders, then the property
> name is present in that first paint, above the guide content.
>
> **AC2.1.1b** (proposed, gated): Given the follow-up adds a property image field
> to `GET /v1/stays/:token`, when the response arrives, then the image renders
> above the guide content with the property name as its accessible name; and
> given the field is absent or null, then the name-only cue of AC2.1.1 renders
> with no broken-image placeholder.

If the photo cue matters — the story and `personas.md` both lean on it — it is a
new item for US4.1, not a frontend story. Please decide which, because right now
US2.1 promises something the system cannot supply.

**AC2.3.2 — "my host's favourited places appear" is unsatisfiable, and the
story's own note says so.**
The guest payload carries `favoritedPOIIds` / `favoritedEventIds` — ids only —
and `GET /v1/pois` / `GET /v1/events` both require an owner JWT. FR7.6 and the
story's own footnote state this; AC2.3.2 asserts the opposite. That is the
inception guardrail's "never carry forward unresolved contradictions" inside a
single story.

> **AC2.3.2** (proposed): Given the stay payload contains favourited ids that no
> guest-readable endpoint can resolve, when the POIs and Events tabs render, then
> no favourites list and no detail affordance is offered for them, and the tab
> shows the FR7.4 empty-state copy — never an id, a placeholder card, or a dead
> link.

The alternative is a guest-readable POI/event lookup in the follow-up, which is
an added AC4.1.x, not a frontend criterion.

**AC1.5.2 — "with my prior entries intact" has no server-side source.**
`GET /v1/onboarding` returns `{ currentStep, completed }` and nothing else. No
owner-side endpoint returns the property name or any other entered value
(`OwnerGuideView` carries `propertyId`, `publishStatus`, `sections`, favourite
ids — no property name). Across a logout/login boundary the only thing restorable
is the step. A test asserting "prior entries intact" therefore has no expected
value and no mechanism.

> **AC1.5.2** (proposed): Given I leave partway through and log back in, when the
> wizard loads, then it resumes at the `currentStep` returned by
> `GET /v1/onboarding`, and steps already completed on the server are not
> re-presented as incomplete.
>
> **AC1.5.2b** (proposed, needs a decision): Given values I typed but had not yet
> submitted, when I return in a new session, then [they are restored from
> client-side draft storage | I am told they were not saved and asked to
> re-enter]. *Pick one — the criterion is untestable while both are open, and the
> choice interacts with OQ3's token-storage decision.*

AC1.5.3 (backward navigation, same session) is unaffected and fully testable.

**AC1.6.1 — "enter guide sections manually and continue" names no request.**
`POST /v1/onboarding/content-source/scratch` takes **no body**. Whatever the
owner types has to reach the server through `PATCH /v1/guides/:propertyId`, which
is a different requirement (FR3.2), full-replace, and reached through the
side-effecting GET of FR3.1. As written the AC has no assertable mechanism and no
ordering.

> **AC1.6.1** (proposed): Given I choose to start from scratch, when I enter
> sections and continue, then `POST /v1/onboarding/content-source/scratch` is
> called with no body, the entered sections are sent as the complete `sections`
> array on `PATCH /v1/guides/:propertyId`, and the wizard advances to
> `content_review` only after both succeed.

**AC1.15.1 — "I see my account identity" has no assertable value.**
`GET /v1/accounts/me` does not exist yet and AC4.1.4 does not name its fields
("returns the current account"). There is nothing for a test to expect. See §7 —
this is the same defect as the rest of US4.1, and it is the reason AC1.15.1 reads
as untestable rather than merely undesigned.

---

### 2. Verdict on the three named caveats

**AC2.4.x (null chat provider) — the caveat is sufficient, but the note is
backwards.** Every chat criterion is testable *now* at the network boundary:
`200` with `messages`, `504 CHAT_PROVIDER_TIMEOUT`, `400` on an empty message,
`410 LINK_INVALID`, `429`. Naming the caveat is enough. But the note says chat is
"not demonstrable end-to-end", and that is not quite right: the deployed backend
**does** return `200` with a canned reply and `sparse: true` when the locality
has fewer than three combined POIs + active events. That is a deterministic,
seedable live path today — and it is exactly AC2.4.4. So AC2.4.4 is the one chat
criterion the thin live suite *can* cover, and the note currently implies the
opposite. Worth correcting, because it is free coverage on the drift detector.

AC2.4.4 still needs rewording: it asserts what the assistant *says*, which the
frontend does not author.

> **AC2.4.4** (proposed): Given a `200` reply with `sparse: true`, when it
> renders, then the server's `reply` string renders verbatim as an ordinary
> assistant message, with no distinct badge, banner, or empty state (FR8.5).

Two more chat criteria need work:

> **AC2.4.2** (proposed rewrite): Given I send a message, when 300ms have elapsed
> with no reply, then a typing indicator is shown and announced once via
> `aria-live="polite"`; when 5s have elapsed, then it is replaced by an explicit
> "still working" note; and at 4.9s that note is not present. *(Tested on a
> controlled clock — "roughly five seconds" is not a pass/fail threshold, and the
> inception guardrail forbids the unpaired adjective.)*
>
> **AC2.4.5a** (proposed split): Given I collapse and reopen the widget without
> reloading, when it reopens, then the full transcript is present in order.
> **AC2.4.5b**: Given I reload the page, when the widget reopens, then the
> transcript is restored via the follow-up's chat-history read (AC4.1.6).
> *(Blocked: no history endpoint exists and `messages` is only a `POST` side
> effect. If a client-side cache is the interim answer, that is a different
> criterion and must be written as one — as written, "close and reopen" does not
> tell a tester which of the two to build.)*
>
> **AC2.4.6** (proposed rewrite): Given a stubbed reply whose text contains
> `<img src=x onerror=...>` and `<script>` markup, when it renders, then the
> markup appears as literal visible text, no new `img`, `script`, `iframe` or
> event-handler attribute appears in the document, and no raw-HTML sink is used.
> *(Enforced twice: this scenario assertion plus the blocking lint rule banning
> raw-HTML injection APIs affirmed in `team-practices.md` § Code Style. "Treated
> as untrusted" is a statement about implementation; the payload assertion is the
> testable form.)*

**AC1.9.x (no design) — the missing design is not what blocks these.** Layout
cannot be tested, but the behaviour can, with one exception: **AC1.9.3 has no
computable expected value.** AC4.1.1 says `POST /v1/stays` returns "the stay
token *or* full link". If it returns only a token, the frontend must build the
URL from a locality domain that no endpoint exposes (C9: no `GET /v1/localities`,
create-only). Deriving it from the app's own origin is defensible — tenancy
resolves from `Host` — but that is an unstated assumption, not a criterion.

> **AC1.9.3** (proposed, gated on AC4.1.1 naming the shape): Given
> `POST /v1/stays` returns `{ token, url }`, when the link is displayed, then the
> displayed string equals `url` verbatim. *If the follow-up returns a token only,
> replace with: the app composes the link from its own origin and the token, and
> the composed origin equals the origin the Owner app is served from — and record
> that as an assumption, since no endpoint returns a locality's domains.*
>
> **AC1.9.4** (proposed rewrite): Given `POST /v1/stays` fails, when the failure
> renders, then an error state is shown, **no link string is present anywhere in
> the rendered output**, and the copy control is absent.
>
> **AC1.9.5** (proposed, new): Given the clipboard write is unavailable or
> rejected — non-secure context, denied permission, unsupported browser — when I
> use the copy control, then the full link stays visible and selectable as text
> and I am told to copy it manually; never a silent no-op and never a success
> confirmation.

AC1.9.5 is not hypothetical: clipboard writes require a secure context and are
restricted outside a user gesture on some mobile browsers, and AC1.9.2's
confirmation is exactly the kind of thing implemented unconditionally.

**AC1.15.x — naming the caveat is not enough.** AC1.15.2 (logout reachable in the
Account section) is testable today and should stay. AC1.15.1 is not (§1). Either
gate it on AC4.1.4 naming the response fields, or reduce it to the one claim that
survives: the signed-in username is displayed.

---

### 3. The four negative criteria — how each is actually verified

Ranked by how well they survive contact with a test.

**AC1.7.3 (other sections must not disappear) — testable, and the single most
valuable criterion in the document. But it will be a fake test unless the AC says
how.** With a canned `GET` fixture the reload assertion passes whether or not the
PATCH dropped sections — the fixture returns three sections because it was
written to. The test only bites if the double *implements* full-replace.

> **AC1.7.3** (proposed rewrite): Given a guide with three sections and an edit to
> the second, when I save, then the intercepted `PATCH /v1/guides/:propertyId`
> body contains all three sections with the edit applied; and given the network
> double stores that body and serves it from the subsequent `GET`, when I reload
> the editor, then all three are present. *(A replay fixture would let this pass
> with the defect present — the double must replace, not replay.)*

Worth adding to the same story as a named, unmitigated consequence rather than a
criterion: two tabs editing concurrently is silent last-write-wins under
full-replace. I am not asking for an AC; I am asking that it not be discovered as
a defect.

**AC1.7.5 (must not request the guide speculatively) — testable by counting
requests, but only if the AC enumerates the triggers.** "No prefetch, no
retry-on-focus" is not a test; a request count over named events is. The default
settings of common data libraries (refetch on window focus) and routers (link
prefetch on hover) are precisely what would violate this, so the triggers must be
exercised explicitly.

> **AC1.7.5** (proposed rewrite): Given the editor mounts once, when I blur and
> refocus the window, when the tab is hidden and re-shown (`visibilitychange`),
> when the browser fires `online` after a disconnect, and when I hover a
> navigation control linking to the editor, then the total number of
> `GET /v1/guides/:propertyId` requests issued remains exactly **one**. *(That GET
> creates an empty draft as a side effect.)*

**AC1.14.5 (must not auto-retry an ambiguous change) — testable, same technique,
same gap.** Assert the count, and exercise the events that would silently break
it.

> **AC1.14.5** (proposed rewrite): Given a `PATCH /v1/subscriptions` that never
> resolves or fails at the network layer, when the request is abandoned and I
> subsequently refocus the window and the browser fires `online`, then exactly
> **one** `PATCH /v1/subscriptions` has been issued in total, a
> `GET /v1/subscriptions` re-read is issued, and I am shown the re-read state
> with an explicit prompt to choose what to do next.

AC1.14.6 pairs with it and is testable as written (assert the outgoing `action`
against the typed union). Given the endpoint cancels on anything unrecognised, I
would add the inverse: an attempt to send an unknown action must fail to issue a
request at all, rather than issuing one and relying on the server.

**AC1.10.3 (must not leave the user believing edits were saved) — not testable as
written.** "Not left believing" is a mental state. There is no query for it. This
is the one criterion in the set I would call unassertable, and it is the one the
story itself calls "the part with real user consequence".

> **AC1.10.3a** (proposed): Given I have unsaved guide edits, when the
> session-expiry state is surfaced, then the editor's unsaved-changes indicator is
> still present and **no "Saved" indication is rendered at any point** in the
> expiry flow.
>
> **AC1.10.3b** (proposed): Given the expiry state is shown, when I dismiss or
> acknowledge it, then there is no path back to a view presenting my edits as
> persisted — the only continuations are re-login or an explicit "discard and log
> in again".
>
> **AC1.10.3c** (proposed, needs a decision): Given I re-authenticate after an
> expiry with unsaved edits, when the editor reloads, then [my unsaved sections
> are restored | an explicit message states they were not saved]. *Pick one; a
> silent reload of the last server state fails either way, and the criterion
> cannot be tested while both are open.*

AC1.10.4 (single in-flight refresh) is well-formed and testable by request count
against N parallel `401`s — the strongest criterion in that story.

---

### 4. Accessibility: an advisory scanner means the scenarios are the gate

NFR2 makes the automated check advisory, so nothing about WCAG 2.1 AA blocks a
merge except the test suite, which does block. Two consequences worth writing
into this document rather than rediscovering at `functional-design`:

**(a) A cross-cutting baseline that points at `interaction-spec.md` is not a
pass/fail criterion.** No test fails for violating a cross-reference. The
behaviours in that spec are specific and testable, and the stories that own them
should carry them as ACs:

> **AC1.5.8** — Given a step transition, when the new step renders, then focus
> moves to its first field and the step indicator carries `aria-current="step"`.
> **AC1.12.7** — Given I toggle a favourite, when it settles, then "Added to
> favorites" / "Removed from favorites" is announced via `aria-live="polite"`.
> **AC2.4.8** — Given the chat widget is open, when I press Escape, then it closes
> and focus returns to the bubble trigger; while open, focus is trapped inside it
> and the container carries `role="dialog"` with an accessible name.
> **AC2.3.6** — Given the guide tabs, when rendered, then they expose
> `role="tablist"` / `role="tab"` / `role="tabpanel"` and are operable by arrow
> keys.
> **AC1.1.6** — Given a field-level error, when it renders, then the input
> references the error text via `aria-describedby`, and the error is conveyed by
> icon and text, never colour alone (FR11.5).

**(b) Make the scenario suite carry accessibility for free.** Query elements by
accessible role and name, never by test id or CSS selector. That single
convention turns every scenario into a partial AA assertion — a control with no
accessible name becomes unfindable, so the test fails — and it is the mechanism
that keeps accessibility enforced while the scanner is advisory. It also happens
to be the convention that survives the affirmed "substitute at the network, never
mock a child component" rule. Worth stating as a testing note here, since
`domain-design` will pick tooling from it.

Caveat I would put in writing: automated rule engines cover only the subset of AA
criteria that are machine-decidable. Focus-order sensibleness, alt-text
meaningfulness, and whether an `aria-live` announcement is the *right* one are
not among them. "WCAG 2.1 AA on every surface" is therefore a design commitment
verified by review, not a criterion any suite can prove — and with NFR2 advisory,
the review is the only thing standing behind it.

**NFR3 (per-locality contrast) has no acceptance criterion anywhere, and it is
the one accessibility requirement that genuinely cannot be checked at build
time** — brands are configured after deploy. The only testable form is a pure
function:

> **AC1.1.7** (proposed, or on whichever story owns theming): Given a resolved
> locality accent, when the brand-token module builds the theme, then it computes
> contrast against the base tokens and, where the accent falls below 4.5:1 for
> text or 3:1 for UI components, substitutes the default accent and records the
> substitution. *(Unit-tested table-driven over passing and failing accents — a
> logic unit under the affirmed ordering.)*

---

### 5. AC2.5.3 and rate limiting: deterministic in one suite, impossible in the other

Three separate findings.

**It is trivially deterministic at the network boundary and impossible against
the live backend.** The bucket is in-memory *per process* and production runs 2–6
tasks behind a load balancer, so effective capacity is 20×N with no control over
which task serves a request. "Send 21 requests, expect a 429" is flaky by
construction. AC2.5.3 must be scoped to the mocked-network suite and explicitly
excluded from the thin live suite, or it will be the first test the team learns
to ignore.

**The `Retry-After` header is unreadable cross-origin.** The backend sets no
`exposedHeaders`, so no non-simple response header is readable from a browser.
Any "try again in N seconds" countdown is unbuildable unless the same-origin
proxy of C3 is adopted. The AC's duration-free copy is correct — I want that made
explicit so it is not later "improved" into a countdown against a header that
reads as `null`.

> **AC2.5.3** (proposed rewrite): Given the intercepted network returns `429` with
> the `RATE_LIMITED` envelope, when it renders, then a specific "too many
> requests, try again shortly" state is shown, distinct from the generic error
> state, with **no countdown and no duration**. *(`Retry-After` is unreadable
> cross-origin — no `exposedHeaders` — and the in-memory-per-process bucket across
> 2–6 tasks makes this non-deterministic against a live backend, so this criterion
> belongs to the mocked-network suite only.)*

**Two rate-limit paths have no criterion at all.**

> **AC2.4.7** (proposed, new): Given `POST /v1/stays/:token/chat` returns `429`,
> when it does, then the FR11.4 state renders inside the widget, my transcript is
> preserved, and Retry does not fire again automatically. *(That bucket is 10/min
> keyed on the **stay token**, not the IP — a repeated Retry, or two guests
> sharing one link, exhaust the same bucket. AC2.4.3's retry affordance is the
> most likely thing to trip it.)*
>
> **AC1.1.8** (proposed, new): Given `POST /v1/accounts` returns `429`, when it
> does, then the FR11.4 state renders on the signup form and my entered values are
> preserved. *(5/min per client IP — a co-working space or a hotel NAT trips this
> for an Owner, not only a Guest.)*

---

### 6. Under-specified observables (testable in principle, vacuous in practice)

Each of these produces a test that passes against almost any implementation.
Every "Then" should name either exact copy (or a copy key) or a named state from
`interaction-spec.md`, plus the role/name a scenario queries by.

| AC | Problem | Minimum fix |
|---|---|---|
| AC1.1.4 | "a specific inline error naming what is wrong" — "specific" is not assertable | assert the message contains the offending field's name and differs between two distinct violations |
| AC1.2.2 | "no theme applied, not even the default accent" | assert the resolved token set equals the neutral set; do not assert computed colours (brittle) |
| AC1.5.4 | "a saved indication is shown" | name the component/state and its accessible text |
| AC1.7.4 | "I see an error, my edits remain" | assert the edited text is still in the field **and** the retry affordance is present |
| AC1.9.1 | "shown the full link" | define "full": scheme + host + path + token, as one selectable string |
| AC1.13.1 | "my account shows it as active" | name the observable — the status text on PO-4 after the re-read |
| AC1.14.2 | "my plan reflects the change" | assert the re-read `GET /v1/subscriptions` value renders, not local optimistic state |
| AC2.3.4 | "the rest of it still renders correctly" | name what must be present: Overview content and the POIs tab, with the Events tab showing the FR7.4 copy |
| AC2.5.1 / AC2.5.2 | "loading state" / "an error with a retry" | assert against a *pending* stub, not an instantly-resolving one; assert retry issues exactly one new request |
| AC1.12.2 | optimistic toggle | must use a deferred stub: with an instant resolve the test cannot distinguish optimistic from pessimistic, so the criterion silently passes for the wrong implementation |

Three criteria are exemplary and I would leave them exactly as they are:
**AC1.4.1** and **AC1.3.2** (non-disclosure, verified by asserting the rendered
output is identical across the exists / does-not-exist runs — a real comparison
test, not a copy check) and **AC1.8.3 / AC1.8.4** (assert the two surfaces render
the *same* string, in one test, from one constant).

**AC1.11.1** needs splitting, because half of it is unobservable at the mocked
boundary and is the best available use of the thin live suite:

> **AC1.11.1a**: mocked — the revocation request is issued carrying the refresh
> token, and local session state is cleared regardless of its outcome.
> **AC1.11.1b**: live — after logout, `POST /v1/auth/refresh` with the old refresh
> token returns `401`. *(The only way "revoked server-side" is observable, and a
> genuine drift detector.)*

**AC1.11.2** should name the back-forward-cache case (`pageshow` with
`persisted: true` can restore an authenticated page from memory without a
re-render), or the route-guard test passes while the browser still shows the old
screen.

**AC1.3.3** (session restored on reload) is testable only once OQ3 is decided —
and it quietly constrains that decision: in-memory-only token storage with no
same-origin proxy cannot satisfy it. That is fine if intended; it should be
stated, since OQ3 is open and C3 is the reason.

**AC1.14.3** is testable (assert the dialog copy) but the copy asserts **A4**,
which `requirements.md` records as unconfirmed against backend behaviour. A green
test would prove we display the sentence, not that it is true. If A4 is wrong we
have a tested lie in a cancellation dialog. Please add a verification task
against the backend before this ships.

**Missing edge path — onboarding step conflict.** `409 CONFLICT` naming the
actual current step is a documented, reachable state (second tab, back button,
stale local state) with no criterion:

> **AC1.5.7** (proposed, new): Given my local step state is stale, when I submit a
> step the server considers out of order, then the app reads the `409`'s current
> step, re-syncs from `GET /v1/onboarding`, and shows me where I actually am —
> never a generic error and never a silent no-op.

**Missing edge path — favourite with no body.** FR4.3 exists precisely because
that handler returns `500`, not `400`, on a missing body, and no AC covers it:

> **AC1.12.6** (proposed, new): Given any favourite request, when it is sent, then
> it carries a JSON body with `itemType` and `itemId`.

**Missing boundary — `visualStyling` (FR10.5), an untrusted-input parser with no
criterion.** A logic unit, and the cheapest thing in the document to test
properly:

> **AC2.1.5** (proposed, new): Given `locality.visualStyling` is `null`, `{}`, or
> carries unexpected keys and non-string values, when the guide renders, then the
> default token set is used, the page renders fully, and no value from the blob
> reaches a style attribute or property without passing the parser.

---

### 7. US4.1 is the highest-value place to add precision, and it is currently the least testable story

Every AC4.1.x names an endpoint and no response shape: "returns the stay token
**or** full link", "returns plan and status", "returns the current account",
"chat history is readable". Three consequences, all of them ours:

1. **AC1.9.3, AC1.14.1, AC1.15.1 and AC2.4.5 inherit the ambiguity** and cannot
   have expected values (§1, §2).
2. **C6 says the frontend's types are hand-written and there is no OpenAPI
   document.** An unspecified response shape means those types are a guess and
   the mocked fixtures encode that guess — precisely the drift risk
   `team-practices.md` names as unaddressed and OQ5 leaves open.
3. The follow-up team can ship something satisfying every AC4.1.x as written and
   still break every frontend fixture.

> **AC4.1.1** (proposed rewrite): `POST /v1/stays` exists, is owner-authenticated,
> and returns `201 { token: string, url: string }` — both, so the client neither
> composes the URL from an origin it cannot verify nor discards the token.
> **AC4.1.3 / AC4.1.4 / AC4.1.6** (proposed): each names its exact response fields
> and its error codes.
> **AC4.1.7** (proposed, new): the follow-up ships an example request and response
> payload for every endpoint it adds (or an OpenAPI fragment), and the frontend's
> mocked-network fixtures are validated against them in CI.
> **AC4.1.2** (proposed addendum): verified by a preflight assertion — an
> `OPTIONS` with each frontend `Origin` returns that origin in
> `Access-Control-Allow-Origin` — run in CI, not asserted by reading config. *(The
> backend has three CORS tests, all against `GET /health`, and no preflight test
> at all.)*

AC4.1.7 is the single change in this document that most reduces downstream test
risk, because it converts the team's top named risk (fixture drift) from "we hope
the live suite catches it" into a check.

---

### 8. Requirement coverage the test suite will not reach

`traceability.json` is promised in the plan but is not in the stage directory. I
flag it because coverage is what I would check it for: on my read, these have no
acceptance criterion in any story — **FR4.3** (§6), **FR10.5** (§6), **FR11.6**
(correlation id in the body, not a header — arguably no AC needed, but it should
be marked deferred rather than absent), **NFR3** (§4), **NFR4** (only AC2.3.5
touches it, and "mobile widths" is not a threshold — the 768px and 1024px SideNav
transitions have no criterion), **NFR5** (the ~300ms interactive-feedback figure
appears in no AC), **NFR7** (no component reads the token store — lint-enforceable,
name it as such), **NFR8** (coverage floor and include/exclude — `domain-design`),
and **NFR9** (browser matrix — with no criterion, the live suite's browser set is
an arbitrary choice made under time pressure at `ci-pipeline`).

Each should get either a criterion or an explicit `Deferred → <stage>` row. An
NFR with neither is one nobody will test.

---

### 9. Two notes on the INVEST section

**"Testable — every acceptance criterion is written to a pass/fail condition"** is
not accurate as it stands, and it is the claim a reviewer will lean on. On my
count: five criteria have no observable in the contract (§1), one asserts a mental
state (AC1.10.3), one has no computable expected value (AC1.9.3), and ten are
under-specified enough to pass vacuously (§6). I would rewrite that paragraph to
name the real state, in the same honest register the rest of the document uses.

**"Independent … each is separately testable against a seeded precursor state"** —
worth naming what seeding costs here. The chain from signup to guest link has no
API shortcut: no fixture endpoint, no test-data reset, no way to create an Owner
other than `POST /v1/accounts` (rate-limited at 5/min per client IP, which a CI
runner shares across a whole suite), and no way to create a locality-brand at all
without ops (A1). For the thin live suite that means seeded state is created once
and reused, not per test, and the 5/min signup bucket is a real CI constraint.
That belongs in `domain-design`'s test-data strategy, but the dependency graph is
where it becomes visible, so a line here would help.

---

### 10. Suite allocation, for the record

Under the affirmed posture, my recommended split — useful to `domain-design`, and
it changes nothing about the criteria themselves:

- **Mocked network (blocking, primary)**: everything in §1–§6 except where noted.
  All error-envelope states, all `429` states, all negative and request-count
  criteria, all optimistic-update and revert paths, all accessibility behaviours.
- **Thin live suite (blocking, narrow)**: AC1.11.1b (revocation actually revokes),
  AC2.4.4 (the sparse `200` path, seeded with fewer than three curated items), the
  walking-skeleton happy path end to end, and AC4.1.2's preflight check. These are
  the four places a fixture cannot lie for us.
- **Never in the live suite**: AC2.5.3 and every rate-limit criterion
  (non-deterministic across 2–6 in-memory buckets).
- **Unit (logic units, after implementation per the affirmed ordering)**: the
  brand-token parser (AC1.1.7), the `visualStyling` parser (AC2.1.5), the
  error-envelope discriminated union and its non-envelope fallback (FR11.2 — no
  criterion currently exercises the `502`/`504`-with-no-body case, which is worth
  one), and the subscription `action` union (AC1.14.6).

## Positions

- AGREE: The mixed granularity (Q2/C) is right for testability specifically — the
  skeleton ACs are the ones that must be scenario-writable before Bolt 1, and the
  rest would be guesses before the stack is chosen.
- AGREE: Writing AC1.7.3, AC1.7.5, AC1.14.5 and AC1.10.4 as explicit negative and
  request-count criteria at all — these four cover the API's genuinely dangerous
  behaviours (full replace, side-effecting GET, cancel-on-anything, per-process
  refresh store), and no prior story covered them.
- AGREE: AC1.4.1, AC1.3.2, AC1.8.3 and AC1.8.4 as written — non-disclosure and
  message-identity expressed as comparison assertions is the correct form and
  needs no change.
- AGREE: US4.1 as one coarse, schedulable story rather than six rows — the fix it
  needs is response-shape precision, not fragmentation.
- OBJECT: AC2.1.1 asserts a property photo that exists nowhere in the API
  (`property` is `{ id, name }`) and a load ordering a single response cannot
  produce — neither implementable nor testable as written.
- OBJECT: AC2.3.2 ("those appear") contradicts FR7.6 and its own story note — the
  guest receives unresolvable ids only, so the criterion cannot pass without a new
  guest-readable endpoint.
- OBJECT: AC1.5.2's "with my prior entries intact" has no server-side source —
  `GET /v1/onboarding` returns `{ currentStep, completed }` and nothing else — so
  the criterion has no expected value across a session boundary.
- OBJECT: AC1.10.3 asserts a mental state ("not left believing") and cannot be
  queried; it needs the three observable criteria proposed in §3, one of which
  requires a decision that is currently open.
- OBJECT: AC1.9.3 has no computable expected value while AC4.1.1 says "token **or**
  full link" — no endpoint exposes a locality's domains (C9), so the expected link
  cannot be derived.
- OBJECT: AC1.6.1 names no request — `POST /v1/onboarding/content-source/scratch`
  accepts no body, so where the entered sections go is unstated and untestable.
- OBJECT: AC2.5.3 is not scoped to the mocked-network suite; the
  in-memory-per-process bucket across 2–6 tasks makes it non-deterministic live,
  and `Retry-After` is unreadable cross-origin (no `exposedHeaders`), which
  constrains the copy permanently and should be recorded in the criterion.
- OBJECT: US4.1's acceptance criteria name no response shapes, which propagates
  ambiguity into AC1.9.3, AC1.14.1, AC1.15.1 and AC2.4.5 and leaves the
  hand-written fixtures (C6) encoding a guess — the fixture-drift risk the team
  named as unaddressed. AC4.1.7 (§7) is the fix.
- OBJECT: Missing criteria for reachable, documented states — chat `429` (bucket
  keyed on the stay token, tripped by AC2.4.3's own Retry), signup `429`,
  onboarding `409` out-of-order, the clipboard-unavailable fallback, the
  favourite-without-body `500` (FR4.3), and the `visualStyling` parser (FR10.5).
- OBJECT: The INVEST section's "every acceptance criterion is written to a
  pass/fail condition" overstates the position and should be restated honestly;
  the independence claim should note that seeded live state has no API shortcut
  and shares a 5/min signup bucket in CI.
- OBJECT: NFR3 (per-locality contrast) has no criterion despite being the one
  accessibility requirement that provably cannot be checked at build time, and
  NFR4's 768/1024 breakpoints, NFR5's ~300ms figure, NFR7, NFR8 and NFR9 have
  neither a criterion nor a `Deferred → <stage>` marker. `traceability.json` is
  promised in the plan but absent from the stage directory.
