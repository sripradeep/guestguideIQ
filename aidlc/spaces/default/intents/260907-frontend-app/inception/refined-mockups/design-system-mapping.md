# Design System Mapping — GuestGuideIQ Frontend

## What exists to map onto

Nothing. There is no component library, no design system and no shared token set
anywhere in the workspace. The marketing site is plain Astro components with
loose CSS custom properties and no linter or formatter configuration; the backend
has no UI at all. **Every component in `interaction-spec.md` is new.**

The product's visual language is a distinct, functional SaaS style — deliberately
not the marketing site's warm/earthy brand. That brand serves a persuasive
purpose for pre-launch visitors; this product serves working sessions (managing a
property, navigating an unfamiliar town) where clarity and speed matter more than
warmth.

**The frontend framework, language and hosting target are not chosen** (OQ4,
deferred to `domain-design`/`infrastructure-design`), so nothing here names one.
The tokens and structural rules below are framework-neutral by necessity, and
that is a feature: they must survive whatever is picked.

## Design tokens (placeholder values — finalised at `domain-design`)

| Category | Values |
|---|---|
| Spacing scale | 4, 8, 16, 24, 32, 48px |
| Colour — primary action | One default accent, distinct from the marketing palette, meeting 4.5:1 against both light and dark surfaces. **This is what ships** — it is the fallback whenever no locality brand resolves, which today is always |
| Colour — locality accent | Per-locality override of the primary accent and the header/accent-bar background. Each value must independently meet the same contrast floor (NFR3) |
| Colour — status | Success, Error, Warning — each paired with an icon, never colour-only. **Never locality-overridable** |
| Typography | One clean sans-serif family, 2–3 weights. **Not locality-overridable** — branding is scoped to colour, logo and name |
| Touch targets | 44×44px minimum; 48×48px for primary actions on mobile |
| Breakpoints | mobile 320–767, tablet 768–1023, desktop 1024–1439, large 1440+ |

Exact values and their measured contrast ratios are deferred to
`domain-design`/`functional-design`. What is fixed here is the **shape** of the
token set — in particular that status colours and typography are outside the
locality-overridable surface, which bounds how much a brand can break.

## Component inventory

| Component | Used by | New / carried |
|---|---|---|
| TextInput | PO-1, PO-2, PO-9 | Carried |
| DateRangeField | PO-7 | **New** |
| CopyableLink | PO-7 | **New** |
| SectionEditor | PO-5 | **New** |
| GuestPreview | PO-5 | **New** |
| Wizard | PO-3 | Carried, corrected (forward-only) |
| PlanControls | PO-4 | **New** |
| SessionExpiredDialog | Every authenticated screen | **New** |
| FavoriteToggle | PO-6 | Carried |
| ChatWidget | G-2, G-3 | Carried, untrusted-render rule added |
| TabNav | G-2 | Carried |
| SideNav | PO-4, PO-5, PO-6, PO-7, PO-8 | Carried, Admin variant removed |
| StatusBanner | PO-1, PO-4, PO-9, G-1, guest surface | Carried, variants changed |
| BrandTheme | PO-1, PO-3, PO-9, dashboard shell, G-2 | Carried, `unavailable` state added |
| ~~FileUpload~~ | — | **Removed** — PDF import deferred (AC1.6.2) |
| ~~LocalityBrandForm~~ | — | **Removed** — its screen is out of scope |

## Structural rules the stack choice must not break

These come from the team's affirmed practices and from what the deployed API
actually does. They are recorded here because they constrain the framework
choice at `domain-design`, and discovering them afterwards would be expensive.

- **Exactly one API-client module owns every backend request.** No component,
  page, route or view calls the network directly. Imports flow downward only:
  UI → view state → API client → transport.
- **Token handling lives inside that same module.** No component, route guard or
  page reads the token store; they consume a resolved session object. This is
  what keeps the token-storage decision (OQ3) genuinely deferrable — if a
  same-origin proxy is chosen later, that is a change in one module rather than a
  rewrite.
- **Concurrent `401`s collapse into one in-flight refresh** (AC1.10.4), with all
  other waiters retrying against its result. The backend's refresh-token store is
  per-process while production runs 2–6 tasks, so parallel refreshes race.
- **Exactly one module parses the error envelope**, keyed on `error.code`, into a
  discriminated union — with a defined fallback for a response that is not
  envelope-shaped at all, and a defined default for an unrecognised future code.
  Nothing above it reads a raw HTTP status.
- **`visualStyling` is parsed into typed tokens with defaults by one module**
  before any component reads it. It is unschematised and attacker-influenceable.
- **No untrusted server content reaches a raw-HTML sink** — chat replies and
  `visualStyling` both qualify. A blocking lint rule bans raw-HTML injection
  APIs; any exception requires a named sanitizer.
- **`PATCH /v1/subscriptions`' action is a typed union at the client boundary,
  never a bare string**, and every request carries a body. The endpoint's final
  `else` cancels on anything unrecognised.
- **Refetch-on-focus and prefetch are disabled** as configuration of the API
  client (AC1.7.5), not as per-component discipline.

## Responsive strategy

- **Guest surfaces (G-1, G-2, G-3): mobile-first.** Sam is on a phone,
  near-universally, often on hotel wifi or roaming, frequently opening the link
  standing at a front door. Desktop is a graceful enhancement, not the target.
- **Owner surfaces (PO-*): desktop-first**, with a genuinely usable mobile
  experience rather than a token one — Priya is desktop-primary but explicitly
  not desktop-only, and onboarding in particular gets interrupted by the rest of
  running a property.

## Naming

A file is named after what it exports — `PascalCase` when the primary export is a
component or class, `camelCase` otherwise. Multi-word directories use kebab-case
consistently. Both are affirmed team practice; the second exists because the
backend's own two unseparated compound names (`guestaccess`, `chatmodule`) are a
self-flagged wart not worth inheriting at greater volume.

## Coverage boundary (carried to `domain-design`)

The 80% line-coverage floor needs a declared `include`/`exclude` set to mean
anything, and that declaration is a required `domain-design` deliverable. Line
coverage overstates rigour on component and template code in particular — a
single render assertion executes every line of a template. Generated route files,
design-system primitives, story files and mock-service definitions should be
explicitly excluded rather than silently inflating the number. Enforce the floor
in the test runner's own configuration, not only in CI, so the same gate fires
locally.
