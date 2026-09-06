# Requirements Analysis — Clarifying Questions

Your request was: "Let's start working on and refining the spec for the backend services, based on the marketing site. Go through discovery."

The marketing site (`docs/SPEC.md`) explicitly scoped itself to Phase 1 only and deferred the real product — a SaaS platform where STR operators subscribe for digital property guides and experience providers pay for placement — to "a separate spec." That's what this intent is. Before I can write concrete requirements, I need to pin down how much of that future product this backend is meant to cover right now, since it changes everything downstream (data model, auth, integrations, and how big a first build is).

---

## Q1: What should this backend cover?

- A. Minimal near-term scope: replace the 3 existing Formspree forms (waitlist, partner, investor) with a first-party backend that receives and stores those same leads — no property guides, no subscriptions, no logins yet.
- B. Foundational SaaS backend: start building the real product's core — STR operators can create an account and a basic digital property guide, guests can view it, experience providers can be listed in it — even if thin/MVP.
- C. Something in between: lead capture backend, plus basic account infrastructure for STR operators (so they exist as an entity in the system), but not the full guide/marketplace functionality yet.
- X. Other (please specify)

[Answer]: Closer to B, Full Saas application and a data backend to add Poi of intrest, and a Chat option to create customized itenraries, Initially Handle Two Personas, a property owner and a Guest, A wizard for onboarding property owners, including uploading existing Digital guides

---

## Q2: Lead data ownership

Right now, all lead data lives only in Formspree's system. Should the new backend take over as the system of record for this data?

- A. Fully own it — the new backend receives and stores all lead submissions directly; Formspree is retired.
- B. Backend adds automation (e.g. notifications, tagging, CRM handoff) on top, but Formspree stays the system of record for now.
- C. Leave lead capture on Formspree entirely; this backend is unrelated to it.
- X. Other (please specify)

[Answer]: A

---

## Q3: STR operator capabilities

If STR operator functionality is in scope for this spec (per Q1), what should an STR operator actually be able to do through the backend?

- A. Sign up / create an account and manage a subscription — no guide content yet.
- B. Create and edit a digital property guide (content management) — no account/subscription billing yet.
- C. Both: account/subscription management AND guide content management.
- D. Not in scope for this spec — we're only doing lead capture right now.
- X. Other (please specify)

[Answer]:C plus more as outlined in Q1

---

## Q4: Experience-provider monetization

Local experience providers are meant to pay for placement/advertising inside guest guides. Is that monetized-placement infrastructure in scope for this spec?

- A. Yes, in scope now — need to design the payment/billing integration.
- B. In scope for listing/placement logic only; payments and billing come later.
- C. Out of scope entirely for this spec.
- X. Other (please specify)

[Answer]:A

---

## Q5: Authentication

Will this backend need user accounts and login for any audience (STR operators, experience providers, or eventually travelers), or is it purely a receive-and-forward system with no logins?

- A. Yes — need authentication/authorization for at least one user type.
- B. No login needed yet — this spec only handles anonymous form/lead submissions.
- C. Not sure yet — flag it as an open question for a later stage.
- X. Other (please specify)

[Answer]: Username /password AUth needed for Prop manager Persona, short term links for Guest persona

---

## Q6: Hosting platform

The original site spec says the future SaaS product would be AWS-hosted (specific services to-be-determined). Should this backend-services spec commit to AWS now, or leave the runtime/hosting choice open for a later design stage?

- A. Yes, commit to AWS now, per the original site spec.
- B. Leave it open — let domain-design/infrastructure-design decide later.
- C. Some other explicit hosting preference (please specify below).
- X. Other (please specify)

[Answer]: B

---

## Q7: Performance and reliability expectations

Do you have concrete targets yet for expected traffic/lead volume, uptime, or response times — or should I use reasonable early-stage defaults for now?

- A. I have specific targets to share now (please specify below).
- B. Use reasonable early-stage defaults (low traffic, standard availability) — we'll refine once we have real usage data.
- C. Not sure — treat this as an open question for NFR Requirements later.
- X. Other (please specify)

[Answer]: B

---

## Q8: Compliance and personal data handling

