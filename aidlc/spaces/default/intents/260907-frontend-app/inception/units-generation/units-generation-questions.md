# Units Generation — Questions

Five decisions about how the 14 components group into units of work.

**What this stage does and doesn't decide.** It produces the dependency
topology — what *can* depend on what, and which units could be built in
parallel. It does **not** choose a build order, a critical path, or which unit
ships first. Those are economic decisions and they belong to Delivery Planning,
which consumes this DAG as input.

**Already settled, not re-asked here:**

- **Deployment model.** The affirmed practice is that the Owner and Guest
  surfaces deploy **together, not split** — every frontend deploy goes to
  staging first and production requires manual approval. So units are build-time
  and ownership boundaries, not separate deployment targets.
- **The walking skeleton.** Affirmed as the Owner path: signup through to a
  published guide (US1.1 → US1.3 → US1.5 → US1.6 → US1.7 → US1.8), run first,
  solo and gated. Whichever decomposition is chosen has to let that slice be
  built without dragging the rest of the Owner app in with it.
- **The two boundaries at the bottom.** Domain Design fixed `ApiClient` and
  `SessionManager` as separate components, and `ApiErrorCatalog` as the single
  error parse. Units may group them; they may not merge them.

---

## Q1 — How coarse should the units be?

Fourteen components have to become some number of units. Three decompositions
are viable, and the difference is real: it changes how much has to be built
before the walking skeleton can run end to end, and how much can proceed in
parallel afterwards.

- **A. Coarse — 5 units.** Foundation, design system, one Owner app, one Guest
  app, one contract package. Fewest boundaries to maintain. But "one Owner app"
  is seven components including everything outside the skeleton, so the skeleton
  Bolt would either carry the whole unit or split it informally anyway.
