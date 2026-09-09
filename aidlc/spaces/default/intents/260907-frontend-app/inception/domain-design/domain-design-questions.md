# Domain Design — Questions

Six decisions about the frontend's internal building blocks.

**What this stage does and doesn't decide.** It identifies the logical
components — the code you write, with their own behaviour, entities and
lifecycle. It does **not** pick the framework, the language or the hosting
target (OQ4 — those belong to `infrastructure-design`), and it does not decide
deployment topology (that is `units-generation`). Everything below is designed to
survive whichever framework is chosen.

**What is already fixed.** The affirmed practices settle several boundaries
before this stage starts, and these are not re-opened here:

- Exactly one module makes every backend request; nothing above it calls the
  network directly, and imports flow downward only.
- Exactly one module parses the `{ code, message, details? }` error envelope into
  a union keyed on `error.code`; nothing above it reads a raw HTTP status.
- `visualStyling` is parsed into typed tokens by one module before any component
  reads it; no component touches the raw blob.
- No component reads the token store directly; they consume a resolved session
  object.

**The backend constraints this design has to absorb**, recorded in the code
knowledge base and verified against source:

- Tenancy resolves from the request `Host` header, so a cross-origin frontend
  cannot resolve its tenant at all today (AC4.1.8).
- CORS `credentials` is off and cannot be enabled cross-origin as configured, so
  **bearer tokens in the `Authorization` header are the only viable scheme**
  unless a same-origin proxy is introduced. That pushes a 15-minute access token
  and a 7-day rotating refresh token onto the frontend.
- No `GET /v1/subscriptions`, no current-user endpoint, no logout, no chat
  history, and no endpoint that creates a stay.

---

## Q1 — Is session handling its own component, or part of the API client?

The affirmed practice says token handling "lives inside that same module" as the
API client. That is one reading of the boundary. The other is that session
handling is a distinct concern — token lifecycle, single-flight refresh, the
resolved session object — that the API client *depends on* rather than contains.

Both satisfy the rule that no component above the boundary reads the token store.
The reason the practice exists is reversibility: if the transport later flips
from cross-origin bearer tokens to same-origin cookies behind a proxy (which the
backend's own architecture notes name as the leading fix for its tenancy
blocker), the change should land in one place rather than spread.

- **A. One component.** `ApiClient` owns transport, tokens, refresh and the
  session object. Matches the affirmed practice literally. Simplest dependency
  graph; the largest single component in the design.
- **B. Two components.** `SessionManager` owns tokens, single-flight refresh and
  the resolved session; `ApiClient` owns request/response and depends on it.
  Clearer boundaries and separately testable refresh logic; a transport flip
  touches two components instead of one, though both are inside the same layer.
- **X. Other (please specify)**

[Answer]: B

---

## Q2 — Do the Owner's guide and the Guest's guide share one model?

The same word means two different things here. The Owner edits a `Guide` — an
array of sections, saved by full replace. The Guest receives a stay payload with
the property, the locality, the rendered guide content and unresolvable
favourite ids. The shapes are genuinely different, the lifecycles are different
(one is edited, one is read once), and the endpoints are different.

- **A. Two separate contexts.** `GuideAuthoring` owns the Owner's `Guide` and
  `GuideSection`; `GuestGuide` owns the Guest's `GuestStay` read model. No shared
  type between them. Each evolves with its own endpoint; the cost is that a
  concept the business calls "the guide" appears twice in the code.
- **B. One shared Guide model** that both sides use, with the Guest side reading
  a subset. Less duplication and one obvious place for "what a guide is"; the
  risk is a lowest-common-denominator type that neither side fits, and a change
  driven by one endpoint rippling into the other.
- **X. Other (please specify)**

[Answer]: A

---

## Q3 — How do we stop mocked fixtures drifting from the real API? (OQ5)

This was left open at Practices Discovery and routed here. The problem is
concrete: there is **no OpenAPI document, no schema export and no generated
client** anywhere in the backend, so frontend types are hand-written against
`api-documentation.md`. A mocked-network fixture can drift from the real API with
no test failing anywhere.

The team already chose a thin live-backend end-to-end suite as a compensating
control. The question is whether anything else is needed.

- **A. The thin live-backend suite alone.** Accept it as the only drift detector.
  Cheapest; its coverage is exactly as good as the paths that suite happens to
  exercise, and it needs a reachable backend to run at all.
- **B. Ask the backend to publish a machine-readable contract** (OpenAPI or JSON
  Schema) and generate the frontend's types from it. Eliminates the drift class
  entirely rather than detecting it. Adds scope to the backend and creates a
  cross-repo publishing dependency — the two repositories are separate, so this
  is a published package or a git dependency, not a shared folder.
- **C. Contract tests against recorded real responses**, re-verified on a
  schedule against the live backend. No backend change needed and it catches
  drift on every recorded path, but recordings go stale silently between runs.
- **X. Other (please specify)**

[Answer]: B

---

## Q4 — What browsers must this support? (NFR9)

