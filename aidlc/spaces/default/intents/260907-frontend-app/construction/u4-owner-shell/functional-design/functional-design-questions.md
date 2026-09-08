# Functional Design — `u4-owner-shell`

Three questions.

**What this unit is.** The frame and the doors: the owner route table across both
its unauthenticated and authenticated halves, the route guards, the persistent
navigation shell, the header user menu with its logout control, and the read-only
Account screen. Seven screens — PO-1 Sign Up, PO-0 Signups Unavailable, PO-9 Log
In, PO-2 Reset Password, the session-expired state, the logout control, and PO-8
Account.

It is `kind: ui`, so this stage produces a `functional-spec.md`, a
`frontend-components.md` and a `traceability.json` — no `entities.md` or
`rules.md`. It owns no business rules; the session logic behind every access
screen lives in `u3-foundation`, and the forms are thin assemblies of
`u2-design-system` primitives.

**Why it holds the whole walking skeleton's entrance.** US1.1, US1.3 and US1.7
are the skeleton, and two of the three are screens in this unit. It is also the
common dependency of every Owner feature unit, which is why keeping features out
of it keeps them independent of each other.

**What is already settled.** The login error is non-disclosing and rendered as one
banner, not per-field (AC1.3.2) — the single deliberate exception to per-field
validation. No locality picker appears on signup (AC1.1.1). PO-0 replaces the
signup screen entirely rather than covering it, and carries no theme at all
(AC1.2.2). Logout lives in the shell header, not only on Account (AC1.11.3).

---

## Q1 — What is on screen between the app booting and the session resolving?

On a cold load the app has tokens in the store but does not yet know whether they
are valid or whose they are. `u3-foundation` resolves that; until it does, every
guarded route has an unresolved answer.

This is the classic place a frontend leaks a bug: render too eagerly and a
returning owner sees a flash of the login screen before landing on their
dashboard. It is also more than cosmetic here, because `AC1.3.3` — session
restored without a re-login — is **blocked on `AC4.1.4`**: `GET /v1/accounts/me`
does not exist, so until it lands the resolution genuinely fails and a reload
really does return the owner to PO-9.

- **A. A blocking resolution state.** Nothing routes until the session resolves.
  The app renders one neutral state — no shell, no login form — and then goes
  where it belongs. No flash is possible, and the behaviour is identical whether
  `AC4.1.4` has landed or not. Cost: a returning owner sees a hold on every cold
  load, and if the resolution hangs, so does the app — so it needs a timeout that
  falls through to PO-9.
- **B. Render the shell optimistically, then correct.** If tokens are present,
  assume the session is good and render the dashboard frame immediately;
  correct to PO-9 if resolution fails. Feels fastest for the common case. Cost:
  a failed resolution shows the owner a frame that then vanishes — and while
  `AC4.1.4` is missing, that is the *only* case, so every reload gets the worse
  experience.
- **C. Guard at the route, not the app.** Unauthenticated routes render
  immediately; guarded routes hold individually until the session resolves.
  Nothing global blocks. Cost: the hold is per-route, so navigating between two
  guarded screens during resolution can hold twice, and the shell's own identity
  display has to tolerate an unresolved session.
- **X. Other (please specify)**

[Answer]: A

---

## Q2 — Do we build the reset-password confirmation screen now?

`AC1.4.1` (request a link) and `AC1.4.3` (expired or unknown link) are both
buildable and testable. `AC1.4.2` — following a valid link and setting a new
password — **is not, by any route available to a test**: the backend generates a
reset token and then discards it, there is no mailer, no SES construct and no
queue, so no link can be obtained outside a direct database read.

The screen itself is trivial. The question is whether an untestable screen on a
dead path belongs in this unit now.

- **A. Build all three screens; mark the middle one untestable.** The route
  exists, the form works against a token in the URL, and the automated suite
  covers `AC1.4.1` and `AC1.4.3` only. When a mailer lands, the flow is already
  complete. Cost: shipping a screen no test exercises and no user can reach — the
  kind of thing that rots quietly and is discovered broken the day it matters.
- **B. Build the two testable screens; defer the confirmation screen.** PO-2 and
  the expired-link screen ship; the `/reset/confirm` route is recorded as a named
  deferral against the mailer work. Cost: `AC1.4.2` is visibly unmet rather than
  quietly unmet, and a later mailer needs a small frontend follow-up rather than
  none.
