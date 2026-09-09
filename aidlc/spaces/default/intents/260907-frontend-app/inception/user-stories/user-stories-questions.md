# User Stories — Story Plan and Questions

## Plan

**Personas.** Two in scope: **Priya, the Property Owner** and **Sam, the Guest**,
carried forward from the prior intent's reviewed `personas.md` and re-cut for the
frontend (device context, trust needs, and failure tolerance matter more here
than they did for a backend). The **Admin/Ops** persona is dropped as an actor —
no Admin/Ops screen is built (Q9 of Requirements Analysis) — but survives as a
named *dependency*: assumption A1 has ops seeding locality-brands out of band,
and nothing works until they do.

**Story format.** Standard "As a [persona], I want [goal], so that [benefit]"
with Given/When/Then acceptance criteria, per the inception-phase guardrail.
INVEST compliance assessed per story.

**Prioritization.** MoSCoW, inherited from the requirements' scope table:
US1.1–US1.3, US1.5–US1.8, US2.1, US2.2 are Must; the itinerary chat is Should but
explicitly included in the first release (Q2 of Requirements Analysis). The
formal MVP boundary is set at Delivery Planning, not here.

**Traceability.** Every `FR{n}` and `NFR{n}` in `requirements.md` gets a coverage
row in `traceability.json`. NFRs that belong downstream are marked `Deferred`
with a named stage rather than force-fitted into a story.

**Mob elaboration.** The designer, developer and quality engineer each review the
draft independently and write their own findings; objections that are judgment
calls come back to you mid-stage.

---

## Questions

> **How this was answered**: the human declined the structured questions and
> directed the orchestrator to proceed ("keep going"). The four answers below
> are therefore orchestrator-selected defaults with stated rationale, not human
> choices. They are recorded as such so the decision record stays honest, and
> every one of them remains open to change at this stage's approval gate.

### Q1. How should frontend stories relate to the existing story IDs?

The prior intent has a reviewed-READY set of 17 stories (`US1.1`…`US4.4`) with
acceptance criteria (`AC1.1.4` and so on) covering these same journeys. The
requirements document quotes those IDs throughout and does not renumber them.

- A. Mint **new** frontend story IDs, each tracing explicitly to the prior story and ACs it realises — two clean sets, one cross-reference table, no ID collisions across intents
- B. **Reuse** the prior IDs exactly (`US1.1` stays `US1.1`), adding frontend-specific acceptance criteria to them — one continuous set, at the cost of two intents owning the same IDs
- C. Reuse the prior IDs but with a frontend prefix (`FE-US1.1`) — visibly paired, still unambiguous
- X. Other (please specify)

[Answer]: A. Mint new frontend story IDs, each tracing explicitly to the prior story and ACs it realises. Rationale: `traceability.json` needs unambiguous `USx.y` targets, and two intents owning the same ID would make every downstream coverage row ambiguous. A cross-reference column preserves the link to the reviewed set without collision. (Orchestrator-selected.)

### Q2. How granular should the stories be?

The prior set was deliberately epic-level, with decomposition deferred to
`domain-design`/`units-generation`. This intent has something the prior one did
not: a finished, reviewed design. Every screen, state and component is already
specified, so implementation-ready stories are achievable now.

- A. Epic-level, matching the prior set — decompose later at `domain-design`/`units-generation`
- B. Implementation-ready — one story per screen or coherent flow, sized for a single Bolt, since the designs already exist to size against
- C. Mixed — implementation-ready for the walking-skeleton path (Owner signup → published guide), epic-level for the rest
- X. Other (please specify)

[Answer]: C. Mixed - implementation-ready for the walking-skeleton path (Owner signup through to a published guide), epic-level for the rest. Rationale: the affirmed practice runs the walking-skeleton Bolt first, solo and gated, so that path needs Bolt-sized stories now; decomposing everything else here would duplicate `domain-design`/`units-generation` before the stack is even chosen. (Orchestrator-selected.)

### Q3. How should the stories be grouped?

