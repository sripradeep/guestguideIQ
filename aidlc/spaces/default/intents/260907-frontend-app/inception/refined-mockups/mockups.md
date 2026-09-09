# Refined Mockups — GuestGuideIQ Frontend (Property Owner + Guest)

Text-based mid-fidelity wireframes per `wireframing-guide.md`, covering the 15
Owner stories and 5 Guest stories in `stories.md`. Each screen names its primary
(Success) state plus the alternate states that materially differ — Empty,
Loading, Error, Partial — rather than repeating all five where they don't.

## How this differs from the prior intent's design

The `260905-backend-services-spec` intent produced a reviewed-READY design set
covering PO-0 through PO-6 and G-1 through G-3. That design was drawn against
what the system was **specified** to do. This one is drawn against what the
deployed API **actually** does, and adds the screens that were never drawn.

Changes carried in from the User Stories mob review, each verified against
backend source rather than against the prior design:

| Change | Prior design | Now | Cause |
|---|---|---|---|
| Guest trust cue | Property photo + name | Property **name** only | No property image exists anywhere in the system — no upload endpoint, no object storage, and the stay payload returns `property: { id, name }` (AC2.1.5) |
| Onboarding resume | "prior entries preserved" | Resume at the reported step; unsubmitted entries restored from client-held draft or shown visibly empty | `GET /v1/onboarding` returns `{ currentStep, completed }` only (AC1.5.2) |
| Onboarding back-navigation | "backward navigation without data loss" | Read-only review of prior steps; no re-submit | The step machine is forward-only; `assertStep` throws `409 CONFLICT` off the current step (AC1.5.3) |
| PDF import (FileUpload) | Full upload + extraction flow | **Removed from the first release** | AC1.6.2 defers the path; no upload control is shown |
| Admin screens AD-1/AD-2/AD-3 | Designed | **Out of scope** | The admin API needs an ops-role token nothing in the system issues |
| Marketing lead forms | Covered here | **Out of scope** | Shipped separately; not part of this frontend |
| Guide save | Plain `[Save]` | Explicit Save with a **shrink guard** | A mis-keyed save returns `200` with every section deleted, not `400` (AC1.7.2, Q5) |
| Subscription controls | Four active controls | Upgrade/Downgrade **visibly disabled** with an explanation | Only one tier exists and neither action changes an observable field (AC1.14.2, Q6) |
| Login screen | **Never drawn** | **PO-9** below | US1.3 is a walking-skeleton story with no screen in the prior set — a genuine gap, closed here |
| Guest link screen | **Never drawn** | **PO-7** below | US1.9; the stage's stated deliverable |
| Account screen | Named in the rail, never drawn | **PO-8** below | US1.15, closing reviewer finding R-02 on `requirements.md` |

## Two standing notes that apply to every screen below

**1. Branding is drawn as primary but does not ship in the first release (Q2).**
Every screen that shows a locality brand is drawn in its branded state, because
that is the intended design. **No route returns a locality brand to the frontend
today** — locality data leaves the system only through the guest stay payload and
internal `127.0.0.1`-bound create routes. Until AC4.1.7 lands, every one of these
screens renders the functional default instead: base tokens, no locality logo, no
locality accent. Each affected screen repeats this as a **Ships as** line. Nothing
in this document should be read as a description of what release 1 looks like on
screen.

**2. The walking skeleton is PO-1 → PO-9 → PO-3 → PO-5**, matching `stories.md`:
sign up, log in, onboard, author and publish. PO-7, PO-8, PO-2, PO-4 and PO-6 are
outside Bolt 1.

---

# Property Owner Screens

## PO-9: Log In (US1.3) — **new; missing from the prior design**

```
┌─────────────────────────────────────┐
│  [Locality logo]  [Locality name]    │
│                                       │
│          Log in                       │
│  ┌─────────────────────────────┐    │
│  │ Username                     │    │
│  ├─────────────────────────────┤    │
│  │ Password                     │    │
│  └─────────────────────────────┘    │
│         [ Log in ]                    │
│  Forgot your password?                │
│  New here? Create an account          │
└─────────────────────────────────────┘
```

- **Success (AC1.3.1)**: authenticated, then routed by onboarding state — into
  PO-3 if onboarding is incomplete, straight to PO-5 if it is finished. The user
  never chooses; the app reads the state and routes.
