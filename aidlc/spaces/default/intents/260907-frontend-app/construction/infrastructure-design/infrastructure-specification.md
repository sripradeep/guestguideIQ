# Infrastructure Specification — GuestGuideIQ Frontend

> **Scope note.** `unit-of-work.md` states that units are build-time and ownership
> boundaries, **not deployment targets**: the Owner and Guest surfaces deploy
> together, and every unit ships in the same artifact. There is therefore **one
> infrastructure specification for one deployable**, not nine near-identical
> per-unit copies. Each unit's traceability points here.

> **Input note.** This stage formally consumes five `nfr-design` artifacts.
> `nfr-design` has run for `u1-api-contract` only, so the requirements below are
> derived from `requirements.md`'s NFR1–NFR9, `team.md`'s affirmed deployment and
> security practices, and the M1–M4 constraints in `oq3-oq4-decisions.md`. Every
> derivation is named where it is used. Recorded in `carried-assumptions.md`.

> **Revision note, 2026-09-08.** An earlier draft of this specification chose
> **ECS Fargate behind an ALB**, on the reasoning that a Node runtime was needed
> both to keep the same-origin proxy open and to serve arbitrary response headers.
> **The first half of that reasoning was wrong** and is corrected in §1: CloudFront
> can be the proxy itself. The human then chose S3 + CloudFront, which reopened and
> re-decided `OQ4` (Vite + React rather than Next.js). Everything below is the
> revised design; the superseded reasoning survives only where it explains a
> constraint that still applies.

---

## 1. Hosting target

> **Decision: S3 for the built assets, CloudFront in front of it.** Chosen by the
> human on 2026-09-08, after the framework question was reopened against a static
> target. Pairs with `OQ4` = Vite + React, a static single-page build.

**Why this is sufficient, taken requirement by requirement.** `team.md` placed two
hard constraints on this choice, and each was worth checking against what
CloudFront actually does rather than against what "static hosting" suggests:

| Constraint from `team.md` | Met? | How |
|---|---|---|
| Must be able to set **arbitrary response headers** (M4 makes this load-bearing) | **Yes** | CloudFront **response headers policies** set CSP, HSTS, `Referrer-Policy` and the rest on every response, per cache behaviour. The requirement was control of the response, not a Node process |
| Must **not foreclose a same-origin proxy** | **Yes** | See below — this is the half the earlier draft got wrong |

### The proxy correction, stated plainly

The superseded draft claimed S3 + CloudFront offers "no real Node runtime for a
future proxy", implying the same-origin proxy was foreclosed. **It is not.**

**CloudFront can be the same-origin proxy itself.** Add the backend's ALB as a
**second origin** on the same distribution, behind a `/v1/*` cache behaviour, with
an origin request policy that forwards the viewer's `Host` header. The browser then
talks to one origin for both the app and the API. That would:

- make the API **same-origin**, so `HttpOnly` cookies become available and the
  bearer-token exposure behind M4 largely dissolves;
- **solve the `Host`-header tenancy problem (M1) with no backend change at all** —
  the viewer's `Host` *is* the locality domain, which is exactly what the backend
  already reads;
- **remove the CORS coupling (M2)** entirely, since there is no cross-origin call
  left to allowlist.

This is **a distribution change, not a platform migration** — which is the whole
point of recording it. `OQ3` was decided against the proxy and that decision
stands; this hosting choice keeps the escape route cheap rather than closing it.

**What this costs against the ECS option.** No server-rendered guest first paint —
the guest gets the `AC2.5.1` skeleton, then an identity-first paint. That is slower
to first real content, and it is the honest cost. What it buys: no containers, no
task sizing, no ALB, no autoscaling, no patching, and a bill close to nothing at
this traffic level.

**Rejected:**

| Option | Why not |
|---|---|
| **ECS Fargate + ALB + CloudFront** | The design this replaces. A whole container tier whose only unique capability — server rendering — is unusable on the Owner surface under `OQ3`'s bearer tokens and merely nice-to-have on the Guest surface. It was chosen partly on the mistaken belief that the proxy required it |
| AWS Amplify Hosting | Less header and routing control, and it makes the second-origin proxy no easier |
| Vercel | A second vendor beside an all-AWS stack, with guest and owner data transiting a third party, and split ops |
| S3 static website hosting **without** CloudFront | Cannot serve HTTPS on a custom domain, cannot set security headers, cannot become the proxy. **This is the option `team.md` was right to rule out** — the constraint was never against S3, it was against a bare bucket |

---

## 2. The multi-domain problem

Each locality brand has **its own domain** — the guest link must be a full absolute
link on the property's own locality domain (`AC1.9.4`), and the backend resolves
tenancy from the request `Host`.

| Concern | Design |
|---|---|
| Certificate | One **ACM certificate in `us-east-1`** (CloudFront requires that region regardless of where everything else lives) covering the locality domains as SANs, or a wildcard where they share a root. The backend already hardcodes a production certificate ARN — do **not** repeat that; publish the ARN via SSM or a stack output |
| DNS | One record per locality domain, aliased to the CloudFront distribution |
| Distribution | **One** distribution with every locality domain as an alternate domain name. One origin, one deployment, many hostnames |
| Routing | The app reads the browser's own hostname to know which locality it is serving. **Nothing is per-locality at the infrastructure layer** — brand resolution is data, not deployment |

