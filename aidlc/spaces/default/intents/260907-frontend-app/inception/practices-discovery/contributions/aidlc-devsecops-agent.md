**Collaborator:** aidlc-devsecops-agent

## Contribution

Remit: lint/format rules, SAST/DAST, secret and dependency scanning, supply-chain
controls. Test strategy/coverage and naming/layering are other reviewers' lanes and
I have stayed out of them.

My overall read: the draft's Security Tooling section is correct as far as it goes,
but it is *backend security with a different ruleset*. It carries over the four
affirmed controls (dependency scan, secret scan, SAST, enforcement discipline),
adjusts the Semgrep ruleset, and stops. The thing that actually changes between a
backend and a browser frontend is not which scanner you run — it is that **the
artifact you ship is executed on untrusted machines, by untrusted users, holding
the user's credentials in the same JavaScript context as every dependency you
pulled in**. Three of the affirmed rules keep their words and lose their meaning
when moved across that boundary, and there is a class of control (browser-delivery
controls: CSP, SRI, referrer/URL hygiene, untrusted-render discipline) with no
backend analogue at all and therefore nothing in the draft.

Everything below is evidence-backed; sources named inline.

---

### 1. "NEVER commit secrets" extends — but gitleaks is no longer a complete control

The draft marks this rule **[extends unconditionally, no need to re-ask]**. I agree
the *rule* extends. I object to the implication that the affirmed control set then
covers it.

On the backend, "committed" and "leaked" are the same event, so a source-tree secret
scan is a complete control. On a frontend they come apart: the canonical frontend
secret leak is a value that was **never in the repo**. It lives in GitHub Actions
secrets, gets injected at build time through the framework's public-prefix mechanism
(`PUBLIC_*`, `VITE_*`, `NEXT_PUBLIC_*`), and is inlined verbatim into a JS chunk that
ships to every browser. Gitleaks scanning a clean source tree passes. The key is
public the moment the first user loads the page.

This workspace already has the pattern in front of it: `src/site.config.ts:25` reads
`import.meta.env.PUBLIC_API_BASE_URL`, and `.github/workflows/deploy.yml:40` supplies
it from `${{ vars.PUBLIC_API_BASE_URL || 'https://api.guestguideiq.com' }}`. That is
correct today because a base URL is genuinely public. The same mechanism with a
third-party API key on the other side of it is a published credential, and no
affirmed control catches it.

Two controls close the gap, and both are cheap:

- **Scan the build output, not only the source tree.** Run the secret scanner (or, at
  minimum, a pattern grep) against the built `dist/` artifact as a blocking CI step
  after `build`. This is the only check that sees a build-time-injected secret.
- **Make the public prefix a rule, not a convention.** Only variables carrying the
  framework's public prefix may be referenced from client-reachable code, enforced by
  a lint rule (`no-restricted-syntax` / `no-restricted-properties` against non-public
  `import.meta.env` / `process.env` member access outside the server-only boundary).
  The prefix then means what it should mean: *this value is published*.

Suggested rule phrasing for the interview:

> ALWAYS treat every value reachable from frontend client code as public. The only
> secrets a frontend may hold are ones that are safe to publish.
>
> ALWAYS run secret scanning against the built bundle as well as the source tree,
> blocking, so a build-time-injected secret cannot escape through a chunk file.

The draft's Deployment section already has the right instinct ("public config values
are fine to bake in; anything that authenticates or authorizes is not"). It needs to
become an enforced control rather than a note.

### 2. `npm audit --audit-level=high` does not port verbatim — and there is no updater behind it

The draft carries the backend's exact step over. Two problems.

**(a) Volume.** The backend has 12 direct dependencies (`guestguideiq-app/package.json`).
Any mainstream frontend framework brings 400–1200 transitive packages. `--audit-level=high`
against that tree will block PRs on advisories in build-time-only packages, repeatedly,
on changes unrelated to the finding. The predictable outcome is pressure to make the
gate advisory — which is the *exact* anti-pattern this team already stamped as
`NEVER` (`project.md` Forbidden, Q7/Q8). A blocking gate without a triage path
becomes a non-blocking gate within a month.

