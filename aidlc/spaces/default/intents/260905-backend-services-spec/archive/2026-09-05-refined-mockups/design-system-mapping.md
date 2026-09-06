# Design System Mapping — Backend Services for GuestGuideIQ

## Relationship to the Marketing Site's Design

Per Q1, this product UI is a **distinct, functional/SaaS-style design**, not a reuse of the marketing site's warm/earthy brand (`docs/SPEC.md` §7). This is a deliberate choice: the marketing site's brand serves a persuasive, emotional purpose for pre-launch visitors; this product serves working sessions (property management, active travel) where clarity and speed matter more than brand warmth. There is no existing component library or design system in the current codebase to map to (`component-inventory.md` confirms the marketing site has no shared component/token system — it's plain Astro components with CSS custom properties) — this stage establishes the product's design tokens fresh.

## Design Tokens (Placeholder — to be finalized at domain-design/functional-design)

| Token Category | Values |
|---|---|
| Spacing scale | 4px, 8px, 16px, 24px, 32px, 48px (per `wireframing-guide.md` consistency rules) |
| Color — primary action | A single accent color, distinct from the marketing site's earthy palette, meeting 4.5:1 contrast against white/dark backgrounds |
| Color — status | Success (green), Error (red + icon, never color-only per WCAG), Warning (amber + icon) |
| Typography | Clean sans-serif, functional (not the marketing site's warmer pairing) — one family, 2-3 weights |
| Touch targets | Minimum 44×44px (mobile, Guest-facing), 48×48px for primary actions |
| Breakpoints | mobile 320-767px, tablet 768-1023px, desktop 1024-1439px, large desktop 1440px+ |

## Component Inventory (this stage's new components)

| Component | Used By | Reused Across |
|---|---|---|
| TextInput | PO-1, PO-2, AD-1, AD-2 | Every form in the product |
| Wizard | PO-3 | Onboarding only (single multi-step flow in this spec) |
| FileUpload | PO-3 | PDF import only |
| FavoriteToggle | PO-6 | Locality content curation |
| ChatWidget | G-2, G-3 | Guest guide view (persistent) |
| TabNav | G-2 | Guest guide (Overview/POIs/Events) |
| SideNav | PO-4, PO-5, PO-6, AD-1, AD-2 | Every Property Owner and Admin/Ops screen |
| StatusBanner | PO-1, PO-2, PO-4, G-1 | Any error/success feedback |

## Reused vs. New

Since no existing product component library exists (this is a greenfield backend/frontend, distinct from the marketing site's static components), **every component above is new**. `code-structure.md`'s naming precedent (`camelCase.ts`, `PascalCase` component-like constructs) is worth carrying forward if the frontend implementation is TypeScript/Node-based, per `team-practices.md`'s Code Style section — but the actual frontend framework/library choice is deferred to `domain-design`/`infrastructure-design` and isn't decided here.

## Responsive Strategy Summary

- **Guest-facing surfaces** (G-1, G-2, G-3): mobile-first, per Sam's persona (`personas.md` — "Primarily mobile... may have weak/roaming connectivity"). Design for the smallest screen first; desktop is a graceful enhancement, not the primary target.
- **Property Owner / Admin surfaces** (PO-*, AD-*): desktop-first is the primary target (dashboard-style, side navigation), with mobile treated as a secondary, collapsible-nav experience rather than the primary design target — reflecting Priya's "primarily desktop... onboarding not desktop-only" context note.