**CloudFront's alternate-domain-name ceiling is 100 by default.** Not a concern now;
worth knowing it exists before the hundredth locality, because the fix (a quota
increase, or a second distribution) is not something to discover late.

**The operational coupling (M2).** Because the frontend is cross-origin, each new
locality domain must **also** be added to the backend's CORS `domainConfig` and the
backend redeployed. Adding a locality is therefore a two-repository change:
DNS + certificate SAN + distribution alias here, CORS allowlist there.

**Onboarding a locality is a runbook, not a code change.** Write it as one, listing
every step, because they are easy to forget and the failure mode is a
`404 LOCALITY_NOT_RESOLVED` at signup that looks like an application bug.

---

## 3. The stay token is a credential in a URL

**This is the most important finding in this specification, and it is
infrastructure's to solve rather than the application's.**

A guest link is `https://<locality-domain>/s/<token>`. That token is a **live,
non-revocable credential** — anyone holding it can read the guide, and nothing in
the API invalidates a stay link early. Putting a credential in a URL path has
consequences only infrastructure can address:

| Leak path | Mitigation |
|---|---|
| `Referer` header on any outbound request | **`Referrer-Policy: no-referrer`** on guest routes. Not `strict-origin-when-cross-origin` — that still sends the origin, and the safe default here is to send nothing |
| **CloudFront access logs** | They record the full request path, so **they contain live credentials**. Either omit the URI field, or classify the log bucket as credential-bearing: encrypted, short retention, tightly scoped read access |
| **The CloudFront cache key** | New under this hosting choice, and easy to miss. The default cache key includes the path, so `/s/<token>` responses would be cached **per token at the edge**. See §4 — `/s/*` must not be cached |
| Browser history and shared devices | Cannot be mitigated by infrastructure. Worth recording as a product-level property of link-based access |
| Third-party scripts | There are none, and the CSP in §5 keeps it that way |

**None of this is hypothetical.** `u7-guest-links` already establishes that a stay
link cannot be re-derived and has no revocation path, which is exactly why a leak
matters.

---

## 4. Build shape, routing and caching

**A static bundle in S3.** No runtime, no rendering tier. The build is HTML, JS, CSS
and assets; every route resolves client-side.

### SPA fallback routing

`/s/<token>` and every Owner route are **client routes with no corresponding S3
object**. S3 would return a miss, so the distribution must serve the app shell
instead:

- A **CloudFront Function** on viewer request, rewriting any non-asset path to
  `/index.html`, is the precise mechanism, and it can branch per route family.
- The blunter alternative — a custom error response mapping `403`/`404` to
  `/index.html` with a `200` — works, but turns *every* genuine miss into the app
  shell, including a mistyped asset path. Prefer the function; it costs little and
  keeps real 404s real.

**Use Origin Access Control**, so the bucket stays private and is reachable only
through the distribution. A public bucket would bypass every header policy in §5.

### Caching policy — the part that must be deliberate

| Path | Policy | Why |
|---|---|---|
| Hashed assets (`/assets/*`) | `max-age=31536000, immutable` | Vite content-hashes filenames, so a changed file is a changed URL. This is where the CDN earns its keep |
| `/index.html` | **No store, or a very short TTL with revalidation** | The shell names the current asset hashes. A stale shell points at assets that may no longer exist, and the app breaks after a deploy |
| **`/s/*`** | **Never cached** | The path *is* the credential (§3). Caching per-token responses at the edge stores guest data keyed by a secret, and a cache hit would also outlive stay expiry. A **correctness and security requirement**, not a tuning choice |
| `/v1/*` | **Not applicable today** | Reserved. If the §1 proxy is ever adopted, this behaviour is where it lands — and it too must not cache |

**Invalidate `/index.html` on every deploy.** With immutable hashed assets that is
the only invalidation needed, and it is cheap. Do not invalidate `/*` by reflex.

### Rendering, per surface

| Surface | Rendering | Why |
|---|---|---|
| Guest (`/s/<token>`) | Client-rendered, skeleton first | `AC2.5.1`'s skeleton, then the identity-first paint order `u9-guest-guide-view` owns. Slower to first content than SSR would be; still meets `AC2.1.1`'s ordering requirement |
| Owner (authenticated) | Client-rendered | Unchanged by this decision — under bearer tokens it was always client-rendered after hydration |
| Unauthenticated Owner screens | Client-rendered | No session to read, so nothing is lost |

**Code splitting is now an infrastructure-adjacent concern**, because there is no
server to compensate. Split per route so the guest — mobile, often on hotel wifi —
does not download the Owner app.

---

## 5. Security headers

M4 makes these load-bearing. Set them in a **CloudFront response headers policy** so
they apply to every response regardless of what S3 returns, and **assert them in the
post-deploy check** (§7) — an unasserted header policy silently regresses.

