# Business Rules — `u3-foundation`

*Re-confirmed 2026-09-08 after the functional-design redo jump, and re-saved
following that confirmation. Content unchanged.*

Twenty-four rules across five groups. Most exist because of a specific, verified
backend behaviour rather than a general principle — the destructive-request
guards, the single-flight refresh and the total error union each trace to
something the deployed API actually does.

## Source of truth

```yaml
rules:

  # --- Session and tokens ---

  - id: BR1.1
    statement: No consumer ever sees a token.
    category: constraint
    applies_to: SessionManager, Session
    trigger: any consumer reading session state
    logic: >
      IF a component outside this unit needs to know about the session, THEN it
      reads a Session object carrying status and an Account. There is no token
      field, no accessor, and no route by which a token reaches a component,
      route guard or page.
    violation: >
      NFR7. A token reachable from a component is a token that can be logged,
      serialised into an error report, or read by injected script. Since the
      refresh token is non-revocable for seven days, one leak is a week-long
      compromise with no way to end it.
    source: NFR7, Contract Design C3

  - id: BR1.2
    statement: Concurrent auth failures collapse into exactly one refresh.
    category: workflow
    applies_to: RefreshFlight
    trigger: a 401 on any resource request
    logic: >
      IF a 401 arrives and no RefreshFlight is in flight, THEN start one. IF one
      IS in flight, THEN park this request on its result rather than starting
      another. Every waiter resolves against the single outcome.
    violation: >
      The backend's refresh-token store is per-process across 2-6 running tasks,
      so parallel refreshes land on different tasks, rotate independently and
      revoke each other. The owner is logged out at random, most often when the
      dashboard fires several reads at once — which is exactly when it happens.
    source: AC1.10.4, unit-of-work.md § U3

  - id: BR1.3
    statement: A 401 from the refresh call itself ends the session.
    category: constraint
    applies_to: SessionManager
    trigger: the refresh request returning 401
    logic: >
      IF the 401 came from POST /v1/auth/refresh rather than from a resource
      call, THEN end the session with endedReason `refresh-rejected`. Never start
      another RefreshFlight.
    violation: >
      Without this the client loops: the refresh fails, which looks like an auth
      failure, which triggers a refresh. It is the difference between an expired
      session and an infinite request storm against production.
    source: AC1.10.5

  - id: BR1.4
    statement: The session survives a page reload.
    category: constraint
    applies_to: TokenStore
    trigger: a returning owner loading the app
    logic: >
      IF valid tokens are in the store, THEN the session is restored without a
      re-login and `status` resolves to `active` before any route guard runs.
    violation: >
      AC1.3.3 is a Must criterion on the walking-skeleton path and states this
      directly: "when I reload the page, then my session is restored without a
      re-login." An owner re-authenticating on every reload also cannot complete
      the onboarding wizard, whose draft is client-held.
    source: AC1.3.3, Q1 (functional design)

  - id: BR1.5
    statement: Ending a session clears session state and nothing else.
    category: constraint
    applies_to: SessionManager
    trigger: any session end
    logic: >
      IF a session ends, THEN local session state and the token store are
      cleared. Caller state — an open editor's buffer, a partially completed
      wizard — is NOT touched.
    violation: >
      AC1.10.3 requires the editor's contents to be preserved on screen when
      expiry is surfaced. A session teardown that clears caller state destroys
      exactly the work the criterion exists to protect.
    source: AC1.10.2, AC1.10.3

  - id: BR1.6
    statement: The refresh single-flight is scoped to the token store, not to the document.
    category: constraint
    applies_to: RefreshFlight, TokenStore
    trigger: two browser tabs of the same app refreshing at once
    logic: >
      IF the token store is shared across documents, THEN the mechanism that
      serialises refreshes must be shared across documents too. An in-document
      singleton satisfies BR1.2 within one tab and not between two.
    violation: >
      Refresh tokens rotate. Two tabs sharing a persistent store each hold the
      same token; whichever refreshes second presents a rotated-away token and is
      rejected, ending that tab's session. US1.10's own note records this as
      unspecifiable while OQ3 was open — Q1 = A closes that: the store is
      persistent, so the race is real and in scope.
    source: AC1.10.4, US1.10 note, Q1 (functional design)
    note: >
      This is a requirement on OQ3's answer, not a mechanism chosen here. A
      same-origin proxy holding an HttpOnly cookie satisfies it by construction,
      because the proxy serialises refreshes server-side and no browser document
      performs one. A browser-side store satisfies it only with a cross-document
      lock. nfr-design owns the choice; this rule is the constraint it must meet.

  - id: BR1.7
    statement: A 401 on a post-refresh retry ends the session; it never starts a second flight.
    category: constraint
    applies_to: SessionManager, RefreshFlight
    trigger: a waiter's single retry returning 401 after a refresh succeeded
    logic: >
      IF a request retried against a freshly refreshed token still returns 401,
      THEN end the session with endedReason `refresh-rejected`. Do NOT treat it
      as an ordinary 401 and do NOT start another RefreshFlight, even though by
      then no flight is in progress.
    violation: >
      Without this the `active` state's ordinary 401 rule applies — no flight is
      in progress once the first resolved, so a second one starts, its retry
      fails, a third starts. That is the concurrent-refresh storm BR1.2 exists to
      prevent, arriving by a different door and from every open tab at once.
    source: functional-spec.md Workflow 1 step 6
    note: >
      BR1.3 covers a 401 from the refresh CALL. This covers a 401 from the
      RETRY that follows a successful refresh. They are different events and only
      one of them was written down before review caught the omission.

  # --- Replay after re-authentication (Q2 = B) ---

  - id: BR2.1
    statement: A read is re-issued transparently after re-authentication.
    category: workflow
    applies_to: ReplayIntent
    trigger: a read failing on an ended session, then the owner signing in again
    logic: >
      IF the failed request was an idempotent read, THEN re-issue it once the new
      session is active. No confirmation and no visible replay.
    violation: >
      Making the owner re-navigate to reach data they were already looking at,
      for no safety benefit — a read has no side effect to guard against.
    source: Q2 (functional design)

  - id: BR2.2
    statement: A write is replayed only with a payload the caller supplies fresh.
    category: constraint
    applies_to: ReplayIntent
    trigger: a write failing on an ended session, then the owner signing in again
    logic: >
      IF a write is replayed, THEN the originating unit supplies the current
      payload at replay time. The bytes captured when the request first failed
      are NEVER re-sent.
    violation: >
      The guide save is a full replace. Replaying captured bytes writes whatever
      the editor held at failure time over whatever the guide holds now —
      silently discarding anything changed in between, including changes made in
      another tab. Losing one save is a smaller harm than overwriting a guide
      with a stale copy of itself.
    source: Q2 (functional design), AC1.7.2

  - id: BR2.3
    statement: A subscription change is never replayed.
    category: constraint
    applies_to: ReplayIntent
    trigger: PATCH /v1/subscriptions failing on an ended session
    logic: >
      IF the failed request was PATCH /v1/subscriptions, THEN its ReplayIntent is
      `no-replay`. After re-authentication the owner is returned to the
      subscription screen with state re-read.
    violation: >
      AC1.14.5 states that a change whose outcome cannot be determined is not
      retried automatically — the app re-reads state and asks. A session that
      ended mid-request is precisely an indeterminate outcome, and the endpoint
      cancels the subscription on anything it does not recognise.
    source: AC1.14.5, Q2 (functional design)

  # --- Requests: the destructive-request guards (Q3 = B) ---

  - id: BR3.1
    statement: Every request carries a complete body, checked before it is sent.
    category: validation
    applies_to: ApiClient
    trigger: constructing any request with a body
    logic: >
      IF a request would be sent with no body or an incomplete one, THEN
      ApiClient refuses to send it and raises a typed client-side error.
    violation: >
      POST /v1/guides/:propertyId/favorites destructures request.body directly
      with no `?? {}` fallback, so a bodyless request returns 500 rather than
      400. It is the one handler in the file without that fallback.
    source: AC1.12.6, Q3 (functional design)

  - id: BR3.2
    statement: A guide save without a complete section set is refused before sending.
    category: validation
    applies_to: ApiClient
    trigger: a guide save request
    logic: >
      IF the outgoing save does not carry the complete set of sections under the
      exact expected key, THEN refuse it locally. Never send it and read the
      response.
    violation: >
      The route defaults a missing or misspelled `sections` to `[]` IN FRONT OF
      the service's array guard. The response is 200 with every section deleted.
      There is no error to handle and no result to inspect — the only defence is
      not sending the request.
    source: AC1.7.2, Q3 (functional design)

  - id: BR3.3
    statement: The subscription action comes from a closed set, checked before it is sent.
    category: validation
    applies_to: ApiClient
    trigger: PATCH /v1/subscriptions
    logic: >
      IF the action value is not one of upgrade, downgrade or cancel, THEN refuse
      the request locally.
    violation: >
      The endpoint's final `else` branch cancels the subscription on anything
      unrecognised, and a missing body reaches that branch. A typo is a silent
      billing event.
    source: AC1.14.6, Q3 (functional design)

  - id: BR3.4
    statement: On an INDETERMINATE failure, reads retry with backoff and writes never retry.
    category: constraint
    applies_to: ApiClient
    trigger: a transport failure, a timeout, or a 5xx
    logic: >
      IF the failure is indeterminate — the request may or may not have taken
      effect — AND it was an idempotent read, THEN retry with bounded exponential
      backoff and jitter. IF it was a write, THEN do not retry. A caller wanting
      a write retried states so at the call site with its reason.
    violation: >
      The dangerous direction must require an explicit, reviewable opt-in. An
      automatic write retry after an indeterminate failure is a silent
      destructive action, not a resilience feature.
    source: Contract Design C3, AC1.14.5
    note: >
      Scoped to INDETERMINATE failures. A 401 is determinate and is governed by
      BR3.6 instead — the two rules were conflated in the first draft, which made
      the single-flight workflow appear to contradict this one.

  - id: BR3.6
    statement: A post-refresh retry re-runs the outgoing guards, and is safe because a 401 precedes the handler.
    category: constraint
    applies_to: ApiClient
    trigger: replaying a parked request after a RefreshFlight succeeds
    logic: >
      IF a request is retried once against a refreshed token, THEN BR3.1, BR3.2
      and BR3.3 are re-evaluated on the outgoing request exactly as on the first
      attempt. The retry re-sends the captured payload, which is correct here and
      NOT the Q2 = B replay case: no owner interaction and no arbitrary gap sits
      between the two attempts.
    violation: >
      Skipping the guards on a retry would leave the one code path that sends a
      request twice as the one path that checks it once.
    source: AC1.14.5, AC1.14.6, Q3 (functional design)
    note: >
      Retrying a write here is safe for a verified reason, not by assumption:
      `auth` is registered as a Fastify `preHandler` on every owner route
      (guestguideiq-app `src/guide/routes.ts`, `src/subscription/routes.ts`), so
      a 401 is raised before the handler body runs and the request provably did
      not take effect. AC1.14.5's no-retry rule governs INDETERMINATE outcomes; a
      401 is determinate. Were auth ever moved into the handlers, this rule and
      BR3.4 would have to merge.

  - id: BR3.5
    statement: Refetch-on-focus and prefetch are disabled as configuration.
    category: constraint
    applies_to: ApiClient
    trigger: the window regaining focus, or a route being revisited
    logic: >
      IF the window regains focus or a route is revisited, THEN no additional
      guide read is issued.
    violation: >
      GET on the guide creates an empty draft row as a side effect. It never
      overwrites content, so the cost is spurious rows rather than data loss —
      but refetch-on-focus is on by default in most data-fetching libraries, so
      this has to be turned off deliberately rather than left alone.
    source: AC1.7.5

  # --- Errors ---

  - id: BR4.1
    statement: Every non-2xx response arrives already parsed; no consumer reads a status.
    category: constraint
    applies_to: ApiErrorCatalog
    trigger: any non-2xx response
    logic: >
      IF a response is not 2xx, THEN ApiClient hands it to ApiErrorCatalog, which
      returns an ApiError. Nothing above this unit reads an HTTP status or an
      unparsed body.
    violation: >
      Status codes are ambiguous here in ways that matter: 404 is both
      NOT_FOUND and LOCALITY_NOT_RESOLVED, and 410 is both an invalid stay link
      and an expired reset token. Branching on the status rather than the code
      routes the guest's central navigational state to the wrong screen.
    source: Contract Design C3, team practices (error-envelope rule)

  - id: BR4.2
    statement: The error union is total.
    category: constraint
    applies_to: ApiError
    trigger: any failure, including one that is not envelope-shaped
    logic: >
      IF the response carries no envelope — a raw 500, a 502 or 504 from
      infrastructure, a network failure, a timeout — THEN it resolves to
      TRANSPORT_FAILURE. IF it carries a code this catalogue does not know, THEN
      it resolves to UNRECOGNISED. Neither throws.
    violation: >
      AC2.5.2 requires a guest to see an error with a retry rather than a blank
      screen. An unhandled parse failure on an infrastructure error produces
      exactly the blank screen the criterion forbids, in the case most likely to
      produce one.
    source: AC2.5.2, Contract Design C3

  - id: BR4.3
    statement: Field-level details stay attached to their named field.
    category: constraint
    applies_to: FieldError
    trigger: a 400 VALIDATION_ERROR carrying details
    logic: >
      IF details are present, THEN each stays bound to its field so a form can
      render it beside that input, rather than being flattened into one message.
    violation: >
      Collapsing every failure into one generic message is what the marketing
      site's lead-capture handler does; it is reasonable there and wrong in a
      signup form with per-field validation.
    source: team practices (error-envelope rule), AC1.1.x
    note: >
      Login is the one deliberate exception (AC1.3.2): a single non-disclosing
      banner, because per-field errors would reveal which usernames exist. That
      is u4-owner-shell's presentation choice; this shape is unchanged.

  - id: BR4.4
    statement: RATE_LIMITED is never collapsed into a generic error.
    category: constraint
    applies_to: ApiError
    trigger: a 429 response
    logic: >
      IF the response is 429, THEN it resolves to RATE_LIMITED as its own code so
      a consumer can render a specific state.
    violation: >
      AC2.5.3 requires a guest to see a "too many requests, try again shortly"
      state rather than a generic error — and a shared hotel address makes this
      a routine case, not an edge one, because the limiter buckets by network.
    source: AC2.5.3

  # --- Theme ---

  - id: BR5.1
    statement: visualStyling is parsed here and nowhere else, and parsing cannot throw.
    category: constraint
    applies_to: LocalityBrandResolver
    trigger: resolving a locality brand
    logic: >
      IF visualStyling is present, THEN this component parses it into typed
      tokens. Any shape it cannot interpret falls back to a default. No input
      produces an exception.
    violation: >
      visualStyling is an unschematised, attacker-influenceable
      Record<string, unknown> | null. A parse that can throw on hostile input is
      a denial of service on the guest guide; a raw blob spread into a style
      object is a rendering injection.
    source: team practices (untrusted-render rule), Contract Design C3

  - id: BR5.2
    statement: Every resolution produces a complete token set.
    category: constraint
    applies_to: ThemeTokens
    trigger: a brand carrying only a name and tagline, or no brand at all
    logic: >
      IF a brand is minimal, THEN the result is the base tokens plus that name.
      IF no brand resolves, THEN the result is the unbranded base set. There is
      no partial result with holes.
    violation: >
      AC2.1.3 requires the clean default look plus the name — never a
      half-styled or broken page. A partial token set pushes fallback logic into
      every primitive, where it will be applied inconsistently.
    source: AC2.1.3

  - id: BR5.3
    statement: An accent failing the contrast floor is replaced, and the replacement is recorded.
    category: validation
    applies_to: ThemeTokens
    trigger: parsing a brand accent colour
    logic: >
      IF a supplied accent fails 4.5:1 against the base surface for text or 3:1
      for UI components, THEN use the base accent instead and set
      contrastDegraded.
    violation: >
      NFR3 requires each locality's accent to meet the floor independently.
      Brand colours are set after deploy, so no build-time check can catch a bad
      one — this runtime check is the only place it can be caught at all.
    source: NFR3
    note: >
      contrastDegraded is recorded rather than merely acted on, so the condition
      is observable. Nothing in this unit surfaces it; who reports a degraded
      brand, and to whom, is an open question for nfr-design — there is no ops
      surface in scope that could show it.

  - id: BR5.4
    statement: The resolver serves the guest invalid-link path as well as the valid one.
    category: constraint
    applies_to: LocalityBrandResolver
    trigger: a 410 LINK_INVALID response
    logic: >
      IF a stay link is invalid, THEN the brand is still resolved for the domain
      the guest arrived at, so the invalid-link screen renders branded.
    violation: >
      ADR-005 requires the invalid-link screen to be branded: the guest reached a
      locality's own domain, so an unbranded error page reads as a broken site
      rather than an expired link.
    source: ADR-005
    note: >
      This cannot take effect until AC4.1.7's unauthenticated brand branch
      exists — a 410 carries no payload to resolve a brand from, and the brand
      read itself currently requires a session. Recorded as N/A in traceability
      rather than claimed as covered. **This design therefore does not yet meet
      Contract Design C3's `theme` guarantee** that the resolver "serves the
      guest invalid-link path as well as the valid one", which C3 states
      unconditionally. The shortfall is external and temporary, but it is a
      shortfall against an approved contract and is named here rather than left
      to be inferred from the block.
```

