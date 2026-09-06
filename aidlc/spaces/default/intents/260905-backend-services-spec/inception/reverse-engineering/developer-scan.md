## Developer Code Scan Results

Conversation language: English.

### Scan Coverage
- **Analyzed deeply**:
  - `package.json`
  - `package-lock.json` (dependency resolution/versions only)
  - `astro.config.mjs`
  - `tsconfig.json`
  - `README.md`
  - `docs/SPEC.md`
  - `.gitignore`
  - `.github/workflows/deploy.yml`
  - `src/site.config.ts`
  - `src/layouts/BaseLayout.astro`
  - `src/components/Header.astro`
  - `src/components/Footer.astro`
  - `src/components/ExperienceCard.astro`
  - `src/components/WaitlistForm.astro`
  - `src/components/PartnerForm.astro`
  - `src/components/InvestorForm.astro`
  - `src/data/experiences.ts`
  - `src/pages/index.astro`
  - `src/pages/about.astro`
  - `src/pages/contact.astro`
  - `src/pages/experiences.astro`
  - `src/pages/how-it-works.astro`
  - `src/pages/partners.astro`
  - `src/pages/thank-you.astro`
  - `src/pages/404.astro`
  - `src/styles/global.css`
  - `public/CNAME`, `public/robots.txt`, `public/favicon.svg` (existence/content)
  - `dist/robots.txt`, `dist/sitemap-index.xml` (build-output spot check, confirms build is current and matches source)

