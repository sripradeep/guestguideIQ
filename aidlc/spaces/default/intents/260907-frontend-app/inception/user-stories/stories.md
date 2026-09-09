# User Stories — GuestGuideIQ Frontend (Property Owner + Guest)

> **Lead**: `aidlc-product-agent`, integrating the mob round-1 reviews from the
> designer, developer and quality engineer (`contributions/`). Grouped by persona
> and journey, Property Owner first. Story IDs are **new to this intent**; each
> names the prior `260905-backend-services-spec` story and acceptance criteria it
> realises, so no two intents own the same ID.
>
> **Granularity is mixed by design**, and the walking-skeleton line moved during
> integration — see "What the mob changed" below.
>
> Confirmed correct by the human at the Consolidated Summary Confirmation
> checkpoint (see `user-stories-questions.md`), including the mob integration.
>
> **Where coverage is recorded**: element-level traceability from every `FR`/`NFR`
> in `requirements.md` to the story IDs below lives in `traceability.json`. That
> file records each `FR{n}` section heading as `N/A` — a heading names a section
> rather than a separately testable requirement, so coverage is asserted against
> its `FR{n}.{m}` sub-requirements instead. Requirements deliberately left to a
> later stage carry `Deferred` with the owning stage named.

## What the mob changed

Three independent reviews converged on one finding: **several stories asserted
behaviour the deployed backend cannot supply.** Each reviewer verified against
source rather than against the draft, and each found a different face of the same
problem. Rather than soften those criteria into vagueness, they are stated here as
they are, with the backend work each depends on named explicitly in US4.1.

The five that matter most, all now reflected below:

1. **No route returns a locality brand to the frontend.** Locality data leaves the
   system only through the guest stay payload and internal, `127.0.0.1`-bound
   create routes. Every branding criterion was unbuildable as drafted (AC4.1.7).
2. **Tenancy resolves from the request `Host` header.** A cross-origin frontend
   makes every signup return `404 LOCALITY_NOT_RESOLVED` and every valid stay link
   return `410 LINK_INVALID`. CORS does not fix this — it permits the request, it
   does not change the `Host` (AC4.1.8).
3. **The guest receives favourite ids it cannot resolve.** Two of the guide's
   three tabs are empty by construction, and US1.12's curation reaches nobody
   (AC4.1.9).
4. **There is no property image anywhere in the system**, and the draft had
   hardened the guest trust cue onto one. The cue is now the property *name*.
5. **`GET /v1/onboarding` returns `{ currentStep, completed }` and nothing else**,
   so "resume with prior entries intact" had no source, and the step machine is
   strictly forward — a mistyped property name cannot be corrected at all.

Also corrected: the guide `PATCH` hazard is worse than drafted — a missing body
returns **`200` with every section deleted**, not `400`; `upgrade`/`downgrade`
change no observable field; password reset has no mailer; and OQ1 (pre-check-in
access) is **not open** — the code never compares `checkIn`.

## Cross-cutting baseline

Applies to every story; not repeated in each.

- **WCAG 2.1 AA** on every Owner and Guest surface (NFR1). Component ARIA, focus
  management and `aria-live` follow the prior intent's `interaction-spec.md` —
  **except** for US1.9 and US1.15, which introduce interactions that file has no
  entry for. Their component specs, states and ARIA behaviour are a required
  output of `refined-mockups`, not an inheritance.
- **One API-client module** owns every backend request (FR11.1); **one error
  module** parses the `{ code, message, details? }` envelope into a union keyed on
  `error.code` (FR11.2, FR11.3). Refetch-on-focus and prefetch are disabled as a
  configuration of that module, not as per-component discipline.
- **Locality-brand theming** (FR10) swaps token values only, never structure.
- **Rate limiting** surfaces as its own state, never a generic error (FR11.4).
- **Testing** follows the affirmed posture: the substitution boundary is the
  network, never the component. Criteria marked *(live)* below can only be
  verified against a real backend; the rest belong to the mocked-network suite.

---

## Property Owner Stories — Priya

### US1.1 — Sign up through a locality domain
**As** Priya, **I want** to create an account from my locality's own web address,
**so that** I can start building my guide without first working out which locality
I belong to.

- **AC1.1.1**: Given I am on a domain mapped to a locality-brand, when the signup
  page loads, then it shows **no locality-selection control anywhere**, and it
  renders that brand's name and accent colour — plus its logo where the parsed
  locality styling supplies one — once a brand-read source exists (AC4.1.7).
  Until then it renders the unbranded functional default, per FR10.3.
- **AC1.1.2**: Given valid credentials, when I submit, then my account is created
  and I am authenticated and taken into onboarding.
- **AC1.1.3**: Given a username already taken, when I submit, then the username
  field shows an inline "already taken" error and no account is created.
- **AC1.1.4**: Given invalid input, when I blur a field, then that field shows a
  specific inline error naming what is wrong — never a generic "invalid input".
- **AC1.1.5**: Given the backend returns field-level validation details, when the
  form re-renders, then each detail is attached to its own named field rather than
  collapsed into one banner.