`requirements.md` records current evergreen desktop browsers plus current mobile
Safari and Chrome on Android — explicitly as **assumption A3, never confirmed
with you**. It matters more than it looks: Sam opens the guide on whatever phone
they own, often an old one, and the answer bounds what the framework choice at
`infrastructure-design` can assume.

- **A. Confirm the assumption.** Current evergreen desktop browsers; current
  mobile Safari and Chrome on Android. Standard modern baseline.
- **B. Widen it** to the last two major versions of mobile Safari and Chrome,
  acknowledging that guests do not update their phones. Costs some build
  configuration and rules out the newest platform features.
- **C. Narrow it** to latest-only, and show an unsupported-browser notice
  otherwise. Cheapest to build and test; turns some guests away at the door,
  which is the one moment this product cannot afford friction.
- **X. Other (please specify)**

[Answer]: A

---

## Q5 — Does the invalid-link screen show the locality's branding? (OQ2)

Carried from the prior intent's design review and routed here. When a guest opens
a dead link, the **domain does resolve** to a real locality — only the specific
stay is invalid. That makes it different from the unmapped-signup case, which
resolves to nothing and is deliberately unbranded.

Low stakes either way; it needs a decision so the component boundary is clear
about whether the brand module is involved on that path.

- **A. Neutral.** Treat "no valid content to show" uniformly with the unmapped
  signup page. Simplest, and it is what happens by default while the brand read
  doesn't exist.
- **B. Branded.** The guest reached a real locality's address; showing its brand
  is consistent with the rule that branding applies wherever a locality resolved.
  Slightly friendlier, and requires the brand module on the error path too.
- **X. Other (please specify)**

[Answer]: B

---

## Q6 — What counts toward the 80% coverage floor?

The affirmed practice is explicit that the floor "needs a declared
`include`/`exclude` set to have teeth, and that declaration is a required
`domain-design` deliverable" — because line coverage overstates rigour on
component code, where a single render assertion executes every line of a
template. The backend's own measured split makes the point: 91% lines against
77% branches on plain service code.

Since the framework isn't chosen, the declaration has to be by **component
category** rather than by file glob. The glob comes later.

- **A. Logic components only.** The API client, error translation, session,
  brand-token parsing, view state and validators count. Presentational components
  and the design system are excluded. The number then means something, and the
  scenario tests still exercise the excluded code — they just don't inflate it.
- **B. Everything except generated and scaffolded files.** Route files, story
  files and mock-service definitions excluded; all hand-written code counts,
  presentational components included. A higher bar, and a number that is easier
  to hit for the wrong reason.
- **C. Logic components at 80%, presentational components at a separate lower
  floor.** Most precise; two numbers to maintain and explain.
- **X. Other (please specify)**

[Answer]: A

---

## Consolidated Summary Confirmation

Answers recorded:

- **Q1 = B** — `SessionManager` and `ApiClient` are two components; the session
  manager owns tokens, single-flight refresh and the resolved session, and the
  API client depends on it.
- **Q2 = A** — The Owner's guide and the Guest's guide are two separate bounded
  contexts with no shared type.
- **Q3 = B** — Ask the backend to publish a machine-readable contract (OpenAPI or
  JSON Schema) and generate the frontend's types from it.
- **Q4 = A** — Browser support is current evergreen desktop browsers plus current
  mobile Safari and Chrome on Android, confirming assumption A3.
- **Q5 = B** — The invalid-link screen renders the locality's branding.
- **Q6 = A** — The 80% coverage floor counts logic components only;
  presentational components and the design system are excluded.

Three consequences I will carry into the artifacts, stated here so they are not
silent:

1. **Q1 is a knowing refinement of an affirmed practice, not an accident.** The
   team's Code Style practice says token handling "lives inside that same module"
   as the API client. Splitting it into two components departs from that literal
   wording while preserving the rule the practice exists to enforce — no
   component above the boundary reads the token store, and both components sit in
   the same layer, so a later flip to same-origin cookies is still confined. I
   will record this as an ADR naming the practice, the departure and the reason,
   rather than letting the design quietly disagree with `team.md`.
2. **Q3 grows the backend follow-up for the third time.** `stories.md` AC4.1.10
   already asks that each new endpoint's response shape be *documented* before
   frontend work begins. Q3 escalates that to a *machine-readable, published*
   contract the frontend generates types from — a larger commitment, and one
   that crosses a repository boundary, so it is a published package or a git
   dependency rather than a shared folder. Together with the time-zone
   requirement added at Refined Mockups, the follow-up is now materially larger
   than `requirements.md` FR9 scoped it. `delivery-planning` needs to see this.
3. **Q5 is blocked on the same brand read as everything else, and specifically on
   its unauthenticated branch.** An invalid stay link returns `410` with no
   payload, so the frontend cannot learn the locality's brand from the response —
   it can only resolve it from the domain, which is exactly what AC4.1.7's
   "unauthenticated signup host" branch provides. Until that lands, the
   invalid-link screen renders neutral regardless of this decision.

[Answer]: Looks correct
