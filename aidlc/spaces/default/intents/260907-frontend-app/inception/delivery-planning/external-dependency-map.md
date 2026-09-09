# External Dependency Map — GuestGuideIQ Frontend

Everything outside this team that this frontend waits on, and which build pass
each item gates. A **Bolt** is one build pass over a piece of the work that ends
in something that runs.

**This document is not lightweight, and that is the finding.** The stage template
anticipates a short list, or an empty one for fully self-contained work. Seven of
this project's eight units are blocked on a single external dependency that has
**no owner and no schedule**.

## The one dependency

**Owner:** the backend team, in `guestguideiq-app` — a separate repository this
project cannot change.
**Tracked as:** `US4.1`, recorded as an external prerequisite rather than a unit,
because nobody here can estimate, build or complete it.
**Schedule:** none. `requirements.md` OQ7 records that it has no owner and no
schedule, and it has grown three times during Inception without being re-scoped.

## Items, in order of how much they block

| # | Item | Gates | Blocks | Effort (backend) | If it slips |
|---|---|---|---|---|---|
| 1 | **AC4.1.3 — CORS origins.** Production allows exactly `https://guestguideiq.com`. No frontend origin, no staging, no `localhost`, no wildcard. `ALLOWED_ORIGINS` is also missing from `.env.example`, so a developer following the documented setup gets none. | **Every request from this frontend**, including local development and CI | B1, B2, B3, B4 — all of them | **One-line config change** plus a redeploy | Everything is buildable and **nothing is verifiable**. The whole plan runs on unverified fixtures until this lands. |
| 2 | **AC4.1.1 — `POST /v1/stays`.** No endpoint anywhere creates a Stay. The service function exists and is referenced by nothing. | Guest-link creation, and the supply side of the entire Guest experience | **B3 cannot start at all**; B4 cannot be demonstrated with a real link | New endpoint, owner-authenticated. Small, but it needs a decision on the response shape and the time-zone fix below | B3 is unstartable. B4 can be built but never shown end to end. |
| 3 | **AC4.1.9 — guest-resolvable locality content.** The stay payload carries bare `favoritedPOIIds` / `favoritedEventIds`; both list endpoints require an owner token. | Whether a guest can see a name or category for anything their host recommended | B4's real value; B2's entire delivered value | New stay-token-scoped read, or the ids resolved into the payload | Two of three guest tabs stay empty for every guest on every stay, and everything curated in B2 reaches nobody. |
| 4 | **AC4.1.8 — cross-origin tenancy.** Tenancy resolves from the request `Host` header. `requireStayToken` reads it; owner-authenticated routes do not. | The whole Guest surface, plus signup's locality resolution (AC1.1.2) | B4, and one criterion in B1 | **Architectural**, not incidental: same-origin proxy, a tenant header, or a path/body parameter | The Guest surface cannot resolve its locality. Narrower than it first appears — Owner login, guides, content and subscription are unaffected. |
| 5 | **AC4.1.7 — locality brand read.** Locality data leaves the system only through the guest stay payload and internal `127.0.0.1`-bound routes. | Every branded state in the product | Branding in B1 and B4; the invalid-link screen's branding | New read, for both an unauthenticated signup host and an authenticated owner | Everything renders the functional default. Degrades gracefully — designed for. |
| 6 | **AC4.1.2 — `GET /v1/subscriptions`.** Documented; `api-documentation.md` marks it Missing in its own gaps table. | Reading plan and status | B2's subscription screen | New read | The screen cannot show what the owner is currently on. |
| 7 | **AC4.1.4 — `GET /v1/accounts/me`.** Documented, not deployed. | Session restore on reload | B1's session restore | New read | A page reload returns the owner to the login screen. |
| 8 | **AC4.1.5 — logout / token revocation.** | Server-side session end | B1's logout | New endpoint | Logout is a client-side discard only, leaving a valid refresh token alive for **up to seven days**. A security consequence, not a convenience one. |
| 9 | **AC4.1.6 — chat history read.** | Transcript surviving a widget close | B4's chat | New read | The transcript is held locally only and lost on reload. |
| 10 | **AC4.1.10 — documented response shapes**, extended by ADR-006 to a **published machine-readable contract**. | Type generation, and any automated divergence check | `u1-api-contract`'s transition from transcribed to generated | Publishing an OpenAPI or JSON Schema document | Types stay hand-written against prose. Fixture drift stays undetectable until integration. |

## Two items this project added during Inception

Both arose from design work here and are **not** in `requirements.md` FR9 as
originally scoped. They belong to the same backend follow-up and should reach it
explicitly rather than being discovered later:

| Item | Origin | Why it matters |
|---|---|---|
| **Link expiry computed in the property's time zone.** Currently `23:59:59.999` **UTC** on the checkout date. | Refined Mockups, Q4 | For a property in UTC−5 the guest's link dies at 18:59 on the checkout evening — before they have left. The owner experiences this as "my guest's link stopped working early." `POST /v1/stays` must accept or resolve a time zone, so this must land **with** AC4.1.1, not after it. |
| **A published machine-readable contract.** | Domain Design, ADR-006 | Escalates AC4.1.10 from *documented* to *generated-from*. Removes the fixture-drift risk class rather than detecting it. Crosses a repository boundary, so it is packaging work as well as authoring work. |

## What to do about it

**Item 1 is the escalation.** It is a one-line configuration change with the
highest impact-to-effort ratio in the entire project: without it, every unit
built in every Bolt runs on fixtures nobody has checked against reality. With it,
the live-backend suite starts running and drift becomes visible continuously
instead of arriving all at once.

**Items 2 and 3 decide whether there is a product to show.** AC4.1.1 is the
supply side of the Guest experience; AC4.1.9 is whether that experience has
content in it. A frontend can be complete on both counts and still demo as hollow
without them — which is the risk the human named as their main worry at this
stage's gate.

**Item 4 needs a decision, not just implementation.** Same-origin proxy versus
tenant header versus path parameter is an architectural choice with consequences
for where tokens live (OQ3, deferred to `nfr-design`) and whether cookie auth
becomes available at all. It should not be settled incidentally while
implementing something else.

**Nothing here is mitigable by this team.** The plan's response is to build
against an intercepted network (Q4 = A), keep the live-backend suite wired and
skipped with its skip reason naming AC4.1.3, and make B4's definition of done
depend on live content resolving rather than on a mock rendering — so that
"done" cannot be reached on a fixture.