- **AC1.1.6**: Given the frontend origin differs from the API origin, when signup
  is attempted, then the request reaches the API carrying a `Host` that resolves
  to this locality-brand. *(The backend resolves the tenant from the request
  `Host`, and a shared API host cannot be registered to more than one brand —
  `BR9.2`, `409 CONFLICT`. Satisfying this is AC4.1.8's job, not this screen's.)*

**Priority**: Must. **Granularity**: implementation-ready (walking skeleton).
**Screen**: PO-1. **Depends on**: US4.1 (AC4.1.7 branding, AC4.1.8 tenancy); a
locality-brand and domain existing (A1 — ops, out of band).
**Traces**: FR1.1, FR1.3, FR10.1 → prior `US1.1`.

### US1.2 — See a clear page when the address maps to no locality
**As** Priya, **I want** a plain explanation when I reach signup at an address that
isn't set up, **so that** I know it is the address that is wrong and not me.

- **AC1.2.1**: Given a domain that resolves to no locality-brand, when I reach
  signup, then I see a neutral, unbranded page reading "Signups aren't available at
  this address", **with no form at all**. *(Determining this before showing a form
  requires AC4.1.7. Today the only signal is a `404` from a real signup attempt,
  which is not reachable as a probe — validation runs before the locality check, so
  an empty probe returns `400` — and which spends the 5/min/IP budget.)*
- **AC1.2.2**: Given that page renders, when it does, then **no** locality theme is
  applied — not even the product's default accent — because none resolved.
- **AC1.2.3**: Given the backend returned a not-resolved response, when the page
  renders, then no raw error code or status is shown.

**Priority**: Must. **Granularity**: implementation-ready.
**Screen**: PO-0. **Depends on**: US4.1 (AC4.1.7). **Traces**: FR1.2, FR10.4 →
prior `US1.1` (AC1.1.5).

### US1.3 — Log in
**As** Priya, **I want** to log back into my account, **so that** I can return to my
guide between guest stays.

- **AC1.3.1**: Given correct credentials, when I log in, then I am authenticated
  and routed to my dashboard — or back into onboarding if I never finished it.
- **AC1.3.2**: Given wrong credentials **or** an unknown username, when I submit,
  then I see one identical, non-disclosing message for both cases.
- **AC1.3.3**: Given I am authenticated, when I reload the page, then my session is
  restored without a re-login.

**Priority**: Must. **Granularity**: implementation-ready (walking skeleton).
**Depends on**: US4.1 (AC4.1.4) for AC1.3.3. **Traces**: FR1.4, FR1.8 → prior
`US1.1`.

### US1.4 — Reset a forgotten password
**As** Priya, **I want** to reset my password by email, **so that** I can get back in
when I forget it.

- **AC1.4.1**: Given I submit any username, when the request completes, then I see
  "check your email" — **identically whether or not the account exists**.
- **AC1.4.2**: Given a valid reset link, when I follow it and set a new password,
  then I can log in with it. *(live)*
- **AC1.4.3**: Given an expired, unknown, or already-used reset link, when I open
  it, then I see "this link has expired" and an action to request a new one.

**Priority**: Must. **Granularity**: epic-level — **moved off the walking skeleton**.
**Screen**: PO-2. **Traces**: FR1.5 → prior `US1.2`.
**Caveat**: **this flow cannot be completed end to end.** The route discards the
reset token it generates; there is no mailer, no SES construct, no queue. AC1.4.2
has no way to obtain a valid link outside a direct database read. The frontend is
buildable and AC1.4.1/AC1.4.3 are testable; AC1.4.2 is not, until a delivery
mechanism exists. Treated exactly like the chat caveat (C8) rather than left
silent.

### US1.5 — Be guided through onboarding, and resume it
**As** Priya, **I want** onboarding to walk me through setup and pick up where I left
off, **so that** an interruption doesn't cost me the work.

- **AC1.5.1**: Given a new account, when I first log in, then I land in the wizard
  with a visible "Step X of Y" indicator carrying step labels, not just dots.
- **AC1.5.2**: Given I leave partway through, when I log back in, then I resume at
  the step the backend reports as current, and any entry I had typed but not
  submitted is restored from client-held draft state — or, where it was not
  retained, the field is empty and visibly so, never silently prefilled with a
  stale or wrong value. *(The API returns `{ currentStep, completed }` only; the
  submitted property name is not readable back by any owner route. Where
  unsubmitted entries live is an open decision — see the gate.)*
- **AC1.5.3**: Given I move backwards a step, when I do, then I can read what I
  previously entered, and the UI does not offer to re-submit a completed step.
  *(The step machine is strictly forward: `assertStep` throws `409 CONFLICT` on any
  non-current step and no route moves it back. An owner who mistypes their property
  name cannot correct it during onboarding at all — carried to the gate as a
  product gap, not hidden in a UI criterion.)*
- **AC1.5.4**: Given I complete a step, when the transition happens, then a saved
  indication is shown.
- **AC1.5.5**: Given an account that already finished onboarding, when I log in,
  then I go straight to the guide editor and never see the wizard again.
- **AC1.5.6**: Given my account resolved to a locality at signup, when any wizard
  step renders, then it carries that locality's brand once AC4.1.7 exists; until
  then, the functional default.

