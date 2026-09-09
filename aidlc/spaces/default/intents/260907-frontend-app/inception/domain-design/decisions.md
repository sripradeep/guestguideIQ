# Architecture Decision Records — GuestGuideIQ Frontend

Decisions made at Domain Design. Each records the forces that made a decision
necessary, what was chosen, the resulting trade-offs, and the viable options that
were rejected.

Seven of the nine were put to the team as questions; two (ADR-008, ADR-009)
record findings that closed themselves against evidence and are logged so the
open-question list can be corrected rather than carried forward untrue.

---

## ADR-001: Session handling is a separate component from the API client

**Status:** Accepted · **Date:** 2026-09-07

### Context

The team's affirmed Code Style practice says the API-client module owns transport
*and* token handling: "Token handling lives inside that same module: no
component, route guard, or page reads the token store directly; they consume a
resolved session object."

The practice exists for a specific reason, stated in `team.md`: the backend's own
architecture notes name a same-origin reverse proxy as the leading fix for its
Host-header tenancy blocker, and that fix would also flip the frontend's auth
transport from cross-origin bearer tokens to same-origin cookies. If one module
owns transport and token handling, that flip is a change in one module. If
components call the network and read tokens themselves, it is a rewrite.

Two forces pull against the literal wording. First, the refresh logic is
genuinely intricate — concurrent 401s must collapse into a single in-flight
refresh because the backend's refresh-token store is per-process across 2–6
tasks, and a 401 from the refresh call itself must end the session rather than
trigger another refresh, or the client loops. That logic deserves to be testable
without standing up a transport. Second, the two concerns change at different
rates: token lifecycle changes when the auth transport changes; request shaping
changes when endpoints change.

### Decision

`SessionManager` and `ApiClient` are two components. `SessionManager` owns the
token store, the single-flight refresh and the resolved session object.
`ApiClient` owns request construction, transport and response handling, and
depends on `SessionManager` for the current token and the refresh decision.

**This is a knowing refinement of the affirmed practice's wording, not an
oversight.** The rule the practice exists to enforce is preserved exactly: no
component above the boundary reads the token store, every consumer takes a
resolved session object, and both components sit in the same layer at the bottom
of the dependency graph — so an auth-transport flip is still confined to that
layer rather than spreading upward.

### Consequences

**Positive.** The refresh logic is separately testable without a transport. The
two concerns can change independently. The boundary between "what a request is"
and "who is making it" is explicit rather than implicit inside one large module.

**Negative.** A transport flip touches two components instead of one — the
practice's stated benefit is slightly diluted. The design now differs from the
literal wording in `team.md`, which someone reading only that file would not
expect; this ADR is the mitigation, and the practice's wording should be
revisited at the next practices review to say "one layer" rather than "one
module".

**Neutral.** The two components form a deliberate cycle (see ADR-003).

### Alternatives Rejected

**One combined component.** `ApiClient` owns transport, tokens, refresh and the
session object.

- Pros: matches the affirmed practice literally; the simplest dependency graph;
  a transport flip lands in exactly one place.
- Cons: the largest single component in the design, mixing two concerns with
  different change rates; the refresh logic cannot be tested without a transport.
- Rejected by the team at the Domain Design gate (Q1).

---

## ADR-002: The owner's guide and the guest's guide are separate bounded contexts

**Status:** Accepted · **Date:** 2026-09-07

### Context

"The guide" names two different things in this product. The owner edits a
`Guide`: an ordered array of sections, saved by full replace through a `PATCH`.
The guest receives a stay payload containing the property, the locality, rendered
guide content and a set of favourite identifiers it frequently cannot resolve.

The shapes differ, the endpoints differ, and the lifecycles differ — one is
edited repeatedly over months, the other is read once during a stay and never
written. This is the textbook shape of a bounded-context split: the same
real-world concept meaning different things to different actors.

### Decision

`GuideAuthoring` owns `Guide` and `GuideSection`. `GuestGuide` owns `GuestStay`.
No type is shared between them, and neither imports from the other.

### Consequences

**Positive.** Each side evolves with its own endpoint. A change driven by the
owner's `PATCH` shape cannot ripple into the guest's read path, which is the
higher-stakes surface — it is what a stranger sees standing at a front door.
Each is testable against its own fixture without the other's concerns.

**Negative.** A concept the business calls "the guide" appears twice in the
codebase, which reads as duplication to someone who has not internalised the
split. Some rendering logic may end up implemented twice; where that becomes
real, the shared part belongs in `DesignSystem` as a presentational primitive
rather than as a shared domain type.