This backend will handle personal data — traveler/host/provider names and emails today, and possibly payment details later. Are there specific compliance requirements you already know apply (e.g. GDPR, CCPA), or should I treat this generically as "handle personal data responsibly" for now?

- A. Yes, specific requirements apply (please specify below).
- B. No specific requirements known yet — treat it as a generically privacy-conscious system for now.
- C. Not sure / not applicable at this stage.
- X. Other (please specify)

[Answer]: B

---

## Follow-Up Questions

Your answers sketched a much fuller product than the original options anticipated (full SaaS core, POI data, an itinerary chat feature, a guide-import wizard). These follow-ups pin down details needed before I can write concrete requirements.

## Q9: Itinerary chat — what kind of feature is this?

You mentioned a "chat option to create customized itineraries." Should this be an AI/LLM-powered conversational assistant, or a simpler guided form/wizard?

- A. AI/LLM-powered conversational chat (open-ended, generates a personalized itinerary from a conversation)
- B. A structured guided wizard (fixed questions → itinerary suggestions), no open-ended AI
- C. Both — a structured wizard now, AI chat as a later phase
- X. Other (please specify)

[Answer]: A. AI/LLM-powered conversational chat (open-ended, generates a personalized itinerary from a conversation)

---

## Q10: Who supplies the points-of-interest (POI) data?

- A. Property owners enter/curate their own POIs during onboarding
- B. Sourced automatically from a third-party places API (e.g. Google Places, Foursquare); owners can edit/add to it
- C. A mix — auto-populated from a places API, then refined/added to by the property owner
- D. Your team curates POI content manually
- X. Other (please specify)

[Answer]: Other — Our team will curate an initial data set for the Locality, prop owners should be able to pick favourites, also events and other [text became garbled here — clarification pending, see Follow-Up Q14]

---

## Q11: Digital guide import format

The onboarding wizard should let property owners upload their "existing digital guides." What format(s) should it support importing from?

- A. PDF documents
- B. A specific existing tool's export (e.g. Airbnb Guidebooks, Hostfully, Touch Stay) — please specify which
- C. Freeform text/paste
- D. Not sure yet — support manual entry for now and defer import to a later phase
- X. Other (please specify)

[Answer]: A. PDF documents

---

## Q12: How do experience providers get into the system?

Q1 named two initial backend personas (property owner and guest), but Q4 says provider paid-placement is in scope now too. How do experience providers actually participate at this stage?

- A. Self-service — providers also get their own account/portal to manage their listing and payment
- B. Ops-managed — your team manually onboards providers and enters their listings; no provider-facing portal yet
- C. Property-owner-managed — property owners recommend/add local providers into their own guide; providers have no separate account
- X. Other (please specify)

