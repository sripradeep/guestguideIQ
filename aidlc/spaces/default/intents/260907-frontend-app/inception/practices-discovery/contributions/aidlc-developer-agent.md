**Collaborator:** aidlc-developer-agent

## Contribution

Remit: naming conventions, layer boundaries, error handling, file organization,
code style. Testing volume/coverage and security scanning are other reviewers'.

My headline read: the draft is careful and well-sourced about *carry-over
judgment*, but it treats almost every convention in my remit as stack-dependent
and defers it. I think that is wrong in five specific places. The frontend's
stack is unchosen, but its **counterparty is fully built and frozen in
evidence** — an eleven-code error envelope, a bearer-only auth model with no
logout and no `/me`, an unschema'd theming blob, and a `PATCH` that cancels a
subscription on anything it does not recognise. Conventions about *how the
frontend meets that counterparty* are decidable now and are not stack-dependent.
Deferring them to `domain-design` means each one gets invented per-component
instead.

---

### 1. Error-envelope consumption is the single most important convention to name now — and the draft does not mention it at all

**Observed.** `guestguideiq-app/src/lib/errors.ts` produces exactly one wire
shape via `toErrorEnvelope`, and `src/app.ts:registerErrorHandler` is the only
place it is emitted. `api-documentation.md` catalogues eleven codes, all in use:
`VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `PAYMENT_FAILED` (402),
`FORBIDDEN` (403), `NOT_FOUND` / `LOCALITY_NOT_RESOLVED` (404), `CONFLICT`
(409), `LINK_INVALID` (410), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500),
`CHAT_PROVIDER_TIMEOUT` (504). This is an unusually good position to build a
frontend against: a stable, exhaustive, centrally-produced contract.

**And the team's only live frontend precedent throws all of it away.**
`C:/Projects/guestguideIQ/src/layouts/BaseLayout.astro` lines 105-129 (the
`data-ajax-form` handler shipped on the current branch) reduces every failure —
400, 429, 500, network — to a thrown `Error` carrying only the status number,
and renders one static string from `[data-form-error]`. The code comment is
explicit that this is deliberate and sanctioned for Contract 3 lead forms. It is
correct there. It is the **wrong default to inherit** for the Owner/Guest app,
and because it is the only frontend-calling-backend code in the workspace, it is
exactly what someone will copy on day one unless a rule says otherwise.

Concretely, each code needs distinct client behaviour and the generic handler
gives none of it:

| Code | What the frontend must do that a generic handler cannot |
|---|---|
| `VALIDATION_ERROR` 400 | bind `details[].field` / `details[].reason` onto the offending form control — the envelope carries field-level detail that the generic handler discards |
| `UNAUTHORIZED` 401 | attempt silent refresh, retry once, and only then sign out (see §3) |
| `PAYMENT_FAILED` 402 | route to billing recovery, not a generic error toast |
| `LINK_INVALID` 410 | this is the **Guest app's central state**, not an error — four distinct backend failure modes deliberately collapse into it, so the guest-facing copy must be a designed screen |
| `RATE_LIMITED` 429 | honour the `Retry-After` header (seconds, set in `app.ts` line 144) and back off rather than hammer |
| `LOCALITY_NOT_RESOLVED` 404 | distinct from `NOT_FOUND` — it means signup is unavailable at this address, a signup-flow dead end |
| `CHAT_PROVIDER_TIMEOUT` 504 | the backend already retried once; the client should offer resend, not auto-retry again |

**Proposed convention (stack-agnostic, decidable now):** exactly one module
parses the envelope into a discriminated union keyed on `error.code`. Nothing
above that module reads `response.status` or touches a raw response body.
Unknown codes are handled as a defined default rather than crashing — the
catalogue will grow, and a frontend that switches exhaustively on today's eleven
codes breaks on the twelfth.

**One thing that module must handle and the backend cannot guarantee:** a
non-envelope failure. `api-documentation.md` records that two u1 routes throw
`500` on a missing body instead of `400`, and there is no ALB/proxy layer
contract at all — a 502/504 from infrastructure arrives as HTML or nothing.
The parser needs a defined fallback for "response was not envelope-shaped",
which is precisely the case the generic handler is right about.

**Correlation ids — a real gap worth naming while the interview is open.**
`toErrorEnvelope` emits only `{ code, message, details? }`; there is no
`requestId`. OTel `traceparent` is propagated server-to-server but never
surfaced. Worse for the frontend: `src/app.ts` registers `@fastify/cors` with
the single key `origin` and **no `exposedHeaders`**, so a frontend cannot read
any non-simple response header cross-origin. That means the obvious fix — add
an `X-Request-Id` response header — **would be invisible to the frontend**. If
the team wants client-side error reports tied back to server traces, the
correlation id has to go in the **envelope body**, and that is a backend change.
`architecture.md` already lists "surface the OTel trace id in the error
envelope" as an improvement opportunity; this intent is the reason to do it.
Recommend recording it as a named frontend-driven backend dependency alongside
the Q-J items, not as a frontend practice.

---

### 2. The ports-and-adapters lesson does transfer — the draft discards the transferable part with the untransferable part

The draft says layer boundaries "do NOT carry over as-is; the backend's answer
is feature-based/ports-and-adapters, which is a backend architectural pattern
for a stateless HTTP service, not a UI pattern," and defers the whole topic.
The first clause is right; the deferral is too broad. `code-structure.md` itself
names what generalises — "one narrow port per external dependency, a single
composition root, and a layer that may only be imported downward" — and all
three are stack-agnostic and enforceable before a framework is picked.

**What genuinely does not transfer:** the triad filenames
(`routes.ts`/`service.ts`/`repository.ts`), the Prisma adapter shape, a service
object per domain. Agreed, drop these.

**What transfers directly:**

- **One narrow module per external dependency.** The frontend has essentially
  one dependency that matters — the backend HTTP API. The analogue is: exactly
  one API-client module, and **no component, page, route, or view ever calls
  `fetch` directly.** This is checkable today with an ESLint
  `no-restricted-globals` / `no-restricted-imports` rule scoped to everything
  outside the client directory — which is exactly the mechanism the affirmed
  `team.md` already anticipates ("lint rules should encode the layer-boundary
  convention... rather than leaving it manually reviewed only"). The rule
  survives any framework choice.

- **Downward-only imports.** UI → view state → API client → transport. Same
  ESLint import-restriction mechanism, same rationale as the backend's.

- **A single composition root.** `code-structure.md` is blunt that
  `src/wiring.ts` being the only place adapters are constructed "is what makes
  the in-memory test doubles work at all." The frontend needs the same trick for
  the same payoff: one place where the API client is built with its base URL and
  token accessor, so tests substitute a fake client instead of intercepting
  network. That is a testability decision made by a *structure* choice, and it
  is available now.

**The argument I find decisive, and which the draft's own evidence supports.**
`architecture.md` Cross-Cutting Constraints 1 and 3 state that a same-origin
reverse proxy is the leading candidate fix for the Host-header tenancy blocker,
and that it "would also make CORS moot entirely and restore the cookie-auth
option." So the frontend's auth transport may flip from cross-origin bearer
tokens to same-origin cookies **after** Construction starts. If a single API
client owns transport, that flip is a change in one module. If components call
`fetch` and read tokens themselves, it is a rewrite. **Naming this boundary now
is what lets the stack, hosting, and auth-transport decisions stay deferred
safely.** Deferring the boundary is the choice that forecloses options, not the
one that preserves them.

I would put these three as candidate mandates in `discovered-rules.md`, not as
deferred items.

---

### 3. Auth/token handling is a layer-boundary question, not only a security one

Facts from `api-documentation.md` and `src/auth/middleware.ts`: bearer-only
(`Authorization: Bearer`), 15-minute access token, 7-day refresh with
rotation-on-use, **no logout/revocation endpoint** (sign-out is a client-side
discard), **no current-user/profile endpoint** — so `accountId` and `propertyId`
are learned *only* from the signup/login/refresh response and the frontend must
persist them alongside the tokens.

*Where* tokens are stored, and the XSS trade-off, belongs to the security
reviewer. Two things in my lane:

- **Confinement.** Token storage, attachment, and refresh live inside the API
  client layer. No component, route guard, or page reads the token store
  directly — they consume a resolved session object. Without this rule, the
  reverse-proxy flip in §2 touches every guarded route.

- **Single-flight refresh — a concrete bug the evidence predicts.**
  `architecture.md` T5 records that the refresh-token store is per-process while
  production runs 2–6 ECS tasks, so single-use rotation is **not reliably
  enforced**. Combine that with a 15-minute access token and a dashboard firing
  several parallel requests, and concurrent `401`s each trigger their own
  refresh; the rotations race, one wins, the losers present a revoked `jti` and
  get `401 UNAUTHORIZED`, and the user is spuriously signed out. The convention
  that prevents it: **concurrent 401s collapse into one in-flight refresh;
  all waiters retry against its result.** Stack-agnostic, testable, and much
  cheaper to state now than to diagnose in staging.

---

### 4. Where the frontend's API types come from — nobody queued this, and Q-A silently decides it

**Observed:** no OpenAPI or Swagger file anywhere in `guestguideiq-app`; no
`zod`, no `@fastify/swagger`, no TypeBox in either `package.json`. Four
independent `package-lock.json` files, **no npm workspaces, no hoisting, no
shared code** (`code-structure.md`). So there is no machine-readable contract
and no way to import a backend type today.

The default outcome is hand-written frontend types that drift silently from a
backend under active development — and the memory `## Corrections` already
record that this backend moved under a scan mid-stage on 2026-09-07. Drift is
not hypothetical here.

