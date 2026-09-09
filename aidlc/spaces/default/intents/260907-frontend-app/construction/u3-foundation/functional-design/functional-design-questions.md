# Functional Design — `u3-foundation`

Three questions.

**What this unit is.** `ApiClient`, `SessionManager`, `ApiErrorCatalog` and
`LocalityBrandResolver` — everything that talks to the backend or interprets what
it returns. It is `kind: library` and renders nothing, but every story's
acceptance criteria depend on it. It is also the reversibility boundary: confining
transport and token handling here is what keeps the hosting and auth-transport
decisions cheap to change later.

**Why it is the riskiest unit in the frontend.** The single-flight refresh is the
most intricate logic in the product, and it exists because of a specific backend
fact: the refresh-token store is per-process across 2–6 running tasks, so parallel
refreshes race and revoke each other. Getting it wrong logs owners out at random.

**What is already settled.** ADR-003's deliberate `ApiClient` ↔ `SessionManager`
cycle is contained inside this unit. No component above reads a token store, a raw
HTTP status, or the unparsed `visualStyling` blob. This unit is inside the 80%
coverage floor in full (ADR-007) — unlike `u2-design-system`.

---

## Q1 — Does a page reload keep the owner signed in?

Where tokens live is **OQ3**, deliberately deferred to `nfr-design`/
`infrastructure-design`, with the recorded constraint that the hosting choice must
not foreclose a same-origin proxy. That deferral is about the *mechanism*.

But a functional design has to say something about the *observable behaviour*, and
the two are not fully separable: "the session survives a reload" rules out
in-memory-only storage, which is the most secure option available.

The stakes are concrete. The backend issues a **7-day, non-revocable refresh
token** and has no logout or revocation endpoint. Anything that persists it in
browser-reachable storage is a week-long credential an XSS can lift.

- **A. Specify reload-survival now.** The session survives a reload and a new tab;
  the owner signs in once. Every screen's spec is complete, the walking skeleton is
  demonstrable end to end, and `u4-owner-shell`'s route guards have defined
  behaviour on a cold load. Cost: it commits OQ3 to *some* persistent store before
  the security work that was meant to choose one, and the safest option is off the
  table from here.
- **B. Specify in-memory only, and revisit at `nfr-design`.** A reload signs the
  owner out. Nothing persists, so the 7-day token never sits in browser storage.
  Cost: this is a genuinely poor experience for an owner authoring a guide, and it
  is not what any of the mockups imply — so it is a decision that will very likely
  be reversed, and the screens specified against it re-specified with it.
- **C. Specify the port, not the behaviour.** `SessionManager` defines a storage
  port with two named implementations (ephemeral, persistent) and the design states
  that which one is wired is OQ3's to decide. Honest about what is undecided, and
  the swap is one module. Cost: a real hole — until OQ3 resolves, no screen can
  state whether a returning owner is signed in, and the walking skeleton has to be
  demonstrated under an assumption rather than a decision.
- **X. Other (please specify)**

[Answer]: A

---

## Q2 — What happens when the refresh call itself fails?

`requirements.md`'s own review raised this and left it **Unresolved** (R-01,
Major): FR1.6/FR1.7 specify how the access token is refreshed, but nothing
anywhere specifies what happens when `POST /v1/auth/refresh` returns a failure —
an expired or revoked refresh token, or the 7-day token simply running out.

Every session eventually hits this. `AC1.10.3` covers the *screen* — the
session-expired state preserves whatever the owner had open behind it — but not
what this unit does to reach it, and the distinction matters because the two
candidate behaviours produce different screens and different tests.

- **A. End the session immediately and surface it.** A failed refresh ends the
  session at once: local session state is cleared, every in-flight request is
  failed with one typed session-ended error rather than each retrying, and
  `u4-owner-shell` renders the session-expired state over the open screen.
  Predictable, and it is what stops the client looping. Cost: an owner mid-save
  loses the request that was in flight — the editor's buffer survives, but the
  save does not.
