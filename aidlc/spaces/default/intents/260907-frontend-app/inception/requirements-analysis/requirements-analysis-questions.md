# Requirements Analysis — Clarifying Questions

**Intent**: Build the Property Owner and Guest-facing frontend for GuestGuideIQ,
consuming the `u1-backend-api` / `u2-admin-api` backend already built and
deployed. Tech stack and hosting are not yet chosen.

**Inputs read**: the authoritative project description; the backend CodeKB
(`aidlc/spaces/default/codekb/guestguideiq-app/` — current as of `main` @
`76d190d`); the prior intent's reviewed-READY `stories.md` (17 stories,
US1.x–US4.x), `mockups.md` (PO-0…PO-6, G-1…G-3, AD-1…AD-3) and
`interaction-spec.md` (TextInput, Wizard, FileUpload, FavoriteToggle,
ChatWidget, TabNav, SideNav, StatusBanner, BrandTheme, LocalityBrandForm); and
this intent's affirmed `team-practices.md`.

**Why these questions**: the design work is already done and reviewed READY, so
the gaps are not "what should it look like" — they are scope boundaries, the
MVP cut, and the places where the deployed backend cannot support a screen the
mockups already specify.

---

## Batch 1 — Scope and boundaries

### Q1. Which surfaces are in scope for this frontend intent?

The mockups cover three audiences. The project description names Property Owner
and Guest. But `US4.4` (Admin/Ops creates a locality-brand and its domains) is a
hard **precondition** for `US1.1` — no Property Owner can sign up through a
locality domain that does not exist yet — and the backend's locality-brand
endpoints are internal-only (`POST /v1/internal/localities`), not reachable from
a browser.

- A. Property Owner + Guest only; locality-brands are seeded by ops another way (script, direct API call, database)
- B. Property Owner + Guest + the Admin/Ops screens (AD-1 POI/Event curation, AD-2 account lookup, AD-3 locality-brand management)
- C. Property Owner + Guest + only AD-3 (locality-brand management), since it is the blocking precondition; AD-1/AD-2 come later
- D. Property Owner only in this intent; the Guest app is a separate follow-on
- X. Other (please specify)

[Answer]: C. Property Owner + Guest + only AD-3 (locality-brand management), since it is the blocking precondition; AD-1/AD-2 come later

### Q2. Which stories are in the first release?

From the reviewed story set, the Must Haves for Owner + Guest are US1.1, US1.2,
US1.3, US1.5, US1.6, US1.7, US1.8, US2.1, US2.2. Two are Should Have, and both
have complications:

- **US1.4 (PDF import)** — the backend's `POST /v1/onboarding/content-source/pdf`
  takes `{ succeeded, sections }`, meaning **the client does the PDF
  extraction**, not the server. That is a substantial piece of frontend work.
- **US2.3 (itinerary chat)** — the backend's chat provider is `null` in the
  deployed configuration, so `POST /v1/stays/:token/chat` returns `504` unless
  the locality has fewer than three curated items. The UI can be built, but it
  cannot be demonstrated working.

Select every Should Have to include in the first release.

- US1.4 — PDF import during onboarding
- US2.3 — itinerary chat widget
- (select neither to ship Must Haves only)

[Answer]: US2.3 (itinerary chat) is IN the first release. US1.4 (PDF import) is OUT — deferred to a later release; onboarding's manual content path (AC1.3.2) covers the first release.

### Q3. Which missing backend endpoints should the follow-up add?

Practices Discovery already scoped a backend follow-up covering `POST /v1/stays`
and the CORS/origin fix. The reverse-engineering pass found five more gaps a
normal frontend would expect. Select every one the follow-up should also close;
anything not selected, the frontend must work around.

- `GET /v1/subscriptions` — read plan and status (PO-4 currently has no way to display them without one)
- `GET /v1/accounts/me` — current user/profile; ids come only from the login/signup response today
- Logout / refresh-token revocation — today logout is a client-side token discard only
- Chat history read — the transcript exists only as a side effect of a POST; reopening the widget loses it
- Guest-facing POI/Event detail lookup — the guest gets favourite ids that they cannot resolve

[Answer]: All except guest-facing POI/Event detail lookup — the follow-up adds `GET /v1/subscriptions`, `GET /v1/accounts/me`, logout / refresh-token revocation, and chat history read. Guest-facing POI/Event detail lookup was not selected, so the frontend works around it.

### Q4. How does a Guest receive their link?

