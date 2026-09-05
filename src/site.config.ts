// Central place for the handful of values that change between "just scaffolded"
// and "actually live". Update these, not the pages, when you:
//   - create real Formspree forms (see README.md "Forms" section)
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

// Formspree endpoints. Create a free account at https://formspree.io, create
// one form per row below, and paste in the real form IDs. Until then these
// point at placeholders and submissions will fail with a clear Formspree error
// rather than silently going nowhere.
export const FORMS = {
  waitlist: 'https://formspree.io/f/xbgjkwkp',
  partner: 'https://formspree.io/f/xjyvolol',
  investor: 'https://formspree.io/f/maeybvbz',
};

// Set to a real GA4 measurement ID ("G-XXXXXXX") or Plausible domain to wire
// up analytics. Leave null to ship without any tracking.
export const ANALYTICS = {
  plausibleDomain: null as string | null,
  ga4MeasurementId: null as string | null,
};
