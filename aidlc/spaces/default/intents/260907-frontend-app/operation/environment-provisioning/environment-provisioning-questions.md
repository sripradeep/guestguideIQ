# Environment Provisioning — Questions

Conversation language: English

**Every answer below is orchestrator-selected, not human-chosen.** The human's
standing instruction for this build is to carry forward on reasonable assumptions
and document them for revisit, and they have twice declined to be asked. These are
recorded as assumptions with rationale, exactly as `project.md`'s recorded practice
requires — never filled in as if answered.

**Q4 and Q6 are the two worth a human's attention before anything is provisioned.**
The rest are safe to carry.

---

### Q1 — Which AWS account hosts the frontend?

**[Assumed]: the same account as the backend — `774888248078` (`ggiq-prod`),
region `us-east-1`.**

**Rationale.** The backend already lives there with a working GitHub OIDC deploy
role, and `infrastructure-specification.md` §1 chose S3 + CloudFront partly to
avoid introducing a second cloud or vendor. A separate account would be better
isolation, but it is not what the team operates today and it would double the
credential and DNS setup.

**Note on region:** the ACM certificate for CloudFront **must** be in `us-east-1`
regardless of any later regional choice. The account already being there makes
this free rather than a constraint.

**Revisit trigger:** if a production/non-production account split is ever adopted
workspace-wide. Do not decide it for the frontend alone.

---

### Q2 — Which environments are provisioned, and in what order?

**[Assumed]: all three — development, staging, production — as three
bucket + distribution pairs, provisioned staging-first.**

**Rationale.** `project.md` stamps `ALWAYS require a staging deployment with manual
approval before production` and `team.md` is explicit that the frontend must not
copy the backend's shape, where `deploy-staging` is an `echo` and production
bypasses it. A staging tier that is provisioned second, "once there's time", is how
that happens. Static hosting makes three environments genuinely cheap — this is one
of the clearer wins of the hosting choice.

**Revisit trigger:** none expected. If cost ever argues for collapsing dev into
staging, note that it re-creates the backend's exact anti-pattern.

---

### Q3 — DNS: Route 53, or the existing external provider?

**[Assumed]: the existing external DNS provider, matching the backend.**

**Rationale.** The backend's own environment-provisioning recorded this as
**accepted permanently** (its Q4): `api.guestguideiq.com` is a CNAME at the
domain's existing external provider, not Route 53. Splitting DNS across two
providers for one product is worse than either choice made consistently.

**What it costs, and it is not nothing.** ACM DNS validation and every locality
domain's alias record become manual steps in an external control panel — outside
CDK, outside CI, and outside any audit trail. `infrastructure-specification.md` §2
already requires locality onboarding to be a written runbook; this is the reason it
cannot instead be automated.

**Revisit trigger:** when the number of locality domains makes manual record
creation the dominant cost of onboarding one. That is the point at which moving
the zone to Route 53 pays for itself.

---

### Q4 — Which domains exist at provisioning time? **← needs a human**

**[Assumed]: `guestguideiq.com` and one subdomain per environment for the app
itself. No locality domains exist yet.**

**Rationale.** Only `guestguideiq.com` and `api.guestguideiq.com` are known to
exist. `AC1.9.4` requires a guest link to be an absolute URL on the property's own
locality domain, so real locality domains are needed before the Guest surface can
be exercised at all — but none has been named anywhere in this intent.

**Why this one genuinely needs answering.** The certificate SAN list and the
distribution's alternate domain names are both derived from it, and adding a
domain later means a certificate re-issue plus DNS validation plus a distribution
update — the slowest loop in the whole provisioning process. Knowing even one real
locality domain now avoids doing it twice.

**Assumption carried meanwhile:** provision for the app's own domains only, and
treat the first locality domain as the runbook's first exercise.

---

### Q5 — Certificate: wildcard or explicit SANs?

**[Assumed]: explicit SANs, not a wildcard.**

**Rationale.** Locality domains are expected to be **separate apex domains** owned
by different brands, not subdomains of one root — that is the whole point of
`AC1.9.4` and of the `Host`-header tenancy model. A wildcard covers
`*.guestguideiq.com` and would cover none of them.

**Do not repeat the backend's mistake here.** Its certificate ARN is hardcoded in
`infra/bin/backend-api.ts`. Publish this one via SSM or a stack output, as
`infrastructure-specification.md` §2 requires.

**Revisit trigger:** if localities turn out to be subdomains of one root after all,
a wildcard becomes the simpler choice.

---

### Q6 — Is a WAF attached to the guest distribution? **← needs a human**

**[Assumed]: no WAF at initial provisioning, matching the backend's deferral.**

**Rationale.** The backend's Q2 deferred its public-service WAF and relies on
in-app rate limiting. Carrying the same posture keeps the decision in one place.

**Why this deferral is weaker than the backend's, and should be looked at.** Three
things are different here:

1. The guest surface is **fully public and unauthenticated** — the credential is in
   the URL, so there is no login to rate-limit behind.
2. The backend's limiter is an **in-memory bucket per process across 2–6 tasks**, so
   the effective limit is multiplied and unpredictable — it is weaker than it looks,
   which `infrastructure-specification.md` §8 already records.
3. A stay token is guessable-in-principle and **non-revocable**, so a brute-force
   attempt against `/s/*` has no automatic mitigation anywhere in the system today.

CloudFront is where a request-rate control would naturally sit, and attaching one
later is easy. **Recorded as a deliberate deferral with its cost named, not as a
gap nobody noticed.**

**Revisit trigger:** before the first real locality goes live with real guests.

---

### Q7 — Asset retention (carried from `carried-assumptions.md` F4)

**[Assumed]: retain superseded build assets for 30 days via an S3 lifecycle rule
on the hashed-asset prefix only.**

**Rationale.** Rollback and in-flight sessions both depend on superseded assets
still being served (`cicd-pipeline.md` §6). Thirty days comfortably exceeds any
plausible session and any realistic rollback window, and hashed assets are small.
**The lifecycle rule must not touch `index.html`**, which is the object rollback
repoints.

**Revisit trigger:** if bucket size ever becomes a real cost line, which at this
traffic level it will not.
