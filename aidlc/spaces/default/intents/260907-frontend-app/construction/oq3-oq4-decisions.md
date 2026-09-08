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

> **Decision: Next.js, App Router. TypeScript throughout.**

TypeScript was never in question — `team.md` already requires type-aware linting
and a **blocking type-check step distinct from build**, which was the explicit fix
for the `astro build`-vs-`astro check` gap the marketing site never closed.

**Why Next.js was chosen:** the largest ecosystem and hiring pool of the
candidates, route handlers and middleware for any server-side work, and SSR
available where it helps.

**What it does not buy under OQ3's answer** — see the interaction below. This is
the one consequence worth reading twice.

### Alternatives rejected

| Option | Why not |
|---|---|
| React Router 7 (Remix) | Recommended by this analysis — loaders/actions are BFF-shaped and cookie sessions are a core competency — but those are advantages of the *proxy* architecture that OQ3 did not take |
| Vite + React SPA behind a Fastify BFF | Reuses the team's existing Fastify expertise with no framework lock-in; rejected for the bespoke routing and data-loading conventions it would require |
| SvelteKit | Smallest bundles and good ergonomics; rejected for having no precedent anywhere in the workspace and the smallest hiring pool |

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

### The Next.js interaction, stated plainly

Next.js was chosen partly for SSR. **Under bearer tokens, SSR cannot authenticate
the Owner app**: the token is in browser storage, unreachable by the server on the
first request, so every authenticated page is effectively client-rendered after
hydration. The server tier's value is largely unrealised for the Owner surface.

**The Guest surface is the exception, and a useful one.** The stay token is in the
URL path, so a server-side fetch *can* resolve the stay before first paint —
directly serving `AC2.1.1`'s identity-first requirement. But that server fetch
faces the same tenancy problem (M1) and must send the tenant signal itself.

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

`infrastructure-design` can proceed: the framework is chosen, and the hosting
target needs a Node runtime for Next.js plus the ability to set arbitrary response
headers (M4). Static-only hosting is ruled out by the header requirement even
though the proxy is not being built.

`code-generation` is unblocked on the language and framework question. It remains
blocked on the backend prerequisites in `carried-assumptions.md` § B, to which M1
is now added as the most urgent.
