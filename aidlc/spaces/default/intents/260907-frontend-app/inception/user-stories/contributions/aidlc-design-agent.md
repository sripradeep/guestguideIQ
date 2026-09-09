**Collaborator:** aidlc-design-agent

## Contribution

Read in full: this stage's `stories.md`, `personas.md`, `user-stories-questions.md`,
`user-stories-assessment.md`, `traceability.json`; `requirements.md` including its
`## Review`; the prior intent's `mockups.md`, `interaction-spec.md`,
`accessibility-checklist.md`, `design-system-mapping.md`, `stories.md`, `personas.md`;
and `codekb/guestguideiq-app/api-documentation.md` (A.2–A.9).

The draft is strong work — the failure-mode acceptance criteria (AC1.7.2/AC1.7.3,
AC1.14.5/AC1.14.6, AC2.5.3) are better than most inception story sets ever get, and
US1.10 and US1.15 close real reviewer findings rather than paper over them. My findings
are about **journey coherence and persona fidelity**, in the order I think they matter.

---

### D-01 (Major) — The Guest journey does not currently deliver its own premise, and no story says so

`GET /v1/stays/:token` returns `guide.favoritedPOIIds` and `guide.favoritedEventIds` as
**bare id arrays**. `GET /v1/pois` and `GET /v1/events` both require an owner JWT, and
`api-documentation.md` A.7 states it plainly: *"The guest cannot currently render the
favourited items."* Not "cannot render detail" — cannot render a name, a category, or a
date. Nothing.