## Rules summary

| ID | Statement | Why it exists |
|---|---|---|
| BR1.1 | No consumer sees a token | A 7-day non-revocable credential |
| BR1.2 | Exactly one in-flight refresh | Per-process token store across 2–6 tasks |
| BR1.3 | A 401 from refresh ends the session | Otherwise the client loops |
| BR1.4 | The session survives a reload | AC1.3.3, a Must on the skeleton path |
| BR1.5 | Session end clears session state only | AC1.10.3's preserved editor |
| BR1.6 | Single-flight is scoped to the store | Two tabs revoke each other |
| BR1.7 | A 401 on the post-refresh retry ends the session | Otherwise the storm returns by another door |
| BR2.1 | Reads re-issue transparently | No side effect to guard |
| BR2.2 | Writes replay with a fresh payload | Full-replace guide save |
| BR2.3 | Subscription changes never replay | AC1.14.5 |
| BR3.1 | Complete body, checked locally | The one handler with no `?? {}` |
| BR3.2 | Complete sections, checked locally | `200` with everything deleted |
| BR3.3 | Closed action set, checked locally | `else` cancels the subscription |
| BR3.4 | On an *indeterminate* failure, reads retry; writes do not | The dangerous direction needs an opt-in |
| BR3.5 | No refetch-on-focus, no prefetch | The guide read creates a draft row |
| BR3.6 | Post-refresh retries re-run the guards | A 401 precedes the handler, so the retry is safe |
| BR4.1 | Everything arrives parsed | Ambiguous statuses (404, 410) |
| BR4.2 | The union is total | AC2.5.2's blank screen |
| BR4.3 | Details stay per-field | Per-field forms |
| BR4.4 | `RATE_LIMITED` stands alone | AC2.5.3, routine on shared networks |
| BR5.1 | One parse, and it cannot throw | Attacker-influenceable input |
| BR5.2 | Token sets are always complete | AC2.1.3's half-styled page |
| BR5.3 | Failing accents are replaced and recorded | NFR3, uncheckable at build time |
| BR5.4 | The invalid-link path is branded too | ADR-005 |

## The three rules that carry the most risk

**BR3.2** is the only rule in the frontend whose violation is unrecoverable and
silent. Every other guard here fails loudly — a refused request, a typed error, a
degraded colour. A mis-keyed guide save returns `200` and the owner's guide is
gone, with no signal at any layer. Q3 = B is why there is now a check at run time
as well as at compile time.

**BR1.6** was not visible until Q1 = A was answered. `US1.10`'s own note records
the cross-tab race as unspecifiable while OQ3 was open; deciding that the store is
persistent is what makes two tabs share it, which is what makes the race real. The
rule is stated as a constraint on OQ3's answer rather than as a mechanism, because
the mechanism is genuinely not this stage's to choose.

**BR2.2** is the compensating control for Q2 = B. The answer was "replay the
request"; the rule is "replay the *intent*, with a payload fetched fresh". Those
differ only in the case that matters — where something changed in the gap between
the failure and the re-authentication, which is precisely the case a replay
exists to handle.
