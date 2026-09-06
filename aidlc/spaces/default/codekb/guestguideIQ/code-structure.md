# Code Structure — guestguideIQ

## Package/Module Organization

Single npm package, no monorepo/workspaces. Top-level layout:

```
guestguideIQ/
├── src/
│   ├── components/       # reusable .astro UI components (Site Shell, Lead Capture Forms, Experience Content)
│   ├── data/              # static content data (experiences.ts)
│   ├── layouts/           # BaseLayout.astro — shared page shell
│   ├── pages/              # file-based routes (one .astro file per URL)
│   ├── site.config.ts      # Site Configuration component (single config source)
│   └── styles/             # global.css
├── public/                 # static assets served as-is (CNAME, robots.txt, favicon.svg)
├── docs/
│   └── SPEC.md              # product/site specification (source of business intent)
├── .github/workflows/
│   └── deploy.yml            # CI/CD pipeline
├── dist/                     # build output (generated, not source)
├── .astro/                   # Astro type/dev cache (generated, not source)
├── astro.config.mjs
├── tsconfig.json
├── package.json / package-lock.json
└── README.md
```

## File Classification

| Path | Classification | Notes |
|---|---|---|
| `src/pages/*.astro` (8 files) | Route / Page Routes component | File-based routing; each maps 1:1 to a URL |
| `src/layouts/BaseLayout.astro` | Layout / Site Shell component | Wraps every page; owns `bindAjaxForms()` |
| `src/components/Header.astro`, `Footer.astro` | UI / Site Shell component | Global chrome |
| `src/components/WaitlistForm.astro`, `PartnerForm.astro`, `InvestorForm.astro` | UI / Lead Capture Forms component | Form markup + field contracts |
| `src/components/ExperienceCard.astro` | UI / Experience Content component | Presentation for one experience item |
| `src/data/experiences.ts` | Data / Experience Content component | Static array, no fetch/API |
| `src/site.config.ts` | Config / Site Configuration component | `SITE`, `FORMS`, `ANALYTICS` objects — single source of environment values |
| `src/styles/global.css` | Style / Site Shell component | CSS custom properties, no preprocessor |
| `astro.config.mjs` | Build config / Build & Deployment Pipeline | `outDir`, `build.format`, `site`, `@astrojs/sitemap` integration |
| `tsconfig.json` | Build config | `extends: astro/tsconfigs/strict` |
| `.github/workflows/deploy.yml` | CI/CD / Build & Deployment Pipeline | build + deploy jobs |
| `public/CNAME`, `robots.txt`, `favicon.svg` | Static asset | Served as-is, no processing |
| `docs/SPEC.md`, `README.md` | Documentation | Not application code, but authoritative for business intent/checklist |
| `dist/`, `.astro/` | Generated / build artifact | Not source, excluded from architectural analysis |

## Code Patterns Observed

- **Astro single-file components**: every UI file uses the `.astro` format —
  a frontmatter script block (data/props), an HTML-like template, and an
  optional scoped `<style>` block. No `.jsx`/`.tsx`/`.vue`/`.svelte` files
  exist — no UI framework is installed.
- **Progressive enhancement via data attributes**: forms opt into AJAX
  behavior with `data-ajax-form`, and configure success redirect via
  `data-success-url` — a declarative convention read generically by
  `bindAjaxForms()` in `BaseLayout.astro`, rather than each form wiring its
  own submit handler. This is the one piece of "shared behavior" logic in the
  codebase and the only inline `<script>` block found.
- **Centralized configuration object**: `site.config.ts` exports plain typed
  constants (`SITE`, `FORMS`, `ANALYTICS`) that every consumer imports by
  name — no environment-variable indirection, no `.env` file, no runtime
  config loading (values are inlined at Astro build time).
- **No dynamic routing / no content collections**: all 8 pages are literal
  files; Astro's Content Collections API is not used even though
  `experiences.ts` is exactly the kind of structured content it is designed
  for — a plain TypeScript array is used instead (small enough not to need
  the abstraction, but worth noting as a straightforward path to formalize
  content operationally if a backend swap includes CMS-style ownership of the
  experience catalog).
- **No component props typing beyond Astro's own inference**: components
  receive frontmatter-typed props idiomatically, consistent with
  `tsconfig.json`'s `astro/tsconfigs/strict` extension, but there are no
  standalone shared TypeScript interface/type files (e.g. no `src/types/`
  directory).

## Naming Conventions

- Astro components: `PascalCase.astro` (e.g. `WaitlistForm.astro`).
- Pages: `lowercase-kebab.astro` matching their URL slug (e.g.
  `how-it-works.astro`).
- Config/data: `camelCase.ts` (`site.config.ts`, `experiences.ts`).
- No project-wide lint/format tool enforces these conventions (see
  `code-quality-assessment.md`) — they are consistent by convention/manual
  review only.
