# OQ3 and OQ4 — decided

The two open questions that gated `infrastructure-design` and all of
`code-generation`. Decided by the human on 2026-09-08, ahead of the
`infrastructure-design` stage that formally owns them, so the build could carry
forward.

Written as a decision record rather than stage output: the `functional-design`
approval stamp is outstanding (see `carried-assumptions.md` § E), and these
decisions do not depend on it.

---

## OQ4 — Framework and language

> **Decision: Vite + React, TypeScript. A static single-page build.**
> *Superseded Next.js App Router the same day — see "Why this changed".*

TypeScript was never in question — `team.md` already requires type-aware linting
and a **blocking type-check step distinct from build**, which was the explicit fix
for the `astro build`-vs-`astro check` gap the marketing site never closed.

### Why this changed

Next.js was chosen first, for its ecosystem and hiring pool and for SSR where it
helps. Then the hosting question was asked properly, and the answer moved to
**S3 + CloudFront** (see `infrastructure-specification.md` §1).

S3 + CloudFront can only serve a **static build**. Under Next.js that means
`output: 'export'`, which removes route handlers, middleware and SSR — that is,
Next.js's entire server half. **Choosing a framework for capabilities and then
amputating them is not a trade-off, it is a mismatch.** Vite + React produces the
same static bundle with far less machinery in the way.

**What the switch actually costs:** the server-rendered Guest first paint. That was
Next.js's one remaining benefit under `OQ3`'s answer, and it is a *speed*
improvement rather than a requirement — `AC2.1.1` is satisfied by the skeleton
that `AC2.5.1` already specifies, followed by the identity-first paint order that
`u9-guest-guide-view` owns. **No functional-design artifact changes.**

**What the switch avoids:** a Next.js app whose route handlers, middleware and
rendering model are all unused, and whose learning curve buys nothing.

### Alternatives rejected

| Option | Why not |
|---|---|
| **Next.js App Router** | Chosen first, then superseded. Under a static export its server half is unused, so its main advantages do not apply |
| React Router 7 (Remix) | Recommended in the original analysis — loaders/actions are BFF-shaped and cookie sessions a core competency — but those are advantages of the *proxy* architecture that `OQ3` did not take, and of a server tier this hosting choice does not have |
| SvelteKit | Smallest bundles and good ergonomics; rejected for having no precedent anywhere in the workspace and the smallest hiring pool |

### What Vite + React must supply that a framework would have

These are the conventions the team now owns rather than inherits. None is hard;
all are easy to leave inconsistent:

- **Routing** — a client router, with the route table `u4-owner-shell` specifies.
- **Data loading and caching** — `u3-foundation` already owns the API client and
  its typed methods, so this is thinner than usual. Its BR3.5 requires
  refetch-on-focus and prefetch to be **off**, which is a configuration decision
  that must be made explicitly rather than inherited from a framework default.
- **Code splitting** — per route, so the Guest surface does not ship the Owner
  app. This matters: the guest is mobile-first and often on hotel wifi.
- **The build's static-hosting shape** — SPA fallback routing, so
  `/s/<token>` and every Owner route resolve to the app shell (see
  `infrastructure-specification.md` §4).

---

## OQ3 — Token storage and tenancy

> **Decision: cross-origin bearer tokens. No same-origin proxy.**

The frontend is a client calling the API cross-origin. Access and refresh tokens
live in browser storage and travel in the `Authorization` header.

### What this decision does not solve

The recommendation was a same-origin reverse proxy, because **four blockers share
that one solution**. Taking bearer tokens instead leaves each of them to be solved
separately. Recorded so the cost is visible, not to reopen the decision:

| Blocker | Status under this decision |
|---|---|
| Host-header tenancy (`AC4.1.8`) | **Still unsolved.** Now requires an explicit tenant header or path/body parameter — a backend change, and now a hard prerequisite rather than one option among several |
| CORS (`AC4.1.3`) | **Still required, and now recurring.** Every frontend origin must be added to the backend's `domainConfig` and redeployed |
| Token storage | Bearer tokens in browser storage. A **7-day, non-revocable** refresh token, on a product with **no revocation endpoint** |
| `u3`'s BR1.6 cross-tab refresh | **Still unsolved.** Needs an explicit cross-document lock; the proxy would have made it impossible by construction |

### Four things this makes mandatory

