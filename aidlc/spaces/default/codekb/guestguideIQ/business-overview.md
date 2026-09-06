# Business Overview — guestguideIQ

## Business Domain

GuestGuideIQ operates in the **hyperlocal travel experiences** domain, at the
intersection of short-term rental (STR) hospitality and local tourism/experience
marketplaces. The domain is currently pre-launch: the codebase under analysis is
the public marketing site, not the eventual product itself.

## Purpose

The site's purpose is to explain the GuestGuideIQ vision and capture leads from
four distinct audiences ahead of building the future SaaS product:

- **Travelers** — end users who would discover and book hyperlocal experiences
  curated for where they are staying.
- **STR operators** (short-term-rental hosts/property managers) — the
  distribution channel who would embed or recommend GuestGuideIQ experiences to
  their guests.
- **Experience providers** — local businesses/individuals who would supply the
  bookable experiences.
- **Investors / press** — audiences interested in the company's trajectory
  ahead of a funding or launch announcement.

This intent (`260905-backend-services-spec`) exists specifically to specify a
**new backend** for this product line; this reverse-engineering pass documents
what exists today as the starting point for that specification.

## Key Functionality (as it exists today)

The current system is a **six-page static marketing site** with no backend of
its own:

- **Home** (`/`) — vision pitch with an embedded waitlist capture (`#waitlist`).
- **About** (`/about`) — company/product narrative.
- **How It Works** (`/how-it-works`) — explains the traveler/host/provider flow,
  also embeds waitlist capture.
- **Sample Experiences** (`/experiences`) — a curated static list of example
  experiences (`src/data/experiences.ts`), also embeds waitlist capture.
- **Partners** (`/partners`) — pitch to STR operators and experience providers,
  with a dedicated application form (`PartnerForm`).
- **Contact** (`/contact`) — general contact page hosting both the waitlist
  form and the investor form.
- **Thank You** (`/thank-you`) and **404** — supporting utility pages.

The only functional "backend" behavior today is **lead capture**: three forms
(waitlist, partner, investor) submit via client-side AJAX to three separate
Formspree-hosted endpoints. There is no database, no authentication, no
server-side business logic, and no first-party API. See
`api-documentation.md` for the full contract of these integration points —
they are the closest thing to an existing "API surface" and the natural seam
a new backend would replace or formalize.

## Business Value of the Current Site

- Validates market interest pre-launch by measuring waitlist/partner/investor
  submission volume (though no analytics/conversion tracking is currently wired
  — see `code-quality-assessment.md`).
- Establishes the brand narrative and positioning (`docs/SPEC.md` is the
  authoritative source for vision, audiences, and business model).
- Provides a stable public URL (`guestguideiq.com`, via GitHub Pages) that a
  future backend/API can be introduced behind without a domain migration.

## Source Evidence

All findings in this artifact are synthesized from
`aidlc/spaces/default/intents/260905-backend-services-spec/inception/reverse-engineering/developer-scan.md`
("Packages Found", "APIs Discovered", and "Handoff Summary" sections), the
`docs/SPEC.md` reference the scan cites, and `README.md`.