- **Error (AC1.3.2)**: wrong password and unknown username produce **one
  identical message** — "We couldn't log you in with those details" — rendered in
  a StatusBanner above the form, never per-field. Distinguishing the two would
  disclose which usernames exist.
- **Reload (AC1.3.3)**: session is restored without a re-login. *Blocked on
  AC4.1.4 (`GET /v1/accounts/me`); until it lands, a reload returns the user
  here.*
- **Ships as**: functional default, unbranded (blocked on AC4.1.7).

> **Why this screen is new.** US1.3 is a Must, implementation-ready,
> walking-skeleton story. The prior design set has no login screen — PO-1 links
> to "Log in" and nothing receives it. Bolt 1 cannot be built without this.

## PO-1: Sign Up (US1.1)

```
┌─────────────────────────────────────┐
│  [Locality logo]  [Locality name]    │
│                                       │
│      Create your account              │
│  ┌─────────────────────────────┐    │
│  │ Username                     │    │
│  ├─────────────────────────────┤    │
│  │ Password                     │    │
│  └─────────────────────────────┘    │
│         [ Create account ]            │
│  Already have an account? Log in      │
└─────────────────────────────────────┘
```

- **No locality selection appears anywhere (AC1.1.1).** The locality is resolved
  from the address the owner arrived at and assigned silently. A visible picker
  would contradict the whole tenancy model.
- **Success (AC1.1.2)**: account created, authenticated, straight into PO-3.
- **Duplicate username (AC1.1.3)**: inline error on the username field —
  "That username is already taken" — not a banner. It is a field-level problem
  with a field-level fix.
- **Field validation (AC1.1.4, AC1.1.5)**: validate on blur, never per keystroke.
  Where the backend returns field-level detail, each detail attaches to its own
  named field rather than collapsing into one message.
- **Unmapped domain (AC1.2.1)**: this screen is replaced entirely by PO-0 — not
  shown with a banner over it.
- **Ships as**: functional default, unbranded (blocked on AC4.1.7).

> **Cross-origin caveat (AC1.1.6).** The backend resolves the tenant from the
> request `Host`. A frontend on its own origin makes every signup return
> `404 LOCALITY_NOT_RESOLVED` regardless of what this screen does. CORS permits
> the request; it does not change the `Host`. Satisfying this is AC4.1.8's job,
> not this screen's — but the screen is untestable end-to-end until it lands.

## PO-0: Signups Unavailable (US1.2)

```
┌─────────────────────────────────────┐
│                                       │
│            ( ! )                      │
│                                       │
│   Signups aren't available            │
│   at this address.                    │
│                                       │
└─────────────────────────────────────┘
```

- **No form at all (AC1.2.1)** — not a disabled form, not a form behind a banner.
- **No theme of any kind (AC1.2.2)**, not even the product's default accent. No
  locality resolved, so nothing is claimed. This is the one screen in the product
  with no `BrandTheme` applied in any state.
- **No raw status or code (AC1.2.3).**
- **Ships as**: exactly as drawn. This screen is not blocked on anything.

> **Reachability caveat.** Determining "this address maps to nothing" before
> showing a form requires AC4.1.7. Today the only signal is a `404` from a real
> signup attempt, which is not usable as a probe: validation runs before the
> locality check, so an empty probe returns `400`, and a real one spends the
> 5/min/IP budget. Until AC4.1.7 lands, this screen is reachable in design but
> not in practice.

## PO-2: Reset Password (US1.4)

```
┌─────────────────────────────────────┐
│   Reset your password                 │
│  ┌─────────────────────────────┐    │
│  │ Username                     │    │
│  └─────────────────────────────┘    │
│        [ Send reset link ]            │
└─────────────────────────────────────┘
```

- **Success (AC1.4.1)**: "If that account exists, we've sent a reset link" —
  **identical whether or not the account exists**. The message is deliberately
  conditional in its wording so it is not a lie in either case.
- **Expired / unknown / used link (AC1.4.3)**: a separate screen — "This link has
  expired" with a [Request a new link] action. Never a dead end.
- **Ships as**: functional default, unbranded.

> **This flow cannot be completed end to end (C8-equivalent).** The route
> discards the reset token it generates. There is no mailer, no SES construct and
> no queue, so AC1.4.2 — following a valid link and setting a new password — has
> no way to obtain a link outside a direct database read. The screens are
> buildable and AC1.4.1/AC1.4.3 are testable; the middle of the flow is not.