**Neutral.** The split is what makes the guest surface's identity-first render
ordering expressible without the owner's editing concerns intruding.

### Alternatives Rejected

**One shared Guide model**, with the guest side reading a subset.

- Pros: no duplication; one obvious place for "what a guide is".
- Cons: a lowest-common-denominator type that neither side fits well; a change
  driven by one endpoint ripples into the other; the guest's read model would
  carry editing concepts (draft state, section ordering, publication) that mean
  nothing to a guest.
- Rejected by the team at the Domain Design gate (Q2).

---

## ADR-003: The ApiClient–SessionManager cycle is accepted deliberately

**Status:** Accepted · **Date:** 2026-09-07

### Context

`ApiClient` depends on `SessionManager` for the current token and the refresh
decision. `SessionManager` depends on `ApiClient` to perform the login, refresh,
logout and current-account calls themselves. That is a cycle, and the catalogue's
own well-formedness rules require an acyclic graph unless a cycle is called out
explicitly.

### Decision

Accept the cycle, bounded to these two components, and record it here.

### Consequences

**Positive.** The affirmed rule that exactly one module reaches the network is
preserved — `SessionManager` does not open its own transport. No third component
exists whose only purpose is to make three HTTP calls.

**Negative.** Two components cannot be reasoned about entirely independently, and
a naive implementation could produce a circular import. `functional-design` must
pin the resolution — an injected refresh handler or a callback registered at
composition, rather than a mutual import.

**Neutral.** The cycle does not extend upward. Nothing above these two
participates in it, so the rest of the graph remains acyclic.

### Alternatives Rejected

**A third `AuthTransport` component** making only the auth calls.

- Pros: a strictly acyclic graph.
- Cons: a component with no business logic, no entities and one reason to exist;
  it would either duplicate `ApiClient`'s transport concerns or depend on it,
  reintroducing the cycle one level down.

**`SessionManager` opening its own transport.**

- Pros: no cycle.
- Cons: directly violates the affirmed practice that exactly one module makes
  every backend request. Rejected without further consideration.

---

## ADR-004: The frontend owns a client-held onboarding draft

**Status:** Accepted · **Date:** 2026-09-07

### Context

`stories.md` AC1.5.2 requires that an owner who leaves onboarding partway
through resumes without losing what they typed. The API cannot support this:
`GET /v1/onboarding` returns `{ currentStep, completed }` and nothing else, and
no owner route reads a submitted property name back. The step machine is strictly
forward — `assertStep` rejects any non-current step — so a completed step cannot
be revisited and resubmitted either.

The property name matters disproportionately: it is typed once, it cannot be
edited anywhere in the product afterwards, and it is the guest's trust cue on the
guide screen.

### Decision

`OnboardingFlow` owns a client-side entity, `OnboardingDraft`, holding
unsubmitted field values. Where a draft exists, resume restores it. Where it does
not, the field renders **visibly empty** rather than prefilled.

### Consequences

**Positive.** The acceptance criterion is met for the common case (same browser,
same device) without a backend change. The failure mode is honest: an empty field
is obviously empty.

**Negative.** The frontend now owns state the backend does not know about, which
is a category of bug that is hard to reason about — the draft can disagree with
the server's current step. Resume does not work across devices or after clearing
site data, and the design does not pretend otherwise. Where the draft physically
lives is bounded by OQ3, the same decision that governs tokens.

**Neutral.** A wrong prefill on a permanent, unchangeable property name is worse
than a blank field, which is why the fallback is empty rather than best-effort.
This is a compensating control for an API gap, not a feature; if a
property-name-edit endpoint is ever built, this entity's justification weakens.

### Alternatives Rejected

**No draft at all** — resume at the reported step with empty fields always.

- Pros: no client-owned state; nothing can disagree with the server.
- Cons: fails AC1.5.2 outright for the case it was written for.

**Ask the backend to return submitted values.**

- Pros: removes the compensating control entirely.
- Cons: a further addition to a backend follow-up that has already grown three
  times (see ADR-006); not raised with the team, so not chosen here. Recorded as
  the clean fix if the follow-up is being re-scoped anyway.

---

## ADR-005: The invalid-link screen renders the locality's brand

**Status:** Accepted · **Date:** 2026-09-07

### Context

Carried from the prior intent's design review as finding R-06, accepted as risk
there and routed to this stage as OQ2. When a guest opens a dead stay link, the
**domain resolves** to a real locality — only the specific stay is invalid. That
is materially different from the unmapped-signup case, where nothing resolves and
the page is deliberately unbranded.

### Decision

