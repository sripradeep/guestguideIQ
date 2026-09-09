# Carried Assumptions and Open Items — GuestGuideIQ Frontend

One place for everything the build is proceeding **on an assumption** rather than
on a settled decision, plus everything recorded as open at a gate. Written at the
human's request so these can be revisited deliberately instead of rediscovered.

Each row names the assumption, why it is reasonable to carry, what it costs if
wrong, and **the trigger that should bring it back**.

Nothing here is a substitute for the artifacts that own each item — this is an
index, and each entry says where the real record lives.

---

## A. Decisions deferred by design, now blocking downstream work

These were deliberately deferred at earlier stages. They are listed first because
`infrastructure-design` and `code-generation` cannot complete without them.

> **A1 and A2 were DECIDED on 2026-09-08** — see `oq3-oq4-decisions.md`.
> Cross-origin bearer tokens with no same-origin proxy, and **Vite + React with
> TypeScript** (A1 was decided twice the same day: Next.js first, then re-decided
> after the hosting choice landed — see A1 and section F). The entries below are
> kept for the reasoning that led there; the decision record supersedes their
> "open" status and adds **four new mandatory items (M1–M4)**, of which **M1 — an
> explicit tenant mechanism — now blocks signup and every guest link outright**.

### A1 — OQ4: the frontend framework and language

**Status:** ~~genuinely unchosen~~ ~~DECIDED: Next.js App Router~~ **DECIDED:
Vite + React, TypeScript — a static single-page build.** Every functional-design
artifact is deliberately framework-neutral, which is what made re-deciding this
cheap: **the framework changed and no unit's spec needed a word altered.**

**Why it was re-decided:** the hosting target became S3 + CloudFront (F1), which
serves a static build only. Next.js under `output: 'export'` loses route
handlers, middleware and SSR — its entire server half — so it would have been
chosen for capabilities and then stripped of them. Full reasoning in
`oq3-oq4-decisions.md` § "Why this changed".

**Revisit trigger:** if the §1 CloudFront proxy is ever adopted *and* a server
tier is wanted with it, the framework question genuinely reopens. Not otherwise —
a static build is a deliberate fit for this hosting choice, not a compromise.

**The reasoning that kept it open, kept because it was vindicated.** The argument
for deferring was that choosing early would write nine units' worth of specs in a
notation the eventual choice might not survive — the same reasoning that led
Contract Design to defer the component specification to `functional-design` (its
Q4 = A). **The framework was then chosen and re-chosen within a day, and the
specs absorbed both without a single edit.** Worth recording as evidence that the
framework-neutral discipline paid for itself, rather than as a still-open item.

**What it blocked:** all of `code-generation`, plus the coverage tooling that
enforces the 80% floor, the linter and type-check configuration, and the
component/E2E test tooling. Those are now unblocked and specified in
`infrastructure-design/cicd-pipeline.md`.

### A2 — OQ3: where the session tokens live

**Status: DECIDED — cross-origin bearer tokens in `localStorage`, no proxy.**
The recommendation was a same-origin proxy, which would have resolved tenancy,
CORS, token storage and the cross-tab refresh race together; the human chose
bearer tokens with the trade-off stated. `oq3-oq4-decisions.md` records what that
leaves unsolved and the four items it makes mandatory. The reasoning below is why
the question mattered.

**Status (historical):** narrowed but not settled. `u3-foundation`'s Q1 = A decided the store
must be **persistent** (the session survives a reload); *which* store is still
open.

**What narrowing cost:** in-memory-only is off the table — the option with no
stored-credential exposure at all. The exposure is concrete: a **7-day,
non-revocable refresh token**, with no revocation endpoint on the backend, sitting
somewhere it survives a reload.

**Constraint this places on `infrastructure-design`:** the hosting target must not
foreclose a same-origin proxy. A same-origin `HttpOnly` cookie is the one
persistent mechanism that keeps that token out of JavaScript's reach. A
static-only host would decide OQ3 against the safest option, silently.

> **Corrected 2026-09-08, and the correction matters.** That last sentence
> conflates "static host" with "bare bucket". **CloudFront is a static host that
> can also be the proxy** — the ALB as a second origin behind `/v1/*`. The
> constraint was satisfied, not violated, by choosing S3 + CloudFront; what would
> genuinely have foreclosed the proxy is S3 website hosting with no distribution.
> `infrastructure-specification.md` §1 carries the full correction, and F1 below
> records why it is worth remembering.

