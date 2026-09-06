# Technology Stack — guestguideIQ

## Languages

| Language | Usage | Evidence |
|---|---|---|
| TypeScript | `.ts` files, `.astro` frontmatter/script blocks | `tsconfig.json` (`extends: astro/tsconfigs/strict`); not a direct `dependencies`/`devDependencies` entry — pulled in transitively via Astro's toolchain |
| Astro component syntax | `.astro` single-file components (frontmatter + template + scoped styles) | `src/components/`, `src/layouts/`, `src/pages/` |
| CSS | Hand-written custom properties + Astro scoped `<style>` | `src/styles/global.css` |
| JavaScript (vanilla) | One inline `<script>` block (`bindAjaxForms`) | `src/layouts/BaseLayout.astro` |
| YAML | CI workflow definition | `.github/workflows/deploy.yml` |

## Frameworks & Build Tooling

| Name | Version (locked) | Purpose |
|---|---|---|
| astro | `^7.3.1` → locked `7.3.1` | Static-site generator/framework: file-based routing, build pipeline, dev/preview servers |
| @astrojs/sitemap | `^3.7.4` → locked `3.7.4` | Astro integration; generates `sitemap-index.xml` + `sitemap-0.xml` at build time |

No other frameworks or libraries are declared. Specifically absent:

- **No UI framework** — no React/Vue/Svelte/Solid integration installed.
  Components are plain `.astro` files.
- **No CSS framework/preprocessor** — no Tailwind, Sass, or PostCSS config.
- **No state management library.**
- **No HTTP client library** — uses the native `fetch` API.
- **No testing library** (Vitest/Jest/Playwright/Cypress) — none installed.
- **No linting/formatting tool** (ESLint/Prettier/Biome) — none installed as
  a dependency.

## Runtime / Platform

- **Node.js**: `>=22.12.0` pinned in `package.json` `engines`.
- **Package manager**: npm (lockfile v3, `package-lock.json`).
- **No server runtime** — the site is built to static files and served by
  GitHub Pages; there is no Node/Express/Deno/Bun server process at runtime.

## External Services (not npm packages)

| Service | Role | Config location |
|---|---|---|
| Formspree | Form-submission backend (3 forms) | `src/site.config.ts` `FORMS` |
| Google Fonts CDN | Web font delivery (Fraunces, Work Sans, IBM Plex Mono) | `<link>` in `BaseLayout.astro` |
| GitHub Pages | Static hosting/CDN | `public/CNAME`, `.github/workflows/deploy.yml` |
| GitHub Actions | CI/CD runner | `.github/workflows/deploy.yml` |
| Plausible / GA4 | Analytics (configured but currently inactive — both IDs `null`) | `src/site.config.ts` `ANALYTICS` |

## Build Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `astro dev` | Local dev server |
| `build` | `astro build` | Produces `./dist` (directory-format clean URLs) |
| `preview` | `astro preview` | Serves the built `./dist` locally |
| `astro` | passthrough | Direct Astro CLI access (e.g. `astro check`) |

## Version Currency Note

All framework versions above are pinned exactly in `package-lock.json`
(`astro@7.3.1`, `@astrojs/sitemap@3.7.4`) rather than resolved from the
caret ranges in `package.json` — recorded here as the versions actually
installed/built against at scan time, per `package-lock.json` dependency
resolution.