**Priority**: Must. **Granularity**: implementation-ready (walking skeleton).
**Screen**: PO-3. **Depends on**: US1.1; US4.1 (AC4.1.7) for AC1.5.6.
**Traces**: FR2.1, FR2.2, FR2.3, FR2.5, FR10.2 → prior `US1.3`.

### US1.6 — Choose to build my guide from scratch
**As** Priya, **I want** to start my guide from a blank page during onboarding, **so
that** I can move on without importing anything.

- **AC1.6.1**: Given I reach the content step, when I choose "start from scratch",
  then the wizard advances to content review. *(The endpoint takes no body; the
  actual section authoring is US1.7's surface, not this one's.)*
- **AC1.6.2**: Given the first release, when the content step renders, then **no PDF
  upload control is shown** — that path is deferred.

**Priority**: Must. **Granularity**: implementation-ready (walking skeleton).
**Screen**: PO-3. **Depends on**: US1.5. **Traces**: FR2.4 → prior `US1.3` (AC1.3.2).
**Note**: narrowed during integration. The draft's AC1.6.1 ("I can enter guide
sections manually") described the full section editor — the same component US1.7
owns, plus its full-replace save discipline, on a different route family. The only
way to write sections anywhere in the system is the guide `PATCH`. Authoring now
lives entirely in US1.7.

### US1.7 — Edit and save my guide
**As** Priya, **I want** to edit my guide's sections and have changes stick, **so that**
guests see current information about my property.

- **AC1.7.1**: Given I edit a section and save, when I reload the editor, then my
  change is present.
- **AC1.7.2**: Given I save, when the request is sent, then it carries the
  **complete** set of sections under the exact expected key. *(The route defaults a
  missing or misspelled `sections` to `[]` **in front of** the service's array
  guard, so a bodyless or mis-keyed save does not return `400` — it returns **`200`
  with every section deleted**. A destructive success is a different failure mode
  from a rejected request.)*
- **AC1.7.3**: Given I have several sections and edit one, when I save and reload,
  then **none of the others have disappeared**. *(Verifying this requires the
  network double to implement full-replace semantics rather than replay a fixture;
  against a naive fixture this criterion passes with the defect present.)*
- **AC1.7.4**: Given a save fails, when it does, then I see an error, my edits
  remain on screen, and nothing is silently discarded.
- **AC1.7.5**: Given the editor is open, when the window regains focus or the route
  is revisited, then no additional guide read is issued. *(That GET creates an empty
  draft row as a side effect. It is idempotent and never overwrites content, so the
  cost is a spurious row rather than data loss — but the constraint belongs on the
  API-client module's fetching configuration, where refetch-on-focus is usually on
  by default.)*

**Priority**: Must. **Granularity**: implementation-ready (walking skeleton).
**Screen**: PO-5. **Depends on**: US1.5. **Traces**: FR3.1, FR3.2, FR3.5 → prior
`US1.5` (AC1.5.1).

### US1.8 — Publish my guide, and know what guests see before I do
**As** Priya, **I want** to publish my guide and see its unpublished state, **so that**
I know exactly what a guest gets at any moment.

- **AC1.8.1**: Given a draft guide, when I publish, then the editor shows it as
  published.
- **AC1.8.2**: Given a published guide, when I unpublish, then it returns to draft.
- **AC1.8.3**: Given nothing is published, when a guest's link resolves, then they
  see a single **guest-framed** placeholder — the property name, a plain statement
  that the host is still preparing the guide, and a prompt to contact the host —
  never an error, never a blank page, never owner-facing wording.
- **AC1.8.4**: Given nothing is published, when I view my editor, then I am shown a
  **preview of that guest-facing screen exactly as a guest would see it**, labelled
  as a preview, so I know what is currently served under any link I have already
  sent.