So the suppression policy must be decided **at the same time as the gate**, not after
the first false positive: a tool with a real ignore mechanism (`audit-ci`, `osv-scanner`,
or `npm audit` plus a checked-in allowlist), where every suppression entry carries a
**named owner, a reason, and an expiry date**, and the allowlist file itself is a
reviewed artifact. An entry that expires re-breaks the build, which is what stops the
allowlist becoming a graveyard.

**(b) The devDependency escape hatch is wrong here.** The usual noise-reduction move
is `npm audit --omit=dev`. For a frontend that is actively unsafe: a bundler inlines
whatever the entry graph imports, regardless of which `package.json` section it sits
in, so `devDependencies` code routinely ships to the browser. Name this now so nobody
reaches for it in six months when the gate is noisy.

**(c) Observed gap worth surfacing:** there is **no `dependabot.yml` and no
`renovate.json` anywhere in `guestguideiq-app/.github/`** (verified by directory
listing). The affirmed rule "ALWAYS run automated dependency-vulnerability scanning"
is implemented as detection only — nothing automatically *bumps* a vulnerable
dependency. On a 12-package backend that is survivable. On a frontend tree it means
`npm audit` will accumulate findings that no process is responsible for clearing. The
interview should decide whether an updater is in scope for the frontend from day one,
not inherit a detection-only posture by silence.

### 3. Supply-chain controls the backend already practises and the draft does not carry over

`guestguideiq-app/.github/workflows/ci.yml` contains three observed supply-chain
controls the draft never mentions. All three are at least as durable as the Semgrep
ruleset choice it *did* carry over, and all three extend to the frontend:

- **Every third-party action is pinned to a full commit SHA** with a `# vN` readability
  comment (`actions/checkout@11d5960a…`, `gitleaks/gitleaks-action@dcedce43…`,
  `bridgecrewio/checkov-action@f9678081…`, `aws-actions/configure-aws-credentials@ff717079…`).
  The workflow header (lines 16–23) states the rationale explicitly and cites the
  repointed-tag incidents on `trivy-action` and `kics-github-action`, and notes
  Semgrep's `p/ci` ruleset blocks on mutable action tags. This is deliberate,
  documented practice — carry it over verbatim.
- **Per-job `permissions:` blocks** narrow `GITHUB_TOKEN` (`contents: read`,
  `pull-requests: read` on the PR-gate jobs; `id-token: write`, `contents: read` only
  on the deploy job). Least privilege on CI credentials. Extends unchanged.
- **OIDC for deploy credentials, no long-lived AWS keys** (`configure-aws-credentials`,
  line 329, comment "OIDC — no long-lived keys"). This extends with *more* force on
  the frontend, not less: if the hosting target is S3+CloudFront, an OIDC deploy role
  is what keeps a long-lived access key out of frontend repo secrets, where a
  compromised build step could read it.

One inconsistency in the observed practice worth *not* copying: the Semgrep step is
`pip install semgrep` (ci.yml:118, 217) — unpinned, so the SAST tool itself floats
while everything around it is SHA-pinned. Pin it in the frontend workflow.

**Two frontend-specific supply-chain controls with no backend precedent:**

- **Install-time script policy.** A frontend dependency tree of 400+ packages is 400+
  opportunities for a `postinstall` script on a CI runner that has deploy credentials
  in scope. Decide explicitly whether CI installs run with `--ignore-scripts` (plus an
  allowlist for the few packages that genuinely need it), rather than leaving it
  unconsidered.
