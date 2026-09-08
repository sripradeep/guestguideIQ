# Environment Provisioning — Environment Inventory

Conversation language: English

> **Status: nothing is provisioned. This is a target inventory, not a snapshot.**
>
> The backend intent's inventory of the same name is a factual record of live,
> verified resources. **This document is not that, and must not be read as
> that.** No AWS resource exists for the GuestGuideIQ frontend in any account or
> tier, and this session holds no AWS credentials to create or inspect one
> (`aws sts get-caller-identity` → `NoCredentials`; the `aws-mcp` server failed
> to connect for the same reason).
>
> Every identifier below is a **name to be assigned**, never an observed one.
> When provisioning actually runs, this file is replaced by the real inventory
> with real ARNs, and the deviations between the two are recorded as
> environment-provisioning questions — per the workspace's recorded practice of
> never silently absorbing a spec/reality gap into an inventory.

**Account and region (assumed, Q1):** `774888248078` (`ggiq-prod`), `us-east-1`.

---

## Environments

| Environment | Status | Notes |
|---|---|---|
| development | **Not provisioned** | Target: own bucket + distribution |
| staging | **Not provisioned** | Target: own bucket + distribution. **Must be genuinely wired** — `team.md` forbids copying the backend's `echo` staging |
| production | **Not provisioned** | Target: own bucket + distribution, manual approval in front of it |

---

## Target resources, per environment

| Resource | Configuration |
|---|---|
| S3 bucket | Private. **No public access, no website hosting.** Reachable only through CloudFront via Origin Access Control — a public bucket bypasses every response-header policy and voids M4 |
| CloudFront distribution | One per environment. Production carries every locality domain as an alternate domain name |
| ACM certificate | **`us-east-1` regardless of anything else** — CloudFront requires it. Explicit SANs, not a wildcard (Q5). ARN published via SSM or stack output, **not hardcoded** as the backend's is |
| Response headers policy | The full §5 header set from `infrastructure-specification.md`, including the build-generated CSP hashes |
| CloudFront Function | Viewer-request SPA fallback, rewriting non-asset paths to `/index.html` |
| Cache behaviours | Hashed assets immutable; `/index.html` no-store; **`/s/*` never cached** — the path is the credential |
| Access logging | URI field omitted, **or** the log bucket classified as credential-bearing: encrypted, short retention, tightly scoped reads |
| S3 lifecycle rule | 30-day retention on the hashed-asset prefix only; **must not touch `index.html`** (Q7) |
| CI/CD identity | GitHub OIDC role, scoped to this frontend's buckets and distributions only. **No long-lived keys** |
| DNS | Records created manually at the existing external provider (Q3) |
| WAF | **None at initial provisioning** (Q6) — deferred with its cost named, and the weakest of the assumptions here |

---

## What must exist before this can be provisioned

These are ordering facts, not preferences:

| Prerequisite | Status |
|---|---|
| **The frontend repository** | **Does not exist.** `project.md` stamps `ALWAYS build the frontend in its own new repository`; only `guestguideiq-app` is checked out. Nothing can deploy into these buckets until it exists |
| **`cd-config`** — this stage's second declared input | **Does not exist.** Produced by `deployment-pipeline` (4.1), which has not run |
| **A built artifact** | Does not exist. `code-generation` (3.5) has not run |
| **AWS credentials on the session performing the work** | Not present here |
| **At least one real locality domain** (Q4) | Not named anywhere in this intent |

**None of these is a reason the design is wrong.** They are the reason this stage
produces a target rather than a record, and they are why it sits at 4.2 rather
than next.

---

## Known deviation from `infrastructure-specification.md`, recorded now

**There is none yet** — because nothing has been built to deviate. This heading is
kept deliberately: the workspace's recorded practice is that every gap between the
specification and what is actually live becomes an explicit question with a
recorded human decision, and the backend intent found four of them (WAF,
auto-scaling, DNS provider, certificate automation) only once it looked. Expect
this section to fill in, and do not treat an empty one as a clean result.