**Priority**: Must. **Granularity**: implementation-ready (walking skeleton).
**Screen**: PO-5. **Depends on**: US1.7. **Traces**: FR3.3, FR3.4 → prior `US1.5`
(AC1.5.2).
**Note**: the draft had both audiences seeing "that exact same message". PO-5's
mockup copy is owner-framed ("guests will see this exact message until you
publish"), which is nonsense shown to a guest. The instinct — show Priya what Sam
sees — is kept as a framed preview instead.

### US1.9 — Generate a guest link and copy it
**As** Priya, **I want** to create a link for a specific stay and copy it, **so that** I
can send it to my guest however I already talk to them.

- **AC1.9.1**: Given a published guide, when I open the link generator, then I can
  enter the stay's validity window — check-in and check-out dates — and generate a
  link for it. *(`createStay` takes `{ propertyId, checkIn, checkOut }` and derives
  expiry from checkout. This is a dated form, not a button.)*
- **AC1.9.2**: Given I enter an invalid range — checkout before check-in, or dates
  already past — when I submit, then I see a specific inline error and no link is
  created.
- **AC1.9.3**: Given a generated link, when I use the copy control, then it is on my
  clipboard and I get visible confirmation.
- **AC1.9.4**: Given the link is displayed, when I read it, then it is a full
  absolute link on my property's own locality-brand domain — not a bare token and
  not a separate central address. *(Requires AC4.1.1's response to be the full link,
  and AC4.1.7 for the domain.)*
- **AC1.9.5**: Given I have generated a link, when I return to the dashboard later,
  then every link I have generated is still listed, still copyable, and shows which
  stay it belongs to and whether it is still valid.
- **AC1.9.6**: Given the link is shown, when the copy control fails or is
  unavailable, then the full link remains visible as selectable text — the copy
  button is never the only way to get it.
- **AC1.9.7**: Given I use the copy control, when it succeeds, then the confirmation
  is announced to assistive technology via a polite live region, never by a colour
  change or a vanishing toast alone.
- **AC1.9.8**: Given link generation fails, when it does, then I see a clear error
  and no partial or unusable link.

**Priority**: Must. **Granularity**: epic-level — **moved off the walking skeleton**.
**Screen**: **none — this screen does not exist in `mockups.md`.**
**Depends on**: US4.1 (AC4.1.1 shape, AC4.1.7 domain). **Traces**: FR6.1, FR6.2,
FR6.3.
**Sequencing**: `POST /v1/stays` request shape → PO-7 design at `refined-mockups`
→ implementation. It cannot be drawn until the request shape is fixed, which is why
it left Bolt 1. Timezone treatment needs deciding at design: expiry is set to
`23:59:59.999` **UTC** on the checkout date, which is the previous evening for a
guest in UTC+2.

### US1.10 — Be told plainly when my session ends
**As** Priya, **I want** a clear message when my session expires, **so that** I
understand what happened instead of watching a save fail for no visible reason.

- **AC1.10.1**: Given my session can no longer be refreshed, when I next act, then I
  see an explicit "your session has expired, please log in again" state — not a
  silent redirect and not a generic error.
- **AC1.10.2**: Given my session expires, when it does, then local session state is
  cleared.
- **AC1.10.3**: Given I have unsaved guide edits when my session expires, when the
  expiry is surfaced, then the editor state is preserved on screen and no success
  indication is shown for the failed save. *(Replaces the draft's untestable "not
  left believing they were saved". Whether the app then blocks and preserves the
  buffer, or re-authenticates in place and replays the save, is a product decision —
  see the gate. They are very different builds.)*
- **AC1.10.4**: Given several requests fail with an auth error at once, when they do,
  then exactly one refresh is attempted and the others wait on its result.
- **AC1.10.5**: Given a `401` comes from the refresh call itself rather than from a
  resource call, when it does, then the session is ended rather than refreshed
  again. *(Without this the client loops.)*

**Priority**: Must. **Granularity**: epic-level — **moved off the walking skeleton**.
**Traces**: FR1.6, FR1.7.
**Note**: closes reviewer finding **R-01** on `requirements.md`, accepted as risk at
that gate. No prior story covers it. **Not fully specifiable yet**: refresh-token
rotation means two browser tabs sharing a token store revoke each other, and an
in-document singleton does not collapse a cross-tab race. Whether that is in scope
depends on OQ3 (token storage), still deferred to `nfr-design`.

### US1.11 — Log out
**As** Priya, **I want** to log out, **so that** my account isn't left open on a shared
or borrowed machine.

- **AC1.11.1**: Given I am logged in, when I log out, then my session is revoked
  server-side and local session state is cleared. *(live)*
- **AC1.11.2**: Given I have logged out, when I navigate back, then I cannot reach an
  authenticated screen.
- **AC1.11.3**: Given I am logged in on any dashboard screen, when I look for it,
  then a logout control is reachable from the persistent shell without first
  navigating to Account. *(US1.11 is Must and US1.15 is Should; routing the only
  logout through Account would leave the Must story with no reachable trigger.)*

**Priority**: Must. **Granularity**: epic-level.
**Depends on**: US4.1 (AC4.1.5). **Traces**: FR1.9.
**Note**: without AC4.1.5 this is a client-side discard only, leaving a valid
refresh token alive for up to seven days.

### US1.12 — Curate the local recommendations in my guide
**As** Priya, **I want** to browse my locality's points of interest and events and mark
favourites, **so that** my guide carries the recommendations I actually trust.

- **AC1.12.1**: Given my locality has curated content, when I browse it, then I can
  mark any item as a favourite with a single click and no confirmation.
- **AC1.12.2**: Given I favourite an item, when the toggle is pressed, then it updates
  immediately, and reverts with an inline notice if the request fails.
- **AC1.12.3**: Given I unmark a favourite, when I do, then it stops appearing in my
  guide.
- **AC1.12.4**: Given my locality has no curated content yet, when I open the screen,
  then I see the message the backend supplies rather than a competing hardcoded one,
  and never a blank grid.
- **AC1.12.5**: Given I favourite an item outside my locality, when the backend
  rejects it, then I see an inline error.
- **AC1.12.6**: Given any favourite or unfavourite request, when it is sent, then it
  always carries a complete body. *(This is the one handler in the file without a
  `?? {}` fallback, so a bodyless request returns `500 INTERNAL_ERROR`, not `400`.
  Closes FR4.3, which had no criterion.)*

**Priority**: Must. **Granularity**: epic-level.
**Screen**: PO-6. **Depends on**: US1.7; ops having seeded locality content (A1).
**Traces**: FR4.1–FR4.5 → prior `US1.6`.
**Note**: **until AC4.1.9 lands, nothing curated here is visible to any guest.**
This story's stated benefit is deferred, not delivered, by the first release.

### US1.13 — Start a subscription
**As** Priya, **I want** to start a paid subscription, **so that** my account is on a
paid footing.

- **AC1.13.1**: Given I have an account, when I start a subscription, then my account
  shows it as active.
- **AC1.13.2**: Given payment fails, when it does, then I see a banner stating plainly
  that **no changes were made to my account**, and my account is unchanged.

**Priority**: Must. **Granularity**: epic-level.
**Screen**: PO-4. **Traces**: FR5.2 → prior `US1.7`.
**Note**: the benefit clause was narrowed during integration. **Nothing in the API
gates any feature on subscription status** — no route, service or middleware outside
`src/subscription/` reads it. Cancelling has no functional effect on the guide, the
guest link, or chat. Delivery Planning should not size this as if entitlement
enforcement existed.

### US1.14 — Manage my existing subscription
**As** Priya, **I want** to see my plan and change or cancel it, **so that** I can adjust
as my needs change.

- **AC1.14.1**: Given an active subscription, when I open the subscription screen,
  then I see my current plan and status. *(Requires AC4.1.2.)*
- **AC1.14.2**: Given an active subscription, when I upgrade or downgrade, then the
  request succeeds and the screen reflects the response without asserting a plan
  change. *(`upgrade` and `downgrade` both set status to `active` and touch no plan
  field; only one tier — `standard` — exists. The draft's "my plan reflects the
  change" can never be observed. Whether multiple tiers are wanted is a product
  question, not a frontend defect.)*
- **AC1.14.3**: Given I cancel, when I confirm, then I am first shown plainly that my
  guide content stays intact and resubscribing restores access. *(Verified: `cancel`
  only sets status and never touches guide content. Assumption A4 is now a property
  of the code, not a belief.)*
- **AC1.14.4**: Given no active subscription, when I open the screen, then upgrade,
  downgrade and cancel are disabled with a "start a subscription first" explanation,
  and only Start is available.
- **AC1.14.5**: Given a change request whose outcome I cannot determine — a timeout or
  network failure — when it happens, then the app **does not retry automatically**; it
  re-reads my subscription state and asks me.
- **AC1.14.6**: Given any plan-change request, when it is sent, then its action value
  comes from a fixed typed set and is never a free-form string, and the request always
  carries a body.

**Priority**: Must. **Granularity**: epic-level.
**Screen**: PO-4. **Depends on**: US1.13; US4.1 (AC4.1.2). **Traces**: FR5.1, FR5.3–FR5.6
→ prior `US1.8`.
**Note**: AC1.14.5 and AC1.14.6 are the highest-consequence criteria in this document.
The endpoint's final `else` branch cancels the subscription on **any** unrecognised
action, and the body is read as `request.body?.action` — so a missing body reaches
`cancel`. A speculative retry is a silent billing event.

### US1.15 — Manage my account details
**As** Priya, **I want** an account screen, **so that** I can see who I am signed in as
and reach the things that belong to my account.

- **AC1.15.1**: Given I am logged in, when I open the Account section, then I see my
  username, my property name, and my locality's name.
- **AC1.15.2**: Given I am on the Account screen, when I look for them, then a link to
  Subscription and a logout control are both present.

**Priority**: Should. **Granularity**: epic-level.
**Screen**: named in PO-5's SideNav but **never drawn**. **Traces**: FR3.5, FR1.9.
**Note**: closes reviewer finding **R-02**. The API constrains this screen sharply and
`refined-mockups` should be handed the constraint rather than a blank brief: **no email
is ever collected** (signup takes username and password only), **no password-change
endpoint exists**, and **no property-name edit endpoint exists** — the name typed once
at onboarding is permanent, and it is the guest's trust cue. Whether property-name
editing becomes backend work is a product decision.

---

## Guest Stories — Sam

### US2.1 — Open my stay link and know it's really mine
**As** Sam, **I want** to open the link my host sent and immediately see it belongs to
my stay, **so that** I trust it enough to use it.

- **AC2.1.1**: Given a valid stay link, when the page opens, then the **property name**
  and the locality's name are painted as the first content on screen — before any tab
  content, chat affordance or theming asset — and no full-page spinner is shown ahead
  of them.
- **AC2.1.2**: Given the guide loads, when I read it, then I see the property's own
  locality branding, consistent with the address I arrived at.
- **AC2.1.3**: Given a locality-brand with only a name and tagline saved, when the page
  renders, then it shows the clean default look plus that name — never a half-styled or
  broken page.
- **AC2.1.4**: Given I never create an account, when I use the guide, then I am never
  asked to.
- **AC2.1.5**: Given no property image exists in the stay payload, when the page
  renders, then the identity block reads as complete without one — never a broken
  image, a grey placeholder box, or a generic stock photo that could belong to any
  property. *(A generic placeholder is worse than none: it weakens exactly the
  specificity the cue exists to provide.)*

**Priority**: Must. **Granularity**: epic-level.
**Screen**: G-2. **Depends on**: US1.8, US1.9, US4.1 (AC4.1.1, AC4.1.8).
**Traces**: FR7.1, FR7.2, FR10.1, FR10.3 → prior `US2.1`, `US2.2`.
**Note**: the draft hardened the prior intent's "property **name/photo**" (either) into
"the property photo and name" (both, photo first). **There is no photo anywhere in the
system** — the stay payload returns `property: { id, name }`, onboarding accepts a name
only, and there is no upload endpoint or object storage. The cue is the name.

### US2.2 — Get a clear message when a link doesn't work yet, or any more
**As** Sam, **I want** a plain explanation when my link doesn't show me a guide, **so
that** I know whether to wait or to ask my host.

- **AC2.2.1**: Given a link for a stay whose checkout has passed, when I open it, then I
  see "this link is no longer valid" and a prompt to contact my host.
- **AC2.2.2**: Given a mistyped or never-issued token, when I open it, then I see **that
  same message** — not a 404 and not a different error.
- **AC2.2.3**: Given either case, when the page renders, then no raw status code or
  technical detail is shown.
- **AC2.2.4**: Given a link for a stay whose check-in has not yet arrived, when I open
  it, then I see the guide normally. *(Verified against the deployed code: the resolver
  compares `expiresAt` only and never reads `checkIn`, so a link is live from creation
  until end of the checkout date. **OQ1 is therefore not an open question** — the
  backend has already decided it. If the team wants pre-check-in access gated, that is a
  backend change belonging in US4.1, and the copy must not be AC2.2.1's: for a
  not-yet-started stay the link is valid, is not expired, and contacting the host
  achieves nothing.)*

**Priority**: Must. **Granularity**: epic-level.
**Screen**: G-1. **Traces**: FR7.3 → prior `US2.1`.
**Open question**: whether G-1 renders the locality's branding — its domain *does*
resolve, unlike the signup case — remains undecided (OQ2).

### US2.3 — Browse what my host recommends
**As** Sam, **I want** to browse the guide's sections, recommendations and local events,
**so that** I can plan my time.

- **AC2.3.1**: Given a published guide, when I open it, then I can move between its
  Overview, POIs and Events tabs.
- **AC2.3.2**: Given my host has favourited places **and the stay payload carries
  displayable content for them** (AC4.1.9), when I view the guide, then those appear
  with name and category. **Given the payload carries only unresolvable ids**, then the
  POIs and Events tabs render the empty state and **no raw id is ever displayed to me**.
- **AC2.3.3**: Given a tab has no displayable content, when I open it, then I see "more
  local recommendations are being added" — never a blank tab.
- **AC2.3.4**: Given the locality has no current events, when I view the guide, then the
  rest of it still renders correctly.
- **AC2.3.5**: Given I am on a phone, when I use the tabs, then they are reachable and
  scrollable at mobile widths.

**Priority**: Must. **Granularity**: epic-level.
**Screen**: G-2. **Depends on**: US2.1, US1.12, US4.1 (AC4.1.9).
**Traces**: FR7.4, FR7.5, FR7.6, NFR4 → prior `US2.2`.
**Note**: **without AC4.1.9, two of the three tabs are empty for every guest, every
stay.** The stay payload returns bare `favoritedPOIIds` / `favoritedEventIds`, and the
POI and event list endpoints both require an owner JWT — so the guest cannot render a
name, a category, or a date. Not a missing detail view: missing everything.

### US2.4 — Ask for an itinerary
**As** Sam, **I want** to describe my interests and time and get suggestions, **so that** I
get something tailored rather than a generic list.

- **AC2.4.1**: Given I am anywhere in the guide, when I look for the assistant, then its
  bubble is reachable from every tab.
- **AC2.4.2**: Given I send a message, when the assistant is composing, then I see a
  typing indicator, escalating to an explicit note past roughly five seconds.
- **AC2.4.3**: Given the assistant fails or times out, when it does, then my chat history
  is preserved and I can retry the last message — never a silent hang.
- **AC2.4.4**: Given the locality has little curated content, when I ask, then the
  assistant says so in its own reply and offers general guidance.
- **AC2.4.5**: Given I close and reopen the widget, when it reopens, then my earlier
  conversation is still there. *(Requires AC4.1.6.)*
- **AC2.4.6**: Given a reply arrives, when it is rendered, then it is treated as untrusted
  text and never reaches a raw-HTML sink.

**Priority**: Should — included in the first release.
**Granularity**: epic-level. **Screen**: G-3. **Depends on**: US2.3; US4.1 (AC4.1.6).
**Traces**: FR8.1–FR8.7 → prior `US2.3`.
**Caveat**: the deployed chat provider is `null`, so this returns `504` unless the
locality has fewer than three curated items. The UI is buildable and its failure states
are testable, but the success path is **not demonstrable end to end** until a provider is
configured (C8).

### US2.5 — Have the guide behave honestly on a bad connection
**As** Sam, **I want** the guide to tell me what's happening when the network is poor, **so
that** I'm not left staring at a blank screen in a hotel lobby.

- **AC2.5.1**: Given a slow load, when I wait, then I see a loading state rather than a
  blank page.
- **AC2.5.2**: Given a failed load, when it fails, then I see an error with a retry.
- **AC2.5.3**: Given too many requests from my network — a shared hotel address, for
  instance — when the backend rate-limits me, then I see a specific "too many requests,
  try again shortly" state, **not** a generic error. *(Deterministic only against a mocked
  network: the live limiter is an in-memory bucket per process across 2–6 tasks. No
  countdown is buildable — `Retry-After` is unreadable cross-origin because the backend
  sets no `exposedHeaders`.)*