- **A cooldown on automated dependency bumps.** The dominant npm compromise pattern is
  a malicious patch release of a legitimate package, caught and unpublished within
  hours to days. A minimum-release-age / cooldown setting on the updater (Renovate's
  `minimumReleaseAge`, Dependabot's cooldown) converts that from an exposure into a
  non-event. This is the single highest-leverage supply-chain control available for a
  browser frontend and costs one config line.

### 4. SBOM: I object to carrying over "forward-looking, not mandated"

The draft carries the backend's non-mandated status for SBOM. I think that is the
wrong call for this artifact class.

A backend's dependency tree runs on servers you control; when an incident lands you can
inspect the running image. A **frontend ships its dependency tree to every user**, and
the incident question is *"did we ship the compromised version, to whom, between which
dates?"* — answerable only from a per-release SBOM correlated with deploy timestamps.
The Guest surface makes this concrete: guest sessions carry a live credential in the
URL (see §6), so "which builds were compromised" is directly a "which guest links were
exposed" question.

Generating a CycloneDX SBOM per release build is one CI step (`cyclonedx-npm` or
`syft`) with near-zero ongoing maintenance, and the artifact is retained by the CI run.
Recommend mandating it for the frontend even though it was not mandated for the backend,
and saying plainly *why the two differ* so it does not read as inconsistency.

### 5. Content Security Policy is a **hosting requirement**, and therefore an input to Q-G, not a downstream detail

This is the highest-value new control and the one place the draft's question ordering
will actively cause harm if left as-is.

Why CSP matters more here than on a typical app, from the reverse-engineering facts:

- `credentials` is not enabled on the backend's CORS config (`api-documentation.md`
  § CORS; `dependencies.md` line 42), so cookie auth is unavailable cross-origin and
  **bearer-token storage falls to the frontend**.
- The tokens in question are an access token (15 min) *and* a refresh token (**7 days**,
  `api-documentation.md` lines 29–30).
- **There is no logout / token-revocation endpoint** — sign-out is a client-side discard
  (line 35).
- Even the revocation semantics that exist are unreliable: the refresh store is
  per-process while production runs 2–6 ECS tasks, so a rotated token replayed against
  another task is accepted (TD-12).

Net: **one XSS on the Owner app yields a stolen refresh token that is valid for up to
seven days and cannot be revoked by anybody.** That is the risk CSP exists to bound.
It is not a hardening nicety on this product; it is the compensating control for a
token-storage posture the backend has already forced on the frontend.

The scheduling problem: **CSP must be delivered as a response header from the host.**
GitHub Pages — the marketing site's current target and one of the options the draft
offers for Q-G — cannot set arbitrary response headers. Choosing it forecloses a real
CSP, HSTS, `Referrer-Policy`, and `frame-ancestors`, permanently, for an app holding
7-day unrevokable credentials. The draft's Q-G asks about hosting on CI/CD-shape and
secrets-exposure grounds only. **Security-header capability must be a stated input to
that question, and answered before it.**

Two CSP design facts worth recording now so the policy is not designed and then
weakened:

- The backend carries `stripe@^16.8.0`, implying a payments UI. **Stripe.js must be
  loaded from `js.stripe.com` and must not be self-hosted or SRI-pinned** (Stripe
  rotates it). The CSP has to allow that origin, and SRI cannot cover it — this is a
  named, justified exception, not a gap.
- **`frame-ancestors 'none'`** closes a concrete attack here, not a theoretical one:
  TD-6 records that `PATCH /v1/subscriptions` **cancels the subscription on any
  unrecognised action** (nested ternary whose final `else` is `cancel`). A clickjacked
  cancel is cheap to mount and has a real business consequence. One directive closes it.

### 6. The stay token is a credential in the URL path — the sharpest frontend-specific finding, and nothing in the draft addresses it

`GET /v1/stays/:token` takes an **opaque credential as a path segment**
(`api-documentation.md` lines 31, 213–218), and the guest reaches the app through a
link that carries the same token in the frontend URL. That single design fact creates
frontend obligations with no backend counterpart:

- **Referrer leakage.** Every outbound link from a guest page can carry the full URL —
  i.e. the credential — in the `Referer` header. `Referrer-Policy: no-referrer` on the
  guest surface is the fix, and it is a response header, which loops back to §5.
- **Telemetry exfiltration.** Sentry, GA, PostHog, LogRocket and every comparable tool
  capture `window.location.href` by default. On the Guest surface that is *transmitting
  a live credential to a third party as designed behaviour*. Any telemetry added to the
  guest app must have URL scrubbing configured **before** it is enabled — a concrete,
  reviewable precondition, not a best-effort intention.
