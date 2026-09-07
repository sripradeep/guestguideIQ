**Collaborator:** aidlc-developer-agent

## Contribution

Remit: implementability and story sizing. I verified every backend claim against
the deployed source at `guestguideiq-app` HEAD `721b33c` (`src/**/routes.ts`,
`src/**/service.ts`, `src/identity/repository.ts`, `prisma/schema.prisma`), not
against `api-documentation.md` alone. Two of the four sharp edges the brief named
are correctly stated, one is understated, one is stated more alarmingly than the
code warrants — and three sharper edges that block the walking skeleton are
missing entirely.

---

### 1. Verification of the named backend behaviours

| Claim | Verdict | Evidence |
|---|---|---|
| AC1.7.2/AC1.7.3 — guide `PATCH` is a full replace | **Confirmed, but understated** | `guide/service.ts:88` `updateSections` calls `guide.setSections(propertyId, sections)` with no merge. See D-5 — the route's own default makes this worse than the AC says. |
| AC1.7.5 — guide `GET` creates a draft as a side effect | **Confirmed, consequence over-weighted** | `guide/service.ts:62` `getForOwner` → `guide.ensureExists(propertyId)`. But `ensureExists` is idempotent and creates an *empty draft row* only — it never overwrites content and is also called by `chooseStartFromScratch` and by the guest read. The real cost is a spurious row, not data loss. See D-5b. |
| AC1.14.5/AC1.14.6 — subscription `PATCH` cancels on any unrecognised action | **Confirmed exactly as written** | `subscription/routes.ts` — nested ternary, final `else` is `subscriptions.cancel(accountId)`; the body is `request.body?.action`, so a missing body reaches `cancel`. These two ACs are the best-drafted defensive criteria in the document. |
| AC1.10.4 — concurrent refresh collapse | **Confirmed, and incomplete** | `identity/service.ts:refresh` — `isRevoked(jti)` then `revoke(jti)` then re-issue. Rotation is real. But the AC only covers collapse *within one document*. See D-9. |

Two further claims in the draft that I checked and can confirm as safe:

- **AC1.13.2 / A4 (content survives cancellation)** — true. `cancel` only calls
  `repository.setStatus(accountId, 'cancelled')`; nothing touches `GuideContent`.
  Stronger than an assumption now: it is a property of the code.
- **AC1.14.4 (no active subscription → only Start available)** — supported.
  Signup creates a `SubscriptionRecord` with `status: 'none'`
  (`identity/repository.ts:72`), and `requireActive` returns `409 CONFLICT` for
  any non-`active` status. Note this *contradicts* `api-documentation.md`'s
  "`404 NOT_FOUND` if no `SubscriptionRecord` row exists" hazard for
  `POST /v1/subscriptions` — that row always exists for an account created
  through signup, so the 404 is unreachable in practice and no story needs to
  defend against it.

---

### 2. Missing sharp edges — these block the walking skeleton

**D-1 (blocking). There is no endpoint that returns a locality brand to the
frontend, so AC1.1.1, AC1.2.1, AC1.2.2 and AC1.5.6 cannot be built at all.**

Locality data leaves the system through exactly two doors: the guest stay payload
(`guestaccess/routes.ts:31-36`) and the internal create-only routes
(`internal/routes.ts:64-82`, internal-scoped service JWT, bound to `127.0.0.1`).
`locality/service.ts` has `resolveDomain`/`tryResolveDomain`, but **no public
route calls them for a read**. Consequences:

- AC1.1.1 requires the signup page to render "that brand's logo, name and accent
  colour" *before* submitting. Nothing returns them. `POST /v1/accounts` resolves
  the host internally and returns only `{ accountId, propertyId, accessToken,
  refreshToken }` — not even after a successful signup does the Owner app learn
  its brand.
- AC1.2.1/AC1.2.2 require knowing the host resolves to nothing *before* any form
  is shown ("with no form at all"). The only signal is `404
  LOCALITY_NOT_RESOLVED` from a real signup attempt — and it is unreachable as a
  probe, because `identity/service.ts:signup` runs `validateUsername` /
  `validatePassword` **before** `locality.resolveDomain`, so an empty probe
  returns `400 VALIDATION_ERROR` and never reaches the locality check. A real
  attempt also spends the 5/min/IP bucket.
