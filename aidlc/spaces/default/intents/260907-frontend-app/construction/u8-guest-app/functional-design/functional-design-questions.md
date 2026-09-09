# Functional Design — `u8-guest-app`

Three questions.

**What this unit is.** Everything a guest sees: the read-only stay view resolved
from a link token (G-2), the invalid-link screen (G-1), and the itinerary chat
(G-3). No authentication, no account, no dashboard frame, and no shared model with
the Owner's guide (ADR-002).

It is `kind: ui`, so this stage produces `functional-spec.md`,
`frontend-components.md` and `traceability.json`.

**Why it is the largest genuinely parallel branch.** It does not depend on the
Owner shell — making the guest app wait on Owner routing would encode a dependency
that does not exist. It needs only `u2-design-system` and `u3-foundation`.

**What is already settled.** Identity paints first and no full-page spinner
precedes it (AC2.1.1). There is no property image anywhere in the system and no
placeholder stands in for one (AC2.1.5). The guest is never asked to create an
account (AC2.1.4). Every stay-link failure — unknown token, expired stay, missing
property, host mismatch — returns the same `410 LINK_INVALID` with the same
message, deliberately, so the frontend cannot distinguish them and must not try.
Chat replies are untrusted text and never reach a raw-HTML sink (AC2.4.6).

---

## Q1 — How does the page look between identity and theme?

`AC2.1.1` requires the property name and locality name to be **the first content
on screen — before any tab content, chat affordance or theming asset**. That
ordering is deliberate: Sam is often standing at a front door with a bag, and the
first thing they need is proof the link is theirs.

But `AC2.1.2` also requires the guide to carry the locality's branding, and the
brand is a **separate resolution** from the stay payload. So identity necessarily
paints before the brand is known, and something visible changes when it arrives.

- **A. Paint identity in base tokens, then apply the brand.** The identity block
  renders immediately in the product's default look; when the brand resolves, the
  accent bar and accent colour change. Honest to the ordering `AC2.1.1` demands.
  Cost: a visible restyle a moment after load, on the screen whose whole job is to
  look trustworthy — and a restyle reads as a glitch to someone who does not know
  it is deliberate.
- **B. Paint identity in base tokens and never restyle it.** The identity block is
  designed to be final in the unbranded look; the brand applies only to the accent
  bar and to content below the block. Nothing the guest is reading changes.
  Cost: the identity block — the most prominent element — is the one part of the
  page the locality cannot brand, which sits awkwardly with `AC2.1.2`'s "the
  property's own locality branding".
- **C. Hold the whole page until both resolve.** One paint, fully branded, no
  restyle. Cost: **this contradicts `AC2.1.1` directly** — it puts a wait ahead of
  the identity block, which is exactly what the criterion forbids. Listed because
  it is the obvious instinct and should be rejected explicitly rather than
  silently.
- **X. Other (please specify)**

[Answer]: A

---

## Q2 — Does the chat widget ship visible, given the provider is `null`?

`AC2.4.1` says the assistant's bubble is reachable from every tab, and `US2.4` is
a Should included in the first release.

But the deployed chat provider is `null`. Every message returns **`504
CHAT_PROVIDER_TIMEOUT`** unless the locality happens to have fewer than three
curated items, in which case it returns a canned sparse-content reply. The failure
states are testable; the success path is not demonstrable end to end at all.

So the first release ships an assistant that, for almost every guest, fails.

- **A. Ship it visible, with its failure state.** The bubble is present, the guest
  can send a message, and the timeout is handled exactly as `AC2.4.3` requires —
  history preserved, retry offered, never a silent hang. Honest, and the moment a
  provider is configured it simply starts working. Cost: every guest who tries it
  gets a failure, which is a poor first impression of the product's most novel
  feature.
- **B. Ship it behind a configuration flag, off by default.** The widget is built
  and tested; it does not render until a provider exists. Cost: `AC2.4.1` is not
  met in the shipped build, and a flag that has never been switched on in
  production is a flag whose on-state is untested.
- **C. Ship it visible, in an explicit not-yet-available state.** The bubble
  renders and says the assistant is not available yet rather than accepting a
  message that will fail. Cost: it is a third state to build and to remove later,
  and it needs a signal to distinguish "no provider" from "provider failed" —
  which the API does not give, since both surface as `504`.