**Priority**: Must. **Granularity**: epic-level.
**Traces**: FR11.4, NFR5, NFR6.

---

## Backend Prerequisite

### US4.1 — Land the backend follow-up before frontend Construction
**As** the delivery team, **we need** the scoped backend follow-up shipped, **so that** the
frontend stories that depend on it are unblocked rather than discovered mid-Bolt.

- **AC4.1.1**: `POST /v1/stays` exists, is owner-authenticated, accepts the stay's
  validity window (check-in and check-out), returns the **full absolute link** rather
  than a bare token, and **its exact request shape is fixed before US1.9 is designed**.
  *(Blocks US1.9 and every Guest story.)*
- **AC4.1.2**: `GET /v1/subscriptions` returns plan and status. *(Blocks AC1.14.1.)*
- **AC4.1.3**: CORS admits the frontend's development, CI and staging origins, and
  `ALLOWED_ORIGINS` appears in the backend's `.env.example`. *(Blocks all local and CI
  integration testing.)*
- **AC4.1.4**: `GET /v1/accounts/me` returns the current account. *(Blocks AC1.3.3.)*
- **AC4.1.5**: A logout/refresh-token revocation endpoint exists. *(Blocks US1.11.)*
- **AC4.1.6**: Chat history is readable. *(Blocks AC2.4.5.)*
- **AC4.1.7**: A frontend-reachable read returns a locality brand — name, tagline and
  styling — for both an unauthenticated signup host and an authenticated owner.
  *(Blocks AC1.1.1, AC1.2.1, AC1.2.2, AC1.5.6 and AC1.9.4. Today locality data leaves the
  system only through the guest stay payload and internal `127.0.0.1`-bound create
  routes.)*