The guest invalid-link screen renders in the resolved locality's brand.
`GuestGuide` therefore depends on `LocalityBrandResolver` on the error path as
well as the success path.

### Consequences

**Positive.** Consistent with the rule that branding applies wherever a locality
has resolved. A guest who has arrived at a real locality's address sees something
coherent rather than an unstyled page.

**Negative.** The brand module is now on the guest error path, so a failure in
brand resolution can affect the screen whose entire job is to degrade gracefully.
`LocalityBrandResolver`'s no-brand fallback must therefore be genuinely total —
it cannot itself throw.

**Neutral, and important.** This decision **cannot take effect in the first
release**. An invalid stay returns `410` with no payload, so the brand cannot be
learned from the response; it can only be resolved from the domain, which is
exactly what AC4.1.7's "unauthenticated signup host" branch provides and nothing
provides today. Until that lands, the screen renders neutral regardless of this
decision. The decision is recorded now so the component boundary is settled and
`functional-design` is not left guessing.

### Alternatives Rejected

**Neutral**, treating "no valid content to show" uniformly with the unmapped
signup page.

- Pros: simplest; keeps the brand module off the error path entirely; matches
  what happens by default while the brand read does not exist.
- Cons: inconsistent with the branding rule for a domain that genuinely resolved.
- Rejected by the team at the Domain Design gate (Q5).

---

## ADR-006: The backend publishes a machine-readable contract

**Status:** Accepted · **Date:** 2026-09-07

### Context

Recorded as OQ5 at Practices Discovery and routed here. There is **no OpenAPI
document, no JSON Schema export and no generated client** anywhere in the
backend, so the frontend's request and response types are hand-written against
`api-documentation.md`. A mocked-network fixture can drift from the real API with
no test failing anywhere — the fixture and the type agree with each other and
both are wrong.

The team had already chosen a thin live-backend end-to-end suite as a
compensating control. That detects drift only on the paths that suite happens to
exercise, and only when a backend is reachable.

### Decision

Ask the backend to publish a machine-readable contract (OpenAPI or JSON Schema),
and generate the frontend's types from it.

### Consequences

**Positive.** Eliminates the drift class rather than detecting it after the fact.
Every endpoint is covered, not only the ones the end-to-end suite touches. The
generated types become the single source of truth the hand-written boundary
module currently has to be.

**Negative, and material.** This grows the backend follow-up **for the third
time**. `stories.md` AC4.1.10 already asks that each new endpoint's response
shape be *documented* before frontend work begins; this escalates that to a
published, machine-readable artifact. Refined Mockups separately added a
time-zone requirement to `POST /v1/stays`. The follow-up is now substantially
larger than `requirements.md` FR9 scoped it, and `requirements.md` OQ7 already
records that it has no owner and no schedule. **`delivery-planning` must see
this**; it is the largest single risk to the frontend's start date.

Because the two repositories are separate, the contract crosses a repository
boundary — it is a published package or a git dependency, not a shared folder.
That plumbing is itself work.

**Neutral.** The thin live-backend suite remains valuable as an integration check
even once types are generated; generated types prove shape agreement, not
behavioural agreement.

### Alternatives Rejected

**The thin live-backend suite alone.**

- Pros: cheapest; no backend change; already agreed.
- Cons: covers only the paths it exercises; needs a reachable backend to run at
  all; detects drift rather than preventing it.

**Contract tests against recorded real responses**, re-verified on a schedule.

- Pros: no backend change; catches drift on every recorded path.
- Cons: recordings go stale silently between scheduled runs, so the window
  between drift and detection is however long the schedule is.
- Both rejected by the team at the Domain Design gate (Q3).

---

## ADR-007: The coverage floor counts logic components only

**Status:** Accepted · **Date:** 2026-09-07

### Context

The team's affirmed Testing Posture is explicit that the 80% line-coverage floor
"needs a declared `include`/`exclude` set to have teeth, and that declaration is a
required `domain-design` deliverable" — because line coverage overstates rigour
on component and template code, where a single render assertion executes every
line. The backend's own measured split makes the point: 91.15% lines against
76.53% branches on plain service code, and the gap is wider on template code.

The framework is not chosen (OQ4), so the declaration cannot be a file glob yet.
It can be a component-category boundary, which is exactly what this stage's
component catalogue provides.

### Decision

The 80% line-coverage floor applies to **logic components**: `ApiClient`,
`SessionManager`, `ApiErrorCatalog`, `LocalityBrandResolver`, and the view-state
and validation logic inside `OnboardingFlow`, `GuideAuthoring`,
`LocalityCuration`, `SubscriptionManagement`, `GuestLinkManagement`, `GuestGuide`
and `ItineraryChat`.