The draft records this as a detail-view limitation (US2.3's note, FR7.6) and then writes
**AC2.3.2: "Given my host has favourited places, when I view the guide, then those
appear."** Against this API, AC2.3.2 is unachievable, and `traceability.json` marks FR7.5
`OK` against a story that cannot satisfy it. The real consequence is bigger than the note
implies:

- **G-2's POIs and Events tabs are empty by construction this release.** Every guest, every
  stay, hits AC2.3.3's "more local recommendations are being added" on two of three tabs.
- **Sam's stated goal is not met at all.** The persona's goal is "instant, trustworthy local
  recommendations for this specific stay". What ships is: property name, the owner's own
  typed sections, and a chat that returns `504` (C8). That is a digital welcome letter, not
  the product the personas describe.
- **US1.12 becomes a Must story with zero delivered value this release.** Priya browses her
  locality, curates favourites, and none of it reaches any guest. Her story's stated benefit
  — "my guide carries the recommendations I actually trust" — is unrealisable. Two Must
  stories (US1.12 and US2.3) whose *combined* user value is currently nil.

This is a scope-honesty decision the human should make at the gate, not something left
implied in a footnote. Concretely I propose:

1. Add to **US4.1**: `**AC4.1.7**: A guest-facing resolution of favoritedPOIIds /
   favoritedEventIds into displayable POI and event content exists (stay-token-scoped —
   either expanded inline in the GET /v1/stays/:token payload or a companion stay-scoped
   read). *(Blocks AC2.3.2 and the entire delivered value of US1.12.)*`
2. Reword **AC2.3.2** so it is true under either outcome:
   `**AC2.3.2**: Given my host has favourited places **and the stay payload carries
   displayable content for them** (AC4.1.7), when I view the guide, then those appear with
   name and category. **Given the payload carries only unresolvable ids, then the POIs and
   Events tabs render the "more local recommendations are being added" empty state and no
   raw id is ever displayed to me.**`
3. Add to **US1.12**'s note: `Until AC4.1.7 lands, nothing curated here is visible to any
   guest. This story's business value is deferred, not delivered, by the first release.`

If the human decides AC4.1.7 is out of scope, the honest follow-through is that US1.12
drops to Should and G-2's tab structure is re-examined at `refined-mockups` — a three-tab
shell where two tabs are permanently empty is a worse design than one scrolling page.

### D-02 (Major) — The Guest trust cue has no data source, and this set hardened it

**AC2.1.1** and `personas.md` both assert the **property photo** renders before anything
else. There is no photo anywhere in this system: `GET /v1/stays/:token` returns
`property: { id, name }`; onboarding's `POST /v1/onboarding/property-basics` accepts
`{ name }` only; there is no upload endpoint, no object storage, no multipart plugin (A.3).
FR9 does not add one. Searching the CodeKB for photo/image/logo returns nothing relevant.

Note the direction of travel: the prior intent's AC2.1.1 read "property **name/photo**" —
either. This draft hardened it to "**the property photo and name**" — both, photo first.
That tightening moved the story *away* from what is buildable, and it is the single cue the
whole Sam persona rests on.

The same problem, one degree softer, hits the Owner side: **AC1.1.1** asserts the signup
page "renders that brand's **logo**, name and accent colour". `locality` is
`{ id, name, tagline, visualStyling }` — there is no logo field. A logo can only come from
inside `visualStyling`, which FR10.5 correctly calls unschematised and untrusted. AC1.1.1
asserts it unconditionally; AC2.1.3 handles the degraded case for the guest, nothing does
for signup.

Proposed:

- **AC2.1.1** (replace): `Given a valid stay link, when the page opens, then the **property
  name** and the locality's name are painted as the first content on screen, before any tab
  content, chat affordance or theming asset — and no full-page spinner is shown ahead of
  them.`
- **AC2.1.5** (new): `Given no property image exists in the stay payload, when the page
  renders, then the identity block is designed to read as complete without one — never a
  broken image, a grey placeholder box, or a generic stock photo that could belong to any
  property.` *(A generic placeholder is actively worse than none here: it weakens exactly
  the specificity the cue exists to provide.)*
- **AC1.1.1** (amend): `…renders that brand's name and accent colour, plus its logo **where
  the parsed locality styling supplies one**, and shows no locality-selection control
  anywhere.`
- `personas.md`, Sam, "What the frontend owes them": replace "The **property photo and name**
  before anything else loads" with "The **property name**, specific to their actual stay, as
  the first thing painted — the trust cue is property-specific *content*, and there is no
  property image in the system to carry it. If a photo is later wanted as that cue, it needs
  an Owner-side capture story and a backend field; neither exists."
- If the team wants the photo, it needs **two** things this set does not have: an FR9 item,
  and an Owner story ("add a photo of my property") with its own upload, cropping,
  size-limit and failure states. I would not add either silently — put it to the human.

### D-03 (Major) — Pre-check-in access (OQ1) has fallen out of the story set

`requirements.md` OQ1 carries it; the prior intent's US2.1 carries it as an explicit open
item; `mockups.md` G-2 carries it. **This draft carries it nowhere.** An open question that
survives three artifacts and dies at user stories will be silently decided by whoever writes
the first `GET /v1/stays/:token` handler branch.

It matters more here than upstream because it is Sam-facing and the default is bad: hosts
routinely send the link **at booking**, weeks early. If the stay window gates access, Sam's
first contact with the product is G-1 — *"This link is no longer valid. Contact your host."*
That copy is wrong three ways for a not-yet-started stay (it is valid, it is not expired,
and contacting the host achieves nothing), and it burns the trust cue on first use.

Proposed — add to **US2.2**:

- `**AC2.2.4**: Given a link for a stay whose check-in date has not arrived, when I open it,
  then I see a distinct "your stay hasn't started yet" state naming the check-in date —
  **never** G-1's "no longer valid" message.`
- `**Open question (OQ1)**: whether a pre-check-in guest gets full guide access, the
  date-only holding state above, or something between, is undecided. Carried from
  requirements OQ1 and the prior intent's US2.1. → refined-mockups / domain-design. Whatever
  is decided, the copy must not be G-1's.`

### D-04 (Major) — What a designer needs for US1.9, and what the story does not yet say

US1.9 is first on the walking-skeleton path with no design. As written it reads like "a
button and a copyable string". Six things are undecided in the story text, and four of them
change what gets drawn, not merely how it looks. A designer cannot start without them:

1. **What does Priya enter to generate a link?** `POST /v1/stays` does not exist, and
   **AC4.1.1 does not say what it accepts.** A `Stay` plainly has a validity window —
   AC2.2.1 ("checkout has passed") depends on one existing. If the endpoint takes
   check-in/check-out dates (and it must, or nothing can expire), US1.9 is a **form** — two
   date fields, validation, a timezone question, mobile date-picker behaviour — not a
   button. If it also takes a guest name or booking reference, more still. This is the
   largest design ambiguity on the skeleton path, and it is a *story* gap, not a mockup gap.
   US1.9 must state the input set, and AC4.1.1 should be amended:
   `**AC4.1.1**: POST /v1/stays exists, is owner-authenticated, accepts the stay's validity
   window (check-in and check-out) **and its exact request shape is known before US1.9 is
   designed**, and returns the stay token or full link.`
2. **Where does it live in the shell?** PO-5's SideNav is a closed set of four (Guide,
   Locality Content, Subscription, Account). A fifth item ("Stays" / "Guest links") changes
   the shell behind *every* dashboard screen and needs an icon for the 768–1023px icons-only
   rail (`interaction-spec.md` SideNav). Folding it into PO-5 avoids that but crowds the
   editor. This is a design-system decision, not a screen detail —
   `design-system-mapping.md`'s component inventory changes either way.