- **B. Middle — 8 units.** Foundation, design system, contract package, Owner
  shell, onboarding-and-guide-authoring (the skeleton's own content),
  curation-and-subscription, guest links, guest app. The skeleton is one unit
  plus its two dependencies. Boundaries follow how the work actually sequences.
- **C. Fine — 11 units.** Roughly one unit per feature component. Maximum
  parallelism and the cleanest test isolation; eleven sets of boundaries,
  contracts and directories to maintain for a frontend one team is building.
- **X. Other (please specify)**

[Answer]: B

---

## Q2 — Is the generated API contract its own unit?

Domain Design decided the backend will publish a machine-readable contract and
the frontend will generate its types from it (ADR-006). That generated package
is real work: consuming the contract, generating types, and keeping the
generation wired into the build.

- **A. Its own `spec` unit.** Everything else depends on it, it has a genuinely
  different lifecycle (it regenerates when the backend publishes, not when a
  feature changes), and it is the one unit that cannot start until the backend
  follow-up lands — which makes that blocker visible in the DAG rather than
  buried inside another unit.
- **B. Folded into the foundation unit** alongside the API client and session
  manager. One less boundary; the blocker becomes invisible in the topology, and
  the foundation unit then has two very different reasons to change.
- **X. Other (please specify)**

[Answer]: A

---

## Q3 — Is the design system its own unit?

`DesignSystem` has no dependencies, is depended on by every surface, changes at a
different rate from any feature, and is **explicitly excluded from the coverage
floor** by ADR-007 — an exclusion that only works cleanly if it is a real
boundary rather than a folder inside something else.

- **A. Its own `library` unit.** Makes the coverage exclusion structural rather
  than a naming convention, and lets the primitives stabilise independently of
  any feature.
- **B. Folded into the foundation unit.** One less unit. The coverage exclusion
  then has to be expressed as a path pattern inside a unit that is otherwise
  fully covered, which is exactly the kind of exclusion that quietly stops
  matching when files move.
- **X. Other (please specify)**

[Answer]: A

---

## Q4 — Should the topology allow parallel work, or stay a single chain?

This is about what the DAG permits, not what gets built first. Independent units
with no edge between them can be worked simultaneously; a strictly linear chain
forbids that even where no real dependency exists.

- **A. Allow parallelism where no real dependency exists.** Declare only genuine
  dependencies, so units like guest links, curation and subscription come out
  independent of each other. Delivery Planning can then choose to sequence them
  anyway, but the topology does not force it.
- **B. Keep a single linear chain.** Simpler to reason about and to review, and
  it matches a one-team reality where nothing is truly built in parallel anyway.
  It also encodes dependencies that do not exist, which later reads as fact.
- **X. Other (please specify)**

[Answer]: A

---

## Q5 — How is the backend follow-up represented?

`US4.1` is a story in this intent's backlog, but the work is a different team's,
in a different repository, and it is the prerequisite for most of this frontend.
It has grown three times during Inception and `requirements.md` records that it
has no owner and no schedule.

- **A. Not a unit; recorded as an external prerequisite.** Every frontend unit
  that is blocked names the specific `AC4.1.x` it waits on, and the story map
  records US4.1 as out of frontend scope with that justification. Honest about
  ownership — this stage cannot plan another team's work.
- **B. A unit in this DAG.** Makes the dependency structurally visible and forces
  Delivery Planning to sequence around it. But it puts another team's work inside
  this frontend's unit list, where nobody here can estimate, build or complete
  it.
- **X. Other (please specify)**

[Answer]: A

---

## Consolidated Summary Confirmation

Answers recorded: **Q1 = B** (middle, 8 units), **Q2 = A** (contract as its own
`spec` unit), **Q3 = A** (design system as its own `library` unit), **Q4 = A**
(allow parallelism where no real dependency exists), **Q5 = A** (backend
follow-up recorded as an external prerequisite, not a unit).

**The decomposition this produces:**

| Unit | Directory | Kind | Components | Complexity |
|---|---|---|---|---|
| U1 | `u1-api-contract` | spec | Generated types from the backend's published contract | S |
| U2 | `u2-design-system` | library | DesignSystem | L |
| U3 | `u3-foundation` | library | ApiClient, SessionManager, ApiErrorCatalog, LocalityBrandResolver | M |
| U4 | `u4-owner-shell` | ui | AppShell, AccountView | S |
| U5 | `u5-owner-guide` | ui | OnboardingFlow, GuideAuthoring | L |
| U6 | `u6-owner-locality-billing` | ui | LocalityCuration, SubscriptionManagement | M |
| U7 | `u7-guest-links` | ui | GuestLinkManagement | M |
| U8 | `u8-guest-app` | ui | GuestGuide, ItineraryChat | L |

**Unit numbers are identity, not order.** Delivery Planning chooses the build
sequence; this stage only says what may depend on what.

**The dependency shape:**

```
u1-api-contract  []                              (blocked on the backend contract)
u2-design-system []
u3-foundation    [u1-api-contract]
u4-owner-shell   [u3-foundation, u2-design-system]
u5-owner-guide   [u4-owner-shell]
u6-owner-locality-billing [u4-owner-shell]
u7-guest-links   [u4-owner-shell]
u8-guest-app     [u3-foundation, u2-design-system]
```

Parallel opportunities the topology permits: `u1` and `u2` are independent of
everything and of each other; once `u3` exists, `u4` and `u8` are independent;
once `u4` exists, `u5`, `u6` and `u7` are all independent of each other.

Two consequences worth stating rather than leaving implicit:

1. **`u8-guest-app` does not depend on the Owner shell.** The Guest surface has
   its own entry point, no authentication and no dashboard frame, so making it
   wait on Owner routing would encode a dependency that does not exist — exactly
   what Q4 asked to avoid. It is the largest genuinely parallel branch in the
   design.
2. **Q2 and Q5 together put the external blocker exactly where it is visible.**
   `u1-api-contract` is the frontier: it is the only unit whose start depends on
   another team, and everything except the design system sits behind it. That is
   the intended consequence of making the contract its own unit rather than the
   accident of it.

[Answer]: Looks correct