`GET /v1/stays/:token` is the whole Guest app's entry point, but nothing creates
a `Stay`. Once `POST /v1/stays` exists, the Property Owner needs a way to get
that link to the guest — and that is frontend behaviour the mockups do not
cover (no screen shows link generation).

- A. Owner generates a link in the dashboard and copies it manually to send however they like
- B. Owner enters the guest's email and the system sends the link (needs a mailer — the backend has none; password reset tokens are generated then discarded)
- C. Owner generates a QR code / printable card for in-property display
- D. Links are created by an external booking-system integration, not by the owner in the UI
- X. Other (please specify)

[Answer]: A. Owner generates a link in the dashboard and copies it manually to send however they like

---

## Batch 2 — Quality attributes and technical constraints

### Q5. AD-3 has no way to authenticate — how should that be handled?

Q1 put AD-3 (locality-brand management) in scope because it is the precondition
for owner signup. Reading the admin API surface closely afterwards turned up two
blockers the mockup does not anticipate:

1. **There is no ops login.** Every `u2-admin-api` route requires an ops-role JWT
   (`role === "ops"`), and `admin-api` only *verifies* that token — **u1's
   identity component does not issue an ops token anywhere in the repo**. A real
   Property Owner token is explicitly rejected with `403`. So there is no
   credential an AD-3 screen could obtain.
2. **The write-only endpoints do not match the screen.** `admin-api` exposes
   `POST /v1/localities` (create) and `POST /v1/localities/:localityId/domains`
   (add). AD-3's mockup shows a locality **list**, an **edit** form pre-filled
   with existing data, and domain **update** — none of which have endpoints
   (`GET /v1/localities` and any `PATCH` are absent).

- A. Widen the backend follow-up to add ops authentication plus the missing list/read/update endpoints, then build AD-3 as designed
- B. Build AD-3 against the create-only endpoints for now — create a locality-brand and add domains, no list or edit — and defer editing to a later release
- C. Drop AD-3 from this intent after all; seed locality-brands by script or direct API call (reverting Q1 to option A)
- D. Build AD-3 read-only against new list/read endpoints only; all writes stay a scripted ops task
- X. Other (please specify)

[Answer]: D. Build AD-3 read-only against new list/read endpoints only; all writes stay a scripted ops task

### Q6. Does the Guest guide need to be server-rendered?

This shapes the framework choice and, more importantly, the hosting target —
which Practices Discovery constrained: hosting **must not foreclose the
same-origin-proxy option** for the deferred token-storage decision. A static-only
host would foreclose it.

- A. Client-rendered single-page app is fine; the guide is behind a private link and never needs to be indexed or preview well
- B. The guide needs server rendering — link previews (iMessage/WhatsApp/SMS) matter, since owners will paste the link into a message to their guest
- C. Server rendering for first paint on poor hotel/mobile connections, regardless of previews
- D. Defer entirely to `domain-design`; capture only the proxy constraint here
- X. Other (please specify)

[Answer]: A. Client-rendered single-page app is fine; the guide is behind a private link and never needs to be indexed or preview well. (The Practices Discovery proxy constraint still binds the hosting choice independently of this answer.)

### Q7. How should the WCAG 2.1 AA commitment be enforced?

`stories.md` commits every Owner and Guest surface to WCAG 2.1 AA, and
`interaction-spec.md` specifies ARIA roles, focus management and `aria-live`
behaviour per component. The affirmed practices make lint, tests and coverage
blocking, but say nothing about accessibility. Per-locality accent-colour
contrast is a live concern: `accessibility-checklist.md` requires each
locality's colour to independently meet 4.5:1 / 3:1.

- A. Blocking automated accessibility check in CI, same standing as lint and tests
- B. Automated check runs and reports, but does not block a merge
- C. Manual review against the accessibility checklist at each approval gate, no automated gate
- D. Automated check blocking, plus an automated per-locality contrast test for every saved brand colour
- X. Other (please specify)

[Answer]: B. Automated check runs and reports, but does not block a merge.

### Q8. How should the Guest app behave on a poor connection?

Guests are mobile-first and often on hotel or foreign-roaming connections. The
backend rate-limits `GET /v1/stays/:token` to 20/min per IP — which a shared
hotel NAT could trip for several guests at once.

- A. Standard loading and error states only; a failed load shows a retry (matches what `interaction-spec.md` already specifies)
- B. Cache the guide after first successful load so a returning guest sees content offline
- C. Full offline support — installable, works with no connection after first visit
- D. Standard states, plus explicit handling of the `429` rate-limit case with a "too many requests, try again shortly" state rather than a generic error
- X. Other (please specify)