**Also unresolved by it:** `u3-foundation`'s **BR1.6** — the refresh single-flight
must be scoped to the token store, not the document. Two tabs sharing a persistent
store hold the same rotating refresh token and revoke each other. A same-origin
proxy satisfies this by construction; a browser-side store needs a cross-document
lock.

**Revisit trigger:** `nfr-design` / `infrastructure-design`. Record BR1.6 as an
input to that decision, not a footnote.

### A3 — OQ2: whether the guest invalid-link screen is branded

**Status:** decided by ADR-005 in favour of branding, but not buildable.

**Why:** a `410 LINK_INVALID` carries **no body at all**, so there is nothing to
resolve a brand from. This is a different reason from `AC4.1.7`, and the two were
conflated once already (see C1).

**Revisit trigger:** if `AC4.1.7`'s domain-keyed read lands with an
unauthenticated branch, `G-1` becomes brandable.

---

## B. Backend work the frontend was assuming would land — **ALL RESOLVED 2026-09-08**

None of this was frontend work. Each item blocked frontend criteria that were
otherwise fully designed. The existing `AC4.1.x` set is in `stories.md`; the four
below were **generated by this stage**.

> **Every row B0-B4 landed on 2026-09-08** and is adopted in
> `guestguideiq-frontend`. The contract of record for the change is
> `docs/frontend-contract-delta.md` in `guestguideiq-app`
> (`sha256:2a98b676…`, backend commit `70b85ca`), transcribed under BR1.3 and
> verified against the service's own route registrations rather than against the
> document alone. `src/api/contract/PROVENANCE.md` carries both digests.
>
> **The rows are kept rather than struck**, because several of them shaped
> designs whose code now carries comments explaining why it looks the way it
> does — `ExpiryLabel`'s deleted second path, `PlanControls`' reversed Q2 = C,
> `ChatWidget`'s refusal to cache locally. A reader following one of those
> comments needs to be able to see what changed.

| # | Requirement | Blocks | Origin |
|---|---|---|---|
| **B0** | **An explicit tenant mechanism** | **RESOLVED.** Landed as the `X-Locality-Domain` request header, resolved ahead of `X-Forwarded-Host` and `Host`. Sent by `ApiClient` on the five tenant-scoped requests and on nothing else — bearer calls take their tenancy from a verified JWT claim, and marking only the five keeps that visible in a diff. Signup and every guest link work from a browser | **OQ3's answer.** `AC4.1.8` existed already; choosing bearer tokens over a proxy pinned its resolution to this mechanism |
| B1 | An owner-scoped `GET /v1/stays` | **RESOLVED.** `AC1.9.5` is met rather than deferred, and `u7`'s Q3 = C is not overturned but has its premise removed: the objection was never to persistence, it was to persistence ON THE CLIENT, and nothing is written to disk now either | `u7-guest-links` |
| B2 | Time-zone-correct stay expiry | **RESOLVED.** Expiry is the end of the checkout day in the **property's locality time zone**. Both live localities are `America/Phoenix`, so a checkout on the 15th now expires at `07:00Z` on the 16th rather than seven hours early on the 15th | `refined-mockups`, restated by `u7-guest-links` |
| B3 | Does `POST /v1/stays` return `expiresAt`? | **RESOLVED: yes.** Which makes `u7` Workflow 2's step 2 not merely unnecessary but **wrong**, exactly as its own removal trigger predicted — a local recomputation would reproduce the old UTC rule and disagree with the server for every non-UTC locality. Deleted rather than left in | `u7-guest-links` |
| B4 | A property-name edit endpoint | **RESOLVED.** `PATCH /v1/properties/:propertyId`, working at any time. The name was permanent by accident rather than design — the onboarding step was its only writer and asserts the step, so it 409'd once onboarding moved on. `AccountView` now offers the edit | `u5-owner-guide` |

### How `u7`'s three assumptions actually landed