- **X. Other (please specify)**

[Answer]: A

---

## Q3 — Three tabs, when two of them are always empty?

`AC2.3.1` says the guest can move between **Overview, Places and Events**.
`AC2.3.3` says an empty tab reads "more local recommendations are being added"
rather than being blank.

Until `AC4.1.9`, **Places and Events are empty for every guest on every stay**.
The payload carries bare `favoritedPOIIds` and `favoritedEventIds`, and both list
endpoints require an owner JWT — so the guest cannot render a name, a category or
a date. It is not a missing detail view; it is missing everything.

- **A. Render all three tabs, two showing the empty state.** Matches `AC2.3.1` and
  `AC2.3.3` literally, and the day `AC4.1.9` lands the tabs fill with no frontend
  change. Cost: every guest, on every stay, sees a guide two-thirds of which is a
  promise — which reads as an unfinished product rather than a curated one.
- **B. Render only tabs that have content; no tab bar when there is one.**
  A guest with only an Overview sees a clean single-page guide. When `AC4.1.9`
  lands, the tabs appear on their own. Cost: `AC2.3.1` is not met as written, and
  the host's curation becomes completely invisible rather than visibly pending —
  `US1.12`'s value is already deferred, and this hides the deferral too.
- **X. Other (please specify)**

[Answer]: A

---

## Consolidated Summary Confirmation

- **Q1 = A** — Paint identity in base tokens, then apply the brand when it
  resolves.
- **Q2 = A** — The chat widget ships visible, with its failure state.
- **Q3 = A** — All three tabs render; Places and Events show the empty state.

All three are the option that keeps a criterion literally met and shows the guest
the truth. Each carries the same cost — the guest sees the product's incompleteness
— so each needs a control that makes incompleteness read as *pending* rather than
*broken*.

**Q1 = A: bound what the restyle may touch.** The risk is that a page changing a
moment after load reads as a glitch on the one screen whose job is to look
trustworthy. So the restyle is confined:

1. **Only accent surfaces change** — the accent bar and the action colour. Never
   layout, never type, never position, never spacing.
2. **Nothing reflows.** No text moves, no element resizes, and the identity block
   occupies the same box before and after. A colour arriving is not a glitch; text
   jumping is.
3. **The unbranded state is a finished design, not a placeholder.** If the brand
   never resolves — `AC4.1.7` is not built, so today it never does — the guest sees
   a complete page, which is `AC2.1.3`'s requirement anyway.

Point 3 matters more than it looks: until `AC4.1.7` lands, **the base-token state
is the only state any guest will ever see**. The restyle Q1 is about is currently
hypothetical.

**Q2 = A: the failure state is the feature, for now.** Since almost every guest
who sends a message gets a `504`, that path has to be genuinely good rather than
merely handled:

1. **History is preserved and the last message is retryable** (AC2.4.3) — never a
   silent hang.
2. **The typing indicator escalates to an explicit note past roughly five
   seconds** (AC2.4.2), so a guest waiting on a provider that will never answer is
   told, not left watching dots.
3. **The one path that does succeed is named**: a locality with fewer than three
   curated items returns a canned sparse-content reply. That is `AC2.4.4`'s
   behaviour and it is the only demonstrable success path until a provider is
   configured — so it is what the scenario test exercises.

**Q3 = A: the empty tabs must read as pending, not broken.**

1. **Overview is the default tab**, so the guest lands on content rather than on a
   promise.
2. **The empty state is `AC2.3.3`'s wording** — "more local recommendations are
   being added" — never a blank panel and never an error.
3. **No raw identifier is ever displayed** (AC2.3.2). The payload carries
   unresolvable ids; showing them would be worse than showing nothing.
4. The panels still carry their empty-state text in the accessibility tree
   (`u2`'s BR3.3), so a screen-reader user is told the tab is empty rather than
   finding silence.

**What all three share.** Every one of these is a frontend presenting a backend
gap honestly: no brand-read source (`AC4.1.7`), no chat provider, no guest-readable
curated content (`AC4.1.9`). None is a frontend defect, and none is hidden.

[Answer]: Looks correct
