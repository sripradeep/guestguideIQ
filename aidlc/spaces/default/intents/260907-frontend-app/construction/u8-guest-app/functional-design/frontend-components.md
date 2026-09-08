# Frontend Components — `u8-guest-app`

*Revised 2026-09-08 under a human Request Changes decision: the guest-guide
theming misclassification is corrected. Every change is marked in place.*

The component hierarchy, each component's inputs and state, its interaction flow,
its validation rules and its integration points.

**Framework-neutral.** The framework is OQ4 and unchosen, so nothing here is
expressed as props, hooks or lifecycle. "Inputs" means values a component is
given; "state" means values it owns.

## Hierarchy

> **Revised 2026-09-08.** `IdentityBlock`, `GuideTabs`, its three panels and
> `NotYetPublishedNotice` **moved out of this unit** into
> `u9-guest-guide-view`, so that `u5-owner-guide`'s preview renders the same
> components a guest gets rather than a second copy (`u5`'s Q2 = C). This unit
> keeps the route model, the stay resolution, the chat widget and the degraded
> states. See `unit-of-work.md`'s correction note.

```
GuestSurface                    (this unit)  — the single route, /{token}
├── GuestSkeleton               (this unit)  — AC2.5.1's loading state
├── u9-guest-guide-view                      — NOT this unit's; the guide itself
├── ChatWidget                  (this unit)  — G-3
├── LinkInvalidScreen           (this unit)  — G-1, terminal
├── RateLimitedNotice           (this unit)  — AC2.5.3, its own state
└── FailedLoadNotice            (this unit)  — AC2.5.2, with a retry
```

**Five components**, down from ten. Only two carry logic of any depth —
`GuestSurface`, which owns the state machine, and `ChatWidget`, which owns a
conversation and its failure handling.

**What moved, and why it is still this unit's concern.** The paint ordering
`AC2.1.1` demands is now guaranteed inside `u9` rather than by this unit's
structure — which is stronger, because it holds for the owner's preview too. This
unit still decides **when** to render the guide at all: `u9` never appears in the
`invalid`, `rate-limited`, `failed` or `resolving` states.

---

## `GuestSurface`

The unit's only stateful coordinator.

| Aspect | Detail |
|---|---|
| Inputs | The stay token from the URL |
| State | `surfaceState` (`resolving`, `guide`, `not-yet-published`, `invalid`, `rate-limited`, `failed`); the `GuestStayView`; the resolved `ThemeTokens` |
| Emits | Nothing upward — it is the root |
| Integration | `u3-foundation` for the **stay read only**. The brand arrives inside that same payload; nothing else is requested |

**It decides *when* the guide renders; `u9-guest-guide-view` decides *how*.** This
component owns the state machine and hands `u9` the shape plus whatever tokens
have resolved. The paint ordering `AC2.1.1` requires — identity before tab
content, before any theming asset — is guaranteed inside `u9`, which is stronger
than guaranteeing it here: it holds for `u5-owner-guide`'s preview too.

**`u9` never renders in the `resolving`, `invalid`, `rate-limited` or `failed`
states.** Those are this unit's screens.

**The chat affordance renders after the guide**, preserving the last step of
`AC2.1.1`'s ordering, which is the part that stays this unit's responsibility
because `ChatWidget` is this unit's component.

**The brand is not a second request.** The stay payload carries `locality:
{ id, name, tagline, visualStyling }` inline, so this component hands that object
to `u3-foundation` for parsing rather than fetching anything. Parsing is not
awaited before identity paints — its result changes accent surfaces when it
arrives, which is Q1 = A's ordering.

**`u9` must still render correctly with no tokens at all.** `visualStyling` is
documented as nullable, and `AC2.1.3` requires a name-and-tagline-only brand to
produce the clean default look. Absent tokens are a supported state, not a
permanent one.

> **Corrected 2026-09-08.** This previously said the brand read "currently never
> arrives" because `AC4.1.7` does not exist. `AC4.1.7` is the domain-keyed read the
> *owner* screens need; the guest surface has had its brand inline all along.

---


## `ChatWidget` (G-3)

The one component here with real logic, and the one whose success path cannot be
demonstrated.

| Aspect | Detail |
|---|---|
| Inputs | The stay token |
| State | `messages`, `composing`, `elapsed`, `lastFailedMessage` |
| Emits | Nothing upward |
| Integration | `u3-foundation`'s chat method |
| Primitives | `u2`'s `TextInput`, `Button`, `LiveRegion`, and its focus-managed overlay behaviour |

**It is persistent across tabs** (AC2.4.1) — genuinely one instance, not
re-mounted per tab. Re-mounting would lose the conversation on every tab change,
which `AC2.4.5` already loses on close; losing it twice over is worse.

**Validation:** a non-empty message. The backend returns
`400 VALIDATION_ERROR` on an empty one, so the check is local as well — there is
no reason to spend a rate-limit budget discovering it.

**State behaviour:**

| Condition | Behaviour |
|---|---|
| Composing, under ~5s | Typing indicator |
| Composing, past ~5s | **Escalate to an explicit note** (AC2.4.2) — a guest waiting on a provider that will never answer is told, not left watching dots |
| `200` | Render the reply as **untrusted text** (AC2.4.6) |
| `200` with `sparse` | The assistant says so in its own words (AC2.4.4). Not a UI state change |
| `504` | Preserve history, offer a retry of the last message (AC2.4.3). Never a silent hang |
| `429` | The rate-limited message, in-widget |
| `410` | The whole surface moves to `invalid` — the stay expired mid-conversation |

**`AC2.4.6` is enforced structurally, not by discipline.** The guest's own message
round-trips through a model and returns as the reply, so the reply is
attacker-influenceable by construction. It never reaches a raw-HTML injection API;
the team's blocking lint rule is what makes that true, and this path carries no
documented exception to it.

**History does not survive close and reopen** (AC2.4.5), blocked on `AC4.1.6`.
Deliberately **not** worked around with browser storage: a locally held history
would diverge from a backend that knows nothing about it, and would then have to
be reconciled when `AC4.1.6` lands.

---

## `LinkInvalidScreen` (G-1)

| Aspect | Detail |
|---|---|
| Inputs | None — **deliberately, not even the cause** |
| State | None |
| Behaviour | One message: the link is no longer valid, contact your host |

**It takes no cause input because there is nothing to take.** The backend returns
the same `410` with the same message for an unknown token, an expired stay, a
missing property and a host/locality mismatch — deliberately, so a stranger cannot
learn which tokens exist (AC2.2.1, AC2.2.2). A component that accepted a cause
would invite someone to branch on one later.

**No raw status code or technical detail** (AC2.2.3), and never a 404 page.

**Terminal — no retry action.** The link is not coming back, and a retry would
suggest otherwise. The only action is to contact the host.

**Ships unbranded, and this is the one guest path where that is genuinely
forced.** Whether G-1 renders the locality's branding was left open as **OQ2** and
decided by ADR-005 in favour of branding — but a `410 LINK_INVALID` carries **no
body at all**, so there is nothing to resolve a brand from. The valid path gets
its brand inline with the stay payload; this path gets nothing, because the
response is empty by design.

Branding it would need `AC4.1.7`'s domain-keyed read — the same one the owner
screens wait on. Neutral is what happens meanwhile, and it is a low-stakes
difference: a guest here is reading an error, not browsing content.

---


## `GuestSkeleton`, `RateLimitedNotice`, `FailedLoadNotice`

| Component | Behaviour |
|---|---|
| `GuestSkeleton` | A skeleton of the identity block and tab bar (AC2.5.1). Never a blank page and never a full-page spinner ahead of identity |
| `RateLimitedNotice` | A **specific** "too many requests — try again shortly" state (AC2.5.3), with a retry. Not a generic error |
| `FailedLoadNotice` | An error with a retry (AC2.5.2) |

**`RateLimitedNotice` exists separately from `FailedLoadNotice` for a concrete
reason.** A shared hotel address means one guest's requests can rate-limit several
unrelated guests at once. A generic error would send all of them to their host
about a link that is working perfectly.

**No countdown.** `Retry-After` is unreadable cross-origin because the backend
sets no `exposedHeaders`, so the copy says "shortly" rather than inventing a
number it cannot know.

---

## API integration points

Every one goes through `u3-foundation`. This unit calls no endpoint directly.

| Component | Call | Notes |
|---|---|---|
| `GuestSurface` | stay read | The only load-bearing request on this surface |
| `GuestSurface` | **none for the brand** | The `locality` object arrives inline with the stay read above; nothing separate is fetched |
| `ChatWidget` | chat send | `504` for almost every guest — the provider is `null` |

**No authenticated call exists anywhere on this surface**, and none may be added.
Auth here is the opaque token path segment plus a `Host`-header locality check;
there is no JWT and no account.

## Accessibility obligations this unit owns

Under `u2-design-system`'s Q1 = A boundary, a feature unit inherits its
obligations from `accessibility-checklist.md` directly rather than assuming the
design system covered them. For this unit:

- **`ChatWidget`'s overlay behaviour** — focus trapped while open, returned to the
  bubble on close, Escape closes normally. It is a dialog, not a session-ended
  dialog, so it does **not** take `u4-owner-shell`'s Escape override.
- **`ChatWidget`'s announcements** — replies announced politely via `LiveRegion`
  (`u2`'s BR2.4), and the past-5s escalation announced too, or a screen-reader
  user has no signal that anything changed.
- **`LinkInvalidScreen`, `RateLimitedNotice` and `FailedLoadNotice`** — each
  reachable as page content with a heading, not as an anonymous block. They
  replace the whole guide, so they are the page when they render.

**The guide's own obligations moved with it.** The empty panels' accessibility-tree
content, `IdentityBlock`'s heading structure and the mobile tab strip are now
`u9-guest-guide-view`'s — and are therefore met once for both surfaces rather than
twice, which is a second thing the extraction bought.