- **AC4.1.8**: A cross-origin frontend can reach the API with tenancy resolving correctly
  — whether by same-origin proxy, an explicit tenant header, or a path/body parameter.
  *(Blocks AC1.1.2 and every Guest story. The backend resolves the tenant from the
  request `Host`; CORS permits the request but does not change the `Host`. Interacts with
  OQ3 and constraint C3.)*
- **AC4.1.9**: The guest can obtain displayable content — at minimum name and category —
  for the property's favourited POIs and events, stay-token-scoped. *(Blocks AC2.3.2 and
  the entire delivered value of US1.12.)*
- **AC4.1.10**: Each new endpoint's response shape is documented before frontend work
  begins. *(There is no OpenAPI document and no schema export, so frontend types are
  hand-written — C6. Undocumented shapes make fixture drift the untested risk.)*

**Priority**: Must — and **first**. **Granularity**: one coarse story; it is one team's
single piece of work. **Traces**: FR9.1–FR9.7.
**Note**: AC4.1.7, AC4.1.8, AC4.1.9 and AC4.1.10 were **added during mob integration** and
are not in `requirements.md` FR9 as scoped at Practices Discovery. **The follow-up as
originally scoped is not sufficient to unblock frontend Construction.** `requirements.md`
OQ7 already records that this work has no owner and no schedule; it is now also larger
than recorded.