Three options, and they are not equally available:

1. **Hand-written types in one boundary module**, reviewed against
   `api-documentation.md`. Works in any repo arrangement. Cheapest, weakest.
2. **Generate a client from an OpenAPI document.** Does not exist yet, but
   `architecture.md`'s improvement list already proposes adding Fastify JSON
   schemas to u1's public routes (u2 already has them) "so a machine-readable
   contract becomes derivable" — which would *also* fix the `500`-on-missing-
   body defect. Two problems, one lever. Requires a backend change.
3. **A shared types package.** Trivial inside a workspace, a publishing and
   versioning problem across separate repos.

**This is why Q-A matters more than the draft says.** The draft frames repo
location purely as Way of Working. It is also the decision that makes option 3
cheap or expensive, and it is being asked *before* anyone has said how types
should flow. Recommend Q-A be re-worded so the human sees the coupling, and that
type-sourcing be asked as its own question rather than discovered in
`functional-design` after the repo is created.

---

### 5. The affirmed naming precedent does not survive contact with a component framework — but a stack-agnostic version of it does

`team.md` records, affirmed, "`camelCase.ts` file naming and `PascalCase` for
component/class-like constructs." The draft carries it forward "unchanged if the
frontend is TypeScript/JS," then adds `PascalCase.tsx` for components as an
"addition."

