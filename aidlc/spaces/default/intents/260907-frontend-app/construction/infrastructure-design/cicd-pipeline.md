# CI/CD Pipeline — GuestGuideIQ Frontend

One deployable, one pipeline. See the scope note in
`infrastructure-specification.md`.

**Written against a specific failure the workspace already has.** The backend's
`deploy-staging`, `integration-test-staging` and `smoke-test-production` jobs are
`echo` no-ops, and `deploy-production` runs without passing through the staging
ones. `team.md` names this explicitly and requires the frontend not to copy the
shape. Every gate below is therefore specified as *a thing that runs and can fail*,
and the ones that cannot be built yet are named as such rather than stubbed.

---

## 1. The pipeline, end to end

| Stage | Trigger | Gate? |
|---|---|---|
| **Verify** — install, lint, type-check, unit + component tests, coverage, build | Every push and every pull request | **Blocking on PR merge** (affirmed) |
| **Scan** — dependency vulnerabilities, secrets in source, **secrets in the built output** | Same run as Verify | **Blocking** (affirmed) |
| **Deploy → staging** | Merge to `main` | Automatic |
| **Post-deploy check → staging** | After the staging deploy | **Blocking** — a failure stops the release here |
| **Live-backend E2E** | After the staging post-deploy check | Blocking once it exists; see §5 |
| **Approve** | Manual | **Required** (affirmed, and stamped `ALWAYS` in `project.md`) |
| **Deploy → production** | After approval | — |
| **Post-deploy check → production** | After the production deploy | **Blocking**, and it is what triggers a rollback |

**Production is reachable only through staging.** Not by convention — the
production job depends on the staging post-deploy check having passed in the same
run.

---

## 2. Verify

Five distinct steps, because collapsing them hides which one failed:

1. **Lint** — blocking, with type-aware rules configured (`team.md`), which is what
   lets the raw-HTML-sink ban actually reason about where a value came from.
2. **Type-check, as its own step.** Explicitly separate from build. This is the
   direct fix for the `astro build`-vs-`astro check` gap the marketing site never
   closed, and Vite makes the mistake easy to repeat — **`vite build` does not
   type-check**. Run `tsc --noEmit` as its own step, or the gate does not exist.
3. **Unit and component tests**, against an intercepted network.
4. **Coverage**, against the 80% line floor. Enforce it **in the test runner's own
   config**, as the backend does in `vitest.config.ts`, not only in the workflow —
   so the same gate fires locally and cannot be bypassed by editing CI. The
   `include`/`exclude` set is declared in component-category terms in
   `domain-design`; translate it to globs here, now that the framework exists.
5. **Build**, producing the static bundle and the CSP hash manifest (§4).

---

## 3. Scan

| Scan | Target | Status |
|---|---|---|
| Dependency vulnerabilities | The lockfile | **Blocking** |
| Secret scan | The source tree | **Blocking** |
| **Secret scan of the built output** | `dist/` | **Blocking.** This is the one the backend does not do and the frontend needs more |

**Why the built-output scan is not redundant.** A build-time-injected value
(`VITE_*`) is written into a shipped JS chunk and never appears in the source tree,
so a source-only scan reports clean on a leaked key. `team.md` records this
precisely; this is where it becomes a job.

**The suppression policy is part of wiring the scan, not a follow-up.** A frontend
dependency tree is an order of magnitude larger than the backend's twelve direct
dependencies. Each suppressed finding carries an **owner, a reason and an expiry**.
Deciding this after the first flood of build-tooling advisories is how a blocking
gate quietly becomes advisory — which `project.md` stamps as forbidden.

**Accessibility check: advisory, deliberately.** Recorded as a time-boxed exception
in `project.md` with an intent to become blocking once the baseline is clean
(`NFR2`). It does not violate the `NEVER` rule, which names security scanners and
the linter.

---

## 4. Deploy

Per environment, and identical between staging and production apart from the target
and the approval in front of it.