The unit was designed against the internal `CreateStayInput` signature
`{ propertyId, checkIn, checkOut }` (its Q1 = A), with every dependent point
named rather than inherited. All three are now settled, and the pattern is worth
recording: **the assumption the design called cheap was cheaper than predicted,
and the one it called unabsorbable was the one that decided whether the screen
could exist at all.**

| # | Assumed | Landed |
|---|---|---|
| A1 | Request takes `{ propertyId, checkIn, checkOut }` | **Narrower.** The property comes from the verified JWT claim; a body `propertyId` is accepted only to be **403'd if it disagrees**, so sending one can never succeed differently — only fail. `CreateStayRequest` therefore has no `propertyId` at all, which makes the failing request unexpressible. The spec priced A1 landing differently at "one call site here"; it cost less, because the form never saw a request body — the whole change was inside `u3-foundation` |
| A2 | Response returns the **full absolute link** | **Confirmed.** `guestLink` is the whole URL. `null` only when the locality has no domain recorded, which `LinkRow` surfaces as the configuration fault it is rather than blanking. The design was right that this could not be absorbed: there is **no API path from which a browser can learn its locality domain** — `domains` is deliberately withheld from every browser-reachable response |
| A3 | Response carries `expiresAt` | **Confirmed**, and it is now load-bearing rather than convenient. See B2/B3 |

**The fourth gap is NOT closed.** No owner-reachable response carries the
property's or locality's **time zone**, so `u7`'s screen still renders every
moment in the owner's own browser zone. It now names the zone it is showing,
which is the honest form of that limitation rather than a silent one.

**Revisit trigger:** if an owner-reachable time-zone field is ever added, the
expiry label should show the property's zone alongside the owner's.

### A documentation defect found while transcribing, recorded not absorbed

`docs/frontend-contract-delta.md` says the owner surface's locality domain "is
also readable from `GET /v1/accounts/me`". **It is not.** That endpoint returns
the brand's `id`, `name`, `tagline` and `visualStyling`; `domains` is withheld
from every browser-reachable response so a caller cannot enumerate the tenant
estate, and `GET /v1/localities/current` says so in its own source comment.

Under BR1.2 the type follows the document and the difference is raised as a
backend defect — but here the *document* is what is wrong and the service
behaviour is correct and deliberate, so nothing was typed against it. The
frontend takes `X-Locality-Domain`'s value from `window.location.host` instead
(with a `VITE_LOCALITY_DOMAIN` override, because `localhost:5173` is not a
locality domain). In production both surfaces are served FROM the locality's own
host, so one answer serves both.

---

## C. Open findings from the functional-design reviews

Recorded as `Accepted risk` in each unit's `## Review` appendix. Listed here so
they are revisitable in one place.

### C1 — RESOLVED, recorded for the pattern it illustrates

The guest guide's theming was recorded as blocked on `AC4.1.7` in `u8-guest-app`
and `u9-guest-guide-view`. **It never was** — the stay payload carries
`locality.visualStyling` inline. Fixed 2026-09-08 under a Request Changes
decision, and `u3-foundation`'s Workflow 4 was corrected at the root.

**Why it is still listed:** the error was generalising "`AC4.1.7` blocks branding"
from the owner surfaces to the guest surface without re-checking, and it
contradicted `u1-api-contract`, which types the very field. If a similar claim
appears downstream, check it against `u1` first.

### C2 — RESOLVED 2026-09-08

Built in `useShell`: the background onboarding retry is bounded, and on
exhaustion the restriction **stays** with wording that says the app has stopped
trying. A session ending mid-retry abandons it, so a late success cannot drag
the shell back. Covered by two scenarios.

**One thing the tests revealed that the design did not anticipate:** a single
`500` on the onboarding read never reaches the shell at all, because
`u3-foundation`'s BR3.4 retries an indeterminate read up to three times first.
The provisional state is therefore rarer than the design implies — it needs the
whole read budget to fail. That is better behaviour, but it means anyone testing
this path has to exhaust the client's retries to see it.

### C2 (original) — `u4-owner-shell`: the provisional state's failure exit

`authenticated-provisional` has no transition for the background onboarding retry
**itself** failing, nor for a session ending while it is in flight.

**The correction is already drafted** (it was written, then reverted to restore
reviewed bytes): the provisional state must be **stable under failure** — a retry
that exhausts its attempts leaves the restriction in place and says so, because
"we gave up asking" must never be read as "onboarding is complete".