That is not an addition, it is a **contradiction of the flat rule** — under a
literal `camelCase.ts` reading, `userCard.tsx` is conformant and `UserCard.tsx`
is a violation, while every mainstream component framework's convention (and
every generator, and React's own component-name-from-filename tooling) says the
opposite. If the rule is promoted as written, the first component file breaks it.

**The stack-agnostic reformulation, which reproduces the backend's observed
behaviour exactly rather than approximating it:** *a file is named after what it
exports* — PascalCase when the primary export is a component or class,
camelCase otherwise. Check it against the evidence: every backend file exports
functions or objects, hence `prismaClient.ts`, `refreshTokenStore.ts`,
`stripeAdapter.ts`; every `PascalCase` identifier in the backend is a type or
class *inside* a file. The backend has no component files, which is the only
reason the two formulations have never diverged there. Stating it this way lets
one rule cover both repos honestly.

Two more from `code-structure.md`:

- **Carry:** "the directory carries the domain name, the file carries the
  layer." This is a genuinely good idea and is framework-independent.
- **Do not carry:** the unseparated compound directory names `guestaccess` and
  `chatmodule`. `code-structure.md` flags them itself ("the two compound names
  are unseparated, not kebab-cased"). A frontend will have many more multi-word
  concepts than a ten-module backend; inheriting an already-noted wart at ten
  times the volume is a bad trade. Pick kebab-case or the language default and
  say so.

---

### 6. Two contracts this intent owns that the draft omits

**`locality.visualStyling` — the guest theming contract.**
`api-documentation.md` line 242: it is `Record<string, unknown> | null` in
`locality/repository.ts` and `Json?` in Prisma, "**has no schema anywhere in the
codebase**," yet the guest UI is expected to theme from it (BR9.6) and must
degrade gracefully on `null`. The CodeKB states plainly: "**Defining that
theming contract is work this frontend intent owns.**" The draft does not
mention it. It is the same shape as the API-client rule and deserves the same
convention: **one module parses `visualStyling` into typed design tokens with
defaults; no component reads the raw blob.** Otherwise every component invents
its own key-lookup-with-fallback and `null` handling, and the degradation
behaviour BR9.6 requires is untestable.

**Server-supplied user-facing copy.** `poi/service.ts` and `event/service.ts`
return `isEmptyLocality: true` with a canned `emptyMessage` ("No events yet —
check back soon.", "Content is being added for this locality."). This is a
deliberate backend choice — but it means **copy ownership is split**, which is a
reliable source of drift and of two different empty states appearing in one app.
Name the rule now: server `emptyMessage` renders when present; components do not
carry a competing hardcoded empty string. Worth flagging for
`functional-design`: that copy is server-side and unlocalised, so this
convention is the thing that breaks first if i18n is ever wanted.

---

### 7. One error-handling rule with real teeth, straight off the API surface

`api-documentation.md` line 209: `PATCH /v1/subscriptions` is a nested ternary
whose final `else` branch is `subscriptions.cancel(accountId)`. **A missing
body, a typo, or an unrecognised future action value silently cancels the
subscription.**

The client-side convention this demands: the `action` value is a typed union at
the API-client boundary and is never a bare string, and this request is never
sent speculatively, optimistically, or as a retry of an ambiguous failure. This
is exactly the class of thing that should be a named rule rather than a comment
someone reads once — the failure is silent, billing-affecting, and
indistinguishable from success at the call site.

---

### 8. Code-style items the evidence supports carrying that the draft skips

- **Traceability comments.** `code-structure.md` calls this out unprompted as
  "the single practice most worth replicating in the frontend repo" — nearly
  every non-obvious backend decision cites the artifact that motivated it
  (`security-design.md`, `BR8.3`, `NFR3.11`, `AC4.3.2`). It costs nothing, it is
  entirely stack-agnostic, and the draft carries none of it. Worth a line in
  `team-practices.md` § Code Style.
- **Marker hygiene, and note this is a real divergence.** The backend has
  **zero** `TODO`/`FIXME`/`HACK`/`@ts-ignore`/`@ts-expect-error` across `src/`,
  `tests/`, `admin-api/`, `infra/`, and two `eslint-disable` comments repo-wide.
  The marketing site has three live `TODO`s (`src/site.config.ts` lines 10 and
  13, `src/layouts/BaseLayout.astro` line 34). The two precedents disagree, so
  this is a choice to make rather than a default to inherit. The org
  construction guardrail already permits TODOs only when explicitly marked with
  a rationale, which is nearer the backend's discipline.
- **TypeScript strictness floor.** Both backend packages run `strict`,
  `noImplicitAny`, `noImplicitOverride`, `noImplicitReturns`,
  `noUncheckedIndexedAccess`, `noFallthroughCasesInSwitch`, with
  `exactOptionalPropertyTypes: false` as the one relaxation. The marketing site
  extends `astro/tsconfigs/strict`, which is weaker. Propose the backend's set
  as the frontend floor if TypeScript is chosen, and ask explicitly whether
  `exactOptionalPropertyTypes: false` is inherited or fixed — it is the one
  place the backend knowingly loosened, and a frontend starting fresh has no
  legacy reason to.
- **Type-aware linting (TD-17).** Endorsed — see Positions.

---

### 9. Interview budget — my recommendation

Q-B (branch/PR discipline), Q-H (blocking linter/formatter), and Q-I (dependency
+ secret scanning) are all classified by the draft itself as "extension likely,"
all framework-agnostic, and all re-asks of practices affirmed one day earlier
whose rationale contained nothing backend-specific. That is three of ten slots
spent on near-certain yeses, while every convention in §1–§7 above — all of
which are genuinely undecided and all of which will otherwise be settled
ad-hoc during Construction — gets zero.

I would collapse Q-B/Q-H/Q-I into a single bundled confirmation ("these three
team habits were affirmed for the backend and nothing in them is
backend-specific — confirm they apply to the frontend repo too?") and spend the
freed slots on:

- **Q-K (Error handling — surfacing):** The backend returns a structured error
  envelope with eleven stable codes. The marketing site's existing form handler
  discards all of it and shows one generic message, which the lead-capture
  contract explicitly allows. Should the Owner/Guest app parse the envelope
  properly — field-level validation errors bound to form controls, `410
  LINK_INVALID` as a designed Guest screen, `429` honouring `Retry-After`, `402`
  routing to billing recovery — or is a single generic error message acceptable
  for the first release too?

- **Q-L (Layer boundaries — the API boundary):** Should the frontend confine all
  backend calls, token storage, and refresh to a single API-client module that
  nothing else bypasses, enforced by a lint rule from day one? The backend's
  auth transport may later change from bearer tokens to same-origin cookies if
  the reverse-proxy fix for the tenancy constraint is adopted; this boundary is
  what makes that a one-module change instead of a rewrite.

- **Q-M (Code organization — API types):** The backend publishes no OpenAPI
  document and shares no code, so the frontend's request/response types would be
  hand-written and would drift as the backend changes. Should we (a) hand-write
  them in one boundary module, (b) ask the backend to add JSON schemas so an
  OpenAPI document and a generated client become possible, or (c) share a types
  package — noting that (c) is cheap only if Q-A puts the frontend in a
  workspace with the backend?

- **Q-N (Naming):** Confirm the file-naming rule as "named after what it
  exports" (PascalCase for component/class exports, camelCase otherwise) rather
  than the flat `camelCase.ts` currently recorded in `team.md`, which a
  component framework's `UserCard.tsx` would violate on day one.

## Positions

- AGREE: naming type-aware linting as something the frontend should *not*
  inherit from the backend's `parserOptions.project: false` (TD-17) — it is a
  precise, evidence-cited gap and stating it positively before a linter exists
  is exactly the right moment.
- AGREE: refusing to default Q-A (repo location) from the backend's Q2 — Q2 was
  explicitly scoped to `guestguideiq-app` in `project.md`'s `## Decided`, and
  inheriting it by analogy would be unfounded.
- AGREE: separating "the *habit* carries over, the *tool* does not" for
  formatter/linter — the right abstraction for a stack-agnostic stage, and it
  keeps the affirmed commitment intact without pretending to know the tooling.
- AGREE: keeping the type-check step distinct from build — the
  `astro build`-vs-`astro check` gap is directly observable in this workspace
  and the fix is worth restating rather than assuming carried.
- AGREE: the public-config-vs-secret distinction drawn from `PUBLIC_API_BASE_URL`
  — a genuinely useful, evidence-grounded frontend refinement of the backend's
  secrets rule, and correct that a static frontend may have no secret at all.
- OBJECT: deferring *all* of layer boundaries/file organization to
  `domain-design` — three of the backend's boundary invariants (one narrow
  module per external dependency, downward-only imports, a single composition
  root) are stack-agnostic and lint-enforceable now, and `code-structure.md`
  itself names them as the transferable shape. Deferring them is what forecloses
  the reverse-proxy auth flip, not what preserves it (§2).
- OBJECT: the draft names no convention for consuming the backend's error
  envelope, despite the envelope being the most stable, fully-specified thing
  the frontend integrates against — and despite the workspace's only live
  frontend-calling-backend code (`BaseLayout.astro` lines 105-129) actively
  discarding `code`, `message`, and `details[]`. That is the pattern that gets
  copied unless a rule says otherwise (§1).
- OBJECT: carrying the `camelCase.ts` naming rule forward "unchanged" while also
  proposing `PascalCase.tsx` components — these contradict; the rule needs
  restating as "named after what it exports" before promotion, or the first
  component file violates the affirmed rule (§5).
- OBJECT: no question anywhere on where the frontend's API types come from, and
  Q-A framed purely as Way of Working when it silently decides whether a shared
  types package is even available. There is no OpenAPI document, no shared
  package, and no npm workspace today (§4).
- OBJECT: `locality.visualStyling` is absent from all three artifacts, though
  `api-documentation.md` states it has no schema anywhere, that the guest UI
  must theme from it and degrade on `null`, and explicitly that "defining that
  theming contract is work this frontend intent owns" (§6).
- OBJECT: interview budget skew — three of ten slots go to "extension likely"
  re-asks of framework-agnostic habits affirmed the previous day, while every
  genuinely-open frontend convention in my remit gets none. Concrete
  replacements proposed as Q-K through Q-N (§9).