- **Skimmed only**:
  - `.astro/` (Astro's generated type/dev cache — build artifact, not source)
  - `dist/` (full built HTML output beyond the two files spot-checked — it is a deterministic build of `src/`, not independently authored)
  - `.claude/` (AI-DLC framework tooling itself — agents, skills, hooks, tools, knowledge, sensors, scopes; not part of the GuestGuideIQ application surface, so not classified as application "packages/modules")
  - `.mcp.json` (MCP server declarations for the AI-DLC framework session — tooling config, not application code)
  - `node_modules/` (third-party dependency internals — not scanned; versions taken from `package-lock.json` pins instead)

Full-repo enumeration was performed (directory listing across the entire repo excluding `.git`, `node_modules`, and the `aidlc/` workspace tree) to confirm no other source surface exists — this is a small, fully static six-page Astro site with no server, no database, and no existing backend of any kind.

### Packages Found
- **guestguideiq** — application (single package, no monorepo/workspaces) — TypeScript/Astro — marketing website for GuestGuideIQ, a pre-launch hyperlocal-travel-experiences product; explains the vision and captures leads from travelers, STR (short-term-rental) operators, experience providers, and investors/press ahead of the future SaaS product (see `docs/SPEC.md`).

There is exactly one package. No workspaces, no `packages/` or `apps/` split, no server package, no shared library package.

### Build System
- **Type**: npm (via `astro` CLI); Node.js `>=22.12.0` pinned in `package.json` `engines`
- **Config Files**: `package.json`, `package-lock.json` (npm lockfile v3), `astro.config.mjs`, `tsconfig.json` (`extends: "astro/tsconfigs/strict"`)
- **Scripts**: `dev` → `astro dev`; `build` → `astro build` (outputs to `./dist`); `preview` → `astro preview`; `astro` → passthrough to the Astro CLI
- **Build Dependencies**: single-package build — `astro` (core static-site generator/bundler) → `@astrojs/sitemap` (integration, generates `sitemap-index.xml`/`sitemap-0.xml` at build time from `astro.config.mjs`'s `site` URL). No inter-package or inter-service build graph exists.
- Astro build config: `outDir: './dist'`, `build.format: 'directory'` (clean URLs, e.g. `/about/index.html` served at `/about/`), `site: 'https://guestguideiq.com'` (drives canonical URLs, sitemap, Open Graph tags).

### APIs Discovered
This is a static site with **no backend or first-party API of its own**. All "API" surface is outbound calls to third-party services, which is the primary integration-point finding this scan was asked to surface for the new-backend spec:

- **Formspree (form submission backend)** — `src/site.config.ts` `FORMS` object — 3 endpoints, each a distinct Formspree form ID:
  - `waitlist`: `https://formspree.io/f/xbgjkwkp` — used by `WaitlistForm.astro` (rendered on Home `#waitlist`, How It Works, Sample Experiences, and Contact pages)
  - `partner`: `https://formspree.io/f/xjyvolol` — used by `PartnerForm.astro` (rendered standalone on the Partners page `#apply`)
  - `investor`: `https://formspree.io/f/maeybvbz` — used by `InvestorForm.astro` (rendered on the Contact page)
  - All three are real, live Formspree form IDs already wired in (not placeholders — contrary to what `README.md` currently says; see Technical Debt Signals below).
  - Submission mechanism: client-side `fetch(form.action, {method: 'POST', body: new FormData(form), headers: {Accept: 'application/json'}})` in `BaseLayout.astro`'s inline `<script>` (`bindAjaxForms()`), intercepting every `form[data-ajax-form]` on `submit`. On success it navigates to `form.dataset.successUrl` (defaults to `/thank-you/`); on failure it un-hides a `[data-form-error]` element and re-enables the submit button. Each form also carries `_subject` (custom email subject) and `_next` (fully-qualified `/thank-you/` URL, Formspree's no-JS fallback redirect) hidden fields.
  - Field contracts observed (this is the closest thing to an existing "API contract" a new backend would need to replace or formalize):
    - **Waitlist**: `email` (required, type=email) — single-field capture.
    - **Partner**: `name` (required), `company`, `role`, `organization_type` (required, enum: `str-operator` | `experience-provider` | `dmo` | `other`), `email` (required), `message`.
    - **Investor**: `name` (required), `organization`, `email` (required), `message`.
  - No authentication, no rate limiting, no server-side validation of any kind — client HTML5 `required`/`type=email` validation only (`form.reportValidity()`), and Formspree's own anti-spam/validation on their side.
  - No response schema is consumed beyond `response.ok` — the site does not parse or display Formspree's JSON response body.

- **Google Fonts CDN** — `src/layouts/BaseLayout.astro` — a single `<link rel="stylesheet">` to `fonts.googleapis.com` loading Fraunces, Work Sans, and IBM Plex Mono. Render-blocking, no `preconnect`/`font-display` hints beyond the URL's own `display=swap` param.

- **Analytics (Plausible / GA4)** — `src/layouts/BaseLayout.astro`, gated by `ANALYTICS.plausibleDomain` / `ANALYTICS.ga4MeasurementId` in `src/site.config.ts`. **Both are currently `null`** — no analytics script is actually emitted on the live site today, despite `docs/SPEC.md` §9 calling for GA4 or Plausible with form-submission conversion tracking. This is a real gap between spec and shipped state (see Technical Debt Signals).

- **GitHub Pages** — the hosting/deploy target itself, not an API the app calls, but an external integration point: `public/CNAME` → `guestguideiq.com`; `astro.config.mjs` `site` matches; DNS/HTTPS setup is manual per `README.md`.

No REST, GraphQL, gRPC, or WebSocket endpoints are defined or consumed anywhere else in the repo. No database, no ORM, no server runtime (Express/FastAPI/etc.), no serverless functions, no CDK/IaC for the site itself.

### Frameworks & Libraries
- **astro** — `^7.3.1` (locked `7.3.1`) — static-site generator/framework; source of the `.astro` component format, file-based routing (`src/pages/`), build pipeline, and dev/preview servers.
- **@astrojs/sitemap** — `^3.7.4` (locked `3.7.4`) — Astro integration, generates `sitemap-index.xml` + `sitemap-0.xml` at build time.
- **TypeScript** — not a direct `dependencies`/`devDependencies` entry; pulled in transitively via Astro's toolchain and configured through `tsconfig.json` (`extends: "astro/tsconfigs/strict"`). Used for `.ts` files (`site.config.ts`, `data/experiences.ts`) and the frontmatter/script blocks of `.astro` files.
- No UI framework (no React/Vue/Svelte/Solid integration installed) — components are plain `.astro` single-file components (frontmatter + template + scoped `<style>`), plus one inline vanilla-JS `<script>` block in `BaseLayout.astro` for AJAX form submission.
- No CSS framework/preprocessor (no Tailwind, Sass, PostCSS config) — hand-written CSS custom properties in `src/styles/global.css` plus Astro's native scoped `<style>` blocks per component.
- No state management, no HTTP client library (uses the native `fetch`), no testing library, no linting/formatting tool is installed as a dependency.
- External fonts (not npm packages): Google Fonts — Fraunces, Work Sans, IBM Plex Mono — loaded via CDN `<link>`, not self-hosted or bundled.

### Test Coverage
- **Test Directories**: none found anywhere in the repo (`src/`, root, or elsewhere).
- **Test Frameworks**: none installed — no Vitest, Jest, Playwright, Cypress, or any `*.test.*`/`*.spec.*` file exists.
- **Coverage Config**: absent — no coverage tooling, no CI test step (the only CI job is build + deploy; see below).

### Code Quality Indicators
- **Linting**: none configured — no `.eslintrc*`, no `.prettierrc*`, no `biome.json`, no lint step in CI. The only static check exercised anywhere is Astro's own TypeScript-strict compilation (`astro/tsconfigs/strict` via `tsconfig.json`), which runs implicitly during `astro build`/`astro check` but is not invoked as an explicit CI gate.
- **CI/CD**: one GitHub Actions workflow, `.github/workflows/deploy.yml` — triggers on push to `main` (or manual `workflow_dispatch`); `build` job does `actions/checkout` → `actions/setup-node@v4` (Node 22, npm cache) → `npm ci` → `npm run build` → `actions/configure-pages` → `actions/upload-pages-artifact` (uploads `./dist`); `deploy` job (needs `build`) runs `actions/deploy-pages@v4` against the `github-pages` environment. No test/lint step, no PR-triggered workflow (build only fires on `main` push or manual dispatch) — there is no CI feedback on pull requests before merge.
- **Documentation**: strong for a project this size — `README.md` gives an accurate quick-start, project structure map, and a numbered pre-launch checklist (forms, contact email, domain, analytics, social image, content review); `docs/SPEC.md` is a thorough, dated (2026-09-04) product/site specification covering vision, audiences, business model, sitemap, page-by-page copy requirements, design direction, forms/analytics/SEO, technical architecture, timeline, success metrics, and open items. Inline code comments are sparse but purposeful, concentrated at exactly the places a future maintainer would need them (e.g., the Formspree `_next` fully-qualified-URL requirement is explained identically in three form components; the AJAX-vs-native-redirect rationale is explained in `BaseLayout.astro`).
- Git history (from repo status) shows 4 commits total: scaffold → CI/domain fix → wire real Formspree endpoints → install AI-DLC. Small, linear, single-author history consistent with a pre-launch project.

### Technical Debt Signals
- **README/config drift on Formspree endpoints**: `README.md` "Before this goes live" §1 tells the reader to "Copy each form's endpoint into `src/site.config.ts`... Until you do this, submissions will hit a placeholder URL," but `src/site.config.ts` already contains three real-looking Formspree form IDs (git log confirms a dedicated commit "Wire real Formspree endpoints and submit forms via AJAX"). The README's own checklist item is now stale/misleading — a maintainer following it verbatim would think the forms are still unwired when they are not. Location: `README.md` lines 33-45 vs `src/site.config.ts` lines 20-24.
- **Analytics gap vs spec**: `docs/SPEC.md` §9 requires GA4 or Plausible with conversion tracking on form submissions; `src/site.config.ts` ships both `ANALYTICS.plausibleDomain` and `ANALYTICS.ga4MeasurementId` as `null`, so no analytics currently fires on the live site. This is an explicitly flagged open item (`README.md` §4, `docs/SPEC.md` §13) rather than a silent bug, but it means there is currently **no telemetry at all** on waitlist/partner/investor conversions — a new backend replacing Formspree would need to decide whether it owns this tracking gap or leaves it to a client-side script.
- **No server-side form validation**: all three forms rely entirely on HTML5 client validation (`required`, `type="email"`) plus whatever Formspree does on receipt. Nothing in this repo enforces business rules (e.g., a valid `organization_type` enum value, message length limits, duplicate-submission handling) — a new backend replacing this integration point starts from zero validation and would need to design it from scratch, not port anything forward.
- **No test suite of any kind** — for a codebase this size the near-term risk is low, but it means there is no regression safety net at all; any new backend work that touches shared conventions (e.g., `site.config.ts` shape) has nothing to run to confirm the marketing site still functions.
- **No lint/format enforcement in CI** — style consistency currently depends entirely on manual review; nothing blocks a PR from introducing inconsistent formatting or obvious errors before merge.
- **CI never runs on pull requests** — `deploy.yml` only triggers on push to `main` (or manual dispatch), so there is no automated build check gating a PR before merge; a broken build is only caught after landing on `main` (though deploy would then also fail, so production itself is not silently broken).
- **Social preview image incomplete**: `BaseLayout.astro` line 34-35 references `/og-image.jpg` but the `og:image` meta tag is commented out pending a real asset — noted openly in code and `README.md` §5, low severity, purely cosmetic (social share previews).
- **No secrets/credentials in the repo** (positive finding, not debt): the three Formspree endpoints are public-by-design form-submission URLs (Formspree's model exposes the endpoint client-side; the security boundary is server-side on Formspree's end, not a leaked secret). No API keys, tokens, or credentials of any kind appear anywhere in the scanned source.
- **Domain/business-model TODOs are tracked, not hidden**: `astro.config.mjs`, `src/site.config.ts` both carry explicit `// TODO` comments for domain confirmation and contact-email finalization, cross-referenced to `docs/SPEC.md` §13 — good practice, but worth carrying forward as open items into the new backend's scope discussion since a domain change affects canonical URLs, sitemap, and Open Graph tags across the whole site (`SITE.url` is the single source of truth already, which is a well-factored mitigation).

## Handoff Summary
- **Intent-relevant finding**: The current site has zero backend surface of its own — it is a fully static Astro build with exactly three outbound integration points that a new backend layer would plausibly need to formalize or replace: the three Formspree form endpoints in `src/site.config.ts` (`FORMS.waitlist`, `FORMS.partner`, `FORMS.investor`), each with its own field contract (documented above under "APIs Discovered"), submitted client-side via `fetch()` in `src/layouts/BaseLayout.astro`'s `bindAjaxForms()`. Any new backend service that replaces Formspree needs to either (a) accept the same three field shapes so the existing form markup keeps working unmodified, or (b) coordinate a form-markup change alongside the backend cutover. `src/site.config.ts` is already the single place all environment-specific values (site URL, contact email, form endpoints, analytics IDs) are centralized — a natural seam for introducing a backend base URL or API client config without touching page/component code.
- **Risks / follow-up**:
  1. Analytics is currently not wired at all (both `plausibleDomain` and `ga4MeasurementId` are `null`) — if the new backend is expected to also handle conversion tracking/telemetry for waitlist/partner/investor submissions, that requirement should be captured explicitly in the backend spec rather than assumed to already exist client-side.
  2. There is no server-side validation anywhere today — a new backend inherits a green field for input validation, spam prevention, and business-rule enforcement (e.g. the `organization_type` enum) with nothing to preserve from the current implementation except the field names/shapes travelers, partners, and investors already see in the deployed forms.
  3. `README.md`'s Formspree section is stale (see Technical Debt Signals) — worth a small doc fix independent of this intent, flagged here so it isn't mistaken for a currently-open blocker during backend scoping.
  4. No test suite and no CI test/lint gate exist — if backend work introduces any shared frontend changes (e.g., swapping form `action` URLs), there is no automated check to catch a regression before it reaches `main`/production.
