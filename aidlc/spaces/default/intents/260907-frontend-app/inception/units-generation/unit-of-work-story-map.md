# Story Map — GuestGuideIQ Frontend

Every story from `stories.md` mapped to the unit that implements it.

## Story assignments

| Story | Summary | Unit | Directory |
|---|---|---|---|
| US1.1 | Sign up through a locality domain | U4 | `u4-owner-shell` |
| US1.2 | Clear page when the address maps to no locality | U4 | `u4-owner-shell` |
| US1.3 | Log in | U4 | `u4-owner-shell` |
| US1.4 | Reset a forgotten password | U4 | `u4-owner-shell` |
| US1.5 | Be guided through onboarding, and resume it | U5 | `u5-owner-guide` |
| US1.6 | Choose to build my guide from scratch | U5 | `u5-owner-guide` |
| US1.7 | Edit and save my guide | U5 | `u5-owner-guide` |
| US1.8 | Publish my guide, and know what guests see | U5 | `u5-owner-guide` |
| US1.9 | Generate a guest link and copy it | U7 | `u7-guest-links` |
| US1.10 | Be told plainly when my session ends | U4 | `u4-owner-shell` |
| US1.11 | Log out | U4 | `u4-owner-shell` |
| US1.12 | Curate the local recommendations in my guide | U6 | `u6-owner-locality-billing` |
| US1.13 | Start a subscription | U6 | `u6-owner-locality-billing` |
| US1.14 | Manage my existing subscription | U6 | `u6-owner-locality-billing` |
| US1.15 | Manage my account details | U4 | `u4-owner-shell` |
| US2.1 | Open my stay link and know it's really mine | U8 | `u8-guest-app` |
| US2.2 | Clear message when a link doesn't work | U8 | `u8-guest-app` |
| US2.3 | Browse what my host recommends | U8 | `u8-guest-app` |
| US2.4 | Ask for an itinerary | U8 | `u8-guest-app` |
| US2.5 | Have the guide behave honestly on a bad connection | U8 | `u8-guest-app` |
| US4.1 | Land the backend follow-up | — | **not a frontend unit** |

## Where the auth and session stories sit, and why — corrected in revision

`US1.1`, `US1.2`, `US1.3`, `US1.4`, `US1.10` and `US1.11` belong to
`u4-owner-shell`.

**The first version of this map put them in `u3-foundation`**, reasoning that the
substance of each is session behaviour rather than layout: `US1.10`'s criteria
are entirely single-flight refresh, refresh-call failure and clearing local
state; `US1.3`'s non-disclosing error and `US1.1`'s duplicate-username handling
are error-envelope translation; `US1.11` is server-side revocation.

That reasoning is still true, and it was still the wrong assignment. Review found
the consequence: `u3-foundation` renders nothing and is described as having no
user-facing surface, so placing those stories there left **the signup and login
screens with no owning unit at all** — on the walking-skeleton path. A developer
starting Bolt 1 would have had nowhere to put them.

The rule this stage now follows, and which the cross-cutting table below already
applied correctly for `US1.10` and `US1.11`:

> **A story belongs to the unit that owns the surface it delivers. Where the
> logic behind that surface lives elsewhere, record it as cross-cutting rather
> than moving the story.**

So the screens sit with the route table that admits them, and the session logic
they depend on stays in `u3-foundation` and is named below. `US1.2` follows the
same rule: it is a page, even though `LocalityBrandResolver` is what determines
that no brand resolved.

**Consequence, recorded rather than hidden:** `u3-foundation` now carries no
stories, joining `u1-api-contract` and `u2-design-system`. All three
library-and-spec units are story-less and all five `ui` units carry stories,
which is a more consistent shape than the original mapping produced — but it does
mean the unit with the most intricate logic in the product has no story of its
own to trace it to. Its behaviour is reachable through the acceptance criteria of
every story that depends on it, and the cross-cutting table is where that is
made explicit.

## Cross-cutting stories

These are implemented in one unit but observable across several. Named so a
reviewer does not read a single-unit assignment as a claim that nothing else is
affected.

