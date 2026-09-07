# Personas — GuestGuideIQ Frontend

> Carried forward from the prior intent's reviewed `personas.md` and re-cut for
> the frontend. What changes here is emphasis, not identity: for a backend, a
> persona's device, connection quality and trust cues were background. For the
> two surfaces these people actually touch, they are the design.
>
> Confirmed correct by the human at the Consolidated Summary Confirmation
> checkpoint (see `user-stories-questions.md`).

## Priya — the Property Owner

- **Role**: Short-term-rental host or vacation-rental property manager. The
  paying customer.
- **Goals**: Get a polished, guest-ready digital guide live quickly without
  writing local recommendations from scratch; keep her subscription simple to
  manage; give guests a better stay and lift her review scores.
- **Pain points**: No time to research and write deep local content; wary of a
  steep technical learning curve; has been burned by tools that were hard to
  leave.
- **Tech comfort**: Medium. Comfortable with web apps; not a developer.
- **Device and context**: Primarily desktop for guide authoring. The dashboard
  is desktop-primary but **not desktop-only** — the SideNav collapses to an
  overlay below 768px and an icons-only rail at 768–1023px (NFR4).
- **Frequency**: Bursty. Heavy during onboarding and initial authoring, then
  light touch-ups between stays.
- **What the frontend owes her, specifically:**
  - Onboarding that **resumes where she left off** rather than restarting — her
    sessions are interrupted by the rest of running a property.
  - Never losing edits silently. The guide PATCH is a full replace, so a partial
    save deletes sections; she must never be the one who discovers that.
  - Never a surprise cancellation. The subscription PATCH cancels on any
    unrecognised action, so her billing depends on the frontend being careful.
  - A clear answer when her session expires mid-edit — today undefined
    (finding R-01, accepted as risk at the requirements gate).
- **Priority**: Highest. The walking-skeleton path is hers, and every Guest story
  depends on an Owner having published something first.

## Sam — the Guest

- **Role**: A traveller staying at a property whose owner uses GuestGuideIQ.
- **Goals**: Instant, trustworthy local recommendations for this specific stay,
  with no app to download and no account to create; a personalised itinerary
  without effort.
- **Pain points**: Generic tourist-trail content; friction between them and a
  quick answer; and — the one that shapes the first screen — **wariness of
  clicking an unfamiliar link**. They need immediate visual proof it belongs to
  their actual stay.
- **Tech comfort**: Variable, and irrelevant by design. The experience must work
  with zero setup, because Sam may use it exactly once.
- **Device and context**: Mobile-first, near-universally. Often on hotel wifi or
  roaming. Frequently opening the link **in the moment** — standing at the front
  door, bag in hand — not planning in advance.
- **Frequency**: Once, or a few times, entirely inside one stay.
- **What the frontend owes them, specifically:**
  - The **property name, specific to their actual stay, as the first thing
    painted** — the trust cue, anchored to property-specific *content* and never
    weakened into "the domain looks official". Sam has no prior familiarity with
    any locality's domain to judge legitimacy by.
    **There is no property image anywhere in the system** to carry this cue: the
    stay payload returns `property: { id, name }`, onboarding accepts a name
    only, and no upload endpoint or object storage exists. If a photo is wanted
    as the cue, it needs both an Owner-side capture story and a backend field,
    and neither exists — see US4.1 and the open decisions at the gate.
  - One calm message for every invalid link — expired, unknown, or mistyped —
    never a raw 404.
  - Honest behaviour on a bad connection, including the shared-hotel-NAT case
    where a rate limit trips for several guests at once (NFR6, FR11.4).
- **Priority**: Second, and dependent — Sam cannot see anything until Priya has
  published and generated a link.

## Not an actor here: the GuestGuideIQ Ops team

Ops was a full persona in the prior intent, with its own screens. **No Admin/Ops
screen is built in this intent** (Requirements Analysis Q9 — the admin API
requires an ops-role JWT that nothing in the system issues).

They remain a **dependency rather than a user**: assumption A1 has ops seeding
every locality-brand and its domains out of band, by script or direct API call.
Nothing in this frontend works until they have — Priya cannot sign up through a
locality domain that does not exist. Worth stating plainly, because a persona
that has been dropped from the screens is easy to forget as a precondition.

## Relationships and priority

1. **Priya (Property Owner)** — highest. Owns the walking skeleton; every Guest
   story is downstream of her publishing.
2. **Sam (Guest)** — second. Depends on Priya's guide existing and on a stay link
   being generated, which itself depends on the backend follow-up (US4.1).
3. **Ops** — not a user of this frontend; a precondition supplier to both.
