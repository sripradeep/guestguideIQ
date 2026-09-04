# GuestGuideIQ — Marketing Website Specification

**Status:** Draft v1.0
**Date:** 2026-09-04
**Owner:** Pradeep Kumar

---

## 1. Overview & Vision

GuestGuideIQ is a platform for **hyperlocal travel experiences** — helping travelers discover a
destination the way a well-connected local would show it to them, rather than the generic
tourist-trail version. The long-term product is a SaaS platform that **short-term rental (STR)
operators** — Airbnb/VRBO hosts and vacation rental property managers — subscribe to, to quickly
build digital property guides packed with deep local knowledge and hidden gems for their guests.
Local experience providers pay separately for lead-gen/advertising placement inside those guides.

This spec covers **Phase 1: the public marketing website** — a pre-launch site whose job is to
explain the vision, show what a hyperlocal experience looks like, and start capturing interest
from the audiences who matter before the SaaS product exists: travelers, STR operators, local
experience providers, and investors/press. The SaaS application itself is out of scope for this
spec and will be planned separately (see [§10 Technical Architecture](#10-technical-architecture)).

## 2. Goals

1. Clearly communicate what "hyperlocal travel experiences" means and why it's better than
   generic travel content.
2. Build early credibility with STR operators as a B2B SaaS opportunity, anchored on the speed
   USP — a guest-ready property guide, built fast — and with experience providers as an
   advertising/lead-gen opportunity.
3. Capture warm leads in three lanes: traveler waitlist, partner interest (STR operators +
   experience providers + DMOs), investor/press contact.
4. Ship fast — a small, polished site live in days, not weeks — on free/cheap infrastructure that
   doesn't block the future AWS-hosted SaaS build.

### Non-goals (Phase 1)

- No live booking, login, or in-browser product functionality.
- No real-time inventory of experiences — sample content is curated/illustrative, clearly framed
  as a preview of what's coming.
- No blog/content marketing engine yet (flagged as a possible Phase 2 addition).

## 3. Audiences & Personas

| Audience | What they need from the site | Primary CTA |
|---|---|---|
| **Travelers** | Understand the concept, feel the "insider" appeal, see example experiences | Join the waitlist |
| **STR operators** (Airbnb/VRBO hosts, vacation rental property managers — the primary paying customer) | Understand the subscription value prop: fast digital property guides + deep local knowledge/hidden gems, see it's credible | Apply as a launch partner |
| **Local experience providers** (guides, artisans, local businesses — the second paying customer, via lead-gen/ads) | Understand how paid placement/leads inside guest guides work | Apply as a launch partner / advertiser |
| **Destinations / DMOs** | Understand potential partnership fit | Apply as a launch partner |
| **Investors / press** | Understand vision, market, and traction/roadmap credibly | Request more info |

Hotels and resorts are explicitly **out of scope for Phase 1.** STR operators are not a
"beachhead" alongside a broader hospitality story — they *are* the story. Site language should
fully embrace STR/vacation-rental vernacular (hosts, listings, properties, guests, guidebooks)
rather than the more generic "hospitality partner" framing, and should not gesture at hotels as a
parallel or future segment. Revisit this scoping decision only as a deliberate future phase, not
as default inclusive language.

## 4. Business Model (for messaging accuracy)

Two revenue engines — the site's B2B messaging should make both legible without conflating them:

1. **Subscriptions from STR operators.** Hosts and property managers pay a recurring
   subscription for (a) a digital property guide their guests actually use, and (b) deep local
   knowledge and hidden-gems content curated for that property's neighborhood. The headline
   **USP is speed** — the ability to stand up a polished, guest-ready property guide quickly,
   without the operator having to author local recommendations themselves. This is the product's
   core, ongoing revenue line and should be the dominant story on Home and the Partners page.
2. **Lead generation / advertising from experience providers.** Local experience providers
   (guides, tour operators, artisans, restaurants) pay to be surfaced and recommended inside
   guest guides — i.e., they're buying visibility and leads at the moment a traveler is deciding
   what to do, not just donating content for free. This is a second, distinct revenue line and
   should be pitched to that audience as paid placement/advertising, not as an invitation to
   contribute content.

Site copy should describe each side in its own commercial terms — subscription value for STR
operators, lead-gen/advertising value for experience providers — without quoting pricing, which
isn't finalized for either.

## 5. Sitemap

```
Home
├── How It Works
├── Sample Experiences
├── Partners            (STR operators + experience providers + DMOs)
├── About               (vision, founding story, team if applicable)
└── Contact             (routes: waitlist / partner interest / investor & press)
```

Six pages total. Every page shares a persistent header (logo, nav, primary CTA button) and footer
(secondary nav, social links, contact email, copyright).

## 6. Page-by-Page Specification

### 6.1 Home
- Hero: headline + subhead selling the hyperlocal concept emotionally; primary CTA "Join the
  Waitlist"; secondary CTA "See Sample Experiences."
- "What is hyperlocal travel" section — 3-4 short value props with icons (e.g., "Discover like a
  local," "Skip the tourist trail," "Curated, not crowdsourced").
- Preview strip of 3-4 sample experiences (cards linking to the Sample Experiences page).
- "For STR Operators" teaser band — leads with the speed USP ("build a guest-ready property
  guide in minutes, not weeks") plus the local-knowledge angle; one paragraph + "Learn more" link
  to Partners page.
- Waitlist signup form (email only, low friction) near the bottom.
- Footer.

### 6.2 How It Works
- Traveler-facing flow: how a hyperlocal experience is surfaced/curated (framed as "how it will
  work" since not yet live) — 3-4 numbered steps with simple illustrations.
- Brief mention of the partner side (STR operator publishes a guide → guest discovers hidden
  gems inside it) to connect the dots without duplicating the Partners page.
- CTA: waitlist signup.

### 6.3 Sample Experiences
- Grid/gallery of illustrative hyperlocal experiences (destination, short story-style
  description, what makes it "hyperlocal" vs. generic). Clearly labeled as a preview/concept
  showcase, not bookable inventory yet.
- Aim for variety across a few destination types (urban neighborhood, coastal town, rural/nature)
  to show range.
- CTA: waitlist signup.

### 6.4 Partners
Two distinct pitches on one page, each with its own commercial framing — do not blend them into
a single generic "partner" pitch.

- **For STR Operators (subscription).** Lead with the speed USP — create a polished digital
  property guide quickly — then the local-knowledge/hidden-gems differentiator, guest
  satisfaction/review-score lift, and low setup lift vs. writing a guide themselves.
- **For Experience Providers (lead-gen/advertising).** Framed as paid visibility: get
  recommended inside guest guides at the moment travelers are deciding what to do, i.e. leads,
  not a content-donation ask.
- Secondary note for DMOs on destination-level partnership fit.
- One interest form covering all three: name, company, role, organization type (STR operator /
  experience provider / DMO / other — no hotel option in Phase 1), email, message —
  routed/tagged by type so follow-up can match the right pitch (subscription vs. advertising).
- Positioned credibly — SaaS/B2B tone even though the rest of the site is warmer.

### 6.5 About
- Founding story / why hyperlocal travel, why now.
- Vision statement.
- Team section (optional — include only if you want names public pre-launch).
- Link to Contact for investor/press inquiries.

### 6.6 Contact
- Single page, three lightweight routes (per discovery: simple forms, not overengineered):
  - **Traveler waitlist** — email capture.
  - **Partner interest** — short form (can reuse/link the Partners page form instead of
    duplicating).
  - **Investor & press** — name, org, email, message.
- General contact email displayed as plain text fallback.

## 7. Design & Brand Direction

No existing brand assets — this site establishes the starting visual direction.

- **Tone of visuals:** warm, human, photography-forward (real-feeling travel imagery over generic
  stock/corporate SaaS look), balanced with clean, modern UI chrome so it still reads credible to
  partners/investors.
- **Voice:** warm & inspiring on traveler-facing copy (Home, How It Works, Sample Experiences,
  About); tone shifts to concrete/confident B2B language on the Partners page and investor path,
  without becoming a different brand.
- **Placeholder palette/type:** propose a natural, earthy-but-modern palette (e.g., warm neutral
  base + one saturated accent) and a clean sans-serif pairing; treat as a v1 placeholder to be
  swapped once a real brand guide exists. Logo: wordmark placeholder acceptable for launch.
- Fully responsive; mobile-first given travel-intent browsing patterns.

## 8. Content Requirements

- Copy needed for all 6 pages (headlines, body copy, CTAs, form labels/confirmation messages).
- Sample experience content: 4-6 written examples (destination, narrative blurb, "why it's
  hyperlocal" note). These need to be drafted — flag as a content task, not just a dev task.
- Legal minimum: a simple privacy note near the forms (what the email is used for) — full privacy
  policy/terms can be a fast-follow, not a blocker for launch.

## 9. Forms, Analytics & SEO

- **Forms:** GitHub Pages has no backend, so all forms (waitlist, partner interest, investor
  contact) submit through a third-party form service (e.g., Formspree, Getform, or similar) that
  emails submissions and/or writes to a Google Sheet. Pick one service and use it consistently
  across all three forms for one integration point.
- **Analytics:** GA4 or Plausible, added via a single script tag; track form submissions as
  conversion events.
- **SEO basics:** unique `<title>`/meta description per page, Open Graph + Twitter card tags with
  a shared social preview image, `sitemap.xml`, `robots.txt`, semantic HTML headings, descriptive
  alt text on imagery.

## 10. Technical Architecture

| Layer | Choice | Notes |
|---|---|---|
| Marketing site | Static site, hosted on **GitHub Pages** | Recommend a lightweight static site generator (e.g., Astro or Next.js static export) over hand-rolled HTML for maintainability — 6 pages with a shared header/footer benefits from templating/components even if no server is involved. |
| Domain | Custom domain (**guestguideiq.com** or similar, TBD availability) | Set via GitHub Pages custom domain settings + `CNAME` file in repo; DNS: `A`/`ALIAS` records to GitHub Pages IPs (apex) or `CNAME` record (www) per GitHub's current docs; enable HTTPS enforcement once DNS propagates. |
| Forms backend | Third-party form service (Formspree/Getform/etc.) | No AWS dependency needed for launch; keeps marketing site fully static and decoupled from the future SaaS backend. |
| Future SaaS product | **AWS** (specific services TBD in a separate spec) | Out of scope here. When the SaaS app exists, the marketing site's CTAs (e.g., partner login, "Open the app") can point to it as a separate subdomain (e.g., `app.guestguideiq.com`) without needing to move the marketing site off GitHub Pages. |
| CI/CD | GitHub Actions → GitHub Pages deploy on push to `main` | Standard `actions/deploy-pages` workflow. |

## 11. Timeline

Target: **live within days**, favoring a small, polished scope over a large one.

Suggested sequence:
1. Confirm brand placeholder (palette/type/logo wordmark) — same day.
2. Draft copy for all 6 pages + sample experiences content.
3. Build static site (scaffold, shared header/footer, 6 pages, forms wired to form service).
4. Wire analytics + SEO tags.
5. Point custom domain, verify HTTPS, launch.

## 12. Success Metrics (v1)

- Waitlist signups (count + week-over-week trend).
- Partner interest form submissions (count, and mix of STR operator / experience provider / DMO —
  the split matters, since it signals demand for the two different revenue lines).
- Investor/press inquiries received.
- Basic traffic + top traffic sources (via analytics).

## 13. Open Items (to resolve before/soon after launch)

- Final domain name confirmation and availability check.
- Which form service to standardize on (Formspree vs. alternatives).
- Whether "About" includes named team members pre-launch.
- Real brand guide (logo, palette, type) — this spec's placeholder direction should be revisited
  once one exists.
- Privacy policy / terms of use — minimal version needed at launch, full version as fast-follow.
