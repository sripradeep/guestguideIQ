# Environment Provisioning — Validation Report

Conversation language: English

> **Status: not executed. No check below has been run, and none has passed.**
>
> There is nothing provisioned to validate and no AWS credentials on this session
> to validate it with. Reporting "not yet evaluated" honestly is the workspace's
> recorded practice — the alternative, a report shaped like a pass, is exactly the
> `echo`-stub pattern `team.md` names in the backend's pipeline and requires the
> frontend not to copy.

**What this document is for now:** the checks, defined precisely enough that
running them later is mechanical rather than a fresh design exercise.

---

## Checks to run once provisioning happens

### Reachability and routing

| # | Check | Passes when |
|---|---|---|
| V1 | `GET /` on each environment's distribution | `200`, serving the app shell |
| V2 | `GET` a deep Owner route | `200` with the shell, **not** a `404` — this is the SPA fallback, and it fails in exactly one direction: everything works until someone reloads a deep link |
| V3 | `GET /s/<synthetic-token>` | Reaches the app, which then shows the invalid-link screen. A `410` from the API here is a **pass** — it proves routing and API reachability in one shot |
| V4 | Direct S3 URL access | **Refused.** A reachable bucket means Origin Access Control is misconfigured and every header policy below is bypassable |

### Security headers — M4's assertions

| # | Check | Passes when |
|---|---|---|
| V5 | All five headers from `infrastructure-specification.md` §5 present | Present, with expected values, on both an app route and an asset |
| V6 | `Referrer-Policy: no-referrer` on `/s/*` | Present. The URL contains a live credential |
| V7 | **A real page load produces no CSP violation** | No violation reported. **This is the check that matters most.** The hash-based policy is build-generated, and a header-presence check alone passes while the app is blank |
| V8 | `frame-ancestors 'none'` honoured | The app refuses to load in an iframe |

### Caching — where a mistake is a security defect, not a slow page

| # | Check | Passes when |
|---|---|---|
| V9 | **`/s/<token>` is never served from cache** | `Miss from cloudfront` on repeat requests for the same token. A cache hit means guest data is stored at the edge keyed by a credential, and would outlive stay expiry |
| V10 | `/index.html` is not cached long | Short TTL or no-store, so a deploy takes effect |
| V11 | Hashed assets are cached long | `max-age=31536000, immutable` |

### Deploy identity and secrets

| # | Check | Passes when |
|---|---|---|
| V12 | No long-lived AWS keys in repository secrets | Only the OIDC role |
| V13 | The deploy role cannot reach the backend's resources | Scoped to this frontend's buckets and distributions |
| V14 | **Secret scan of the built output** | Clean. A `VITE_*`-injected value never appears in the source tree, so a source-only scan proves nothing |

### Rollback — the one with no automatic trigger

| # | Check | Passes when |
|---|---|---|
| V15 | The previous release's `index.html` is addressable | It can be pointed at, not reconstructed from a git tag under pressure |
| V16 | **A rollback is actually performed once, deliberately** | The previous shell serves after re-upload and invalidation |
| V17 | Superseded assets still resolve | The lifecycle rule has not removed what rollback depends on |

**V16 is the one most likely to be skipped, and the one worth insisting on.** The
backend has genuine rollback evidence because its ECS circuit breaker really
fired; there is no equivalent mechanism here, so the only way to know rollback
works is to do it on purpose, in staging, before needing it.

---

## Checks that cannot run until the backend follow-up lands

| # | Check | Blocked on |
|---|---|---|
| V18 | Owner signup completes end to end | **M1** — returns `404 LOCALITY_NOT_RESOLVED` until an explicit tenant mechanism exists |
| V19 | A real guest stay link resolves to a guide | **M1**, and `POST /v1/stays` (B0/B1) |
| V20 | The frontend origin can call the API at all | **M2** — no frontend origin is in the backend's CORS allowlist, in any tier |

**V20 is the floor.** Until it passes, V18 and V19 cannot be attempted and the
live-backend E2E suite specified in `cicd-pipeline.md` §5 cannot be wired. This is
the same blocker recorded as B0 in `carried-assumptions.md`, reaching the last
stage that depends on it.
