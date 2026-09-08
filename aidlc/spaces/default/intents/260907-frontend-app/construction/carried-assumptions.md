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

## B. Backend work the frontend is assuming will land

None of this is frontend work. Each item blocks frontend criteria that are
otherwise fully designed. The existing `AC4.1.x` set is in `stories.md`; the four
below were **generated by this stage** and are not yet in it.

| # | Requirement | Blocks | Origin |
|---|---|---|---|
| **B0** | **An explicit tenant mechanism (`X-Locality-Domain` or a path/body parameter)** | **Signup (`404 LOCALITY_NOT_RESOLVED`) and every guest stay link (`410 LINK_INVALID`).** The most urgent item on this list | **OQ3's answer.** `AC4.1.8` existed already; choosing bearer tokens over a proxy pins its resolution to this mechanism and makes it a hard prerequisite |
| B1 | An owner-scoped `GET /v1/stays` | `AC1.9.5` beyond a single session — a stay link cannot be re-derived from anything an owner can reach | `u7-guest-links` |
| B2 | Time-zone-correct stay expiry | Nothing formally, but expiry is computed as `setUTCHours(23,59,59,999)` on the checkout date, so a UTC−5 property's link dies at **18:59 on checkout day**, before the guest has left | `refined-mockups`, restated by `u7-guest-links` |
| B3 | Does `POST /v1/stays` return `expiresAt`? | Determines whether `u7`'s local expiry computation is needed at all | `u7-guest-links` |
| B4 | A property-name edit endpoint | Nothing formally. The name typed once at onboarding is permanent **and is the guest's trust cue** — a typo is visible to every guest forever | `u5-owner-guide` |

**Assumption being carried:** that `AC4.1.1` (`POST /v1/stays`) will land with a
request shape compatible with the internal `CreateStayInput` —
`{ propertyId, checkIn, checkOut }`. `u7`'s three named assumptions (A1/A2/A3 in
its own spec) are the detail. **A2 is the one that cannot be absorbed:** if the
endpoint returns a bare token rather than a full absolute link, no client code can
construct the link, because the frontend does not know the locality domain.

**Revisit trigger:** whenever the backend follow-up is scoped. B1–B4 should be
added to `US4.1` rather than living only here.

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

### C2 — `u4-owner-shell`: the provisional state's failure exit

`authenticated-provisional` has no transition for the background onboarding retry
**itself** failing, nor for a session ending while it is in flight.

**The correction is already drafted** (it was written, then reverted to restore
reviewed bytes): the provisional state must be **stable under failure** — a retry
that exhausts its attempts leaves the restriction in place and says so, because
"we gave up asking" must never be read as "onboarding is complete".

**Cost if unfixed:** an un-onboarded owner could be left able to author a guide.
**Revisit trigger:** before `code-generation` for `u4`.

### C3 — `u4-owner-shell`: `AC1.10.3`'s second half is unowned

The criterion has two halves: the editor state is preserved **and** no success
indication is shown for the failed save. `u4` claims both; nothing in `u4` or
`u5` specifies the second. **Revisit trigger:** before `code-generation` for `u4`
or `u5` — assign it explicitly to one of them.

### C4 — `u4-owner-shell`: two unspecified values

The cold-load timeout has no value (`NFR5`'s ~300ms governs when the loading
treatment appears, not how long to wait), and the `routing` state has no listed
screen treatment on the cold-load path. **Revisit trigger:** `nfr-design`, or
`code-generation` with a stated default.

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
and has not been revised. **Revisit trigger:** before Construction sequencing is
used to schedule work.

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