| Story | Owning unit | Logic and surfaces elsewhere |
|---|---|---|
| US1.1 (sign up) | U4 | Account creation, the resulting session, and duplicate-username error translation are `u3-foundation`. The screen is a thin form over `u2-design-system` primitives. Blocked on AC4.1.8 — cross-origin tenancy — before it can succeed at all. |
| US1.2 (no locality at this address) | U4 | `LocalityBrandResolver` in `u3-foundation` determines that no brand resolved. Not reachable in practice until AC4.1.7. |
| US1.3 (log in) | U4 | Credential exchange and the non-disclosing error are `u3-foundation`. Session restore on reload is blocked on AC4.1.4. |
| US1.4 (reset password) | U4 | The request call is `u3-foundation`. The middle of the flow cannot be completed at all — no mailer exists. |
| US1.10 (session ends) | U4 | The single-flight refresh, the refresh-call-failure rule and clearing local state are all `u3-foundation`. The shell presents the state over whichever screen is open, preserving its in-progress content, so **every Owner unit must tolerate being interrupted by it**. |
| US1.11 (log out) | U4 | Server-side revocation is `u3-foundation` and is blocked on AC4.1.5 — until then logout is a client-side discard. The control lives in the header user menu (AC1.11.3) and is linked from the account screen. |
| US1.15 (account details) | U4 | Reads the resolved account identity from `u3-foundation`; owns no state itself. |
| US2.5 (bad connection) | U8 | Its rate-limited and failed-load states are rendered from `u2-design-system` primitives and keyed on `u3-foundation`'s typed errors. |
| US1.8 (publish and preview) | U5 | The guest-view preview renders guest-shaped content, but through shared primitives rather than by importing `u8-guest-app` — see the non-edge in `unit-of-work-dependency.md`. |

## Story order within each unit

Ordering **inside** a unit, where one story genuinely enables another. This is
not a build order across units — Delivery Planning owns that.

- **U4 `u4-owner-shell`** — US1.1 and US1.3 first (they establish a session at
  all, and the walking skeleton needs both), then US1.10 and US1.11 (which act on
  an existing session), then US1.15 (the account screen needs an identity to
  show). US1.2 and US1.4 are independent of the rest and of each other; US1.4's
  middle cannot be completed anyway without a mailer.
- **U5 `u5-owner-guide`** — US1.5 → US1.6 (onboarding, in flow order), then
  US1.7 → US1.8 (author before publish). The wizard completes into the editor,
  so the pairing is sequential in both directions.
- **U6 `u6-owner-locality-billing`** — US1.13 before US1.14 (there is nothing to
  manage before there is a subscription). US1.12 is independent of both.
- **U7 `u7-guest-links`** — a single story.
- **U8 `u8-guest-app`** — US2.1 first (nothing renders without a resolved stay),
  then US2.2 (the same resolution's failure branch), then US2.3, then US2.4 and
  US2.5. US2.5's states apply across all of them, so it is last only in the sense
  that it needs something to degrade.

## Coverage verification

**Every story is assigned.** All 21 stories from `stories.md` appear in the table
above: 20 mapped to a frontend unit, and US4.1 recorded as out of frontend scope.

**Every `ui` unit has stories. The three `library` and `spec` units have none.**

| Unit | Kind | Stories |
|---|---|---|
| U1 `u1-api-contract` | spec | none |
| U2 `u2-design-system` | library | none |
| U3 `u3-foundation` | library | none |
| U4 `u4-owner-shell` | ui | US1.1, US1.2, US1.3, US1.4, US1.10, US1.11, US1.15 |
| U5 `u5-owner-guide` | ui | US1.5, US1.6, US1.7, US1.8 |
| U6 `u6-owner-locality-billing` | ui | US1.12, US1.13, US1.14 |
| U7 `u7-guest-links` | ui | US1.9 |
| U8 `u8-guest-app` | ui | US2.1, US2.2, US2.3, US2.4, US2.5 |

**A unit with no stories is normally a smell**, so the three are flagged here
rather than left to be noticed. The split is clean along `kind`: every unit that
renders something carries the stories it renders, and no unit that renders
nothing carries a story. `u1-api-contract` is generated types; `u2-design-system`
is the primitives every story is assembled from; `u3-foundation` is the session,
transport and error behaviour every story's criteria depend on. None delivers
user-visible behaviour on its own.

Each was made a unit for a structural reason the team confirmed (Q1, Q2, Q3), not
because a story pushed it into existence.

**The one thing this costs**, stated plainly: `u3-foundation` holds the most
intricate logic in the product — single-flight refresh, the refresh-failure rule,
error-envelope translation — and has no story of its own to trace it to. It is
reachable only through the acceptance criteria of the stories that depend on it,
which the cross-cutting table above enumerates. Whoever builds it should read
that table rather than looking for a story with its name on it.

## US4.1 — out of frontend scope

`US4.1` is the backend follow-up: `POST /v1/stays`, the CORS and tenancy fix, the
subscription and current-account reads, logout, chat history, the locality brand
read, guest-resolvable locality content, and — added by ADR-006 — a published
machine-readable contract.

It is not mapped to a unit because it is **another team's work, in another
repository**. Nobody in this frontend's unit list can estimate it, build it or
complete it, and putting it in the DAG would create a unit nobody can close.

The dependency is recorded instead as an external prerequisite, with each blocked
unit naming the specific `AC4.1.x` it waits on — see the blocked-unit table in
`unit-of-work.md`. Seven of the eight units appear in that table.