- AC1.5.6 and FR10.2 (wizard and dashboard shell carry the brand) have the same
  problem for an authenticated owner: `/v1/pois` and `/v1/events` derive the
  locality internally and return items only; no route returns the brand's name,
  tagline or `visualStyling` to an owner.

This gap is in neither FR9 nor US4.1. As drafted, the first story of the walking
skeleton has an acceptance criterion no implementation can satisfy.

**D-2 (blocking). The `Host`-header tenancy constraint blocks
`POST /v1/accounts` and every Guest story, and US4.1's CORS criterion does not
address it.**

`identity/service.ts:signup` resolves the tenant from `input.host`, and
`guestaccess/service.ts:resolveStayForRequest` requires
`tryResolveDomain(requestHost).id === property.localityBrandId`, else
`410 LINK_INVALID`. A browser at `https://stay.somelocality.com` calling a shared
API origin sends `Host: api.guestguideiq.com` — which `BR9.2`
(`locality/service.ts:addDomain`, `409 CONFLICT`) forbids from being registered
against more than one brand. So on a cross-origin deployment:

- every signup returns `404 LOCALITY_NOT_RESOLVED` → AC1.1.2 never passes and
  AC1.2.1's "signups aren't available here" page becomes the *only* page anyone
  sees;
- every valid stay link returns `410 LINK_INVALID` → AC2.2.1/AC2.2.2 pass for the
  wrong reason and AC2.1.1 can never pass.

AC4.1.2 (CORS/`ALLOWED_ORIGINS`) makes the request *permitted*; it does not
change the `Host` header the browser sends. `requirements.md` records this as C5
and `team-practices.md` § Deployment records the same-origin-proxy constraint,
but **no story or dependency line reflects it**. US1.1 and US2.1 both need it as
an explicit dependency, and US4.1 needs a criterion for it, or the skeleton Bolt
will be sequenced as buildable and will not run end to end.

**D-3 (blocking). US1.5's AC1.5.2 and AC1.5.3 are not supported by the
onboarding API.**

`GET /v1/onboarding` returns `{ currentStep, completed }` and nothing else
(`onboarding/service.ts:toStatus`). The property name submitted at
`property_basics` is written to `Property.name` and **is not readable back by any
owner-facing route** — `OwnerGuideView` carries `propertyId`, `publishStatus`,
`sections` and the two favourite-id arrays, no property name. So "resume … with
my prior entries intact" (AC1.5.2) is achievable only from client-held state,
which is exactly what an interruption destroys.