3. **Is the link retrievable after the moment of generation?** Nothing in US1.9 says so, and
   the story implies a generate-and-copy modal. **This is where Priya's persona bites**: she
   is "interrupted constantly". Generate → interrupted → clipboard overwritten → the link is
   gone, and she cannot tell whether generating another is safe (does a second link
   invalidate the first? undefined). Propose:
   `**AC1.9.5**: Given I have generated a link, when I return to the dashboard later, then
   every link I have generated is still listed, still copyable, and shows which stay it
   belongs to and whether it is still valid.`
4. **Is generation gated on publish?** AC1.9.1 says "Given a published guide" but no AC
   defines the unpublished case. Both answers are defensible; neither is drawable until
   chosen. See D-06 — I think the right answer is *do not gate, warn persistently*.
5. **Copy is not a solved interaction.** The clipboard API needs a secure context and a user
   gesture and still fails in places. Propose:
   `**AC1.9.6**: Given the link is shown, when the copy control fails or is unavailable,
   then the full link remains visible as selectable text so I can copy it by hand — the copy
   button is never the only way to get the link.`
   `**AC1.9.7**: Given I use the copy control, when it succeeds, then the confirmation is
   announced to assistive technology via a polite live region, and is never conveyed by a
   colour change or a vanishing toast alone.`
6. **The accessibility baseline currently exempts this story.** The cross-cutting clause
   defers component-level ARIA and focus behaviour to "the prior intent's
   `interaction-spec.md`" — which has **no component** for a copy field, and none for the
   Account screen either. The two stories with no design are precisely the two the baseline
   cannot cover. Worth stating in the cross-cutting section rather than discovering it at
   build time:
   `Two stories (US1.9, US1.15) introduce interactions with no entry in interaction-spec.md;
   their component specs, states and ARIA behaviour are a required output of the
   refined-mockups pass, not an inheritance.`

**Sequencing recommendation for the lead:** `refined-mockups` must produce PO-7
(guest-link) and PO-8 (Account) — screens, states, and their `interaction-spec.md` /
`design-system-mapping.md` entries — **before Bolt 1 is cut**, and PO-7 cannot be drawn
until AC4.1.1's request shape is fixed. That is a real dependency chain
(`POST /v1/stays` shape → PO-7 design → Bolt 1) and it belongs in the sequencing summary,
where today only `US4.1 → US1.9` appears.

### D-05 (Major) — US1.15's contents are more constrained than "undefined", and one of them is a trap

The draft says the Account screen's contents are undecided. True, but the API narrows the
option set almost to a single answer, and saying so saves the design pass a round trip:

- **Profile display**: the only identity value the system holds is `username` (plus
  `accountId` / `propertyId`). **There is no email address anywhere** — `POST /v1/accounts`
  takes `{ username, password }` only (A.2).
- **Password change**: no endpoint exists. Not `PATCH /v1/accounts`, not anything. The only
  path is the reset flow, which is itself broken (D-07).
- **Property name edit**: no endpoint. The name Priya types once at onboarding
  `property-basics` is permanent — and it is the *only* thing Sam sees as the trust cue
  (D-02). A typo there is uncorrectable and degrades every guest's first impression forever.
- **What is actually left**: username, property name (read-only), locality name, a link to
  Subscription, and Logout.

Proposed note for US1.15: `The API constrains this screen sharply: no email is ever
collected, no password-change endpoint exists, and no property-name edit endpoint exists.
Absent new backend work, the screen's realistic content is username, property name
(read-only), locality name, a link to Subscription, and Logout. refined-mockups should be
handed that constraint rather than a blank brief; whether property-name editing becomes an
FR9 item is a product decision — the name is the guest's trust cue (see D-02).`

