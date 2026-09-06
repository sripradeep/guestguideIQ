**Collaborator:** aidlc-developer-agent

## Contribution

Reviewed `team-practices.md`, `discovered-rules.md`, and `evidence.md` against
the CodeKB evidence (`code-structure.md`, `technology-stack.md`,
`dependencies.md`), focused on naming, layer boundaries, error handling, file
organization, and code-style conventions — the areas most load-bearing for
the Code Generation stage that will eventually implement this backend.

**1. Layer boundaries — entirely unaddressed, and this is a real gap, not a
non-finding.** The existing repository has no server-side layering to
observe (correctly noted in `evidence.md` and `team-practices.md`), but the
draft stops there instead of naming the gap as an explicit interview topic.
For a "backend services spec" intent, layer-boundary convention (e.g.
route/handler → service → repository/data-access, or a simpler
controller → model split) is exactly the kind of decision that, if left
implicit, produces inconsistent generated code across units in Code
Generation. Recommend adding a `## Layer Boundaries` sub-section (or a
bullet under `## Code Style`) to `team-practices.md` flagged
`[unconfirmed — no backend exists to infer from]`, and a corresponding
interview question to `evidence.md` § Explicit Gaps: *"What layering
convention should the new backend follow (e.g. controller/service/
repository, or a flatter route+model split), and should cross-layer
imports be restricted (e.g. repositories never importing route handlers)?"*

**2. Error handling — no convention exists today, and the one data point in
the codebase is worth citing.** The only error-handling behavior observed
anywhere in the current repo is client-side: `BaseLayout.astro`'s
`bindAjaxForms()` surfaces a Formspree submission failure via the
`[data-form-error]` UI path (`code-structure.md` § Code Patterns Observed;
`dependencies.md` § External Service Dependencies notes Formspree
unreachability is "handled gracefully via the `[data-form-error]` UI path").
That is a front-end fallback-UI pattern, not a server-side error-handling
convention, and it gives zero precedent for how the new backend should
handle validation errors, integration failures, or fatal vs. recoverable
errors at its own API boundaries. Since Construction Phase Guardrails
mandate "error handling at integration boundaries" and "errors surfaced to
the caller or logged — silent failures are not acceptable," this needs to
be an explicit interview topic rather than left silent. Recommend adding to
`discovered-rules.md` § Notes for the interview (or a new `evidence.md` gap
item): *"No error-handling convention exists to inherit for the new
backend — the interview should confirm the team's preferred pattern (e.g.
typed error classes vs. result/either objects, structured logging format,
how 4xx validation errors vs. 5xx integration failures are distinguished at
the API boundary) before Code Generation begins."*

**3. File organization for the backend — draft correctly defers the
language/stack choice but should still flag the organizational question.**
`team-practices.md` § Code Style correctly notes the frontend's
`src/components|data|layouts|pages` structure "says nothing about what
language/framework the new backend will use." Agreed — but file
*organization* (e.g. feature-based vs. layer-based directory structure, where
a new backend package would live relative to the existing single-npm-package
frontend — sibling directory, monorepo workspace, or separate repo) is a
distinct question from language/framework choice and is squarely in scope
for practices-discovery even before domain-design picks the stack. Recommend
adding this as an explicit interview question: *"Should the new backend live
in this repo (e.g. `server/` sibling to `src/`, or converted to an npm
workspace) or a separate repository, and should it follow a feature-based or
layer-based internal directory structure?"*

**4. Naming — one useful precedent the draft doesn't carry forward.** The
draft's naming section (frontend: `PascalCase.astro`, `lowercase-kebab.astro`,
`camelCase.ts`) is accurate per `code-structure.md` § Naming Conventions, but
it treats this purely as frontend-only evidence. The `camelCase.ts` for
config/data files (`site.config.ts`, `experiences.ts`) is a TypeScript-idiom
precedent that *would* naturally extend to a Node/TypeScript backend if that
stack is chosen (e.g. `userService.ts`, `authMiddleware.ts`), independent of
the org default's "language idiomatic" fallback. Worth noting in
`team-practices.md` as a soft signal for the interview rather than omitting
it: *"If the backend is TypeScript/Node, the existing `camelCase.ts` file
naming and `PascalCase` for component/class-like constructs is a natural
continuation of current practice."*

**5. Code style — agree with the linter/formatter gap and recommendation;
one addition.** The draft's recommendation to adopt ESLint + Prettier for a
Node/TS backend is sound and consistent with the org default. Recommend the
interview also confirm whether lint rules should *encode* the layer-boundary
and naming answers above once decided (e.g. `eslint-plugin-boundaries` or
import-restriction rules to enforce that repositories/data-access code never
imports route handlers) — turning an architectural convention into an
enforced one rather than a manually-reviewed one, consistent with the org
note that "the agent's suggestion only fires if the linter doesn't already
cover it."

None of the above contradicts anything asserted in the draft — it is thin
evidence made explicit into interview questions, in the same spirit the lead
already applied to Testing Posture and Deployment.

## Positions

- AGREE: The draft's characterization of frontend naming conventions
  (`PascalCase.astro`, `lowercase-kebab.astro`, `camelCase.ts`) accurately
  reflects `code-structure.md` and correctly labels them manual-only
  (no enforcement).
- AGREE: Deferring the backend's language/framework choice to
  domain-design/infrastructure-design rather than asserting it here is
  correct scoping discipline.
- OBJECT: The draft is silent on layer boundaries and error handling for the
  new backend — my two explicit review-focus areas — even though both are
  Construction Phase Guardrail concerns ("error handling at integration
  boundaries," "silent failures are not acceptable") and neither has any
  existing-codebase precedent to point to. Leaving them unaddressed risks
  Code Generation inferring an inconsistent convention per unit rather than
  the team affirming one convention at this stage. Recommend the lead add
  both as explicit `[unconfirmed]` interview questions (see Contribution
  items 1–2) before Step 4.
- OBJECT: File organization for the new backend package (where it lives
  relative to the existing repo, feature- vs. layer-based internal
  structure) is treated as fully out of scope in the draft, but it is
  answerable independently of the stack/language decision and belongs in
  this stage's interview question set (see Contribution item 3).
