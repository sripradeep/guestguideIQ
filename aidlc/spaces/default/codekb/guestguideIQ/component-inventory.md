# Component Inventory — guestguideIQ

Six logical components exist in the current codebase. All are client/build-time
concerns of a single static-site package; there is no server-side component of
any kind today (confirmed by full-repo enumeration in the developer scan).

## Site Shell

- **Responsibility**: Global page chrome shared by every route — HTML document
  head/meta/SEO tags, navigation header, footer, global CSS custom properties,
  and the single client-side script (`bindAjaxForms()`) that intercepts and
  submits every lead-capture form on the site.
- **Files**: `src/layouts/BaseLayout.astro`, `src/components/Header.astro`,
  `src/components/Footer.astro`, `src/styles/global.css`.
- **Depends on**: Site Configuration (reads `SITE`, `ANALYTICS` from
  `site.config.ts`); Google Fonts CDN (external).
- **Depended on by**: Page Routes (every page wraps its content in
  `BaseLayout`).

## Page Routes

- **Responsibility**: File-based route definitions — one `.astro` file per
  URL, each composing Site Shell + page-specific content and, where relevant,
  a Lead Capture Form.
- **Files**: `src/pages/index.astro`, `src/pages/about.astro`,
  `src/pages/contact.astro`, `src/pages/experiences.astro`,
  `src/pages/how-it-works.astro`, `src/pages/partners.astro`,
  `src/pages/thank-you.astro`, `src/pages/404.astro`.
- **Depends on**: Site Shell, Lead Capture Forms (Home/How It
  Works/Experiences/Contact embed `WaitlistForm`; Contact also embeds
  `InvestorForm`; Partners embeds `PartnerForm`), Experience Content
  (`experiences.astro` renders `ExperienceCard` per item from
  `src/data/experiences.ts`).
- **Depended on by**: nothing internal — these are the leaves the build system
  compiles to static HTML.

## Lead Capture Forms

- **Responsibility**: Render the three lead-capture forms and carry their
  field contracts and Formspree submission targets.
- **Files**: `src/components/WaitlistForm.astro`,
  `src/components/PartnerForm.astro`, `src/components/InvestorForm.astro`.
- **Depends on**: Site Configuration (`FORMS.waitlist` / `FORMS.partner` /
  `FORMS.investor` endpoint URLs); Site Shell (submission is actually
  performed by `bindAjaxForms()` in `BaseLayout.astro`, which every form
  markup opts into via the `data-ajax-form` attribute).
- **Depended on by**: Page Routes.
- **Note**: this is the component a new backend most directly replaces or
  fronts — see `api-documentation.md`.

## Experience Content

- **Responsibility**: Static sample-experience catalog data and its card
  presentation.
- **Files**: `src/data/experiences.ts`, `src/components/ExperienceCard.astro`.
- **Depends on**: nothing (self-contained static data).
- **Depended on by**: Page Routes (`experiences.astro`).

## Site Configuration

- **Responsibility**: Single source of truth for every environment-specific
  value — canonical site URL, contact email, the three Formspree form
  endpoints, and analytics IDs (currently both `null`).
- **Files**: `src/site.config.ts`.
- **Depends on**: nothing.
- **Depended on by**: Site Shell, Lead Capture Forms, and (transitively) Page
  Routes. This is explicitly the seam the developer scan identifies as the
  natural place to introduce a backend base URL or API client config without
  touching page/component code.

## Build & Deployment Pipeline

- **Responsibility**: Compiles the Astro source to static HTML/CSS/JS
  (`./dist`), generates the sitemap, and deploys the build to GitHub Pages on
  every push to `main`.
- **Files**: `astro.config.mjs`, `tsconfig.json`, `package.json`,
  `package-lock.json`, `.github/workflows/deploy.yml`, `public/CNAME`.
- **Depends on**: `astro` (build engine), `@astrojs/sitemap` (integration),
  GitHub Actions, GitHub Pages (external hosting).
- **Depended on by**: nothing internal — this is the outermost component that
  packages every other component for delivery.

## Dependency Summary

```
Build & Deployment Pipeline
        (packages)
             |
             v
        Page Routes ---> Experience Content
             |
             +---------> Lead Capture Forms ---> Site Configuration
             |
             +---------> Site Shell -----------> Site Configuration
```

No circular dependencies exist. `Site Configuration` is a shared leaf
dependency of three components, consistent with the developer scan's
observation that it is "already the single place all environment-specific
values ... are centralized."