Second, smaller point: **AC1.15.2 makes Account the only stated route to logout.** Priya's
persona names a "shared or borrowed machine" (US1.11's own benefit clause). Putting logout
two clicks deep behind a *Should*-priority screen, when US1.11 is *Must*, leaves the Must
story with no reachable trigger if US1.15 slips. Propose adding to US1.11:
`**AC1.11.3**: Given I am logged in on any dashboard screen, when I look for it, then a
logout control is reachable from the persistent shell without first navigating to Account.`

### D-06 (Major) — The not-yet-published state is handled at cross-purposes

AC1.8.4's instinct — show Priya exactly what Sam sees — is right and I want it kept. As
written the pair has three problems:

1. **One string cannot serve both audiences.** PO-5's mockup copy is *"Your guide isn't
   published yet — guests will see this exact message until you publish."* That is owner
   framing; showing it to Sam is nonsense ("you publish"?). AC1.8.3 and AC1.8.4 both say
   "that exact same message", which forces the conflict. The fix is a framed preview, not an
   identical sentence:
   - `**AC1.8.3**: Given nothing is published, when a guest's link resolves, then they see a
     single guest-framed placeholder — the property name, a plain statement that the host is
     still preparing the guide, and a prompt to contact the host — never an error, never a
     blank page, never owner-facing wording.`
   - `**AC1.8.4**: Given nothing is published, when I view my editor, then I am shown a
     **preview of that guest-facing screen exactly as a guest would see it**, labelled as a
     preview, so I know what is currently served under any link I have already sent.`
2. **Sam has no next action.** G-1 tells Sam to contact the host; the unpublished state
   currently tells them nothing. Sam is at the front door with no door code — "contact your
   host" is the only useful thing that screen can say, and it is missing. Folded into the
   AC1.8.3 text above.
3. **Priya can send a link into this state and never learn it.** US1.9 and US1.8 are separate
   stories with no stated relationship. Her mental model is "made a link, sent it, done". A
   one-time toast at generation will not survive her interruption pattern. Propose:
   `**AC1.8.5**: Given I have generated one or more guest links and my guide is not
   published, when I am anywhere in the dashboard, then a persistent notice states that
   anyone opening my links right now sees the not-published placeholder — not a dismissable
   one-time toast.`
   And, matching the AC1.14.3 precedent for a consequential action with an invisible effect:
   `**AC1.8.6**: Given a published guide with generated links, when I unpublish, then I am
   first told plainly that guests holding my link will immediately see the not-published
   message instead of my guide.`

This also answers D-04 item 4: **do not gate generation on publish** — gating strands a host
who wants links ready before writing the guide — warn persistently instead.

### D-07 (Major) — US1.4 is a lockout waiting to happen, and carries no caveat

US1.4 is Must and marked "implementation-ready". End to end it cannot work, for two
independent reasons in `api-documentation.md` A.2:

1. **No email address is ever collected.** Signup is `{ username, password }`. PO-2's mockup
   draws a "Registered email" field for a `{ username }` endpoint. AC1.4.1 correctly says
   "submit any username" — and then promises **"check your email"** for an address the
   system has never seen. That is a screen that lies to the user.
2. **`POST /v1/auth/reset/confirm` is unreachable**: `requestPasswordReset` returns a
   `resetToken` and the route **discards it**. No mailer, no SES construct, no queue. The
   link never arrives.

Compare the draft's own handling of chat: US2.4 carries an explicit C8 caveat that it is not
demonstrable end to end. **US1.4 has the identical problem and no caveat at all**, while
being Must rather than Should. The persona consequence is worse than chat's: Priya — medium
tech comfort, "burned by tools that were hard to leave" — forgets her password, is told to
check an email she never gave, and is locked out of a paid account with no recovery path and
no support surface anywhere in this product.

Proposed note for US1.4: `**Note**: not demonstrable end to end, for the same class of
reason as US2.4/C8 but with higher user consequence. No email address is collected at
signup, and reset/confirm's token is discarded by the route with no mailer configured, so
AC1.4.2 and AC1.4.3 cannot be exercised against the deployed backend. The screens are
buildable; the journey is a dead end, and a locked-out owner has no recovery path. Whether
email capture and a mailer join the FR9 follow-up is a product decision this set should
surface rather than absorb.`
And amend **AC1.4.1** so the UI does not promise what the system cannot do:
`**AC1.4.1**: Given I submit any username, when the request completes, then I see the same
non-disclosing confirmation whether or not the account exists, worded so that it does not
assert a message has been sent to an address the system may not hold.`

### D-08 (Major) — Priya is interrupted constantly, and the editor is the one screen that does not account for it

The draft handles interruption well in onboarding (AC1.5.2, AC1.5.3, AC1.5.4 — resume,
back-navigation, saved indication). The **guide editor**, where she spends by far the most
time, has none of it:

- No autosave, and **no unsaved-changes guard**. AC1.7.4 covers a save that *fails*. Nothing
  covers her clicking "Locality Content" in the SideNav, or closing the tab, with unsaved
  edits — the far more frequent loss.
- This is an **internal inconsistency in the product's own interaction language**: the wizard
  autosaves per `interaction-spec.md`; the editor does not. Same user, same session, two
  different mental models of whether her typing is safe.
- `api-documentation.md` A.4 notes concurrent edits are silently last-write-wins across tabs
  — plausible for a desktop-primary owner with the editor open twice.

Proposed additions to **US1.7**:

- `**AC1.7.6**: Given I have unsaved edits, when I navigate away within the app or attempt
  to close the tab, then I am warned and given the chance to save first — my edits are never
  discarded without an explicit choice.`
- `**AC1.7.7**: Given I am editing, when my edits are unsaved, then the editor shows an
  unmistakable unsaved/saved status at all times, using the same saved-state language as the
  onboarding wizard rather than a second convention.`

And strengthen **AC1.10.3**, which today only requires that she not be *misled*: with a
15-minute access token and a persona who steps away mid-task, session expiry during a long
edit is routine, not exotic:
`**AC1.10.3**: Given I have unsaved guide edits when my session expires, when the expiry is
surfaced, then my edits remain on screen and recoverable after I log back in — I am neither
told they were saved nor silently made to lose them.`

Add to `personas.md` under Priya's "What the frontend owes her": `Not losing work to an
interruption **in the editor**, not only in onboarding — the wizard autosaves and the editor
currently does not, which is one product speaking two languages to the same person.`

### D-09 (Minor) — Sam's contexts are named in the persona but only partly reach the acceptance criteria

Mostly the ACs do not describe a calm user at a desk — AC2.5.3's hotel-NAT rate limit is
exactly the right kind of thinking. Three gaps remain:

1. **The first moment has no owner.** AC2.5.1 ("a loading state rather than a blank page")
   sits in a different story from the trust moment (US2.1). On a bad connection at the front
   door, that pre-response second *is* the experience, and the two ACs need to meet. Note
   also that the stay payload arrives in **one response** — there is no separate identity
   endpoint — so "before any other content loads" cannot mean a two-phase fetch. Propose in
   US2.1:
   `**AC2.1.6**: Given the stay request is still in flight, when I am waiting, then I see a
   skeleton of the guide's own shape — never a blank screen, and never a placeholder that
   could be mistaken for another property's identity.`
2. **In-app browsers are unaddressed.** A link sent "however I already talk to them"
   (US1.9's own wording) opens inside WhatsApp's, iMessage's or a booking platform's webview
   far more often than in Safari or Chrome. NFR9/A3 names evergreen browsers and never
   mentions webviews, and the stories inherit that gap. It matters concretely for AC2.4.5:
   with no chat-history endpoint until FR9.5, transcript survival depends on client-side
   storage that some webviews partition or clear. Propose in US2.1:
   `**AC2.1.7**: Given I open the link inside a messaging app's in-app browser, when the
   guide loads, then it renders and functions the same as in a standalone browser; any
   behaviour depending on client-side storage degrades to a clear state rather than an
   error.` Plus a line in `personas.md` under Sam's device context.
3. **"Try again shortly" is not a recovery.** AC2.5.3's state is right; its exit is missing.
   `**AC2.5.4**: Given the rate-limited state, when I am shown it, then I am given a retry
   action and told roughly how long to wait — not left to guess when "shortly" is.`

### D-10 (Minor) — Three loose ends in journey coherence

- **The Owner journey has no bridge from "published" to "shared".** US1.8 ends at published;
  US1.9 begins with no stated entry point. For a first-time owner this is the "now what"
  moment. Propose in US1.8: `**AC1.8.7**: Given I publish successfully, when the
  confirmation appears, then it offers generating a guest link as the next action.` This
  also gives the walking-skeleton chain a user-visible seam rather than a developer-only one.
- **PO-5's mockup draws a `[ Preview ]` button that no story and no requirement owns.**
  Either a story claims it — Priya has no other way to see the mobile, tabbed guest view her
  guests actually get, and once US1.9 exists she can only preview by opening a real stay link
  she may not want to burn — or `refined-mockups` drops the control. An unowned button should
  not reach implementation.
- **G-1's branding question (OQ2 / prior R-06) is carried in US2.2 but is not in the
  sequencing summary.** It is genuinely low-stakes and I would leave the decision open —
  noting only that it should be settled in the same `refined-mockups` pass as PO-7/PO-8
  rather than drifting to `domain-design` separately, since all three are the same
  designer's sitting.

---

### One note on this stage's inputs

All four planning answers were orchestrator-selected because the human declined to answer.
That is recorded honestly in `user-stories-questions.md`, and I have no objection to any of
the four on UX grounds — A/C/A/B are the choices I would have made. But D-01, D-02, D-03 and
D-07 are all *product-scope* questions (what the first release actually delivers to Sam,
whether the photo cue survives, what a pre-check-in guest sees, whether a locked-out owner
has any recovery), and they should be put to the human explicitly at this stage's approval
gate rather than resolved by the lead's judgment. They are exactly the kind of question the
declined interview would have surfaced.

## Positions

- AGREE: The mixed granularity (Q2/C), with the walking-skeleton path written implementation-ready — the designs exist to size those stories against, and the epic-level remainder correctly waits for a chosen stack.
- AGREE: Making the FR9 backend follow-up a single schedulable story (US4.1) with per-AC "blocks X" annotations — it turns the largest recorded risk into something Delivery Planning can sequence without fragmenting one team's work.
- AGREE: US1.10 (session expiry) and US1.15 (Account) as new stories closing R-01 and R-02 — both are genuine gaps, and both are framed honestly rather than papered over.
- AGREE: Anchoring the guest trust cue to property-specific content and refusing to weaken it to "the domain looks official" — that reasoning is correct and should survive the rewording D-02 proposes.
- AGREE: AC1.14.5/AC1.14.6 and AC1.7.2/AC1.7.3 — the highest-consequence criteria in the set, correctly identified as such and correctly written as user-visible outcomes rather than implementation notes.
- OBJECT: AC2.3.2 asserts the guest sees the host's favourited places, but the stay payload carries only unresolvable ids and no guest-facing lookup exists — the POIs and Events tabs are empty by construction and US1.12's value is undelivered this release (D-01).
- OBJECT: AC2.1.1 and `personas.md` require a property photo that exists nowhere in the API and has no Owner-side capture path; this draft hardened the prior set's "name/photo" into "photo and name" (D-02).
- OBJECT: The pre-check-in open question (requirements OQ1, prior US2.1, `mockups.md` G-2) is absent from the story set, leaving a very common guest arrival defaulting to G-1's "no longer valid" copy (D-03).
- OBJECT: US1.9 does not say what Priya enters to generate a link (AC4.1.1 leaves `POST /v1/stays`'s request shape open), where the control lives in the SideNav shell, or whether a generated link is retrievable afterwards — a designer cannot draw PO-7 from it, and it is first on the skeleton path (D-04).
- OBJECT: US1.4 is Must and "implementation-ready" with no caveat, though no email is collected at signup and the reset token is discarded by the route with no mailer — a locked-out owner has no recovery path, while chat's lesser problem got an explicit C8 caveat (D-07).
- OBJECT: AC1.8.3 and AC1.8.4 require one identical string to serve both a guest and the owner, the guest-facing version offers Sam no next action, and nothing tells Priya that links she has already sent currently resolve to the placeholder (D-06).
- OBJECT: US1.7 has no unsaved-changes guard and no autosave, while the onboarding wizard autosaves — the same interrupted persona gets two different promises about her work on two screens of the same product (D-08).
- OBJECT: The cross-cutting accessibility baseline defers component ARIA and focus behaviour to `interaction-spec.md`, which has no entry for either undesigned story's interactions (US1.9's copy control, US1.15's Account screen) — the baseline silently exempts the two riskiest stories (D-04 item 6).