- **Access logs are credential stores.** CloudFront/S3/ALB access logs from the frontend
  host will contain guest URLs, therefore guest credentials, and inherit whatever
  retention and bucket-access policy those logs have. That needs to be a deliberate
  decision at `infrastructure-design`, flagged from here.
- **Third-party scripts.** Any script the guest page loads runs with access to
  `location.href`. Combined with §5's Owner-app token exposure, this justifies a
  standing rule: **no third-party script is added to either surface without a named
  owner and a written reason**, because on this product a third-party script has read
  access to bearer tokens (Owner) and stay tokens (Guest).

I would raise this to a `NEVER` candidate:

> NEVER send a guest URL, or any value derived from `window.location`, to a third-party
> analytics, error-reporting, or session-replay service without URL scrubbing verified
> to strip the stay token.

### 7. Untrusted content reaching the DOM — two named sources, and a lint rule that follows from them

Two concrete server-supplied values will be rendered by this frontend, and both are
attacker-influenceable:

- **LLM chat replies.** `POST /v1/stays/:token/chat` returns `reply: string` from a chat
  provider (currently `NullChatProvider`, TD-2, but wired later). The guest's own
  message round-trips through the model, so the reply is not trusted content. Rendering
  it as Markdown or HTML without sanitization is XSS on the Guest surface — which is the
  surface whose URL *is* the credential.
- **`locality.visualStyling`.** TD-7: an **unschematized JSON blob**
  (`Record<string, unknown> | null`) with nothing constraining, validating, or
  documenting its keys — and the guest UI themes from it (BR9.6). Unvalidated server
  data driving CSS is a CSS-injection surface, and if any of it reaches a `style`
  attribute or a `<style>` block it also forces `style-src 'unsafe-inline'`, weakening
  the CSP from §5 for the whole app.

Both point at the same enforceable control, and it belongs in the lint lane rather than
left to review:

> ALWAYS enforce, as a **blocking** lint error, a ban on raw-HTML injection APIs —
> `react/no-danger`, `vue/no-v-html`, `svelte/no-at-html-tags`, or the chosen
> framework's equivalent — with a documented per-use exception requiring a named
> sanitizer.
>
> ALWAYS validate `locality.visualStyling` against a frontend-owned schema with a
> closed key set and value patterns before any value reaches the DOM; never spread it
> into a style object.

**This is where TD-17 stops being a code-quality item and becomes a security
prerequisite.** The draft correctly names `parserOptions.project: false` as a
non-inheritance. Worth adding *why it matters here*: type-aware linting is what lets a
rule reason about where a value came from, which is how "no unsanitized server string
reaches a raw-HTML sink" is enforced mechanically rather than by reviewer attention.
Without `parserOptions.project`, taint-shaped rules cannot run at all. The TD-17 fix is
a dependency of the rules above, not an independent nicety.

### 8. DAST: I would spend the effort differently, and say so explicitly

The draft carries the backend's "forward-looking, not mandated" status for DAST. I
agree it should not be mandated, but for a sharper reason than "not yet" — and the team
should get the reason rather than an open TODO that resurfaces every stage.

A ZAP/Nuclei baseline scan against a deployed frontend overwhelmingly reports **missing
security headers**. That finding is real, but a deterministic assertion catches it
faster, earlier, and without a flaky scanner in the merge path. So instead of DAST in
name, I recommend a control that delivers DAST's actual yield here and is testable
(which the Inception guardrail requires — every requirement needs a clear pass/fail
criterion):

> ALWAYS run an automated security-header assertion against the deployed staging URL as
> a blocking post-deploy check: CSP present with no `unsafe-inline` in `script-src`;
> `Strict-Transport-Security`; `X-Content-Type-Options: nosniff`; `Referrer-Policy`;
> `frame-ancestors 'none'`.

That is a handful of assertions in the existing test runner, it fails loudly when a
hosting change silently drops a header, and it makes §5's CSP commitment *verifiable*
rather than aspirational. Real DAST earns its place later, if and when the frontend
grows meaningful server-side surface (SSR routes, an API proxy) — that is the trigger
to revisit, and naming the trigger is better than leaving "forward-looking."