[Answer]: D. Standard loading/retry states, plus explicit `429` rate-limit handling with its own "too many requests, try again shortly" state.

---

## Follow-Up Questions

Raised by the mandatory ambiguity/contradiction pass over the Batch 2 answers.

### Q9. Read-only AD-3 still needs an ops credential that does not exist

Q5 chose a read-only AD-3 built against new list/read endpoints. That closes the
missing-write-endpoint half of the blocker, but **not the authentication half**:
`GET` routes on `u2-admin-api` require the same ops-role JWT as the writes, and
nothing in the system issues one. A read-only AD-3 is therefore still
unbuildable unless the backend follow-up also provides an ops credential.

- A. The follow-up adds ops authentication (an ops login or issued ops token) alongside the new read endpoints
- B. The read endpoints are exposed on a separate ops surface that does not require the ops-role JWT (e.g. network-restricted rather than token-gated)
- C. Drop AD-3 from this intent after all — the auth work is larger than the screen is worth right now
- X. Other (please specify)

[Answer]: C. Drop AD-3 from this intent after all — the ops-authentication work is larger than the screen is worth right now.

> **This answer supersedes Q1.** Final surface scope for this intent is
> **Property Owner + Guest only** (Q1's option A). Locality-brands are seeded by
> ops another way — script, direct internal-API call, or database — and no
> Admin/Ops screen (AD-1, AD-2, AD-3) is built in this intent. The ops-auth gap
> and the missing locality list/read/update endpoints are recorded as known
> constraints for a later intent, not as work this one performs.

### Q10. Accessibility-advisory versus the team's enforcement-discipline principle

Q7 chose an accessibility check that reports but does not block. The affirmed
`## Forbidden` rule names only security scanners and the linter, so this is
**not** a rule violation. But the team's own stated enforcement discipline —
"a tool that exists but never blocks a merge provides no real protection" — was
written against exactly this shape, and every Owner and Guest surface is
committed to WCAG 2.1 AA in `stories.md`.

- A. Keep it advisory as answered; the WCAG 2.1 AA commitment is upheld by review, not by a gate
- B. Keep it advisory for now, with a recorded intent to make it blocking once the baseline is clean
- C. Change to blocking after all
- X. Other (please specify)

[Answer]: B. Keep it advisory for now, with a recorded intent to make it blocking once the baseline is clean.

---

## Consolidated Summary Confirmation

- **Surface scope**: Property Owner + Guest only. No Admin/Ops screen (AD-1,
  AD-2, AD-3) is built in this intent. Locality-brands are seeded by ops
  another way — script, direct internal-API call, or database. (Q1 as
  superseded by Q9.)
- **First release**: all Owner + Guest Must Haves (US1.1, US1.2, US1.3, US1.5,
  US1.6, US1.7, US1.8, US2.1, US2.2) plus **US2.3 (itinerary chat)**. **US1.4
  (PDF import) is deferred** to a later release; onboarding's manual content
  path covers the first release. (Q2)
- **Backend follow-up scope**: `POST /v1/stays` and the CORS/origin fix (both
  already scoped at Practices Discovery), plus `GET /v1/subscriptions`,
  `GET /v1/accounts/me`, logout / refresh-token revocation, and chat history
  read. Guest-facing POI/Event detail lookup is **not** included — the frontend
  works around it. (Q3)
- **Guest link delivery**: the Property Owner generates a link in the dashboard
  and copies it manually to send however they already communicate with guests.
  No mailer, no QR code, no booking-system integration in this intent. (Q4)
- **Rendering**: a client-rendered single-page app is acceptable; the guide sits
  behind a private link and needs neither indexing nor link previews. The
  Practices Discovery constraint still binds independently — the hosting choice
  must not foreclose the same-origin-proxy option. (Q6)
- **Accessibility**: WCAG 2.1 AA remains the commitment for every Owner and
  Guest surface. The automated check runs and reports but does **not** block a
  merge for now, with a recorded intent to make it blocking once the baseline is
  clean. (Q7, Q10)
- **Poor-connection behaviour**: standard loading and retry states as
  `interaction-spec.md` already specifies, plus explicit `429` rate-limit
  handling with its own "too many requests, try again shortly" state rather than
  a generic error. (Q8)
- **Ops-auth gap recorded, not solved**: `u2-admin-api` requires an ops-role JWT
  that nothing in the system issues, and the locality-brand endpoints are
  create-only (no list, read, or update). Carried forward as a known constraint
  for a later intent. (Q5, Q9)

Does this all look correct before I generate the requirements artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