- **X. Other (please specify)**

[Answer]: B

---

## Q3 — Where does a just-authenticated owner land if their onboarding state cannot be read?

`AC1.3.1` and `AC1.1.2` both route by onboarding state rather than asking the
owner: incomplete goes to PO-3, finished goes to PO-5. That requires
`GET /v1/onboarding` to succeed immediately after authenticating.

It can fail. The rate limiter is an in-memory bucket per process across 2–6
tasks, so limits are effectively multiplied and unpredictable; a `429`, a
transport failure or a `500` right after login is a real occurrence, not a
hypothetical. Nothing upstream says what happens then, and this is on the
walking-skeleton path.

- **A. Hold on the login screen with a retry.** Authentication succeeded, but the
  app does not route until it knows where to. The owner sees a retry rather than
  a wrong destination. Cost: an owner who is definitely signed in is looking at a
  login screen, which reads as a failed login even though it was not — and if the
  read keeps failing they are stuck at the door.
- **B. Route to the dashboard and let it recover.** Land on PO-5 and let the
  guide editor handle its own load failure with the error and retry it already
  owes `AC1.7.4`. Cost: an owner who has **not** finished onboarding is put
  somewhere they should not be; the wizard is forward-only, so the recovery path
  back into PO-3 has to be explicit rather than assumed.
- **C. Route to the wizard.** Land on PO-3, which reads onboarding state itself
  and will show the correct step once the read succeeds. A finished owner sees
  the wizard's completed-state redirect rather than a wrong screen. Cost: a
  returning owner who finished onboarding months ago briefly lands in a signup
  wizard, which is alarming in a way the other two failures are not.
- **X. Other (please specify)**

[Answer]: B

---

## Consolidated Summary Confirmation

- **Q1 = A** — A blocking resolution state. Nothing routes until the session
  resolves.
- **Q2 = B** — Build PO-2 and the expired-link screen; defer `/reset/confirm`.
- **Q3 = B** — On a failed onboarding read, route to the dashboard and recover
  from there.

**What Q1 = A costs today, and why it is still the right call.** `AC4.1.4` does
not exist, so the resolution currently fails on every cold load — which means the
blocking state is not a rare hold, it is what every returning owner sees before
being sent to PO-9. That is the honest presentation of a broken capability rather
than a disguised one, and it is why A is preferable to B: optimistically rendering
a shell that then vanishes would make a known gap look like a glitch. Two things
follow, and both are design obligations rather than notes:

1. The blocking state has a **bounded timeout** that falls through to PO-9. An
   app that hangs because a resolution never returns is worse than one that asks
   for a login.
2. It must **read as working, not as stuck** — the shell's own loading treatment,
   not a blank page. `NFR5` puts interactive feedback at roughly 300ms.

**The compensating control Q3 = B needs.** Routing to PO-5 on a failed onboarding
read puts an owner who has not finished onboarding somewhere `AC1.5.1` says they
should not be — "given a new account, when I first log in, then I land in the
wizard". The guide read will not rescue this: `GET` on the guide **creates an
empty draft row** rather than failing, so an un-onboarded owner sees a plausible
empty editor rather than an error.

So the recovery is explicit and belongs to this unit, not to `u5-owner-guide`:

1. The shell **retries the onboarding read in the background** after routing.
2. When it resolves as incomplete, the shell **routes to PO-3**, exactly as it
   would have done had the read succeeded first time.
3. The dashboard is rendered in a **provisional** state until that read resolves,
   so nothing irreversible is offered on the strength of a routing guess.

Point 3 is the one that matters: without it, the window between landing on PO-5
and the retry resolving is a window in which an un-onboarded owner could start
authoring a guide.

**What Q2 = B records rather than builds.** `AC1.4.2` moves from "quietly unmet"
to a named deferral with an owner: the `/reset/confirm` route is not built, and
the reason is the backend's, not the frontend's — the reset token is generated and
discarded, and there is no mailer, no SES construct and no queue. This is recorded
as `Deferred` in traceability against the backend follow-up rather than left to
look like an oversight.

[Answer]: Looks correct