**Cost if unfixed:** an un-onboarded owner could be left able to author a guide.
**Revisit trigger:** before `code-generation` for `u4`.

### C3 — RESOLVED 2026-09-08

Assigned to **`u5-owner-guide`**, which owns the editor and therefore owns the
indicator. A failed save leaves no success indication of any kind.

The implementation detail that matters: the indicator is cleared when a save
**starts**, not when one fails. Clearing on failure still leaves a window in
which a failing save displays the previous save's success — which is exactly the
misleading state the criterion exists to prevent.

### C3 (original) — `AC1.10.3`'s second half is unowned

The criterion has two halves: the editor state is preserved **and** no success
indication is shown for the failed save. `u4` claims both; nothing in `u4` or
`u5` specifies the second.

### C4 — RESOLVED 2026-09-08 with stated defaults

Both values chosen at code generation and named in the source rather than left
implicit:

- **Cold-load timeout: 8s** (`RESOLUTION_TIMEOUT_MS`). A stated default, not an
  inherited one — `NFR5`'s ~300ms governs when a loading treatment appears, not
  how long to wait.
- **The `routing` state now has a screen treatment** — a distinct status message
  from `resolving`, so the two blocking states are not silently the same one.

**Revisit trigger:** `nfr-design`, if it ever wants a different number. The
values are constants precisely so that is a one-line change.

### C5 — `u7-guest-links`: `[assumed]` provenance

The spec attributes `refined-mockups`' two `[assumed]` markers to A1 and A2. They
are actually on **A2 (the full absolute link)** and **link-list persistence**. The
assumptions themselves are all real; only the attribution is wrong.
**Revisit trigger:** cosmetic — fix when `u7` is next opened.

### C6 — `unit-of-work-dependency.md`: stale unit count

"Seven of the **eight** units are blocked on external work" — there are now nine.
The sibling `unit-of-work.md` was corrected. **Revisit trigger:** cosmetic.

### C7 — `u6-owner-locality-billing`: the known favourite-toggle race

Not a defect to fix — a decision taken with its failure named (its Q1 = B). Two
toggles resolving out of order revert the newer one, because the endpoint returns
a whole `OwnerGuideView` snapshot. Recoverable, server state stays correct, and
nothing downstream depends on it until `AC4.1.9`.

**The fix, if wanted:** a per-item sequence number, or serialising per item. Both
local to `FavoriteToggle`. **Revisit trigger:** if guests ever see favourites, or
if the revert is reported as a bug.

---

## D. Planning artifacts not yet updated

### D1 — `delivery-planning/bolt-plan.md` sequences eight units

`u9-guest-guide-view` was added at `functional-design`. The Bolt plan predates it
and has not been revised.

**Resolved in practice, 2026-09-08, without amending the plan.** `u9` was built
inside B1 rather than scheduled separately, because `u5-owner-guide`'s
publication preview (`AC1.8.4`) renders it — B1 could not be finished without it.
That is the answer the plan would have reached: `u9` belongs wherever its first
consumer is, and its first consumer is an owner screen, not the guest app.

**Still worth amending before B2–B4 are scheduled**, since the plan's unit counts
and sizes are now wrong in a document someone will read as authoritative.
**Revisit trigger:** when B2 is picked up.

### D2 — B1 is complete

All five units built, plus `u9`. 144 tests, 92% lines, every gate green.

**What B1's confidence hypothesis asked, and what it answered:** whether the
layering survives contact with five real units — one module reaching the
network, one parsing errors, one owning tokens — and specifically whether the
deliberate `ApiClient`/`SessionManager` cycle resolves cleanly. **It does.**
Injecting the auth calls at construction means no circular import at module
level, and the cycle stays invisible to consumers.

**What it did not answer, exactly as predicted:** whether any of it matches the
real API. Every unit is built against hand-written fixtures that have never met
the deployed backend. That stays open until M1 and M2 land.

**The override's cost, assessed honestly.** B1 dropped the "thin" third of the
walking-skeleton mandate and built five complete units before demoing. The
mitigation was ordering — build the skeleton path first and demo there — and it
worked: **the skeleton's first run found a real defect** (signup never adopting
its tokens) that would otherwise have surfaced much later and against more code.
The deferred discovery the override risked did not materialise, but that is one
sample, not a vindication of the general trade.