---

## Dependency and Sequencing Summary

```
US4.1 (backend follow-up) — larger than FR9 as scoped
  ├─ AC4.1.7 (brand read)      ─→ US1.1, US1.2, US1.5 (branding), US1.9
  ├─ AC4.1.8 (host tenancy)    ─→ US1.1, US2.1, US2.2, US2.3, US2.4  [blocks all Guest work]
  ├─ AC4.1.9 (guest POI/event) ─→ US2.3, and the delivered value of US1.12
  ├─ AC4.1.1 (stay creation)   ─→ PO-7 design ─→ US1.9 ─→ US2.1
  ├─ AC4.1.2 ─→ US1.14 · AC4.1.4 ─→ US1.3 · AC4.1.5 ─→ US1.11 · AC4.1.6 ─→ US2.4

Walking skeleton (Bolt 1, solo and gated) — re-cut during integration:
  US1.1 → US1.3 → US1.5 → US1.6 → US1.7 → US1.8

Moved off Bolt 1: US1.4 (no mailer), US1.9 (no design, blocked on AC4.1.1's
shape), US1.10 (unspecifiable until OQ3 resolves).

Design dependency: refined-mockups must produce PO-7 (guest link) and PO-8
(Account) with their interaction-spec and design-system entries. PO-7 cannot be
drawn until AC4.1.1's request shape is fixed.
```

**Ops precondition (A1)**: a locality-brand and at least one domain must exist before
US1.1 can be exercised at all. Not a story — no Admin/Ops screen is built — but nothing
runs without it.

## INVEST Compliance Notes

**Independent** — the skeleton stories form a chain by nature (you cannot publish a guide
you have not authored); that is sequencing, not coupling, and each is separately testable
against a seeded precursor state.

**Negotiable** — no story names a framework, and none can: the stack is unchosen.

**Valuable** — every story states a benefit to a named persona. US4.1 is the deliberate
exception, framed as delivery-team value rather than dressed up as a user story. Two
stories have **deferred rather than delivered** value this release and say so plainly:
US1.12 (curation reaches no guest until AC4.1.9) and US1.13 (nothing gates on subscription
status).

