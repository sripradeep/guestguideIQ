# Dependencies — guestguideIQ

## Internal Cross-Package Dependencies

None — this is a single npm package (`guestguideiq`), no workspaces, no
`packages/`/`apps/` split, no server package, no shared library package. All
"internal dependencies" are source-file-level relationships between the six
logical components, fully enumerated in `component-inventory.md`'s Dependency
Summary:

- Page Routes → Site Shell, Lead Capture Forms, Experience Content
- Lead Capture Forms → Site Configuration
- Site Shell → Site Configuration
- Build & Deployment Pipeline → packages/deploys Page Routes (and therefore
  everything it depends on)

`Site Configuration` (`src/site.config.ts`) is the single shared leaf
dependency — three components depend on it, it depends on nothing.

## External (npm) Dependencies

From `package.json` / `package-lock.json`:

| Package | Declared range | Locked version | Type |
|---|---|---|---|
| astro | `^7.3.1` | `7.3.1` | dependency |
| @astrojs/sitemap | `^3.7.4` | `3.7.4` | dependency |

No `devDependencies` beyond what Astro's toolchain pulls in transitively
(TypeScript is not a direct dependency — see `technology-stack.md`). No other
first-party or third-party npm packages are declared.

## External Service Dependencies

These are runtime/operational dependencies, not npm packages:

| Service | Dependency type | Criticality | Notes |
|---|---|---|---|
| Formspree | Hard runtime dependency for all lead capture | High — this is the entire "backend" today | 3 form IDs in `site.config.ts`; if Formspree is unreachable, all three forms fail (handled gracefully via the `[data-form-error]` UI path) |
| GitHub Pages | Hosting dependency | High — site is unreachable without it | `public/CNAME` binds `guestguideiq.com` |
| GitHub Actions | CI/CD dependency | Medium — affects deploy velocity, not live-site availability | Single workflow, `deploy.yml` |
| Google Fonts CDN | Presentation dependency | Low — cosmetic degradation only if unreachable | Render-blocking `<link>`, no self-hosted fallback |
| Plausible / GA4 | Configured but inactive | None currently (both IDs `null`) | No live dependency today; would become one if activated |

## Dependency Risk Notes (for the new backend's scope)

- **Formspree is the single point of failure for 100% of the site's current
  functional behavior.** A new backend that replaces it inherits full
  responsibility for delivery/reliability of lead data with no existing
  fallback beyond the current client-side error UI.
- **No dependency-scanning/audit tooling is configured** — no
  `npm audit` step in CI, no Dependabot/Renovate config found. With only two
  direct dependencies this is low current risk, but worth noting as an
  absence rather than assuming it is covered elsewhere.
- **No lockfile drift risk observed** — `package-lock.json` is committed and
  consistent with `package.json`'s ranges (`astro@7.3.1` satisfies `^7.3.1`;
  `@astrojs/sitemap@3.7.4` satisfies `^3.7.4`).
- **Introducing a backend changes the dependency graph shape**: today, Build
  & Deployment Pipeline → Page Routes is the only "packages" edge; a new
  backend service will add its own dependency subtree (server framework,
  database driver, etc.) that is out of scope for this reverse-engineering
  pass but should be tracked separately once that service is designed.