- A. By persona and journey — Property Owner first, then Guest (matches the prior set and the walking-skeleton order)
- B. By screen — one group per mockup (PO-1, PO-3, PO-5, G-2 …), closest to how the work will actually be picked up
- C. By workflow — signup, onboarding, authoring, curation, subscription, guest access, chat
- X. Other (please specify)

[Answer]: A. By persona and journey - Property Owner first, then Guest. Rationale: matches the reviewed prior set, matches the walking-skeleton order, and keeps each journey readable end to end rather than fragmented across screens. (Orchestrator-selected.)

### Q4. Should the backend follow-up be a story in this set?

`requirements.md` FR9 is a backend prerequisite this intent consumes but does not
build: `POST /v1/stays`, the CORS/origin fix, `GET /v1/subscriptions`,
`GET /v1/accounts/me`, logout/revocation, and chat history. OQ7 records that it
has **no owner and no schedule**, and names it the largest risk in the document.
Delivery Planning sequences stories; it does not sequence loose requirements.

- A. Yes — one story per FR9 endpoint, so each is individually schedulable and its blocked frontend stories can depend on it
- B. Yes — a single "backend follow-up" story covering all of FR9, kept coarse because it is one team's one piece of work
- C. No — FR9 stays a requirement and a constraint; Delivery Planning picks it up from `requirements.md`
- X. Other (please specify)

[Answer]: B. Yes - a single backend-follow-up story covering all of FR9. Rationale: it makes the largest recorded risk schedulable at Delivery Planning, which sequences stories rather than requirements, without fragmenting one team's single piece of work into six rows in a frontend backlog. Blocked frontend stories name the specific FR9.x item they depend on. (Orchestrator-selected.)

---

## Consolidated Summary Confirmation

**Plan decisions** (orchestrator-selected; the human declined the questions and
said to proceed - they remain open to change at the approval gate):

- **Story IDs**: new frontend IDs, each tracing to the prior intent's story (Q1).
- **Granularity**: mixed - implementation-ready for the walking-skeleton path,
  epic-level elsewhere (Q2).
- **Grouping**: by persona and journey, Property Owner first (Q3).
- **Backend follow-up**: one combined story, so Delivery Planning can sequence it (Q4).
- **Personas**: Priya (Property Owner) and Sam (Guest). Admin/Ops drops as an actor
  but is named as the out-of-band dependency behind assumption A1.

**What the mob changed after the draft.** Three independent reviews each verified
against deployed source rather than the draft, and converged on one finding: several
stories asserted behaviour the backend cannot supply. Integrated:

- **No route returns a locality brand to the frontend** - every branding criterion was
  unbuildable. Now conditional on new AC4.1.7.
- **Tenancy resolves from the request `Host` header** - a cross-origin frontend gets
  `404` on every signup and `410` on every valid stay link. CORS does not fix it. Now
  new AC4.1.8, a dependency of US1.1 and all Guest stories.
- **The guest receives favourite ids it cannot resolve** - two of the guide's three
  tabs are empty by construction, and US1.12's curation reaches no guest. Now new
  AC4.1.9.
- **There is no property image anywhere in the system**; the draft had hardened the
  guest trust cue onto one. The cue is now the property name, with AC2.1.5 forbidding
  a generic placeholder.
- **Onboarding resume had no source** (`{ currentStep, completed }` only) and the step
  machine is strictly forward - a mistyped property name is uncorrectable.
- Guide `PATCH` is worse than drafted: a bodyless save returns **`200` with every
  section deleted**, not `400`.
- `upgrade`/`downgrade` change no observable field; only one tier exists.
- Password reset has **no mailer** - the token is generated and discarded.
- **OQ1 is not open**: the code never compares `checkIn`, so a link is live from
  creation until end of checkout date.

**Walking skeleton re-cut**: US1.1 -> US1.3 -> US1.5 -> US1.6 -> US1.7 -> US1.8.
US1.4 (no mailer), US1.9 (no design, blocked on AC4.1.1's shape) and US1.10
(unspecifiable until token storage resolves) moved off Bolt 1.

**Net**: 21 stories, ~75 acceptance criteria, full FR/NFR traceability. The backend
follow-up is now materially larger than `requirements.md` FR9 records, and it already
had no owner and no schedule.

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