| Header | Value | Why |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'`; `script-src 'self'`; `connect-src 'self' <api-origin>`; `img-src 'self' data:`; `object-src 'none'`; `base-uri 'self'`; `frame-ancestors 'none'` | The primary XSS mitigation. `connect-src` must name the API origin explicitly **because the frontend is cross-origin** — under the proxy it would be `'self'` alone |
| `Referrer-Policy` | `no-referrer` | §3. The URL contains a credential |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Covers every locality subdomain |
| `X-Content-Type-Options` | `nosniff` | |
| `Permissions-Policy` | Deny camera, microphone, geolocation | The product uses none of them |

**`script-src 'self'`, with no hashes and no nonces.** *Revised 2026-09-08, once
the build existed to check against.*

A nonce must be unique per response, which needs a server that renders the HTML,
and there isn't one — so the plan was hash-based `script-src`, generated at build
time and injected into the header policy by the deploy step. That would have been a
**build/deploy coupling with no CI-visible failure mode**: a hand-edited policy or
an unhashed inline script breaks the app in the browser and nowhere in CI.

**That coupling was avoided rather than managed.** Setting
`build.modulePreload.polyfill: false` in `vite.config.ts` drops the modulepreload
polyfill — the only inline script a default Vite build emits. **Verified against a
real build: `dist/index.html` contains zero inline `<script>` blocks.** So the
policy is the simplest possible one, and nothing has to stay in sync.

**The obligation this creates.** The property must hold. Anything reintroducing an
inline script — an injected snippet, a library, a hand-edit to `index.html` —
silently breaks the deployed CSP while passing local dev, where no CSP applies.
**The post-deploy check that loads a real page and confirms no CSP violation
(§7) is what catches that, and is now the only thing that does.**

**`'unsafe-inline'` is not an acceptable escape hatch**, given that a successful
injection yields a week-long, non-revocable compromise.

**A known tension to resolve at implementation:** `locality.visualStyling` is parsed
into typed design tokens by `u3-foundation` and applied as styles. Confirm the
styling approach works under a strict `style-src`. Applying tokens as **CSS custom
properties set on a root element** keeps this clean; a library that injects style
tags at runtime does not.

---

## 6. Environments and secrets

**Three environments: development, staging, production**, as three
bucket + distribution pairs. Cheap enough that sharing one is a false economy.

**Staging must be genuinely wired.** The backend's `deploy-staging` and
`integration-test-staging` jobs are `echo` no-ops and `deploy-production` runs
without passing through them — `team.md` explicitly requires the frontend not to
copy that shape.

**Production requires manual approval** (affirmed, and applied uniformly to the
Owner and Guest surfaces rather than split).

**Secrets: the frontend has none at runtime, and this must stay true.** Every value
reachable from client code is public the moment a page loads — and on a static host
that is unambiguous, since the entire deployable is public files. The API base URL is
a genuinely public value and follows the marketing site's `PUBLIC_*` precedent.
**Nothing that authenticates or authorises may use that mechanism** — a
build-time-injected secret is invisible to a source-tree secret scan, which is why
the scan must also run against the built output (§7).

---

## 7. Deployment pipeline shape

Detailed in `cicd-pipeline.md`. The infrastructure-relevant requirements:

- **OIDC deploy credentials**, no long-lived AWS keys. `team.md` already flagged that
  this matters more for a frontend deploying to S3 + CloudFront, and the reason is
  worth stating: a leaked deploy key means arbitrary code served from the product's
  own origin — the exact scenario M4's CSP exists to prevent, and a compromised
  deploy role walks straight past it.
- **SHA-pinned third-party actions** and per-job least-privilege `permissions`,
  carried from observed backend practice.
- **A real post-deploy check** — that the deployed build serves, that core routes
  resolve through the SPA fallback, **that the §5 headers are present**, and that a
  real page load produces no CSP violation. Not an `echo`.
- **Rollback.** Different from the backend's, and it needs its own answer: there is
  no ECS circuit breaker here. **Keep the previous build's assets in place** — which
  the immutable-hash scheme makes natural, since old asset URLs stay valid — so
  rolling back is re-uploading the previous `index.html` and invalidating it.
  **Do not delete superseded assets on deploy**; that is what makes both rollback
  and in-flight sessions work.

---

## 8. What this specification does not decide

- **WAF** — the backend's second service uses one for an IP allowlist. A public guest
  surface has different needs; deferred to `environment-provisioning`, noting that
  the backend's rate limiter is per-process across 2–6 tasks and therefore weaker
  than it looks, and that CloudFront is where a request-rate control would naturally
  sit.
- **Asset retention policy** — how long superseded builds' assets stay in the bucket.
  It must exceed the longest plausible in-flight session, and it is the mechanism
  rollback depends on. Decide it alongside the rollback runbook.
- **Whether to adopt the §1 proxy.** Explicitly out of scope here — `OQ3` decided
  against it. Recorded so the option is visible when M1 becomes painful.