---

## E. Workflow-record items (not design)

### E1 — Line endings and review receipts

The `git rebase` on 2026-09-08 converted every workspace file to CRLF, which
invalidated a pending review receipt bound to the pre-rebase LF bytes. Recovered
by converting that unit's artifacts back to LF.

**Carry-forward:** AI-DLC review receipts are byte-fingerprinted, so **any**
whole-tree line-ending change invalidates open receipts. Record verdicts before
rebasing, or expect to re-review.

### E2 — Findings carried as `Accepted risk`

Every item in section C is recorded in its unit's review appendix with that
status, which is the honest disposition: reviewed, understood, and knowingly not
fixed yet. None is hidden in prose.

---

## F. Infrastructure-design decisions and their open edges

Added 2026-09-08 when `infrastructure-design` ran. The stage's own artifacts are
the record; these are the rows that should come back.

### F1 — Hosting: S3 + CloudFront, chosen by the human

**Not an assumption** — chosen deliberately after the alternative was put and its
cost stated. Recorded here because two things follow from it that are easy to
lose.

**The correction it forced.** An earlier draft of `infrastructure-specification.md`
chose ECS Fargate partly on the claim that S3 + CloudFront had "no real Node
runtime for a future proxy". **That was wrong.** CloudFront can be the proxy
itself — the ALB as a second origin behind `/v1/*`, forwarding the viewer's
`Host`. The correction is disclosed in place at the top of that specification.

**The escape route this keeps open, and why it matters.** Adopting that proxy
would make the API same-origin, allow `HttpOnly` cookies, **resolve M1 with no
backend change at all**, and dissolve M2. It is one distribution change, not a
migration. `OQ3` was decided against it and that stands — but this is the
cheapest available answer to the M1 blocker, and it should be on the table the
moment M1 becomes painful rather than rediscovered then.

**Revisit trigger:** when M1 is scoped as backend work. Compare "backend accepts
`X-Locality-Domain`" against "CloudFront proxies `/v1/*`" before starting, since
the second requires no backend change.

#### F1 — the comparison was made on 2026-09-08. **The proxy was DECLINED.**

The revisit trigger fired as intended and the two options were compared before
adoption rather than after. `X-Locality-Domain` was taken; the CloudFront proxy
was not. Recorded here because the trigger asked for the comparison, and a
comparison whose result is not written down has to be made again.

**Why declined, in order of weight:**

1. **The distribution does not exist.** `F1` is written as "one distribution
   change, not a migration", and that is true of a distribution that has been
   created. This repo has no `infra/` directory and no IaC of any kind —
   `environment-provisioning` ran out of sequence, could not complete, and
   provisioned nothing (`section G`). So the cheap option is cheap relative to a
   starting point that was never reached.
2. **Tenancy that way reintroduces the per-locality coupling, more expensively.**
   The proxy resolves tenancy by forwarding the viewer's `Host`, which means
   every locality domain must be an **alias on the distribution**, with an ACM
   certificate covering it. Adding a brand then means a certificate re-issue,
   DNS validation and a distribution update — the slowest loop in provisioning,
   named as such in `G1`'s Q4. `M2`'s actual complaint was that adding a brand
   required a backend deployment; the wildcard `ALLOWED_ORIGIN_SUFFIXES` the
   header shipped alongside means a new `*.guestguideiq.com` frontend needs **no
   config change anywhere**. The proxy would have replaced a deployment with a
   certificate re-issue, which is worse.
3. **The header landed and is deployed.** Comparing a shipped mechanism against
   an unbuilt one is not a fair comparison of costs, and it is the comparison
   actually in front of anyone reading this today.

**What declining it costs, stated rather than glossed.** The proxy would also
have made the API same-origin and allowed `HttpOnly` cookies — which is the
`OQ3` exposure, not the `M1` one. That trade is **unchanged and still open**: a
7-day, non-revocable refresh token in `localStorage`, readable by any injected
script. `POST /v1/auth/logout` has since made it revocable *when the owner signs
out*, which narrows the window without closing it. The CSP (`F2`) and the
raw-HTML lint ban remain the mitigations.

