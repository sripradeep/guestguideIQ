# Functional Design — `u9-guest-guide-view`

**No new questions.** This unit did not exist when the stage began. It was created
part-way through `functional-design`, and every decision that shapes it was
already made at another unit's gate — so putting them again would be asking the
same questions twice.

What follows is the record of that inheritance, for confirmation.

## Where this unit came from

It was created on 2026-09-08 as a direct consequence of the human's **Q2 = C** at
`u5-owner-guide`'s gate: *extract the guest rendering into a component both units
consume.*

`AC1.8.4` requires the owner's preview to show the guest screen "exactly as a
guest would see it" — a claim that has to stay true over time, not only on the day
it is written. The alternatives were a `u5` → `u8` dependency edge, ending the
Guest branch's independence, or a second implementation that would diverge
silently.

The shared rendering could not go into `u2-design-system`: it renders guide
sections, so it knows what a guide is, and `u2`'s BR1.1 forbids exactly that.
Hence a new unit rather than a new component in an existing one.

## The decisions this unit inherits

| Decision | Where it was made | What it fixes here |
|---|---|---|
| Extract the rendering | `u5-owner-guide` Q2 = C | That this unit exists at all, and that it is consumed by both `u5` and `u8` |
| Paint identity in base tokens, then apply the brand to accent surfaces only | `u8-guest-app` Q1 = A | Steps 1–5 of this unit's Workflow, and that nothing reflows when tokens arrive |
| Render all three tabs, two showing the empty state | `u8-guest-app` Q3 = A | `GuideTabs`, and that Overview is selected by default |
| Generic primitives only in `u2` | `u2-design-system` Q1 = A | Why this is a unit rather than a design-system component |
| Accessibility provided, not enforced | `u2-design-system` Q2 = B | That this unit owns its own obligations, inherited from `accessibility-checklist.md` |

## What was decided here, and is not inherited

Three shaping choices were made while writing this unit rather than at a gate.
They follow from the decisions above rather than reopening them, and they are
listed so they are visible rather than buried:

1. **`kind: ui`, complexity S.** It renders, so `ui`; it is presentation over `u2`
   primitives with no logic beyond which panel is selected, so S.
2. **`GuestGuideView` is the single entry point.** Both consumers name one
   component, not five. A consumer that could assemble the parts itself could
   assemble them differently.
3. **No preview-mode input, ever.** The moment this unit knows whether it is
   inside an owner's preview, the two renderings can diverge — which is the exact
   failure the extraction prevents. The frame and its label stay in
   `u5-owner-guide`.

Point 3 is the one worth defending: a "preview mode" flag looks harmless and would
immediately reintroduce the drift `AC1.8.4` needs eliminated.

## What this cost elsewhere

Recorded rather than absorbed, because it is rework on already-approved and
already-written work:

| Artifact | What changed |
|---|---|
| `unit-of-work.md` | Nine units, not eight; `U8` resized L → M; correction note at the top |
| `unit-of-work-dependency.md` | `u9` and its two edges; graph re-verified acyclic programmatically |
| `u8-guest-app`'s three artifacts | Five components, not ten; traceability targets repointed here |
| `delivery-planning/bolt-plan.md` | **Not revised** — it sequenced eight units. Open item for this stage's gate |

---

## Consolidated Summary Confirmation

`u9-guest-guide-view` exists because of your Q2 = C at `u5-owner-guide`, and
inherits its rendering behaviour from your Q1 = A and Q3 = A at `u8-guest-app`.
No new decision is being asked of you here.

Confirming means: the inheritance above is what you intended, the three
locally-made choices are acceptable, and the rework in `u8-guest-app` and the two
`units-generation` artifacts is disclosed rather than hidden. `bolt-plan.md`
remains unrevised and is carried to the approval gate as an open item.

[Answer]: Looks correct