- **B. End the session, but let the open screen attempt one replay after
  re-authentication.** As above, plus: after the owner signs in again, the request
  that triggered the failure is retried once. Better for the owner mid-save. Cost:
  a replayed guide save is a **full-replace destructive write** (`u5`'s highest-risk
  path), and a replayed subscription change is billing-affecting — replaying either
  after an arbitrary gap, against state that may have changed, is exactly the
  pattern `AC1.14.5` forbids for indeterminate outcomes.
- **X. Other (please specify)**

[Answer]: B

---

## Q3 — Are the destructive-request guards runtime checks, or types alone?

`u1-api-contract`'s three highest-consequence rules — `sections` non-optional,
`action` a closed enum, every body complete — were written on the reasoning that
**the type is the only enforcement point available**, because the backend treats
each malformed request as a *successful* destructive action. There is no error to
handle; by the time a result arrives, the guide is deleted or the subscription is
cancelled.

Types are compile-time. This unit is where those requests are actually
constructed, so it is the last place a runtime check could sit.

- **A. Types alone, as `u1` specified.** No runtime duplication. The type makes the
  dangerous request unconstructable, and the CI type-check is a blocking gate
  (`team.md`), so a violation cannot merge. Cost: nothing catches a request built
  from a value that was `any`, a cast, or JSON parsed at runtime — and a
  hand-written type transcribed from prose can itself be wrong, which has already
  happened once in this workflow.
- **B. Types, plus a runtime assertion at this boundary.** `ApiClient` refuses to
  send a guide save whose `sections` key is absent, a subscription change whose
  `action` is outside the enum, or any request with no body — throwing before the
  request leaves, as a typed client-side error. Defence in depth on the three paths
  where a mistake is unrecoverable. Cost: a small amount of duplicated intent, and
  three assertions that must be kept in step with `u1`'s types.
- **X. Other (please specify)**

[Answer]: B

---

## Consolidated Summary Confirmation

- **Q1 = A** — The session survives a reload. The owner signs in once.
- **Q2 = B** — A failed refresh ends the session, and after re-authentication the
  request that triggered it is replayed once.
- **Q3 = B** — Types **and** a runtime assertion at this boundary for the three
  destructive-request guards.

**What Q1 = A decides that OQ3 was holding.**

OQ3 (where tokens live) stays open, but its answer space has narrowed: the store
must be **persistent**, so in-memory-only is off the table from here. The recorded
constraint that the hosting choice must not foreclose a same-origin proxy now
matters more, not less — a same-origin `HttpOnly` cookie is the one persistent
option that keeps the 7-day refresh token out of JavaScript's reach entirely.

This design therefore records a **requirement for `nfr-design`**, not just a note:
persistence is decided, and the mechanism must minimise the exposure that decision
creates. The exposure is concrete — a 7-day, non-revocable refresh token, with no
logout or revocation endpoint on the backend, sitting somewhere it survives a
reload.

**The compensating control Q2 = B needs.**

Replaying a request after an arbitrary gap is safe for a read and dangerous for
two specific writes. The design bounds it rather than leaving it general:

1. **Reads are re-issued transparently.** No visible replay at all.
2. **A write is replayed with a *fresh* payload, never the captured bytes.** The
   originating unit supplies the current state at replay time. A guide save is a
   full-replace destructive write; replaying stale bytes over a guide the owner may
   have changed in between is a worse outcome than losing the save.
3. **`PATCH /v1/subscriptions` is never replayed.** `AC1.14.5` states that a
   subscription change whose outcome cannot be determined is not retried
   automatically — the app re-reads state and asks the owner. That criterion is
   already approved, so the replay path excludes this one endpoint and returns the
   owner to the subscription screen with state re-read instead.

Point 3 is the one worth being explicit about: it is not a narrowing of the
answer, it is the answer reconciled with a Must-level criterion that predates it.

**What Q3 = B changes about `u1-api-contract`.**

`u1` recorded that "the type is the only enforcement point available". After this
answer that is no longer true, and `u1`'s reasoning is unchanged but its claim is
now too strong: the type is the enforcement point *at compile time*, and this unit
adds one at run time. `u1`'s `functional-spec.md` is already reviewed and frozen;
the correction is recorded here, in the unit that now owns the second check, rather
than by reopening an approved artifact.

[Answer]: Looks correct