1. **Assume the deploy role via GitHub OIDC.** No long-lived AWS keys. The blast
   radius here is arbitrary code served from the product's own origin — see
   `infrastructure-specification.md` §7.
2. **Upload hashed assets first**, with the long-lived immutable cache header.
   Assets before shell, always: the shell must never reference an asset that is not
   yet in the bucket, and this ordering is what makes that impossible rather than
   unlikely.
3. **Upload `index.html`** with a no-store or short-TTL header.
4. **Apply the response headers policy**, including the **CSP script hashes emitted
   by the build**. Generated, never hand-edited — §5 of the specification explains
   why a manual edit here breaks the app in the browser and nowhere in CI.
5. **Invalidate `/index.html`.** Not `/*`.
6. **Do not delete superseded assets.** They are what rollback and in-flight
   sessions depend on. Retention is set by lifecycle policy, and that policy is
   still open (`infrastructure-specification.md` §8).

**Third-party actions are SHA-pinned** and each job takes least-privilege
`permissions`, carried from observed backend practice.

---

## 5. The post-deploy check, specified so it cannot be an `echo`

It runs against the deployed URL and asserts:

| Assertion | Why this one |
|---|---|
| The app shell serves `200` at `/` | The floor |
| **A deep client route serves the shell** — an Owner route, and a `/s/<synthetic>` path | The SPA fallback (§4 of the spec) is infrastructure config, not application code, and it fails silently in exactly one direction: everything works until someone reloads a deep link |
| **Every §5 security header is present, with the expected values** | An unasserted header policy regresses silently, and M4 makes CSP load-bearing |
| **A real page load produces no CSP violation** | The hash-based policy is build-generated; this is the only check that catches a stale or mis-generated hash. A header-presence check alone would pass while the app is blank |
| Referenced assets resolve | Catches the stale-shell failure named in `monitoring-design.md` §1 |

**The `/s/<synthetic>` assertion checks routing, not a valid stay.** A synthetic
token resolves to `410 LINK_INVALID`, which is a correct and useful result — it
proves the route reaches the app and the app reaches the API.

**Live-backend E2E is a real prerequisite, not a formality.** `team.md`'s Q5
answer requires a thin live-backend suite as the drift detector against
hand-written fixtures. **It cannot run today**: signup returns
`404 LOCALITY_NOT_RESOLVED` and every stay link returns `410 LINK_INVALID` until
M1 lands, and no origin is allowlisted until M2 does. The job is therefore
**specified now and wired when those land** — named here as blocked rather than
stubbed with an `echo`, which is the distinction this whole document turns on.

---

## 6. Rollback

**There is no circuit breaker on this hosting choice.** The backend's ECS breaker
has genuinely fired and correctly rolled back a crash-looping deploy; nothing
equivalent exists for S3 + CloudFront, and assuming otherwise would be the most
likely way this pipeline disappoints under pressure.

**The mechanism:** re-upload the previous `index.html` and invalidate it. That is
the entire rollback, and it works only because superseded assets are still in the
bucket (§4.6) and asset URLs are immutable.

**The trigger:** a failing production post-deploy check. Automate the re-upload if
it is easy; if it is not, **the runbook is acceptable and honest** — a single
responder with a documented two-command rollback is a real capability, and a
half-built automation that has never fired is not.

Keep the previous release's `index.html` as an addressable object (a versioned key,
or bucket versioning) so "the previous shell" is a thing you can point at rather
than something to rebuild from a git tag under pressure.

---

## 7. What this does not decide

- **Artifact versioning scheme** beyond "keep the previous shell addressable" —
  carried open alongside the backend's equivalent item.
- **When the accessibility check becomes blocking** — `OQ6`, still open.
- **Preview deployments per pull request.** Attractive on this hosting choice
  (cheap, since it is just another prefix) but each preview origin would need
  adding to the backend's CORS allowlist under M2, which makes it a backend
  deployment per environment. Deferred, with that cost named.