**Excluded:** `DesignSystem`, presentational components, generated route files,
story files and mock-service definitions.

The floor is enforced in the test runner's own configuration, not only in CI, so
the same gate fires locally and cannot be bypassed by editing a workflow.

### Consequences

**Positive.** The number means something. Excluded code is still exercised — the
scenario tests mount the real component tree and substitute only at the network
boundary — it just does not inflate the metric. This is consistent with the
affirmed rule that a component-level unit test is written only when the component
carries branching logic of its own, rather than by default to hit a number.

**Negative.** The exclusion list is a place to hide. A presentational component
that quietly grows branching logic drifts out of measurement without anyone
noticing; the reviewer at `functional-design` and `build-and-test` should watch
for that. Two categories also means someone has to classify each new component,
and misclassification is silent.

**Neutral.** The concrete globs are deferred until the framework exists. This ADR
fixes the boundary, not its expression.

### Alternatives Rejected

**Everything except generated and scaffolded files.**

- Pros: a higher bar; nothing to classify; no exclusion list to hide in.
- Cons: produces a number that is easy to hit for the wrong reason, which is
  precisely the failure mode the affirmed practice names.

**Two floors** — logic components at 80%, presentational at a separate lower
floor.

- Pros: most precise; nothing falls out of measurement.
- Cons: two numbers to maintain, explain and enforce, for a team that has not yet
  written a single frontend test.
- Both rejected by the team at the Domain Design gate (Q6).

---

## ADR-008: Browser support is confirmed as current evergreen browsers

**Status:** Accepted · **Date:** 2026-09-07

### Context

`requirements.md` NFR9 records current evergreen desktop browsers plus current
mobile Safari and Chrome on Android — but explicitly as **assumption A3, never
confirmed with the team**. It bounds what the framework choice at
`infrastructure-design` may assume, and it matters for the guest surface in
particular: Sam opens the guide on whatever phone they own, often an old one,
frequently on hotel wifi.

### Decision

Confirmed as stated. Current evergreen desktop browsers (Chrome, Edge, Firefox,
Safari) plus current mobile Safari and Chrome on Android. Assumption A3 is now a
decision.

### Consequences

**Positive.** `infrastructure-design` and `functional-design` have a firm floor
rather than an unvalidated assumption. Modern platform features are available
without a compatibility layer.

**Negative.** A guest on an older phone that no longer receives browser updates
may get a degraded or broken experience at the one moment the product cannot
afford friction — standing at a front door with a bag. No unsupported-browser
notice is specified, so the failure would be silent.

**Neutral.** If guest-side breakage shows up in practice, widening the floor is a
build-configuration change rather than an architectural one.

### Alternatives Rejected

**Widen to the last two major versions** of mobile Safari and Chrome.

- Pros: more forgiving for guests who do not update their phones.
- Cons: build configuration cost; rules out newer platform features.

**Narrow to latest-only** with an unsupported-browser notice.

- Pros: cheapest to build and test.
- Cons: turns guests away at exactly the wrong moment.
- Both rejected by the team at the Domain Design gate (Q4).

---

## ADR-009: Pre-check-in access is not an open question

**Status:** Accepted · **Date:** 2026-09-07

### Context

`requirements.md` lists OQ1 — "what does a guest see opening a link before their
stay's check-in date?" — as open and routed to this stage. It was carried forward
from the prior intent's design review.

It is not open. The stay resolver compares `expiresAt` only and **never reads
`checkIn`**, verified against the deployed source during User Stories. A link is
live from the moment it is created until the end of the checkout date.

### Decision

Record OQ1 as **already decided by the backend's behaviour**: a guest opening a
link before check-in sees the guide normally. `GuestGuide` implements no
pre-check-in state, and `requirements.md`'s open-question list should be
corrected rather than carrying an untrue entry forward.

### Consequences

**Positive.** One fewer open question, and no component built for a state that
cannot occur. `GuestGuide`'s invalid-link path stays a single state rather than
splitting into "expired" and "not yet started".

**Negative.** If the team later wants pre-check-in access gated, that is a
backend change belonging in the follow-up, not a frontend one — and the copy must
not reuse the invalid-link message, because for a not-yet-started stay the link
is valid, is not expired, and contacting the host achieves nothing.

**Neutral.** This ADR exists so a reader of `requirements.md` alone is not misled
by a stale entry. It records a finding, not a choice.

### Alternatives Rejected

None. This is a factual correction rather than a decision between options.
Presenting it as a choice would have implied the frontend could decide it, which
it cannot.