**Revisit trigger, revised:** if `HttpOnly` cookies are ever wanted, or if a
server tier is wanted for another reason. **Not** for tenancy — that question is
settled, and reopening it would mean unpicking a working header to buy a
certificate management problem.

### F2 — CSP hashes: **RESOLVED 2026-09-08, and better than the fallback**

**Original risk.** A nonce must be unique per response, which needs a server
rendering the HTML. There isn't one, so the plan was build-generated hashes
applied by the deploy — a build/deploy coupling with **no CI-visible failure
mode**: a hand-edited policy, or an inline script added without regenerating
hashes, would break the app in the browser and pass every test.

**Resolution.** The revisit trigger said to prefer emitting zero inline scripts
if it turned out to be straightforward in Vite. **It is one flag** —
`build.modulePreload.polyfill: false` in `vite.config.ts` drops the modulepreload
polyfill, which is the only inline script a default Vite build emits.
**Verified against a real build:** `dist/index.html` contains zero inline
`<script>` blocks.

**So the deployed CSP is `script-src 'self'` with no hashes at all**, and the
coupling never exists. `infrastructure-specification.md` §5 is updated.

**What replaces the risk, smaller but real:** the property must stay true.
Anything that reintroduces an inline script — a library that injects one, an
analytics snippet, a hand-edit to `index.html` — silently breaks the deployed CSP
while passing local dev, where no CSP is applied. **The post-deploy check
asserting a real page load produces no CSP violation (`cicd-pipeline.md` §5) is
still the thing that catches it**, and is now the only thing.

**Accepted consequence:** no modulepreload in browsers without native support.
`NFR9` scopes support to current evergreen browsers, all of which have it.

**Revisit trigger:** if an inline script is ever genuinely needed. Read
`infrastructure-specification.md` §5 before adding one.

### F3 — Rollback has no automatic trigger

The backend's ECS circuit breaker has genuinely fired and rolled back a bad
deploy. **Nothing equivalent exists here.** Rollback is re-uploading the previous
`index.html` and invalidating it, triggered by a failing post-deploy check, and
it works only because superseded assets are never deleted.

**Recorded as honest rather than solved:** a documented two-command rollback for
a single responder is a real capability; a half-built automation that has never
fired is not. **Revisit trigger:** if a failed deploy is ever handled slowly
enough to matter, or when asset retention (below) is decided.

### F4 — Asset retention is undecided, and rollback depends on it

Superseded builds' assets must outlive the longest plausible in-flight session,
because both rollback and mid-session asset loads depend on them. No lifecycle
policy is specified. **Revisit trigger:** `environment-provisioning`. Decide it
with the rollback runbook, not separately.

### F5 — The live-backend E2E suite cannot run yet

`team.md`'s Q5 answer requires it as the drift detector against hand-written
fixtures. It is blocked on M1 (signup and guest links both fail) and M2 (no
origin is allowlisted). **Specified in `cicd-pipeline.md` §5 and deliberately not
stubbed with an `echo`**, which is the exact anti-pattern `team.md` names in the
backend's pipeline. **Revisit trigger:** when M1 and M2 land.

### F6 — `nfr-design` did not run for eight of nine units

`infrastructure-design` formally consumes five `nfr-design` artifacts;
`nfr-design` has run for `u1-api-contract` only. The specification is therefore
derived from `requirements.md`'s NFR1–NFR9, `team.md`, and M1–M4, with each
derivation named where used.

**Cost if wrong:** a per-unit NFR could surface a requirement the single shared
specification does not meet. Low risk, since there is one deployable — but it is
a genuine gap in the stage's inputs, not a formality. **Revisit trigger:** if
`nfr-design` is later run for the remaining units, re-read §4 and §5 against it.

---
---

## G. Environment-provisioning items

Added 2026-09-08. The stage was run **out of sequence** (it is 4.2; the workflow
pointer is still at 3.1) and **could not complete**: nothing is provisioned, the
session had no AWS credentials, and its second declared input `cd-config` does not
exist because `deployment-pipeline` has not run. Its artifacts are a target and a
set of defined checks, both labelled as such.

### G1 — Seven provisioning decisions carried as assumptions

All seven answers in `environment-provisioning-questions.md` are
**orchestrator-selected, not human-chosen**, per the standing instruction to carry
forward on documented assumptions. Two want a human before anything is created:

- **Q4 — which domains exist.** No locality domain has been named anywhere in this
  intent, and `AC1.9.4` requires guest links to live on one. The certificate SAN
  list and the distribution aliases both derive from it, and adding a domain later
  means certificate re-issue + DNS validation + distribution update — the slowest
  loop in provisioning. **Revisit trigger:** before the certificate is requested.
- **Q6 — no WAF.** Carried from the backend's deferral, but the reasoning is
  weaker here: the guest surface is public and unauthenticated, the backend's rate
  limiter is per-process across 2–6 tasks, and a stay token is non-revocable, so
  brute force against `/s/*` has no mitigation anywhere today. **Revisit trigger:**
  before the first real locality goes live with real guests.

### G2 — Rollback has never been exercised, and there is no mechanism that would

Recorded in F3 as a design fact; it becomes a **testable obligation** here as
check V16. The backend has genuine rollback evidence because its ECS circuit
breaker really fired. There is no equivalent here, so the only way to know
rollback works is to perform one deliberately in staging.

**Revisit trigger:** at provisioning. Do not let V16 be the check that gets
skipped because everything else passed.

### G4 — M3 (the cross-tab refresh lock) is **BUILT** 2026-09-08

`u3-foundation`'s `refreshLock.ts` implements BR1.6 with the Web Locks API, and
`sessionManager.ts` re-reads the token store *after* acquiring the lock — so a
tab that queued behind another tab's refresh uses the token that tab obtained
rather than rotating a valid one away. That re-read is what makes the lock
cooperation rather than mere serialisation, and it is easy to omit.

Covered by tests for the collapse, the two session-ending paths, and the
post-refresh-retry rule. **Not yet verified across two real browser tabs** —
`jsdom` has no Web Locks, so the unit tests exercise the *fallback* path, not
the locked one.

**Revisit trigger:** during `build-and-test`, open two real tabs and confirm one
refresh goes out. This is the single most valuable manual check in the build,
because the failure mode is an owner being signed out at random.

### G5 — The Web Locks fallback runs unlocked

Where `navigator.locks` is unavailable (Safari before 15.4, and `jsdom`),
`withRefreshLock` runs the task without a lock rather than failing.

**Why that direction:** the alternative is that such a browser cannot refresh at
all and the session ends on the first `401`. Degrading to *today's behaviour* —
in-document single-flight, cross-tab race still present — beats degrading to
*signed out*.

**What it costs:** on those browsers M3 is not actually fixed, silently. Nothing
reports it.

**Revisit trigger:** if the supported-browser floor (`NFR9`) is ever written
down precisely. If Safari 15.4+ is the floor, the fallback can become an error
instead, which would make the gap visible rather than silent.

### G3 — The frontend repository: **RESOLVED 2026-09-08**

Created as `sripradeep/guestguideiq-frontend` (private, matching the backend),
checked out at `C:\Projects\guestguideIQ\guestguideiq-frontend` — an immediate
child of the workspace root, sibling to `guestguideiq-app`, per the multi-repo
convention `project.md` records for the backend. Ignored in the outer repo's
`.gitignore` with the same anchored pattern, so its nested `.git` is never
tracked here.

Scaffolded with Vite + React + TypeScript and every affirmed gate wired as
blocking. `npm run verify` — format, lint, type-check, test with coverage, build
— passes.

---

## How to use this document

- **Before `infrastructure-design`:** ~~read A1, A2 and A3~~ — **that stage has
  run.** Its decisions and their open edges are section F.
- **Before wiring the build and deploy:** read F2 and F3. F2 is the one with no
  CI-visible failure mode, which makes it the likeliest to bite.
- **When M1 is scoped as backend work:** read F1 first. The CloudFront proxy
  resolves M1 with no backend change, and comparing the two is a five-minute
  exercise that is worthless once the backend change is half-built.
- **Before `code-generation` for a given unit:** read section C for that unit.
  C2 and C3 are the two that would produce wrong behaviour rather than imprecise
  documentation.
- **When the backend follow-up is scoped:** read section B and add B1–B4 to
  `US4.1`.
- **When any of these is settled:** update the owning artifact first, then strike
  the row here. This document is an index, never the source of truth.
