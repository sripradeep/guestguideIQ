# API Documentation — `guestguideiq-app`

**Derived from**: the developer full-repo scan of 2026-09-07, re-run over current HEAD (branch `main`, HEAD `76d190d`). The earlier pass ran at `40c8aed`; `git diff 40c8aed..HEAD` touches only `infra/lib/backend-api-stack.ts`, so the entire `src/`, `tests/`, and `prisma/` surface this document describes is byte-identical to HEAD, and the CORS chain plus `tests/unit/cors.test.ts` were re-read at `76d190d`. Every `routes.ts` and `service.ts` in both packages was read line by line; response shapes were extracted from the repository port record types. Repository adapter bodies were only skimmed, so **field nullability at the database level is not independently verified** beyond what the port types declare.

> **There is no OpenAPI, Swagger, AsyncAPI, or JSON Schema document anywhere in this repo.** The README points at `contract-summary.md` in the sibling AI-DLC workspace. u1's public routes carry no Fastify schemas, so nothing can be derived from the running app either. A frontend must hand-write its client and duplicate every request/response type. This document is currently the most complete contract that exists.

---

## Three Surfaces

| Surface | Process | Port | Bind | Reachable by a browser frontend? |
|---|---|---|---|---|
| **A — u1 public API** (Contract 2 + Contract 3) | `createApp()`, `src/app.ts` | `PORT`, default **3000** | `0.0.0.0` | **Yes — this is the frontend's target** |
| **B — u1 internal API** (Contract 1) | `createInternalApp()`, `src/internalApp.ts` | `INTERNAL_PORT`, default **3001** | **`127.0.0.1` only**, never `EXPOSE`d, never in an ALB target group | No, by construction |
| **C — u2 admin API** | `admin-api/src/app.ts` | `PORT`, default **4000** | ECS behind a WAF IP allowlist | No — internal ops tool |

All three are JSON over HTTP and share one error envelope.

---

# Surface A — u1 public API (the frontend's target)

Routes are registered with **literal `/v1/...` paths** (no Fastify prefix), so the base path is `{origin}/v1`. Health routes sit at the origin root, outside `/v1`.

## Authentication

| Token | TTL | Claims | Notes |
|---|---|---|---|
| **Access token** | **15 minutes** | `{ accountId, propertyId }` | Sent as `Authorization: Bearer <accessToken>`. No role claim. |
| **Refresh token** | **7 days** | `{ accountId, propertyId, jti }` | **Rotation-on-use**: each refresh revokes the presented `jti` and returns a new pair. |
| **Stay token** | Per-stay expiry | Opaque, not a JWT | Passed as a path segment, combined with a `Host`-header locality check. |

- **No cookies, no sessions, no CSRF token.** `credentials` is not enabled on CORS, so **cookie auth is not an option cross-origin** — bearer tokens in the `Authorization` header are the only viable scheme, and the frontend owns token storage and silent re-auth.
- **Revocation caveat**: the refresh-token store is per-process while production runs 2–6 ECS tasks, so single-use rotation semantics are **not reliably enforced**. See `architecture.md` T5.
- **There is no logout / token-revocation endpoint.** Sign-out is a client-side token discard only.
- **There is no current-user / profile endpoint.** `accountId` and `propertyId` are only ever learned from the signup, login, or refresh response — the frontend must persist them alongside the tokens.

## Tenancy — read this before designing anything

Two public flows resolve the tenant (locality brand) from the **request's own `Host` / `X-Forwarded-Host` header**, not from a body field or path segment:

- `POST /v1/accounts` → `identity/service.ts` calls `locality.resolveDomain(input.host)` before creating anything. An unregistered host yields `404 LOCALITY_NOT_RESOLVED`.
- `requireStayToken` → `auth/middleware.ts` calls `resolveStayForRequest(..., host)` and requires the resolved locality to equal the linked Property's `localityBrandId` (BR8.3). A mismatch yields `410 LINK_INVALID`.

