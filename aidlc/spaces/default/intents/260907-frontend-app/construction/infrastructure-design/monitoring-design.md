# Monitoring Design — GuestGuideIQ Frontend

One deployable, one monitoring design. See the scope note in
`infrastructure-specification.md`.

**Sized to the team that will operate it.** A prior stage in this workspace
recorded, as a persisted learning, that inventing a multi-tier alert-severity
scheme with no on-call rotation to route to describes a maturity the team does not
have. That applies here: **one honest notification tier**, and escalation
documented for the actual responder count.

---

## 1. What is worth watching, and why

Derived from `requirements.md`'s NFRs rather than from a generic checklist.

| Signal | Why this one | Source |
|---|---|---|
| **Guest first-paint latency** (LCP on `/s/*`) | `AC2.1.1` requires the property and locality name to be the first content on screen, on a mobile-first surface, for someone standing at a front door. This is the product's sharpest performance requirement | AC2.1.1, NFR4 |
| **Interactive feedback within ~300ms** | NFR5, and the threshold at which the design switches to skeleton states | NFR5 |
| **`410 LINK_INVALID` rate on `/s/*`** | A rising rate means guest links are failing. Under M1 this is also the **primary symptom of a tenancy misconfiguration** — a new locality whose domain was not added to the backend | `u8`, M1 |
| **`404 LOCALITY_NOT_RESOLVED` rate on signup** | The other half of the same symptom. An owner cannot sign up at all | M1 |
| **`429` rate** | The backend limiter is an in-memory bucket **per process across 2–6 tasks**, so effective limits are multiplied and unpredictable. A shared hotel address can rate-limit unrelated guests | AC2.5.3 |
| **Refresh failure rate / session-end rate** | The cross-tab refresh race (M3) shows up here first. A spike means the Web Locks mitigation is not working | `u3` BR1.6, M3 |
| **CSP violation reports** | The only way to learn that the policy is either too tight (breaking the app) or being probed | M4 |
| **CloudFront 5xx rate and origin errors** | The static host's own failure signal. There is no task health check to watch, because there are no tasks | §1, §7 of the spec |
| **A stale-shell deploy failure** | Specific to this hosting choice: a cached `/index.html` referencing assets that are no longer served produces a blank app with console errors and **no server-side error at all**. It is invisible to every server-side signal | §4 of the spec |

**Deliberately not watched yet:** synthetic user journeys, real-user monitoring
across every route, and error-budget burn rates. There is no traffic to justify
them and no SLI pipeline exists. Recorded as a follow-up rather than built
speculatively — consistent with the workspace's existing decision not to build an
SLI pipeline before the traffic warrants it.

---

## 2. The two signals that would otherwise be invisible

**M1 tenancy failures look like application bugs.** A locality whose domain is
missing from the backend's CORS allowlist or tenant registry produces a `404` at
signup and a `410` for every guest — indistinguishable, from the user's side, from
"the link is expired". **Alert on a step change in these rates per locality
domain**, not in aggregate: one broken locality is invisible in a global average.

**CSP violations have no other reporting path.** Configure `report-to` and collect
them. Without this, the first sign of a too-strict policy is a user reporting a
blank screen.

---

## 3. Alerting

**One tier: notify the responder.** No Page-versus-Ticket distinction, because
there is no paging system and no rotation to route to differently.

| Condition | Threshold |
|---|---|
| CloudFront 5xx rate above baseline | Immediate |
| **Post-deploy check fails** | Immediate. On a static host this is the primary deploy-failure signal — nothing rolls itself back |
| `404 LOCALITY_NOT_RESOLVED` or `410` step change on any single locality domain | Sustained, to avoid firing on one mistyped link |
| Frontend error rate step change | Sustained |
| CSP violation reports appearing after a deploy | Sustained. Under §5's build-generated hashes, this is how a mis-generated policy announces itself |

**Escalation** is documented for the team's real size — a single responder, with
runbooks as Markdown in the repository. Lightweight and free, until incident
frequency justifies more.

---

## 4. Logging, and the credential problem

**Access logs on `/s/*` contain live credentials** — see
`infrastructure-specification.md` §3. This constrains logging design directly:

- Either **omit the URI field** from CloudFront access logs, or treat the log store
  as credential-bearing: encrypted, short retention, tightly scoped read access.
- **There is no server-side application log on this hosting choice.** Everything
  the frontend knows about its own failures is client-side, which makes the
  post-deploy check and the CSP report endpoint the only two signals that do not
  depend on a user hitting the problem first.
- **Never send full URLs to any third-party analytics or error reporter.** If an
  error reporter is added later, its URL scrubbing must be configured **before**
  it is switched on, not after.
- Client-side error reports must scrub the stay token from any captured URL or
  breadcrumb.

**Correlation.** The backend surfaces no trace id in its error envelope today (its
own recorded improvement opportunity). Until it does, frontend and backend logs
cannot be correlated per request — worth knowing before an incident makes it
urgent.

---

## 5. What is deferred

- An SLI/SLO pipeline. No traffic to justify it; the backend's equivalent is
  deferred for the same reason.
- Real-user monitoring beyond the guest first-paint signal.
- Distributed tracing across the frontend/backend boundary, which is blocked on the
  backend surfacing a correlation id.