### 9. SAST ruleset (agreeing with the draft, with two additions)

`p/ci` + `p/typescript` carry over cleanly. Add the framework ruleset once the stack is
chosen (`p/react`, `p/javascript`, `p/xss`) — that is where the frontend-specific value
is, since `p/typescript` alone will not catch a raw-HTML sink. And pin the Semgrep
install, per §3.

### 10. Cross-lane flag (not mine to decide, but it should not be lost)

`code-quality-assessment.md` TD-13 records that the backend's `deploy-staging` and
`integration-test-staging` jobs are `echo` placeholders while `deploy-production` is
fully wired — i.e. **the backend currently violates the staging-first half of
`project.md`'s own Mandated rule**, with only the manual-approval half honoured. The
CodeKB says explicitly the frontend "must **not** inherit this pattern" (line 114). The
draft's Deployment section does not mention it. Whoever owns the deployment lane should
decide whether the frontend's staging tier is real from day one, and the Q-F answer
should be about what the team *wants*, not what the backend currently *does*.

### 11. Questions the interview must ask that the draft did not queue

Q-A through Q-J contain no question about token storage, CSP, third-party scripts, or
supply-chain policy. Q-I ("confirm dependency + secret scanning should be set up, matching
the backend's Q7") is phrased as a yes/no re-confirmation — it will get "yes" and close
the security topic before a single frontend-specific control has been discussed. I
recommend splitting it and adding the following.

- **Q-K (Security — token storage; highest severity on this list).** Where do the Owner
  app's access and refresh tokens live? (a) in-memory only, accepting re-login on tab
  reload; (b) `localStorage`/`sessionStorage`, XSS-exfiltratable; (c) behind a
  same-origin reverse proxy so the backend can set `HttpOnly; Secure; SameSite` cookies.
  Context the human needs: refresh TTL is 7 days, there is no revocation endpoint, and
  revocation is not reliably enforced even where it exists (TD-12) — so a token stolen
  via XSS cannot be killed. **This is coupled to the reverse-proxy decision:** the proxy
  being considered for the tenancy blocker also restores the cookie option, so the two
  should be decided together rather than sequentially.
- **Q-L (Security — hosting must support response headers). Ask before Q-G.** Is the
  ability to set CSP, HSTS, `Referrer-Policy`, and `frame-ancestors` a hard requirement
  on the hosting target? A "yes" rules out GitHub Pages and narrows Q-G's option set
  before it is answered.
- **Q-M (Security — guest link handling).** The guest stay token is a credential in the
  URL path. Confirm the frontend will (i) set `Referrer-Policy: no-referrer` on the
  guest surface, (ii) require URL scrubbing to be configured in any analytics or
  error-reporting tool *before* it is enabled, and (iii) treat host access logs
  containing guest URLs as credential-bearing for retention and access purposes.
- **Q-N (Security — untrusted render).** Confirm a blocking lint ban on raw-HTML
  injection APIs, and that LLM chat replies and `locality.visualStyling` are sanitized
  and schema-validated before reaching the DOM.
- **Q-O (Supply chain).** Confirm (i) SHA-pinned GitHub Actions, per-job `permissions`,
  and OIDC deploy credentials extend to the frontend; (ii) whether automated dependency
  updates are in scope from day one and whether they get a cooldown / minimum-release-age;
  (iii) whether a CycloneDX SBOM is generated per release build.
- **Q-P (Dependency-scan triage).** `npm audit --audit-level=high` against a frontend
  tree will block PRs on advisories in build-only packages. What is the suppression
  policy — who may add an ignore entry, must it carry an owner and an expiry date, and
  is the ignore file itself a reviewed artifact? (Note for the answer: `--omit=dev` is
  not an available shortcut here — bundlers ship `devDependencies` code to the browser.)

### 12. Summary of proposed rule text (for direct integration)

Extends verbatim from the affirmed backend set: blocking lint + format; blocking
secret scanning; blocking dependency scanning; blocking SAST; enforcement discipline
(nothing advisory); SHA-pinned actions; per-job least-privilege `permissions`; OIDC
deploy credentials; `npm ci` from a committed lockfile.

Needs re-phrasing to mean anything on the frontend: "never commit secrets" →
"every client-reachable value is public, and the bundle is scanned too";
"dependency scanning" → "dependency scanning **plus** a triage/suppression policy with
owners and expiries, and a decision on automated updates with a cooldown".

Genuinely new, no backend analogue: CSP (as a hosting requirement); `frame-ancestors`;
`Referrer-Policy` and telemetry URL scrubbing on the guest surface; third-party script
policy; SRI where the vendor supports it with a named Stripe exception; a blocking lint
ban on raw-HTML sinks; schema validation of `visualStyling`; per-release SBOM; automated
security-header assertion against staging in place of DAST.

## Positions

- AGREE: The draft's refusal to auto-inherit the `project.md` mandates scoped "for backend work" — flagging each as `[extension likely, still needs asking]` rather than silently extending is the right discipline, and it is exactly what makes room for the re-phrasings in §1 and §2.
- AGREE: Carrying "enforcement discipline" (blocking, never advisory) over unchanged — it is the single most load-bearing item on the list, and §2's triage policy exists precisely to keep it from eroding under a noisier dependency tree.
- AGREE: Naming TD-17 (`parserOptions.project: false`) as an explicit non-inheritance — §7 adds that it is also a hard prerequisite for the anti-XSS lint rules, not just a code-quality improvement.
- AGREE: The public-config-vs-secret distinction in the Deployment section, and the `PUBLIC_API_BASE_URL` precedent it cites — right instinct, correctly sourced; §1 turns it into an enforced control rather than a note.
- AGREE: Semgrep `p/ci` + `p/typescript` carrying over with a framework ruleset added once the stack is known.
- OBJECT: The Security Tooling section treats frontend security as backend security with a different ruleset, and has nothing on the browser-delivery threat class — CSP, SRI, third-party scripts, token storage, stay-token-in-URL leakage — which is where essentially all of the frontend's new risk lives (§§5–7).
- OBJECT: "NEVER commit secrets" is marked `[extends unconditionally, no need to re-ask]`, which is true of the rule and false of the control — the canonical frontend leak is a build-time-injected value that was never committed, and gitleaks on a clean source tree passes it (§1).
- OBJECT: `npm audit --audit-level=high` is carried over verbatim with no triage/suppression policy and no devDependency caveat; on a 400+ package tree that gate erodes into an advisory one within weeks, violating the team's own `NEVER` (§2).
- OBJECT: SHA-pinned actions, per-job `permissions`, and OIDC deploy credentials are observed, deliberately-documented practice in `ci.yml` (header comment lines 16–23) and are not carried over at all, while less-durable choices are (§3).
- OBJECT: SBOM inherits the backend's "not mandated" status — wrong for an artifact whose entire dependency tree is shipped to users, and the one thing that answers "which builds shipped the compromised package" after an incident (§4).
- OBJECT: No interview question covers token storage, despite it being the highest-severity frontend security decision available (7-day refresh token, no revocation endpoint, unreliable revocation) and despite it being coupled to the reverse-proxy decision already on the table — proposed as Q-K (§11).
- OBJECT: Q-G asks the hosting question on CI/CD and secrets grounds only; security-header capability is a hard input that eliminates options (GitHub Pages cannot set CSP) and must be asked first — proposed as Q-L (§5, §11).
- OBJECT: Q-I is a yes/no re-confirmation of the backend's Q7 and will close the security topic before any frontend-specific control is raised; recommend splitting it into Q-I plus Q-K through Q-P (§11).
- OBJECT: DAST is carried over as an open "forward-looking" item with no decision criterion; recommend replacing it with a testable security-header assertion and naming the trigger (SSR/API-proxy surface) that would make real DAST worthwhile (§8).
- OBJECT (cross-lane, flagging only): The Deployment section does not mention TD-13, the backend's live staging bypass, even though the CodeKB states explicitly that the frontend must not inherit it — Q-F should be about what the team *wants*, not what the backend currently *does* (§10).