**M1 — `AC4.1.8` must be resolved as an explicit tenant mechanism.**
`POST /v1/accounts` and `requireStayToken` resolve the locality from the request's
own `Host`. A cross-origin browser sends the *frontend's* host, which cannot be
registered against every brand — `BR9.2` forbids it with a `409 CONFLICT`. So the
backend must accept an explicit tenant signal (`X-Locality-Domain`, or a path/body
parameter). **Until this lands, signup returns `404 LOCALITY_NOT_RESOLVED` and
every guest stay link returns `410 LINK_INVALID`, whatever the frontend does.**

**M2 — the CORS allowlist becomes an operational coupling, not a one-off.**
Production's `allowedOrigins` is exactly `['https://guestguideiq.com']`; `dev` and
`staging` have no entry at all and refuse every cross-origin call. Each frontend
origin — development, CI, staging, production, **and each locality domain** —
needs adding and a backend redeploy. Adding a locality becomes a backend
deployment, which is worth knowing before the second locality exists.

**M3 — a cross-document lock for the refresh single-flight (`u3` BR1.6).**
Refresh tokens rotate and the backend's store is per-process across 2–6 tasks. Two
tabs sharing browser storage hold the same token; whichever refreshes second is
rejected and that tab's session ends. `u3`'s in-document single-flight does not
span tabs. The Web Locks API is the standard mechanism; **this is now real code to
write and test**, and it belongs to `u3-foundation`.

**M4 — CSP becomes the primary XSS mitigation, and load-bearing.**
A successful XSS yields a week-long account compromise that cannot be revoked. The
`team.md` constraint that the hosting target must be able to set arbitrary
response headers is now a **hard requirement**, not a nice-to-have. Two
attacker-influenceable values already reach this frontend — LLM chat replies and
`locality.visualStyling` — and the blocking lint rule banning raw-HTML sinks is
the other half of the defence.

### The rendering interaction, stated plainly

This is the reasoning that connects `OQ3` to `OQ4`, and it is why the framework
switch costs so little.

**Under bearer tokens, server rendering cannot authenticate the Owner app.** The
token is in browser storage, unreachable by a server on the first request, so
every authenticated page is client-rendered after hydration no matter which
framework serves it. A server tier earns nothing on the Owner surface.

**The Guest surface was the exception.** The stay token is in the URL path, so a
server-side fetch *could* resolve the stay before first paint. Under a static
build it does not, and the guest gets the `AC2.5.1` skeleton followed by an
identity-first paint instead — slower to the first real content, and still
correct. That server fetch would also have faced the same tenancy problem (M1)
and had to send the tenant signal itself, so it was never free.

**Net:** `OQ3`'s answer removed most of the value of a server tier, and the
hosting decision removed the rest. That is the honest reason `OQ4` could be
re-decided without touching a single functional-design artifact.

### Assumption carried, for revisit

**Storage mechanism: `localStorage`.** `u3`'s Q1 = A requires the session to
survive a reload *and* a new tab, which rules out `sessionStorage`. `IndexedDB`
offers no security advantage over `localStorage` against XSS — both are readable
by injected script — so the simpler mechanism was assumed.

Namespaced per account, and holding **tokens plus `accountId`/`propertyId` only**;
the API has no current-user endpoint, so those two ids are learned from the
signup, login or refresh response and must be persisted alongside the tokens.

**Revisit trigger:** if a same-origin proxy is ever adopted, this whole section is
replaced by `HttpOnly` cookies and M1–M4 mostly dissolve.

---

## What is now unblocked

`infrastructure-design` can proceed. The framework is chosen, and the hosting
target's two hard requirements are settled:

1. **It must set arbitrary response headers** (M4). CloudFront response-headers
   policies do this, so the constraint that ruled out naive static hosting is
   satisfied — the requirement was never "a Node process", it was "control of
   the response".
2. **It must not foreclose the same-origin proxy**, per `team.md`. **It does
   not.** CloudFront can *be* the proxy: add the ALB as a second origin behind a
   `/v1/*` cache behaviour, with an origin request policy forwarding the
   viewer's `Host`. That is a distribution change, not a platform migration —
   see `infrastructure-specification.md` §1. This is worth stating plainly
   because the earlier draft of that spec said the opposite.

**The consequence worth carrying:** because CloudFront can become the proxy
later, M1–M4 have a cheap escape route that this hosting choice deliberately
keeps open. Adopting it would move the frontend to same-origin, allow `HttpOnly`
cookies, resolve the `Host`-header tenancy problem without a backend change, and
dissolve the CORS coupling. **It is not being built now** — `OQ3` was decided
the other way — but it is one distribution change away rather than a rebuild.

`code-generation` is unblocked on the language and framework question. It remains
blocked on the backend prerequisites in `carried-assumptions.md` § B, to which M1
is now added as the most urgent.