[Answer]: Other — paid placement out of scope for phase 1 [contradicts Q4's "Yes, in scope now" — clarification pending, see Follow-Up Q15]

---

## Q14 (clarifying Q10): POI curation — the rest of your answer

Your Q10 answer got cut off after "...prop owners should be able to pick favourites, also events and other..." — the rest came through garbled. Just so I capture this correctly: what else, besides favourited POIs and events, should be part of the curated locality content?

(Free text — describe what you meant, or say "just POIs and events" if that's the complete list.)

[Answer]: We need a module to continuously monitor for events in the locality, and add it, and manage the event lifecycles

---

## Q15 (resolving a contradiction): Is experience-provider paid placement in scope now?

Two of your answers disagree:
- **Q4** said paid placement for experience providers is **"in scope now — need to design the payment/billing integration."**
- **Q12** said **"paid placement out of scope for phase 1."**

Which one is correct for this spec?

- A. In scope now — experience providers can be listed and pay for placement as part of this backend
- B. Out of scope for phase 1 — this backend only handles property owners and guests; provider monetization comes later
- C. Something in between (please specify — e.g. providers can be listed for free/unpaid now, monetization added later)
- X. Other (please specify)

[Answer]: B. Out of scope for phase 1 — this backend only handles property owners and guests; provider monetization comes later

---

## Q13: Guest access link lifecycle

You said guests access their guide via short-term links rather than logging in. What generates and controls that link's lifespan?

- A. One link per property, generated by the property owner, that doesn't expire (reused across all their guests)
- B. One link generated per guest stay (e.g. tied to check-in/check-out dates), expiring automatically after checkout
- C. Not sure yet — flag as an open question for a later stage
- X. Other (please specify)

[Answer]: B. One link generated per guest stay (e.g. tied to check-in/check-out dates), expiring automatically after checkout

---

## Second Follow-Up Round (raised after Domain Design was already underway)

While working on Domain Design, you raised a new requirement: hyperlocal content will be branded per locality, and GuestGuideIQ will approach property owners under a locality-specific brand rather than a single generic brand — requiring multi-domain support.

## Q16: Locality branding and multi-domain — what you said

- **What "branded" means**: Each locality has its own visual identity. When GuestGuideIQ approaches a property owner, it presents itself as a locality-specific operator, not as a single generic "GuestGuideIQ" brand — so the app needs to support different domains.
- **Scope**: This is a real requirement, not just a domain-design detail — recorded here in requirements.md, per your explicit direction.

[Answer]: Confirmed as stated above — recorded verbatim from the conversation, not a structured question.

---

## Q17: Domain structure

Does each locality get a fully custom domain (e.g. `downtownspringfield-guides.com`), or a subdomain of a shared GuestGuideIQ domain (e.g. `downtownspringfield.guestguideiq.com`)?

- A. Fully custom domain per locality-brand
- B. Subdomain of a shared domain per locality-brand
- C. Both should be supported — some localities get custom domains, others use a subdomain
- X. Other (please specify)

[Answer]: C. Both should be supported — some localities get custom domains, others use a subdomain

---

## Q18: Who manages locality-brand domains

Who is responsible for acquiring/managing each locality-brand's domain?

- A. GuestGuideIQ manages all domains centrally (registers and configures them)
- B. Varies — sometimes a local partner/reseller owns the domain and GuestGuideIQ points it at the backend
- C. Not decided yet — flag as an open question for domain-design/infrastructure-design
- X. Other (please specify)

[Answer]: A. GuestGuideIQ manages all domains centrally (registers and configures them)

---

## Q19: Does branding extend to the Property Owner's own dashboard?

Is locality branding purely guest-facing (the guide a Guest views), or does the Property Owner also see their locality's brand when they log in to manage their guide?

- A. Guest-facing only — Property Owner dashboard stays a single, generic GuestGuideIQ brand
- B. Both — Property Owner dashboard also reflects their locality's brand
- X. Other (please specify)

[Answer]: B. Both — Property Owner dashboard also reflects their locality's brand

---

## Q20: Property-to-locality relationship

Does each property belong to exactly one locality-brand, or could locality-brands overlap or nest (e.g. a city-wide brand containing several neighborhood-level brands)?

- A. Exactly one locality-brand per property — simple, flat relationship
- B. Localities can nest or overlap (e.g. neighborhood within a city brand)
- C. Not sure yet — flag as an open question for domain-design
- X. Other (please specify)

[Answer]: A. Exactly one locality-brand per property — simple, flat relationship

---

## Q21: Can a single POI belong to more than one locality?

You noted points-of-interest can be shared across locales (e.g. a POI near a boundary, or a well-known attraction relevant to more than one nearby locality-brand).

- A. Yes — a POI can be associated with more than one locality; localities and POIs are many-to-many
- B. No — a POI belongs to exactly one locality; a shared attraction would need to be curated separately per locality
- X. Other (please specify)

[Answer]: A. Yes — a POI can be associated with more than one locality; localities and POIs are many-to-many (per the user's explicit note)

---

## Q22 (from review, R-06): How/when is a property assigned to its locality-brand?

- A. Via the signup domain — a Property Owner signs up through that locality's own domain/subdomain, which implicitly sets their locality
- B. Wizard selection step — the onboarding wizard asks the owner to pick their locality from a list
- C. Pre-assigned by GuestGuideIQ ops before the account exists
- X. Other (please specify)

[Answer]: A. Via the signup domain — a Property Owner signs up through that locality's own domain/subdomain, which implicitly sets their locality

---

## Consolidated Summary Confirmation

- Looks correct
- Request changes

[Answer]: Looks correct
