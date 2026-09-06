# Code Quality Assessment — guestguideIQ

## Test Coverage

- **Test directories**: none found anywhere in the repo.
- **Test frameworks**: none installed — no Vitest, Jest, Playwright,
  Cypress, or any `*.test.*`/`*.spec.*` file exists.
- **Coverage config/tooling**: absent.
- **Assessment**: for a codebase this size (six static pages, no business
  logic) the near-term risk from having zero tests is low, but it means there
  is **no regression safety net at all**. Any change that touches a shared
  convention — e.g. the `site.config.ts` shape, or the `data-ajax-form`
  contract in `BaseLayout.astro` — has nothing automated to confirm the
  marketing site still functions before or after a new backend is introduced.

## Linting / Formatting

- **Linting**: none configured — no `.eslintrc*`, no `biome.json`.
- **Formatting**: none configured — no `.prettierrc*`.
- **The only static check exercised anywhere** is Astro's own
  TypeScript-strict compilation (`astro/tsconfigs/strict` via
  `tsconfig.json`), which runs implicitly during `astro build`/`astro check`
  but is **not invoked as an explicit CI gate** — a build could still succeed
  with type errors surfaced only as warnings, since the CI workflow's `build`
  step is `npm run build` (`astro build`), not `astro check`.
- **Assessment**: style consistency currently depends entirely on manual
  review; nothing blocks a PR from introducing inconsistent formatting.

## CI/CD

- **Pipeline**: one GitHub Actions workflow, `.github/workflows/deploy.yml`.
  - Trigger: push to `main`, or manual `workflow_dispatch`.
  - `build` job: `actions/checkout` → `actions/setup-node@v4` (Node 22, npm
    cache) → `npm ci` → `npm run build` → `actions/configure-pages` →
    `actions/upload-pages-artifact` (uploads `./dist`).
  - `deploy` job (needs `build`): `actions/deploy-pages@v4` against the
    `github-pages` environment.
- **Gaps**:
  - **No test/lint step** in the pipeline.
  - **No PR-triggered workflow** — the workflow only fires on `main` push or
    manual dispatch, so there is **no automated build check gating a pull
    request before merge**. A broken build is only caught after landing on
    `main` (though the subsequent deploy would then also fail, so production
    itself is not silently left broken by a build failure — it simply fails
    to update).
- **Assessment**: adequate for a solo/small-team pre-launch site, but a real
  gap once a backend service (with its own test suite) is introduced —
  recommend adding a PR-triggered CI workflow (build, and eventually backend
  tests) as part of this intent's scope discussion rather than treating it as
  separately deferred.

## Documentation Quality

- **Strong for a project this size.**
  - `README.md` gives an accurate quick-start, a project structure map, and a
    numbered pre-launch checklist (forms, contact email, domain, analytics,
    social image, content review).
  - `docs/SPEC.md` is a thorough, dated (2026-09-04) product/site
    specification covering vision, audiences, business model, sitemap,
    page-by-page copy requirements, design direction, forms/analytics/SEO,
    technical architecture, timeline, success metrics, and open items — the
    authoritative source for business intent behind this reverse-engineering
    pass.
  - Inline code comments are sparse but purposeful, concentrated exactly
    where a future maintainer would need them (e.g. the Formspree `_next`
    fully-qualified-URL requirement is explained identically in all three
    form components; the AJAX-vs-native-redirect rationale is explained in
    `BaseLayout.astro`).
- **Git history**: 4 commits total (scaffold → CI/domain fix → wire real
  Formspree endpoints → install AI-DLC framework tooling). Small, linear,
  single-author history consistent with a pre-launch project — no branching
  complexity or merge-conflict debt to account for.

## Technical Debt Signals

1. **README/config drift on Formspree endpoints** (Medium — misleading, not
   broken). `README.md` "Before this goes live" §1 (lines ~33-45) tells the
   reader to "Copy each form's endpoint into `src/site.config.ts` ... Until
   you do this, submissions will hit a placeholder URL," but
   `src/site.config.ts` (lines ~20-24) already contains three real Formspree
   form IDs — confirmed by a dedicated commit, "Wire real Formspree endpoints
   and submit forms via AJAX." A maintainer following the README verbatim
   would wrongly believe the forms are still unwired. Recommend a small,
   independent doc fix (not a blocker for this intent).
2. **Analytics gap vs. spec** (Medium — explicitly tracked, not silent).
   `docs/SPEC.md` §9 requires GA4 or Plausible with conversion tracking on
   form submissions; `site.config.ts`'s `ANALYTICS.plausibleDomain` and
   `ANALYTICS.ga4MeasurementId` both ship `null`, so **no telemetry
   currently fires** on waitlist/partner/investor submissions. Flagged
   openly in `README.md` §4 and `docs/SPEC.md` §13. A new backend replacing
   Formspree needs to explicitly decide whether it owns this tracking gap or
   leaves it to a client-side script — currently unowned by anything.
3. **No server-side form validation** (High relevance to this intent, not a
   defect in the current system). All three forms rely entirely on HTML5
   client validation plus whatever Formspree does on receipt; nothing
   enforces business rules (e.g. a valid `organization_type` enum value,
   message length limits, duplicate-submission handling). A new backend
   starts from zero validation here and must design it from scratch — there
   is nothing existing to port forward except field names/shapes.
4. **No test suite of any kind** (see Test Coverage above) — no regression
   safety net for any change, including a backend cutover that touches
   shared conventions.
5. **No lint/format enforcement in CI** (see Linting section above).
6. **CI never runs on pull requests** (see CI/CD section above).
7. **Social preview image incomplete** (Low — cosmetic only).
   `BaseLayout.astro` (lines ~34-35) references `/og-image.jpg`, but the
   `og:image` meta tag is commented out pending a real asset — openly noted
   in code and `README.md` §5. Affects social-share previews only.
8. **Domain/business-model TODOs are tracked, not hidden** (Low — positive
   process signal). `astro.config.mjs` and `src/site.config.ts` both carry
   explicit `// TODO` comments for domain confirmation and contact-email
   finalization, cross-referenced to `docs/SPEC.md` §13. Worth carrying
   forward into the new backend's scope discussion since a domain change
   would affect canonical URLs, sitemap, and Open Graph tags site-wide —
   mitigated already by `SITE.url` being the single source of truth.

## Positive Findings

- **No secrets/credentials in the repo.** The three Formspree endpoints are
  public-by-design form-submission URLs (Formspree's security boundary is
  server-side on their end, not a client-exposed secret). No API keys,
  tokens, or credentials of any kind appear anywhere in the scanned source.
- **Centralized configuration** (`site.config.ts`) is a well-factored
  mitigation against the domain/email TODOs above, and a ready seam for a new
  backend's configuration needs.

## Overall Assessment

For a six-page pre-launch marketing site with no backend, the current
engineering quality is appropriate to its stage: functional, honestly
documented (including its own gaps), and free of security-sensitive
mistakes. The absence of tests, linting, and PR-gated CI are real gaps that
should be weighed when scoping the new backend — introducing a service with
persistent data and business logic into a repo that currently has *zero*
automated verification is the single biggest process risk this
reverse-engineering pass surfaces for the next stage of work.
