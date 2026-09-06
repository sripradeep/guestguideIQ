# API Documentation — guestguideIQ

## Scope Note

This is a **static site with no first-party backend or API of its own** — no
REST, GraphQL, gRPC, or WebSocket endpoints are defined or consumed anywhere
in the repository, and no server runtime, database, or serverless function
exists (confirmed by full-repo enumeration in the developer scan). The
sections below document the existing **outbound integration points** — chiefly
the three Formspree form endpoints — as the closest thing to an existing "API
surface" today, since this is exactly the surface a new backend for this
intent would replace or front.

## External API Surface: Formspree (Form Submission Backend)

Three independent Formspree-hosted forms are configured in
`src/site.config.ts`'s `FORMS` object. All three are real, live endpoints
(not placeholders, despite stale README wording — see
`code-quality-assessment.md`).

### Endpoint 1 — Waitlist

- **URL**: `https://formspree.io/f/xbgjkwkp`
- **Method**: `POST`
- **Consumed by**: `src/components/WaitlistForm.astro`, rendered on Home
  (`#waitlist`), How It Works, Sample Experiences, and Contact pages.
- **Request** (`multipart/form-data` via `FormData`):

  | Field | Required | Type | Notes |
  |---|---|---|---|
  | `email` | yes | `email` | Sole capture field |
  | `_subject` | — | hidden | Custom email subject sent to Formspree |
  | `_next` | — | hidden | Fully-qualified `/thank-you/` URL — Formspree's no-JS fallback redirect target |

- **Response**: JSON (`Accept: application/json` requested); only
  `response.ok` is inspected client-side — no response body is parsed or
  displayed.
- **Auth**: none. **Rate limiting**: none on this repo's side (Formspree may
  apply its own). **Validation**: client HTML5 only (`required`,
  `type="email"`) plus whatever Formspree enforces server-side.

### Endpoint 2 — Partner

- **URL**: `https://formspree.io/f/xjyvolol`
- **Method**: `POST`
- **Consumed by**: `src/components/PartnerForm.astro`, rendered standalone on
  the Partners page (`#apply`).
- **Request** (`multipart/form-data` via `FormData`):

  | Field | Required | Type | Notes |
  |---|---|---|---|
  | `name` | yes | text | |
  | `company` | no | text | |
  | `role` | no | text | |
  | `organization_type` | yes | enum | `str-operator` \| `experience-provider` \| `dmo` \| `other` |
  | `email` | yes | `email` | |
  | `message` | no | text | |
  | `_subject`, `_next` | — | hidden | Same convention as Waitlist |

- **Response / Auth / Rate limiting / Validation**: identical mechanism to
  Endpoint 1.

### Endpoint 3 — Investor

- **URL**: `https://formspree.io/f/maeybvbz`
- **Method**: `POST`
- **Consumed by**: `src/components/InvestorForm.astro`, rendered on the
  Contact page.
- **Request** (`multipart/form-data` via `FormData`):

  | Field | Required | Type | Notes |
  |---|---|---|---|
  | `name` | yes | text | |
  | `organization` | no | text | |
  | `email` | yes | `email` | |
  | `message` | no | text | |
  | `_subject`, `_next` | — | hidden | Same convention as Waitlist |

- **Response / Auth / Rate limiting / Validation**: identical mechanism to
  Endpoint 1.

### Shared Submission Mechanism

All three forms are submitted by one piece of shared logic —
`bindAjaxForms()`, an inline `<script>` in `src/layouts/BaseLayout.astro` —
rather than per-form submit handlers:

1. Binds a `submit` listener to every `form[data-ajax-form]` on the page.
2. On submit: `event.preventDefault()`, `form.reportValidity()` (native HTML5
   check), then `fetch(form.action, { method: 'POST', body: new
   FormData(form), headers: { Accept: 'application/json' } })`.
3. On `response.ok`: `window.location` navigates to
   `form.dataset.successUrl` (defaults to `/thank-you/`).
4. On failure (non-2xx or network error): un-hides the form's
   `[data-form-error]` element and re-enables the submit button; the form
   data is not retried or persisted anywhere in this codebase.

This is a **contract new backend implementers must either preserve or
consciously replace**: as long as a replacement endpoint accepts the same
field names/shapes per form and returns a 2xx/non-2xx status the same way,
the existing form markup and `bindAjaxForms()` script keep working unmodified
— option (a) in the developer scan's handoff summary. Otherwise, a
form-markup change must be coordinated alongside the backend cutover
(option (b)).

## Other External Integrations (not request/response APIs)

- **Google Fonts CDN** — `<link rel="stylesheet">` in `BaseLayout.astro`,
  loading Fraunces, Work Sans, IBM Plex Mono. Passive resource load, not a
  data API.
- **Analytics (Plausible / GA4)** — gated by `ANALYTICS.plausibleDomain` /
  `ANALYTICS.ga4MeasurementId` in `site.config.ts`. **Both are currently
  `null`** — no analytics script is emitted on the live site today, despite
  `docs/SPEC.md` §9 requiring conversion tracking on form submissions. Not an
  active integration point today, but a documented open item for the new
  backend's scope discussion (does the new backend own this telemetry, or
  does it remain a client-side concern).
- **GitHub Pages** — deployment/hosting target, not a runtime API call from
  the application; see `dependencies.md`.

## Internal API Surface

None exists. There are no internal service boundaries, no inter-package
calls, and no internal HTTP/RPC endpoints — this is a single static-site
package with zero server-side code.