## PO-3: Onboarding Wizard (US1.5, US1.6)

```
┌─────────────────────────────────────┐
│ [Locality logo]  [Locality name]      │
│  ●──●──○──○   Step 2 of 4: Your guide │
│  Property · Guide · Content · Done    │
│                                       │
│  How do you want to start your guide? │
│                                       │
│      [ Start from scratch ]           │
│                                       │
│  ✓ Saved                              │
│               [ Review ]  [ Continue ]│
└─────────────────────────────────────┘
```

- **Step indicator carries labels, not just dots (AC1.5.1)** — "Step 2 of 4" plus
  the named steps beneath it.
- **Resume (AC1.5.2)**: on return, the wizard opens at the step the backend
  reports as current. Any entry typed but not submitted is restored from
  client-held draft state; where it was not retained, **the field is empty and
  visibly so** — never silently prefilled with a stale value. A wrong prefill on
  a permanent, unchangeable property name is worse than an empty field.
- **Backward movement is review-only (AC1.5.3)**: `[Review]` opens prior steps as
  **read-only**. There is no Back button that returns you to an editable step,
  because there is no route that would accept the resubmission.
- **Saved indication (AC1.5.4)**: shown on each successful step transition.
- **No PDF upload control (AC1.6.2)** — the import path is deferred, so the
  control is absent rather than present-and-disabled.
- **Completed accounts never see this again (AC1.5.5)**: PO-9 routes them
  straight to PO-5.
- **Ships as**: functional default, unbranded (blocked on AC4.1.7 for AC1.5.6).

> **A named product gap, surfaced rather than designed around (AC1.5.3).** An
> owner who mistypes their property name cannot correct it during onboarding, or
> afterwards — no route edits it. That name is the guest's trust cue on G-2. The
> read-only review step is what makes the mistake *visible* before the final
> step commits; it cannot make it *fixable*. Whether a property-name edit
> endpoint gets built is a product decision, recorded here as the design's
> sharpest constraint rather than hidden inside a wizard behaviour.

## PO-5: Guide Editor (US1.7, US1.8) — the dashboard shell

The persistent shell all of PO-4/PO-5/PO-6/PO-8 render inside.

```
┌──────────┬──────────────────────────────────────┐
│[Locality logo]         Priya ▾  ← user menu      │
├──────────┼──────────────────────────────────────┤
│ ▸ Guide  │  Beach House Cottage      ● Published │
│   Content│  ┌────────────────────────────────┐  │
│   Subscr.│  │ ▸ Welcome            [edit]     │  │
│   Account│  │ ▸ House rules        [edit]     │  │
│          │  │ ▸ Getting around     [edit]     │  │
│          │  └────────────────────────────────┘  │
│          │  [ + Add section ]                    │
│          │                                       │
│          │  ⬤ Unsaved changes                    │
│          │        [ Preview as guest ] [ Save ]  │
└──────────┴──────────────────────────────────────┘
```

- **Save is explicit; there is no autosave (Q5).** The editor always sends the
  **complete** section set under the exact expected key (AC1.7.2).
- **Shrink guard (Q5, AC1.7.3)**: when the outgoing payload carries fewer
  sections than the last loaded state, saving first shows a confirmation naming
  the count and the sections: *"This will remove 2 sections: 'House rules',
  'Getting around'. They can't be recovered."* A legitimate delete costs one
  extra click; an accidental one is caught.
- **Save failure (AC1.7.4)**: error shown, **edits stay on screen**, nothing
  silently discarded. The editor never clears itself on a failed write.
- **No refetch on window focus (AC1.7.5)** — a configuration of the API-client
  module, not per-component discipline.
- **Published state**: a persistent indicator by the property name — `● Published`
  or `○ Draft` — with publish/unpublish available (AC1.8.1, AC1.8.2).
