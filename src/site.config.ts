// Central place for the handful of values that change between "just scaffolded"
// and "actually live". Update these, not the pages, when you:
//   - point the lead-capture forms at a real backend deployment (see README.md "Forms" section)
//   - pick a real contact inbox
//   - add analytics
//   - confirm the domain

export const SITE = {
  name: 'GuestGuideIQ',
  url: 'https://guestguideiq.com', // TODO: confirm domain availability (see docs/SPEC.md §13)
  description:
    'GuestGuideIQ turns any short-term rental stay into a hyperlocal experience — real hidden gems, curated by neighborhood, built into your host’s digital guide.',
  contactEmail: 'hello@guestguideiq.com', // TODO: point this at a real inbox before launch
};

// The GuestGuideIQ backend's base URL, used by the lead-capture forms below.
// Configure via the PUBLIC_API_BASE_URL env var at build time (see
// README.md "Forms" section and .env.example) — never hardcode the real
// backend domain here. Falls back to a local dev placeholder so `npm run
// dev`/`npm run build` don't require it; requests simply fail against a
// backend that isn't running, same as any other unconfigured integration.
const DEFAULT_API_BASE_URL = 'http://localhost:8080';

export const API = {
  baseUrl: import.meta.env.PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL,
};

// Lead-capture endpoints on the backend (contract 3 of
// aidlc/spaces/default/intents/260905-backend-services-spec/inception/contract-design/contract-summary.md).
// Each accepts a JSON POST body matching the form's field names below.
export const LEADS = {
  waitlist: `${API.baseUrl}/v1/leads/waitlist`,
  partner: `${API.baseUrl}/v1/leads/partner`,
  investor: `${API.baseUrl}/v1/leads/investor`,
};

// Set to a real GA4 measurement ID ("G-XXXXXXX") or Plausible domain to wire
// up analytics. Leave null to ship without any tracking.
export const ANALYTICS = {
  plausibleDomain: null as string | null,
  ga4MeasurementId: null as string | null,
};