Worse for AC1.5.3: the state machine is strictly forward. `assertStep` is a
string equality check that throws `409 CONFLICT` on any non-current step, and
there is no route that moves `currentStep` backwards. Rendering a previous step
is possible; **re-submitting it is not** — an owner who mistypes their property
name cannot correct it during onboarding at all. AC1.5.3 as written ("no entered
data is lost") reads as a UI-buffer requirement but is actually an unstated
demand for a backend capability that does not exist.

---

### 3. Where the granularity line is drawn wrongly

The mixed-granularity decision is right in principle. The line is in the wrong
place: **ten stories are marked implementation-ready and assigned to Bolt 1**
(US1.1–US1.10), which is most of the Owner application, not a thin slice.
`team.md` § Walking Skeleton defines the slice as "signup through to a published
guide". US1.9 is past that boundary, US1.4 is not on that path, US1.10 is an
infrastructure concern, and US1.6 is not separable from US1.7 (D-4).

My proposed skeleton, in order: **US1.1 (signup, minus the branding criteria) →
US1.3 (login) → US1.5a (wizard traversal) → US1.7 (edit and save) → US1.8
(publish)**. Everything else moves off Bolt 1.

**D-4. US1.6 and US1.7 are one story, and US1.6's AC hides the whole editor.**
`POST /v1/onboarding/content-source/scratch` takes **no body**
(`onboarding/routes.ts`); it calls `guide.ensureExists` and advances the step.
The only way to write sections anywhere in the system is
`PATCH /v1/guides/:propertyId`. So AC1.6.1 ("I can enter guide sections manually
and continue") requires the full section editor — the same component US1.7 is
about — plus the full-replace save discipline of AC1.7.2, plus ownership-scoped
auth on a different route family. US1.6's two ACs describe a step transition;
its actual surface is US1.7's. Fold AC1.6.1/AC1.6.2 into US1.7 and reduce US1.6
to the wizard step itself, or merge the two.

**D-5. AC1.7.2 understates the guide-save hazard.** The route is
`request.body?.sections ?? []` (`guide/routes.ts`), and the service's
`Array.isArray` guard sits *behind* that default. A `PATCH` with a missing body,
or with the key misspelled, therefore does not return `400` — it returns **`200`
with every section deleted**. The documented `400` only fires when `sections` is
present but not an array. A destructive success response is a materially
different failure mode from a rejected request, and the AC should say so.

**D-5b.** AC1.7.5 forbids prefetch and retry-on-focus. That is the right
instruction, but it is a *configuration* of the data-fetching layer, not
per-component discipline — most mainstream fetching libraries enable
refetch-on-focus by default. Per `team-practices.md` § Code Style ("one API-client
module owns transport"), this belongs as a constraint on that module.

**D-6. US1.4 cannot be verified end to end and does not say so.**
`identity/routes.ts` discards the `{ resetToken }` that
`requestPasswordReset` returns; there is no mailer, no SES construct, no queue.
AC1.4.2 ("Given a valid reset link, when I follow it and set a new password, then
I can log in with it") has no way to obtain a valid link outside a database read.
Every other undeliverable case in this document carries a named caveat
(AC2.4.x/C8, AC1.9.x/FR6.4); this one does not, and it is currently listed as
implementation-ready.

**D-7. AC1.14.2 is not satisfiable.** `subscription/service.ts` — `upgrade` and
`downgrade` both call `requireActive` then `repository.setStatus(accountId,
'active')`. Neither touches `plan`, and only one tier (`standard`) exists. The
response's `plan` field is identical before and after. "Then my plan reflects the
change" can never be observed.

**D-8. US1.9 hides more than its ACs suggest, and AC4.1.1 is too loose.**
`StayService.createStay` takes `{ propertyId, checkIn, checkOut }`
(`guestaccess/service.ts`), and `expiresAt` is derived from `checkOut`
(`guestaccess/repository.ts:35-51`). So "generate a stay link" is really a date-range
form: two date inputs, range validation, a timezone decision (the repository
sets `expiresAt` to `23:59:59.999` **UTC** on the checkout date, which is the
previous evening for a guest in UTC+2), and an empty/managed list of issued
links. None of that appears in AC1.9.1–AC1.9.4.

Separately, AC1.9.3 requires the link to be on the property's own locality
domain — and the frontend has **no way to learn that domain** (same root cause as
D-1; `addLocalityDomain` is internal and write-only). AC4.1.1's "returns the stay
token **or** full link" must be resolved to *full absolute link*, or AC1.9.3 is
unbuildable.

**D-9. US1.10 is two stories, and AC1.10.4 is incomplete.** AC1.10.4 is an
API-client property, not a user-visible behaviour; it belongs with the transport
module the team already affirmed. Two mechanisms it omits:
(a) the client must distinguish a `401` on a resource call (→ refresh once) from
a `401` returned by `/v1/auth/refresh` itself (→ session over), or it loops;
(b) rotation-on-use means **two browser tabs sharing a token store will revoke
each other** — an in-document singleton does not collapse a cross-tab race. Which
of these is in scope depends on OQ3 (token storage), still deferred to
`nfr-design`, so US1.10 cannot be fully specified now. AC1.10.3 also needs a
decision rather than a negative: "not left believing they were saved" admits
both "block and preserve the buffer" and "re-auth in place and replay the
`PATCH`", which are very different builds.

**D-10. FR4.3 has no acceptance criterion anywhere.** `guide/routes.ts`
destructures `const { itemType, itemId } = request.body` with no `?? {}` — the
only handler in the file without it — so a bodyless favourite request returns
`500 INTERNAL_ERROR`, not `400`. US1.12 has five ACs and none covers it.

**D-11. OQ1 (pre-check-in access) is already answered by the deployed code.**
`resolveStayForRequest` checks `expiresAt` only; `checkIn` is stored but never
compared. A link is live from the moment it is created until end of the checkout
date. That is a decision the backend has already made, not an open question — it
should be recorded as such, and if the team wants gated pre-check-in access it is
a *backend* change belonging in US4.1, not a `domain-design` question.

**D-12. Nothing in the API gates any feature on subscription status.** I grepped
for it: no route, service or middleware outside `src/subscription/` reads it.
Cancelling has no functional effect on the guide, the guest link, or chat. US1.13's
benefit clause ("so that I can use the product properly") describes behaviour the
system does not have. Not a frontend defect — but Delivery Planning should not
size US1.13/US1.14 as if entitlement enforcement existed.

---

### 4. Proposed text

**Replace AC1.1.1** (removes the unbuildable half, keeps the real requirement):

> - **AC1.1.1**: Given I am on a domain mapped to a locality-brand, when the
>   signup page loads, then it shows **no locality-selection control anywhere**,
>   and it renders that brand's logo, name and accent colour once a brand-read
>   source exists (AC4.1.7). Until then it renders the unbranded functional
>   default, per FR10.3's degradation rule.

**Add to US1.1**:

> - **AC1.1.6**: Given the frontend origin differs from the API origin, when
>   signup is attempted, then the request reaches the API carrying a `Host` that
>   resolves to this locality-brand. *(The backend resolves the tenant from the
>   request `Host`; a shared API host cannot be registered to more than one brand
>   — `BR9.2`, `409 CONFLICT`. Satisfying this is AC4.1.8's job, not this
>   screen's.)*
>
> **Depends on**: US4.1 (AC4.1.8 — tenancy/host resolution).

**Replace AC1.2.1**:

> - **AC1.2.1**: Given a domain that resolves to no locality-brand, when I reach
>   signup, then I see a neutral, unbranded page reading "Signups aren't
>   available at this address", **with no form at all**. *(This requires a
>   pre-submit brand-resolution read — AC4.1.7. A signup attempt is not an
>   acceptable substitute: the backend validates credentials before it resolves
>   the host, so a probe cannot reach the locality check, and a real attempt
>   consumes the 5/min/IP bucket.)*

**Replace AC1.5.2 and AC1.5.3**:

> - **AC1.5.2**: Given I leave partway through, when I log back in, then I resume
>   at the step `GET /v1/onboarding` reports, with any entries the client still
>   holds restored. *(The API returns `{ currentStep, completed }` only; no
>   owner-facing route reads back the submitted property name, so durable resume
>   of entered values requires client-side persistence — its mechanism is a
>   `domain-design` decision bound by OQ3.)*
> - **AC1.5.3**: Given I move backwards a step, when I do, then the earlier step
>   renders read-only with my entered values shown, and no submission is
>   attempted. *(The backend state machine is forward-only: re-posting a
>   completed step returns `409 CONFLICT` naming the actual current step. An
>   editable back-step would require a backend change.)*

**Add to US1.5**:

> - **AC1.5.7**: Given the client and server disagree about the current step,
>   when a step submission returns `409 CONFLICT`, then the wizard re-reads
>   `GET /v1/onboarding` and navigates to the step the server names, rather than
>   surfacing an error. *(Navigation is server-driven; local step state is a
>   cache.)*

**Replace AC1.7.2**:

> - **AC1.7.2**: Given I save, when the request is sent, then it carries a
>   `sections` array holding the **complete** set of sections. *(The endpoint is
>   a full replace, and a request with a missing or misnamed `sections` key is
>   not rejected — the route defaults it to `[]` before validation, so the guide
>   is emptied and `200` is returned. A malformed save is silently destructive,
>   not an error.)*

**Add to US1.7**:

> - **AC1.7.6**: Given the API-client module is configured, when it is, then
>   automatic refetch-on-window-focus, refetch-on-reconnect and route prefetch
>   are disabled for `GET /v1/guides/:propertyId`. *(AC1.7.5 stated as
>   configuration rather than per-component discipline — most fetching libraries
>   enable these by default.)*

**Replace AC1.14.2**:

> - **AC1.14.2**: Given an active subscription, when I upgrade or downgrade, then
>   the request is accepted and the screen re-renders from the response.
>   *(`upgrade` and `downgrade` are currently no-ops on `plan` — only one tier,
>   `standard`, exists — so no visible plan change can be asserted until real
>   tiers exist.)*

**Add to US1.12**:

> - **AC1.12.6**: Given a favourite or unfavourite is requested, when the request
>   is sent, then it always carries a body containing `itemType` and `itemId`.
>   *(This is the one handler in the guide routes without a `?? {}` fallback: a
>   missing body yields `500 INTERNAL_ERROR`, not a `400` the error module can
>   classify. Closes FR4.3, which currently has no acceptance criterion.)*

**Add to US1.4**:

> **Note**: `POST /v1/auth/reset/confirm` is not exercisable end to end.
> `identity/routes.ts` discards the reset token the service returns; there is no
> mailer and no queue, so the link never arrives. AC1.4.1 and AC1.4.3 are
> testable; AC1.4.2 is verifiable only against a directly-seeded token. Same
> treatment as C8 for chat.

**Add to US4.1** (both are skeleton-blocking; neither is in FR9 today):

> - **AC4.1.7**: A frontend-reachable read exists that returns the locality
>   brand — name, tagline, `visualStyling`, logo — for (a) the current request
>   host, unauthenticated, and (b) the authenticated owner's own property.
>   *(Blocks AC1.1.1, AC1.2.1, AC1.2.2, AC1.5.6 and all of FR10.2. No public
>   route returns locality data today outside the guest stay payload.)*
> - **AC4.1.8**: A frontend origin can make the two host-resolved calls —
>   `POST /v1/accounts` and `GET /v1/stays/:token` — with a `Host` that resolves
>   to the intended locality-brand, whether by same-origin proxy or by
>   per-locality API domains. *(Blocks US1.1 and every Guest story. AC4.1.2's
>   CORS fix permits the request; it does not change the `Host` the browser
>   sends.)*

**Replace AC4.1.1**:

> - **AC4.1.1**: `POST /v1/stays` exists, is owner-authenticated, accepts the
>   stay's check-in and check-out dates, and returns the **full absolute guest
>   link** on the property's own locality domain. *(Returning only the token is
>   insufficient: no frontend-reachable route exposes a locality's domains, so
>   the client cannot construct the URL AC1.9.3 requires.)*

---

## Positions

- AGREE: The two subscription-defence criteria AC1.14.5 and AC1.14.6 — verified line by line against `subscription/routes.ts`; the nested ternary's final `else` is `cancel`, a missing body reaches it, and these are the best-drafted ACs in the set.
- AGREE: AC1.7.2/AC1.7.3 and AC1.7.5 name real backend behaviour, and AC1.7.3 as an explicit regression for AC1.7.2 is exactly the right instinct for a full-replace endpoint.
- AGREE: Making the backend follow-up a single coarse story (US4.1) rather than six — it is one team's one piece of work and Delivery Planning sequences stories, not requirements.
- AGREE: Keeping the Guest set epic-level — none of it is buildable end to end until US4.1 lands, so implementation-ready detail there would be speculative.
- OBJECT: AC1.1.1, AC1.2.1, AC1.2.2 and AC1.5.6 are unbuildable — no frontend-reachable route returns a locality brand, and the gap is in neither FR9 nor US4.1 (D-1; proposed AC4.1.7).
- OBJECT: US1.1 and every Guest story are missing their dependency on the `Host`-header tenancy fix; AC4.1.2's CORS criterion does not address it, so the skeleton would be sequenced as buildable and fail at first run (D-2; proposed AC4.1.8 and AC1.1.6).
- OBJECT: AC1.5.2 and AC1.5.3 demand capabilities the onboarding API does not have — `GET /v1/onboarding` returns only `{ currentStep, completed }`, the property name is not readable back, and `assertStep` makes the machine forward-only (D-3; replacement text supplied).
- OBJECT: US1.6 is not a separate story — `content-source/scratch` takes no body, so "enter guide sections manually" is US1.7's editor in full (D-4).
- OBJECT: AC1.7.2 understates the hazard — a missing or misnamed `sections` key returns `200` with the guide emptied, not `400` (D-5).
- OBJECT: AC1.14.2 cannot pass — `upgrade`/`downgrade` never modify `plan` (D-7).
- OBJECT: US1.4 is marked implementation-ready but AC1.4.2 is unverifiable — the reset token is discarded and no mailer exists — while every comparable case in the document carries a named caveat (D-6).
- OBJECT: The walking-skeleton line encloses ten stories, i.e. most of the Owner app; US1.9 (blocked, no design, hidden date-range surface), US1.4 (undeliverable), US1.10 (API-client infrastructure, and unspecifiable until OQ3 resolves) and US1.6 (not separable) should all come off Bolt 1, leaving US1.1 → US1.3 → US1.5a → US1.7 → US1.8 (D-4, D-6, D-8, D-9).
- OBJECT: FR4.3 has no acceptance criterion anywhere, leaving the one `500`-on-missing-body handler undefended (D-10; proposed AC1.12.6).
- OBJECT: OQ1 is recorded as open but the deployed code has already decided it — a stay link is live from creation until end of the checkout date, `checkIn` is never compared (D-11).