**Estimable** — the skeleton stories are estimable now. US1.9 is not, until AC4.1.1's
shape is fixed; US1.10 is not, until OQ3 resolves.

**Small** — the skeleton stories are intended to fit one Bolt. US1.12 and US1.14 are the
largest epic-level stories and will need splitting at `units-generation`.

**Testable** — every criterion is written to a pass/fail condition. Six carry named
caveats rather than silent uncertainty: AC1.4.2 (no mailer), AC2.4.x (no chat provider),
AC1.7.3 (needs a full-replace network double, not a fixture), AC2.5.3 (mocked-network
only), AC1.9.x (no design yet), AC1.15.x (screen contents constrained by a sparse API).

## Review

**Verdict:** READY
**Reviewer:** aidlc-product-lead-agent
**Date:** 2026-09-07T20:45:59Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | `inception/requirements-analysis/requirements.md` > FR2.2, vs. `stories.md` > US1.5 (AC1.5.2, AC1.5.3) | FR2.2 in the reviewed-READY `requirements.md` states the app "shall resume an incomplete wizard at the last completed step **with prior entries intact**." The mob's own finding #5 (echoed in AC1.5.2's caveat) establishes this is unbuildable as written: `GET /v1/onboarding` returns only `{ currentStep, completed }`, no owner route reads back a submitted property name, and the step machine is strictly forward so a mistyped entry cannot even be corrected. `stories.md` quietly reinterprets FR2.2 into a weaker, conditional criterion (resume from client-held draft state where retained, visibly empty otherwise) without flagging that the upstream FR is now known to assert something the deployed backend cannot support — unlike the R-01/R-02 pattern, where a correction to an already-approved artifact is disclosed explicitly, here no correction note is added to `requirements.md` and no reviewer-style finding ID is opened for it. A reader of `requirements.md` alone still sees FR2.2 asserted as buildable fact. | Add a correction note to `requirements.md` FR2.2 (matching the disclosed-correction pattern used for R-01/R-02) recording that "prior entries intact" is not achievable via any existing owner route, and cross-reference `stories.md` AC1.5.2/AC1.5.3 as the corrected statement of scope. | New |
| R-02 | Major | `stories.md` > US1.5 (AC1.5.2) and US1.10 (AC1.10.3) | Both criteria explicitly defer a real product decision to "the gate" — where unsubmitted onboarding entries are held (client-held draft state, and for how long/where), and whether a mid-session refresh failure blocks-and-preserves the edit buffer or re-authenticates in place and replays the save. Checking `user-stories-questions.md`, the only human interaction recorded is a single "Looks correct" on the Consolidated Summary Confirmation, which lists the mob's factual findings but never surfaces either of these two specific product decisions for a choice. Neither decision is resolved anywhere in this stage's artifacts. As written, AC1.5.2 and AC1.10.3 are not yet criteria QA could write a deterministic test plan against — the two very different implementations they gesture at ("empty and visibly so" vs. a specific draft-persistence mechanism; "block" vs. "re-authenticate and replay") would produce different UI and different tests. | Either resolve both decisions now (they are cheap, framework-agnostic product calls) and rewrite the ACs as concrete pass/fail conditions, or explicitly carry them forward as named open questions to `nfr-design`/`domain-design` (the way OQ1–OQ8 are carried in `requirements.md`) rather than leaving "see the gate" as if a decision already happened. | New |
| R-03 | Minor | `stories.md` > US1.15 (Account screen, closing reviewer finding R-02 on `requirements.md`) | US1.15 defines the API-imposed *constraints* on the Account screen (no email collected, no password-change endpoint, no property-name edit endpoint) and two acceptance criteria for its content, but the screen itself is "named in PO-5's SideNav but never drawn," with the actual design still deferred to `refined-mockups`. This is a genuine, disclosed improvement over `requirements.md`'s R-02 (which had nothing at all), but it is a partial closure, not a full one — worth the human's attention distinctly from R-01, which US1.10 does close with concrete, implementable acceptance criteria. | None required to proceed — recorded for the human's awareness that R-02 is narrowed, not fully closed, pending a `refined-mockups` design pass. | New |

### Summary

The stage does real, verified work: it does not paper over the backend's limits, it names five concrete unbuildable-as-drafted behaviours with source-level evidence, and it correctly consolidates all of that risk into a single sequenced prerequisite story (US4.1) that Delivery Planning can schedule. The walking-skeleton boundary (US1.1→US1.3→US1.5→US1.6→US1.7→US1.8) is unambiguous, dependencies on US4.1 are named at the acceptance-criterion level throughout, and INVEST is assessed honestly rather than asserted. What holds this at READY rather than higher confidence: a discovered-but-undisclosed inconsistency between `requirements.md` FR2.2 and this stage's own corrected understanding of onboarding resume (R-01 here), and two product decisions ("see the gate") that were never actually put to the human and so remain genuinely open despite reading as settled (R-02 here). Neither blocks a developer from starting the walking-skeleton Bolt, which is why this is READY rather than NOT-READY, but both should be resolved before the stories that depend on them (US1.5, US1.10) are pulled into a Bolt.