A browser calling a shared API origin (`https://api.guestguideiq.com`) sends that one host, which would have to be registered as a domain of **every** locality brand — which BR9.2 forbids with a `409 CONFLICT`. **A per-locality frontend origin calling a shared API origin cannot resolve its tenant today.** Full statement of the constraint and the candidate resolutions: `architecture.md` § Cross-Cutting Constraints, item 1.

Every other authenticated route derives the locality from the JWT's `propertyId` and is unaffected.

## CORS

`@fastify/cors` is the only Fastify plugin registered on u1. `origin` comes from the comma-separated `ALLOWED_ORIGINS` env var.

| Environment | `allowedOrigins` | Effect |
|---|---|---|
| `dev` | empty | `origin: false` — **all cross-origin browser requests refused** |
| `staging` | empty | `origin: false` — same |
| `production` | `['https://guestguideiq.com']` | **exactly one origin — the marketing site.** No API subdomain, no frontend origin, no staging origin, no `localhost`, no wildcard |

- **CORS is on `main`** as of `b9c7c6e` (PR #15), re-verified file by file at `76d190d` — the `@fastify/cors` dependency, `config.allowedOrigins`, the `ALLOWED_ORIGINS` task-definition env var, and the `domainConfig.production.allowedOrigins` entry are all present on the trunk. Nothing here depends on an unmerged branch any more.
- **But the frontend's origin is still not allowed.** Production's allowlist is exactly `['https://guestguideiq.com']`, hardcoded in `infra/bin/backend-api.ts`'s `domainConfig.production` with an inline comment naming it as the marketing site's lead-capture caller. `dev` and `staging` have no `domainConfig` entry at all, so `ALLOWED_ORIGINS` resolves empty and `origin: false` refuses every cross-origin browser call. **Every frontend origin this intent introduces — production, staging, preview deploys, and `http://localhost:<port>` for local development — must be added to `domainConfig` and redeployed. That is a backend change the frontend cannot make for itself**, and it must be sequenced before the first browser call from a new origin can succeed. "CORS works now" is not the same as "the frontend can call the API".
- **`credentials` is NOT enabled.** The options object passed to `app.register(cors, …)` in `src/app.ts` carries the single key `origin` and nothing else, so `Access-Control-Allow-Credentials` is never emitted and a browser will neither send nor accept cross-origin cookies. **Cookie/session auth is unavailable to a cross-origin frontend; bearer tokens in the `Authorization` header are the only viable scheme**, which pushes token storage — and its XSS-exposure trade-off — onto the frontend as an explicit design decision.
- **No `methods`, `allowedHeaders`, `exposedHeaders`, or `maxAge` overrides** — `@fastify/cors` plugin defaults apply to all four. Because no custom response header is exposed, a frontend cannot read any non-simple response header cross-origin; worth remembering if a correlation-id header is later added to answer TD-8.
- **`ALLOWED_ORIGINS` is not documented in `.env.example`** (verified: the file stops at the OTel vars), so a local developer silently gets `origin: false` unless they know to set it.
- **Test coverage is thin.** `tests/unit/cors.test.ts` has three tests, all against `GET /health`: an allowed origin is reflected, a non-allowlisted origin is not, and an unconfigured harness reflects nothing. **Nothing asserts `Access-Control-Allow-Credentials`, and there is no preflight `OPTIONS` test and no cross-origin test against a real `/v1/...` route** — the credentials-disabled behaviour the frontend's auth design depends on is a property of the code, not of a regression test.
- **The alternative that changes all of the above**: a same-origin reverse proxy (the leading candidate fix for the Host-header tenancy constraint) would make CORS moot entirely and restore the cookie option. See `architecture.md` § Cross-Cutting Constraints — constraints 1 and 3 share a solution and must be decided together, before contract design.

## Error envelope (identical across all three surfaces)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message.",
    "details": [{ "field": "email", "reason": "must be a valid email" }]
  }
}
```

`details` is optional; `field` within a detail is optional.

**There is no `requestId` or correlation id in the envelope.** `lib/errors.ts:toErrorEnvelope` emits only `{ code, message, details? }`. OTel `traceparent` is propagated between services but never surfaced to the client, so a frontend error report cannot be tied to a server-side trace.

### Codes in use

| Code | Status | Raised by |
|---|---|---|
| `VALIDATION_ERROR` | 400 | missing/blank/malformed fields, non-array `sections`, favourite outside the locality, empty chat message |
| `UNAUTHORIZED` | 401 | bad credentials; invalid, expired, or replayed refresh token; missing/invalid access token |
| `PAYMENT_FAILED` | 402 | subscription creation |
| `FORBIDDEN` | 403 | `:propertyId` does not match the JWT's `propertyId` |
| `NOT_FOUND` | 404 | no `SubscriptionRecord` row |
| `LOCALITY_NOT_RESOLVED` | 404 | signup host not registered to a locality brand |
| `CONFLICT` | 409 | username taken (case-insensitive); onboarding step called out of order |
| `LINK_INVALID` | 410 | any stay-link failure; expired/unknown/used reset token |
| `RATE_LIMITED` | 429 | any rate-limited bucket |
| `CHAT_PROVIDER_TIMEOUT` | 504 | chat provider failure after one retry |
| `INTERNAL_ERROR` | 500 | unhandled — including a missing body on the two routes noted below |

### Rate limits

Token bucket, `src/ratelimit/memoryStore.ts` `RATE_LIMIT_PRESETS`, **in-memory per process** (so effective limits are multiplied by the running task count — 2 in production, autoscaling to 6).

| Bucket | Capacity (burst) | Refill | Keyed on |
|---|---|---|---|
| `POST /v1/accounts`, `POST /v1/auth/reset/request` | 5 | 5/min | client IP |
| `GET /v1/stays/:token` | 20 | 20/min | client IP |
| `POST /v1/stays/:token/chat` | 10 | 10/min | **the stay token** |
| `POST /v1/leads/*` | 15 | 15/min | client IP |

`429` responses carry a **`Retry-After` header in seconds** (`Math.ceil(retryAfterMs / 1000)`). Firing was empirically verified during the scan (429 after the 5th `POST /v1/accounts`).

Buckets are applied by an app-level `preHandler` hook registered *after* the routes, using hand-rolled path matching (`path.startsWith('/v1/stays/') && !path.endsWith('/chat') && method === 'GET'`). It has **no test coverage** — see `code-quality-assessment.md` TD-9.

### Conventions and their absence

- **No pagination, no filtering, no sorting** on any list endpoint.
- **No `ETag`, no conditional requests, no `Cache-Control`.**
- **No API versioning** beyond the `/v1` path segment.
- **No Fastify JSON schemas on any u1 public route.** Bodies are cast with `as`, most with a `?? {}` fallback. **Two routes lack that fallback and throw `500 INTERNAL_ERROR` on a missing body instead of `400`** — the `POST /v1/guides/:propertyId/favorites` handler destructures `request.body` directly. A frontend cannot rely on every malformed request producing a well-shaped `400`.

---

## A.1 Health (no auth, outside `/v1`)

| Method | Path | Success | Notes |
|---|---|---|---|
| GET | `/health` | `200 {"status":"ok"}` | Shallow liveness. |
| GET | `/health/ready` | `200 {"status":"ready"}` / `503 {"status":"not_ready"}` | Deep — runs `SELECT 1` through Prisma. |

## A.2 Identity — `src/identity/routes.ts` (no auth required)

| Method | Path | Request body | Success | Errors |
|---|---|---|---|---|
| POST | `/v1/accounts` | `{ username, password }` | `201 { accountId, propertyId, accessToken, refreshToken }` | `400 VALIDATION_ERROR` with `details[{field,reason}]` for `username`/`password`; `409 CONFLICT` (username taken, case-insensitive); `404 LOCALITY_NOT_RESOLVED`; `429 RATE_LIMITED` |
| POST | `/v1/auth/login` | `{ username, password }` | `200 { accountId, propertyId, accessToken, refreshToken }` | `401 UNAUTHORIZED` — **identical message for unknown user and wrong password**; `500` if the account somehow has no Property |
| POST | `/v1/auth/reset/request` | `{ username }` | **always** `202 { message }` | `429 RATE_LIMITED`. Never reveals whether the account exists. |
| POST | `/v1/auth/reset/confirm` | `{ token, newPassword }` | `200 { message: "Password updated." }` | `400 VALIDATION_ERROR`; `410 LINK_INVALID` (expired, unknown, or already used) |
| POST | `/v1/auth/refresh` | `{ refreshToken }` | `200 { accountId, propertyId, accessToken, refreshToken }` | `401 UNAUTHORIZED` (invalid, expired, or replayed) |

Notes for the frontend:
- `POST /v1/accounts` **atomically creates the Account and its single Property** and returns tokens — there is no separate "create property" call.
- **`POST /v1/auth/reset/confirm` is unreachable in practice.** `IdentityService.requestPasswordReset` returns `{ resetToken }` and `identity/routes.ts` **discards it** — no mailer, no SES construct in the CDK stack, no queue. The "request reset" screen can be built; the link will never arrive and the confirm screen is untestable end to end.

## A.3 Onboarding — `src/onboarding/routes.ts` (auth required)

A strict four-step state machine: `property_basics` → `content_source` → `content_review` → `confirm` → completed. **Calling a step out of order returns `409 CONFLICT` with a message naming the actual current step** — the frontend should drive navigation from `GET /v1/onboarding` rather than from local state.

| Method | Path | Request body | Response |
|---|---|---|---|
| GET | `/v1/onboarding` | — | `200 { currentStep, completed }` |
| POST | `/v1/onboarding/property-basics` | `{ name }` | `200 { currentStep: "content_source", completed: false }`; `400` if `name` is blank |
| POST | `/v1/onboarding/content-source/scratch` | — | `200 { currentStep: "content_review", ... }` |
| POST | `/v1/onboarding/content-source/pdf` | `{ succeeded: boolean, sections?: [{ title, body }] }` | `200 { currentStep: "content_review", ... }` |
| POST | `/v1/onboarding/content-review/confirm` | — | `200 { currentStep: "confirm", ... }` |
| POST | `/v1/onboarding/finish` | — | `200 { currentStep: "confirm", completed: true }` |

**The server does not parse PDFs.** `/content-source/pdf` accepts a `succeeded` flag plus **already-extracted** `sections`. There is no file-upload endpoint, no `@fastify/multipart` plugin registered anywhere, no object storage, and no configured file-size limit. Client-side extraction, size limits, and error handling are all unowned today and become a frontend responsibility.

## A.4 Property Guide — `src/guide/routes.ts`

Auth **and** ownership: `:propertyId` must equal the JWT's `propertyId`, otherwise `403 FORBIDDEN`.

**`OwnerGuideView`** — returned by every route in this group:

```ts
{
  propertyId: string;
  publishStatus: "draft" | "published";
  sections: { title: string; body: string }[];
  favoritedPOIIds: string[];
  favoritedEventIds: string[];
}
```

| Method | Path | Request body | Response |
|---|---|---|---|
| GET | `/v1/guides/:propertyId` | — | `200 OwnerGuideView`. **Creates an empty draft guide on first read** — a GET with a side effect. |
| PATCH | `/v1/guides/:propertyId` | `{ sections: [{ title, body }] }` | `200 OwnerGuideView`. **Full replace** of the sections array — not a merge, not a JSON Patch. `400` if `sections` is not an array. |
| POST | `/v1/guides/:propertyId/publish` | — | `200 OwnerGuideView` with `publishStatus: "published"` |
| POST | `/v1/guides/:propertyId/unpublish` | — | `200 OwnerGuideView` with `publishStatus: "draft"` |
| POST | `/v1/guides/:propertyId/favorites` | `{ itemType: "poi" \| "event", itemId }` | `200 OwnerGuideView`; `400 VALIDATION_ERROR` if the item is not in the property's own locality. **Missing body → `500`, not `400`** (no `?? {}` fallback here, unlike every other handler in the file). |
| DELETE | `/v1/guides/:propertyId/favorites/:itemType/:itemId` | — | `200 OwnerGuideView` |

Because PATCH is a full replace, the frontend must hold the whole sections array client-side and send it in full on every save — concurrent edits from two tabs will silently last-write-wins.

## A.5 Curated content browse — `src/poi/routes.ts`, `src/event/routes.ts` (auth required)

Both derive the locality from the JWT's `propertyId`. **No query parameters, no filtering, no pagination, no sorting** — the full locality list is returned every time.

| Method | Path | Response |
|---|---|---|
| GET | `/v1/pois` | `200 { items: [{ id, name, description, category, localityIds: string[] }], isEmptyLocality: boolean, emptyMessage?: string }` |
| GET | `/v1/events` | `200 { items: [{ id, name, eventDate, localityId, expiryStatus: "active" \| "expired", sourceRef: string \| null }], isEmptyLocality: boolean, emptyMessage?: string }` |

- `GET /v1/pois` `emptyMessage`: `"Content is being added for this locality."`
- `GET /v1/events` `emptyMessage`: `"No events yet — check back soon."` Expired events are **excluded** from this public list (so `expiryStatus` is `"active"` in practice here; `"expired"` appears only in the internal audit view).
- The `isEmptyLocality` / `emptyMessage` pair is the server-supplied empty state — the frontend should render `emptyMessage` rather than inventing its own copy.

## A.6 Subscription — `src/subscription/routes.ts` (auth required)

| Method | Path | Request body | Response |
|---|---|---|---|
| POST | `/v1/subscriptions` | — | `201 { id, accountId, plan: "standard", status: "active" }`; `404 NOT_FOUND` if no `SubscriptionRecord` row exists; `402 PAYMENT_FAILED` |
| PATCH | `/v1/subscriptions` | `{ action: "upgrade" \| "downgrade" \| "cancel" }` | `200 SubscriptionRecordRow`; `404 NOT_FOUND`; `409 CONFLICT` if there is no active subscription |

Two hazards the frontend must design around:

1. **There is no `GET /v1/subscriptions`.** The current plan and status cannot be read without mutating. A "manage subscription" screen has no safe way to render current state; the only value it can show is whatever the last mutation returned.
2. **`PATCH` cancels on anything it does not recognise.** The handler is a nested ternary whose final `else` branch is `subscriptions.cancel(accountId)`. **A missing body, a typo, or a future action value silently cancels the subscription.** The client must never send this request speculatively or with an unvalidated value. `upgrade` and `downgrade` are currently no-ops on `plan` because only one tier (`standard`) exists.

## A.7 Guest access (stay-scoped) — `src/guestaccess/routes.ts`, `src/chatmodule/routes.ts`

**No JWT.** Auth is the opaque `:token` path segment **plus** a `Host`-header locality check (BR8.3). Every failure mode — unknown token, expired stay, missing property, host/locality mismatch — returns the **same** `410 LINK_INVALID` with `"This link is no longer valid."` This is deliberate, so the frontend cannot distinguish them and must not try.

| Method | Path | Request body | Response |
|---|---|---|---|
| GET | `/v1/stays/:token` | — | `200` (shape below); `410 LINK_INVALID`; `429 RATE_LIMITED` |
| POST | `/v1/stays/:token/chat` | `{ message }` | `200 { reply: string, sparse: boolean, messages: [{ role: "guest" \| "assistant", text, timestamp }] }`; `400 VALIDATION_ERROR` (empty message); `410 LINK_INVALID`; `429 RATE_LIMITED`; `504 CHAT_PROVIDER_TIMEOUT` |

`GET /v1/stays/:token` `200` body:

```ts
{
  property: { id: string; name: string };
  locality: {
    id: string;
    name: string;
    tagline: string;
    visualStyling: Record<string, unknown> | null;
  };
  guide: {
    propertyId: string;
    sections: { title: string; body: string }[] | null;
    notYetPublished: boolean;
    favoritedPOIIds: string[];
    favoritedEventIds: string[];
  };
}
```

- `guide.sections` is `null` with `notYetPublished: true` when the owner has not published. The guest UI needs a real "not ready yet" state, not an empty list.
- **`locality.visualStyling` has no schema anywhere in the codebase** — `Record<string, unknown> | null` in `locality/repository.ts`, `Json?` in Prisma. Nothing constrains, validates, or documents its keys, yet the guest UI is expected to theme from it (BR9.6) and must degrade gracefully on `null`. **Defining that theming contract is work this frontend intent owns.**
- The `favoritedPOIIds` / `favoritedEventIds` arrays are returned to the guest, but **there is no guest-facing endpoint to resolve those ids into POI or Event details** — `GET /v1/pois` and `GET /v1/events` both require an owner JWT. The guest cannot currently render the favourited items.

### Chat, as it actually behaves today

`CHAT_PROVIDER=null` in `.env.example` **and** in the CDK task definition (`infra/lib/backend-api-stack.ts`, `environment.CHAT_PROVIDER: 'null'`). `wiring.ts:resolveChatProvider` therefore returns `NullChatProvider`, which always throws; any other value throws at startup. `chatmodule/service.ts` retries once with a 1 s backoff, then returns `504 CHAT_PROVIDER_TIMEOUT`.

The **only** `200` path is the sparse-content fallback: when the stay's locality has fewer than **3** combined POIs + active events, the provider is bypassed and a canned reply is returned with `sparse: true`.

> **Net behaviour on the wire today: fewer than 3 curated items → `200` canned message; 3 or more → `504`.** Itinerary chat cannot be demonstrated end to end against the deployed backend.

**There is no endpoint to read chat history.** The `messages` array is returned only as a side effect of a `POST`. A guest reloading the page loses the transcript unless the frontend caches it.

## A.8 Lead capture (Contract 3) — `src/leadcapture/routes.ts` (no auth)

Already consumed by the existing marketing site. Required fields are enforced in `leadcapture/service.ts`; **unlisted extra fields are stored without complaint**; **duplicates are accepted and never deduplicated**.

| Method | Path | Required fields | Response |
|---|---|---|---|
| POST | `/v1/leads/waitlist` | `email` | `201 { id }` |
| POST | `/v1/leads/partner` | `name, company, role, organizationType, email, message` | `201 { id }` |
| POST | `/v1/leads/investor` | `name, org, email, message` | `201 { id }` |

`400 VALIDATION_ERROR` with `details[{ field, reason: "required" }]` per missing field; a malformed `email` yields `details: [{ field: "email", reason: "must be a valid email" }]`.

---

## A.9 The gap that blocks the Guest app: no endpoint creates a `Stay`

The entire Guest surface (A.7) is stay-token-scoped, but **no HTTP endpoint in either service creates a `Stay`**.

- `createStayService` / `StayService.createStay` exist in `src/guestaccess/service.ts` (lines 62–77) and are **never referenced** — not by `wiring.ts`, not by any `routes.ts`, not by `internal/routes.ts`, not by admin-api. `grep -rn "createStay\|StayService"` across `src/` and `tests/` matches only that file's own definition.
- Stays exist in tests **solely** via `tests/factories/stayFactory.ts` seeding the fake DB directly.

**Consequences for this frontend intent:**
- The Property Owner UI has **no "generate guest link" API to call**.
- The Guest app (US2.x) **cannot be exercised against the deployed backend** as it stands.
- An owner-authenticated `POST /v1/stays` returning the token or the full link is a **prerequisite backend change**, not a frontend one. It should be raised at requirements analysis, not discovered at code generation.

## A.10 Endpoint gap summary for the frontend

| Wanted by a normal frontend | Status |
|---|---|
| Create a stay / issue a guest link | **Missing entirely** (A.9) |
| `GET /v1/subscriptions` (read plan and status) | **Missing** — and `PATCH` cancels on any unrecognised action (A.6) |
| Current user / profile (`GET /v1/accounts/me`) | **Missing** — ids come only from auth responses |
| Logout / refresh-token revocation | **Missing** — client-side discard only |
| Chat history read | **Missing** — transcript is a POST side effect only |
| Guest-facing POI / Event detail lookup | **Missing** — favourite ids are returned to the guest but not resolvable by them |
| Pagination / filtering / sorting on lists | **Missing** — whole locality list every time |
| Machine-readable contract to generate a client from | **Missing** — no OpenAPI, no schemas on u1's public routes |

---

# Surface B — u1 internal API (Contract 1) — not frontend-reachable

Bound to `127.0.0.1` on `INTERNAL_PORT` (default 3001), never `EXPOSE`d in the Dockerfile, never in the ALB target group (NFR3.11). Every `/v1/internal/*` route requires an **internal-scoped service JWT** (`{ service }` claim, 5 min TTL, signed with `INTERNAL_JWT_SECRET`). Its own `/health` is unguarded.

| Method | Path | Purpose |
|---|---|---|
| POST | `/v1/internal/pois` | `createPOI` → `201` |
| GET | `/v1/internal/events?localityId&includeExpired` | `listEvents` → `200 { items: [...] }` — audit view, **includes expired** |
| GET | `/v1/internal/accounts/:accountId` | `lookupAccount` → `200 { id, username, createdAt, property: { id, name } \| null }`; `404` |
| POST | `/v1/internal/localities` | `createLocalityBrand` → `201` |
| POST | `/v1/internal/localities/:localityId/domains` | `addLocalityDomain` → `200`; `409 CONFLICT` if the domain is already bound to another locality brand (BR9.2) |

The last route is the one that would have to be abused to make a shared API host work as a tenant for every locality — and it explicitly refuses to.

# Surface C — u2 admin API — internal ops tool, not frontend-reachable

`admin-api/src/app.ts`, port `PORT` default **4000**, Fastify prefix `/v1`. Every `/v1` route requires an **ops-role JWT** (`role === "ops"`): missing or invalid → `401`; valid but not ops (**including a real u1 Property Owner token**, which shares signing infrastructure) → `403`. **u1's identity component does not issue an ops token anywhere in this repo** — admin-api only verifies it.

| Method | Path | Delegates to |
|---|---|---|
| GET | `/health` | — (unguarded) |
| POST | `/v1/pois` | `createPOI` |
| GET | `/v1/events?localityId&includeExpired` | `listEvents` |
| GET | `/v1/accounts/:accountId` | `lookupAccount` |
| POST | `/v1/localities` | `createLocalityBrand` |
| POST | `/v1/localities/:localityId/domains` | `addLocalityDomain` |

Unlike u1, these routes **do** carry Fastify JSON body schemas (`poi/routes.ts`, `localities/routes.ts`) — a pattern u1's public surface should adopt. Upstream failures are relayed **verbatim** (status + body) by `InternalApiError`. Outbound calls carry `Authorization: Bearer <internal JWT>` and a W3C `traceparent`; 5 s timeout; idempotent reads retried once on 502/503/504/network error; non-idempotent writes never retried.