- **Empty (nothing published, AC1.8.4)**: `[ Preview as guest ]` opens a framed
  preview of **exactly what a guest currently sees**, labelled as a preview. The
  prior design showed owner-framed copy here ("guests will see this exact message
  until you publish"), which is nonsense if it ever reached a guest. The instinct
  was right; the framing was not.
- **Logout lives in the user menu (AC1.11.3)**, in the shell header — reachable
  from every dashboard screen without going through Account.
- **Ships as**: functional default, unbranded (blocked on AC4.1.7).

### Shell responsive behaviour (NFR4)

| Width | SideNav |
|---|---|
| < 768px | Hamburger-triggered overlay |
| 768–1023px | Icons-only rail, labels on hover/focus |
| ≥ 1024px | Persistent, expanded |

## PO-7: Generate a Guest Link (US1.9) — **new**

> **Provisional (Q1).** `POST /v1/stays` does not exist yet; its shape is being
> settled by the `post-stays-endpoint` work. This screen is drawn against the
> known internal `createStay` shape `{ propertyId, checkIn, checkOut }`. The two
> assumptions marked **[assumed]** below must be re-verified when that endpoint
> lands, and this screen revised if they do not hold.

```
┌──────────┬──────────────────────────────────────┐
│ ▸ Guide  │  Guest links                          │
│   Content│  ┌────────────────────────────────┐  │
│   Subscr.│  │ New link                        │  │
│   Account│  │ Check-in    [ 12 Mar 2026  📅 ]│  │
│          │  │ Check-out   [ 15 Mar 2026  📅 ]│  │
│          │  │ Times shown in Europe/Lisbon    │  │
│          │  │             [ Generate link ]   │  │
│          │  └────────────────────────────────┘  │
│          │                                       │
│          │  Your links                           │
│          │  ┌────────────────────────────────┐  │
│          │  │ 12–15 Mar   ● Valid             │  │
│          │  │ https://springfield.gg.io/s/... │  │
│          │  │            [Copy]               │  │
│          │  ├────────────────────────────────┤  │
│          │  │ 2–5 Mar     ○ Expired           │  │
│          │  │ https://springfield.gg.io/s/... │  │
│          │  │            [Copy]               │  │
│          │  └────────────────────────────────┘  │
└──────────┴──────────────────────────────────────┘
```

- **A dated form, not a button (AC1.9.1)**: the stay's validity window is
  check-in and check-out dates. Link expiry derives from checkout.
- **Time zone is captured and displayed (Q4, AC1.9.1).** The property's time zone
  is shown beneath the dates and used for every date the owner reads. See the
  backend requirement below — this is not cosmetic.
- **Invalid range (AC1.9.2)**: checkout before check-in, or dates already past,
  produce a specific inline error on the offending field. No link is created.
- **Copy (AC1.9.3, AC1.9.6, AC1.9.7)**: the copy control confirms visibly **and**
  announces via a polite live region. **The full link is always present as
  selectable text** — the copy button is never the only way to get it, because
  clipboard access fails silently in more browsers and contexts than people
  expect.
- **Full absolute link on the property's own locality domain (AC1.9.4)**, never a
  bare token and never a separate central address. **[assumed]** — requires the
  endpoint to return the full link and AC4.1.7 for the domain.
- **Link list persists (AC1.9.5)**: every generated link stays listed, copyable,
  labelled with its stay window and whether it is still valid. **[assumed]** —
  requires a readable list of stays, which no endpoint provides today.
- **Generation failure (AC1.9.8)**: a clear error and **no partial link**. A
  half-formed link is worse than none — the owner may send it.
- **Empty (no links yet)**: the form alone, with "You haven't created any guest
  links yet." No empty table.
- **Ships as**: functional default, unbranded. Also **blocked on AC4.1.1** — this
  screen cannot be built at all until the endpoint exists.

> **Backend requirement added by Q4 — for the `post-stays-endpoint` work.**
> Link expiry is currently computed as `23:59:59.999` **UTC** on the checkout
> date. For a property in UTC−5 the link dies at 18:59 on the checkout evening,
> before the guest has left; in UTC+2 it survives until 01:59 the next local
> morning. Expiry must be computed in the **property's** time zone, which means
> `POST /v1/stays` needs to accept or resolve one. This is a named addition to
> AC4.1.1 arising from this stage, not a pre-existing requirement — see
> `interaction-spec.md` § DateRangeField.

## PO-8: Account (US1.15) — **new**

```
┌──────────┬──────────────────────────────────────┐
│   Guide  │  Account                              │
│   Content│                                       │
│   Subscr.│  Signed in as     priya_m             │
│ ▸ Account│  Property         Beach House Cottage │
│          │  Locality         Downtown Springfield│
│          │                                       │
│          │  Manage your subscription →           │
│          │                                       │
│          │  [ Log out ]                          │
└──────────┴──────────────────────────────────────┘
```

- **Read-only (Q3, AC1.15.1)**. Three identity values, a link to Subscription,
  and a logout control (AC1.15.2). Nothing on this screen can be edited, and
  nothing on it is drawn as though it could — no disabled inputs, no greyed
  "Change password" that leads nowhere.
- **Ships as**: functional default, unbranded.

> **Why it is this thin, deliberately.** The API allows nothing else. **No email
> is ever collected** (signup takes a username and password only), **no
> password-change endpoint exists**, and **no property-name edit endpoint
> exists**. Drawing affordances for any of those would be drawing a lie. This
> screen is `Should` priority and logout is separately reachable from the shell
> (AC1.11.3), so nothing Must-priority depends on it.

## PO-4: Subscription (US1.13, US1.14)

```
┌──────────┬──────────────────────────────────────┐
│   Guide  │  Subscription                         │
│   Content│  ┌────────────────────────────────┐  │
│ ▸ Subscr.│  │ Plan     Standard               │  │
│   Account│  │ Status   ● Active               │  │
│          │  └────────────────────────────────┘  │
│          │  [ Upgrade ]  [ Downgrade ]  ← disabled│
│          │  Only one plan is offered at present.  │
│          │                                       │
│          │  [ Cancel subscription ]              │
└──────────┴──────────────────────────────────────┘
```

- **Upgrade and Downgrade are visibly disabled with an explanation (Q6)**, not
  hidden and not active. Both actions set status to `active` and touch no plan
  field; only one tier exists, so neither can produce an observable change. A
  working-looking control that does nothing is discovered as a lie in use.
- **No active subscription (AC1.14.4)**: Upgrade, Downgrade and Cancel are all
  disabled with "Start a subscription first"; only `[ Start subscription ]` is
  active.
- **Payment failure (AC1.13.2)**: a banner stating plainly that **no changes were
  made to your account**, and the account is unchanged.
- **Cancel confirmation (AC1.14.3)**: a modal that states, before committing,
  that **guide content stays intact and resubscribing restores access**. Verified
  against the code — `cancel` only sets status.
- **Indeterminate outcome (AC1.14.5)**: on a timeout or network failure the app
  **does not retry**. It re-reads subscription state and asks the owner what to
  do.
- **Ships as**: functional default, unbranded. `Plan` and `Status` are **blocked
  on AC4.1.2**; until it lands there is no read for them.

> **The highest-consequence screen in the product.** The endpoint's final `else`
> branch cancels the subscription on **any** unrecognised action, and the body is
> read as `request.body?.action` — so a missing body reaches `cancel`. Every
> control here must send an action drawn from a fixed typed set, and every
> request must carry a body. A speculative retry on an ambiguous failure is a
> silent billing event, which is why AC1.14.5 forbids automatic retry outright.

## PO-6: Locality Content (US1.12)

```
┌──────────┬──────────────────────────────────────┐
│   Guide  │  Downtown Springfield                 │
│ ▸ Content│  Places                               │
│   Subscr.│  ┌──────────┐ ┌──────────┐           │
│   Account│  │ Café Rosa │ │ Pier Walk │  ...     │
│          │  │ Café   ★  │ │ Outdoors ☆│          │
│          │  └──────────┘ └──────────┘           │
│          │  Events                               │
│          │  ┌──────────┐ ┌──────────┐           │
│          │  │ Night Mkt │ │ Jazz Fri  │          │
│          │  │ 14 Mar ☆  │ │ 15 Mar ★  │          │
│          │  └──────────┘ └──────────┘           │
└──────────┴──────────────────────────────────────┘
```

- **One click, no confirmation (AC1.12.1)** — favouriting is reversible and
  low-stakes.
- **Optimistic with revert (AC1.12.2)**: the star updates immediately and reverts
  with an inline notice if the request fails.
- **Empty locality (AC1.12.4)**: render **the message the backend supplies**, not
  a competing hardcoded string, and never a blank grid.
- **Out-of-locality rejection (AC1.12.5)**: inline error.
- **Ships as**: functional default, unbranded.

> **This screen's value is deferred, not delivered, in release 1 (AC4.1.9).**
> Nothing curated here reaches any guest. The stay payload carries bare
> `favoritedPOIIds` / `favoritedEventIds`, and the POI and event list endpoints
> both require an owner token — so a guest cannot resolve an id into a name. An
> owner curating carefully here is, today, curating into a void. The screen
> should not imply otherwise: it says "Favourites appear in your guide" only once
> AC4.1.9 lands, and until then reads "Favourites are saved and will appear in
> your guide once local listings are available to guests."

## Session expiry (US1.10) — a state across every authenticated screen

```
┌─────────────────────────────────────┐
│  ( ! )  Your session has expired      │
│                                       │
│  Please log in again. Your unsaved    │
│  changes are still on screen behind   │
│  this message.                        │
│                                       │
│         [ Log in again ]              │
└─────────────────────────────────────┘
```

- **Explicit, never a silent redirect and never a generic error (AC1.10.1).**
- **Local session state is cleared (AC1.10.2)**, but **editor state is preserved
  on screen and no success indication is shown for the failed save (AC1.10.3)**.
- **Exactly one refresh attempt (AC1.10.4)**: concurrent auth failures collapse
  into a single in-flight refresh; the rest wait on its result.
- **A `401` from the refresh call itself ends the session (AC1.10.5)** rather
  than refreshing again. Without this the client loops.

> **Not fully specifiable yet.** Whether the app blocks and preserves the buffer
> or re-authenticates in place and replays the save is a product decision that
> was raised at the User Stories gate and accepted as risk rather than settled;
> the two are materially different builds. This design commits to the *blocking*
> reading — the safer of the two, and the one that cannot silently double-write —
> and marks it as revisitable. Separately, refresh-token rotation means two tabs
> sharing a token store revoke each other, and an in-document singleton does not
> collapse a cross-tab race; whether that is in scope depends on where tokens
> live (OQ3, deferred to `nfr-design`).

---

# Guest Screens

## G-2: Property Guide (US2.1, US2.3) — mobile-first

```
┌─────────────────────────────────────┐
│ [Locality accent bar]                 │
│                                       │
│  Beach House Cottage                  │
│  Downtown Springfield                 │
│  ✓ This is your stay                  │
├─────────────────────────────────────┤
│ [ Overview ] [ Places ] [ Events ]    │
├─────────────────────────────────────┤
│                                       │
│  Welcome                              │
│  The keybox code is ...               │
│                                       │
│                              ┌─────┐ │
│                              │ 💬  │ │
│                              └─────┘ │
└─────────────────────────────────────┘
```

- **The identity block is painted first (AC2.1.1)** — property name and locality
  name before any tab content, chat affordance or theming asset, and **no
  full-page spinner ahead of them**. Sam is often standing at a front door with a
  bag; the first thing on screen has to be proof the link is theirs.
- **No image, and the block reads as complete without one (AC2.1.5)** — never a
  broken image, a grey placeholder box, or a generic stock photo. A generic
  photo is *worse* than none: it weakens exactly the specificity the cue exists
  to provide.
- **Never asked to create an account (AC2.1.4)** — no account prompt anywhere in
  the guest surface.
- **Tabs (AC2.3.1, AC2.3.5)**: Overview, Places, Events; horizontally scrollable
  at mobile widths.
- **Partial content (AC2.3.3, AC2.3.4)**: an empty tab reads "More local
  recommendations are being added" — never a blank tab, and the rest of the guide
  still renders.
- **Nothing published yet (AC1.8.3)**: a single guest-framed placeholder — the
  property name, a plain statement that the host is still preparing the guide,
  and a prompt to contact the host. Never an error, never a blank page, never
  owner-facing wording.
- **Ships as**: functional default, unbranded (blocked on AC4.1.7 for AC2.1.2).

> **Two of the three tabs are empty for every guest, on every stay, until
> AC4.1.9.** The payload carries only unresolvable ids, so Places and Events
> render the empty state and **no raw id is ever displayed** (AC2.3.2). This is
> not a missing detail view — it is missing everything. The guide ships with one
> working tab.

## G-1: Link Not Valid (US2.2)

```
┌─────────────────────────────────────┐
│                                       │
│            ( ! )                      │
│                                       │
│   This link is no longer valid.       │
│                                       │
│   Contact your host for a new one.    │
│                                       │
└─────────────────────────────────────┘
```

- **One message for both cases (AC2.2.1, AC2.2.2)**: an expired stay and a
  mistyped or never-issued token look identical. Distinguishing them tells a
  stranger which tokens exist.
- **No raw status code or technical detail (AC2.2.3)**, never a 404 page.
- **A not-yet-started stay is NOT this screen (AC2.2.4)**: the resolver compares
  `expiresAt` only and never reads `checkIn`, so a link is live from creation
  until end of the checkout date. A guest opening a link early sees the guide
  normally.
- **Ships as**: unbranded. See below.

> **One deliberately undecided thing (OQ2).** Whether G-1 renders the locality's
> branding is genuinely open and assigned to `domain-design`. Unlike PO-0's
> unmapped domain, G-1's domain **does** resolve — only the specific link is
> invalid — so by `BrandTheme`'s own rule it could legitimately render branded.
> This design ships it neutral, which is what happens by default while AC4.1.7
> is unavailable, and does not pre-empt the decision. Low stakes either way: a
> guest here is reading an error, not browsing content.

## G-3: Itinerary Chat (US2.4)

```
┌─────────────────────────────┐
│  Itinerary assistant     [×] │
│  ┌─────────────────────┐    │
│  │ You: two days, we    │    │
│  │ like food and walking│    │
│  │                       │    │
│  │ Assistant: ● ● ●      │    │
│  └─────────────────────┘    │
│  [ Type a message…    ] [→] │
└─────────────────────────────┘
```

- **Reachable from every tab (AC2.4.1)** — genuinely persistent, not per-tab.
- **Typing indicator, escalating past ~5s (AC2.4.2)** to an explicit note.
- **Failure preserves history and offers retry (AC2.4.3)** — never a silent hang.
- **Sparse content is the assistant's own words (AC2.4.4)**, not a UI state
  change.
- **History survives close and reopen (AC2.4.5)** — *blocked on AC4.1.6.*
- **Replies are untrusted text (AC2.4.6)**: the guest's own message round-trips
  through a model, so a reply never reaches a raw-HTML sink. See
  `interaction-spec.md` § ChatWidget.
- **Ships as**: buildable, but the success path is **not demonstrable**. The
  deployed chat provider is `null`, so this returns `504` unless the locality has
  fewer than three curated items. Every failure state is testable; the happy path
  is not, until a provider is configured.

## Degraded connectivity (US2.5) — states across the guest surface

- **Slow load (AC2.5.1)**: a skeleton of the identity block and tab bar, never a
  blank page.
- **Failed load (AC2.5.2)**: an error with a retry action.
- **Rate limited (AC2.5.3)**: a **specific** "Too many requests — try again
  shortly" state, not a generic error. This matters more than it looks: a shared
  hotel address means one guest's requests can rate-limit several unrelated
  guests at once, and a generic error would send all of them to their host.

> **No countdown is buildable.** `Retry-After` is unreadable cross-origin because
> the backend sets no `exposedHeaders`. The state is honest about "shortly"
> rather than inventing a number. Deterministic testing of this state requires a
> mocked network — the live limiter is an in-memory bucket per process across 2–6
> tasks.

---

## Screen inventory

| Screen | Story | Status | Blocked on |
|---|---|---|---|
| PO-0 Signups Unavailable | US1.2 | Redrawn | AC4.1.7 to be reachable |
| PO-1 Sign Up | US1.1 | Redrawn | AC4.1.7 (branding), AC4.1.8 (tenancy) |
| PO-2 Reset Password | US1.4 | Redrawn | Mailer does not exist |
| PO-3 Onboarding | US1.5, US1.6 | Redrawn — resume and back-nav corrected | AC4.1.7 (branding) |
| PO-4 Subscription | US1.13, US1.14 | Redrawn — two controls disabled | AC4.1.2 (plan/status read) |
| PO-5 Guide Editor + shell | US1.7, US1.8 | Redrawn — shrink guard, guest preview | AC4.1.7 (branding) |
| PO-6 Locality Content | US1.12 | Redrawn | AC4.1.9 for any delivered value |
| **PO-7 Guest Link** | US1.9 | **New** | **AC4.1.1 — endpoint does not exist** |
| **PO-8 Account** | US1.15 | **New** | AC4.1.7 (branding) |
| **PO-9 Log In** | US1.3 | **New — gap in prior design** | AC4.1.4 (session restore) |
| Session expiry state | US1.10 | New | OQ3 (token storage) |
| G-1 Link Not Valid | US2.2 | Redrawn | OQ2 (branding, undecided) |
| G-2 Property Guide | US2.1, US2.3 | Redrawn — name-only trust cue | AC4.1.8, AC4.1.9 |
| G-3 Itinerary Chat | US2.4 | Redrawn | AC4.1.6; no chat provider deployed |
| Degraded states | US2.5 | New | — |
| ~~AD-1, AD-2, AD-3~~ | — | **Out of scope** | No ops-role token issuer |
| ~~Marketing lead forms~~ | — | **Out of scope** | Shipped separately |

## What this design does not settle

- **OQ1** — pre-check-in access is **not** an open question: the backend already
  decided it (`checkIn` is never compared). Recorded here because
  `requirements.md` still lists it as open.
- **OQ2** — G-1's branding. Assigned to `domain-design`; not pre-empted here.
- **OQ3** — token storage, which determines whether cross-tab session races are
  in scope for the session-expiry state.
- **The session-expiry product decision** — block-and-preserve versus
  re-authenticate-and-replay. This design commits to block-and-preserve and marks
  it revisitable.
- **Colour token values and their measured contrast ratios** — deferred to
  `domain-design`/`functional-design`; see `design-system-mapping.md`.

## Review

**Verdict:** READY
**Reviewer:** aidlc-product-lead-agent
**Date:** 2026-09-08T01:24:01Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | `mockups.md` PO-5 / PO-8 and `interaction-spec.md` § SideNav — US1.11 (Log out) | US1.11 is a Must, walking-skeleton-adjacent story, and `stories.md` records an explicit, security-relevant caveat against it: "without AC4.1.5 this is a client-side discard only, leaving a valid refresh token alive for up to seven days." Every comparable backend gap elsewhere in this design (the mailer on PO-2, the plan/status read on PO-4, the chat provider on G-3, the branding read everywhere) gets an explicit "Ships as" / "blocked on" annotation naming the consequence. Logout gets none: neither `mockups.md` nor `interaction-spec.md` mentions AC4.1.5, AC1.11.1 (server-side revocation), or the 7-day exposure window anywhere. A reader of this design alone would reasonably believe clicking "Log out" ends the session server-side. | Add a "Ships as" note to PO-5's and PO-8's logout control (and/or `interaction-spec.md` § SideNav) stating that release 1's logout is a client-side token discard only, that the refresh token is not server-side revoked until AC4.1.5 lands, and what that means for a lost/stolen device within the 7-day window. | New |
| R-02 | Major | `mockups.md` PO-7 (screen text) and `interaction-spec.md` § DateRangeField | Q4's answer (recorded in `refined-mockups-questions.md`) was "design the form to **capture** the property's time zone." The artifact instead only *displays* a time zone ("Times shown in Europe/Lisbon" / `timeZone` prop, required, no default, no documented source) — no screen anywhere in the design (PO-1 signup, PO-3 onboarding, or PO-7 itself) shows an input, picker, or any other control that lets an owner actually set the property's time zone, and no such field exists in the deployed schema today (verified: no `timeZone`/`timezone` field anywhere in `guestguideiq-app`). Either the frontend must capture it somewhere (undrawn) or the backend is expected to resolve it (e.g., from address/IP), which is a different design than "capture" and isn't stated as such. | Either draw the actual capture point (which screen, which step) for the property's time zone, or correct the language to say the backend resolves/derives it rather than the owner capturing it — and update the Q4 backend-requirement note in `interaction-spec.md` § DateRangeField to match whichever is true. | New |
| R-03 | Minor | `mockups.md` § Screen inventory | US1.11 (Log out) has no row in the Screen inventory table, unlike every other story with a user-facing surface (including the cross-cutting Session expiry and Degraded states rows). Logout is a Must-priority story and deserves the same visible tracking the other cross-cutting states get, especially given R-01 above. | Add a row for US1.11 naming its home (the shell user menu / PO-8) and its blocked-on status (AC4.1.5). | New |

### Summary

The redraw is careful, evidence-grounded, and consistently honest about what release 1 actually ships — I spot-checked the highest-stakes claims (the UTC expiry bug, the subscription `else`-branch-cancels behavior, the `{currentStep, completed}` onboarding shape, the absence of `GET /v1/accounts/me`) directly against `guestguideiq-app` source and all of them check out exactly as stated. Story coverage is complete except for the two findings above. Neither finding blocks implementability of the drawn screens themselves, but both are gaps the human should see before approving: R-01 is a security-relevant omission inconsistent with this document's own diligence standard elsewhere, and R-02 is a design claim that isn't actually drawn anywhere and needs either a capture point or corrected language.
