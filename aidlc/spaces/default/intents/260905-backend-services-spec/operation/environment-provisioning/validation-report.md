# Environment Provisioning — Validation Report

Conversation language: English

Validates the live `production` environment for `u1-backend-api` against
`infrastructure-specification.md` and `cd-config.md`, and records every
deviation as a deliberate, human-confirmed decision (not a silently accepted
gap) per `environment-provisioning-questions.md`.

## Validation Checklist

| Check | Result | Evidence |
|---|---|---|
| Environments provisioned per Infra Design | **Partial, deliberately scoped** | Production only; dev/staging deferred (Q1) |
| VPC, subnets, security groups correct | **Pass** | 2 AZs, public+private split; RDS security group scoped to specific security groups only, no CIDR-based ingress; ALB security group correctly open on 80/443 (public-facing by design) |
| NACLs correct | **Pass (default)** | No custom NACL requirements identified in the spec; VPC defaults apply |
| Secrets in Secrets Manager, correctly injected | **Pass** | 5 secrets (DB credentials, JWT signing×3, Stripe) injected as ECS `secrets`, never plain env vars; verified in synthesized template across 4 separate deploy fixes this session (missing `JWT_REFRESH_SECRET`/`INTERNAL_JWT_SECRET` was a real bug, now fixed and confirmed working in production) |
| Cross-account / cross-VPC connectivity validated | **N/A** | Single-account, single-VPC deployment; no cross-account/cross-VPC boundary exists yet |
| ALB HTTPS + redirect | **Pass** | Verified live: `200` on HTTPS `/health` and `/health/ready`, `301` redirect from HTTP, valid cert to 2027-03-23 |
| Database connectivity from application | **Pass** | `/health/ready` (which genuinely checks DB connectivity, not just process liveness) returned `200 {"status":"ready"}` live |
| Database migrations applied | **Pass** | Migration RunTask completed successfully as part of the same deploy that reached `CREATE_COMPLETE` |
| RDS not publicly accessible | **Pass** | `PubliclyAccessible: false`, confirmed via `describe-db-instances` |
| RDS encrypted at rest | **Pass** | `StorageEncrypted: true` |
| WAF / edge rate limiting | **Deviation, accepted (Q2)** | Spec calls for WAF rate-based rules on 4 route groups; none implemented. In-app token-bucket rate limiting (`nfr-design`) is live and accepted as sufficient for now. **Follow-up**: revisit before real user-facing traffic scales up. |
| ECS auto-scaling (2→6 on CPU>70%) | **Pass — correction, see below** | `publicService.service.autoScaleTaskCount({minCapacity: 2, maxCapacity: 6})` with a CPU-70% target-tracking policy has been present in `backend-api-stack.ts` since Code Generation's initial commit (`git log -S autoScaleTaskCount` confirms). |
| DNS via Route 53 | **Deviation, accepted permanently (Q4)** | `api.guestguideiq.com` is a CNAME on the domain's existing external DNS provider, not Route 53. Spec should be updated to match this as the intended approach, not a temporary gap. |
| ACM certificate issued programmatically | **Deviation, accepted as interim (Q5)** | Requested manually via AWS CLI, DNS-validated by hand, ARN hardcoded in `infra/bin/backend-api.ts`. Acceptable until the locality-brand/domain-creation workflow (a not-yet-built frontend feature) exists to automate it. |
| `u2-admin-api` environment provisioned | **Out of scope for this pass (Q6)** | No live AWS environment exists for `u2-admin-api` at all. This is a real, tracked gap — not a deviation — since the spec expects it deployed; it is deferred to a separate later provisioning pass, not silently dropped. |
| RDS deletion protection | **Resolved (Q7)** | Was `false` during bring-up (a genuine, temporary safety trade-off made to unblock repeated `ROLLBACK_FAILED` cycles before `CREATE_COMPLETE`). Now that the stack is stable, re-enabled via `guestguideiq-app` PR #16. |

## Real defects found and fixed this session (for context — not open items)

These were genuine bugs, not design deviations, all found via direct evidence
and fixed before this stage closed:

1. Missing `JWT_REFRESH_SECRET`/`INTERNAL_JWT_SECRET` in the ECS task's
   `secrets` block — caused a `ConfigError` crash-loop at container startup.
2. Main service's Docker image built the wrong target (`migrate` instead of
   `runtime`, due to Docker's default-to-last-stage behavior with no explicit
   `--target`) — the container silently ran a migration and exited instead
   of serving traffic.
3. `tsconfig.json`'s `rootDir` produced `dist/src/server.js` instead of
   `dist/server.js`, so `node dist/server.js` (the Docker `CMD`) failed with
   `MODULE_NOT_FOUND` — the very first time that exact command had ever
   actually been run.
4. Dockerfile's `build` stage didn't copy the new `tsconfig.build.json` file
   (added to fix #3), breaking the image build outright.
5. IAM: the GitHub Actions deploy role had no `ecs:RunTask`/`iam:PassRole`
   permission for the migration task (it only had `sts:AssumeRole` on the CDK
   bootstrap roles) — fixed with a narrowly-scoped inline policy.

## Correction (recorded during Observability Setup)

Q3 and this report's original "ECS auto-scaling" row were **factually wrong**.
At the time this stage ran, I asserted the deployed stack had "a fixed
`desiredCount: 2` with no scaling policy configured" and got the human to
defer a gap that doesn't exist — I never actually re-checked the live CDK
code before writing that claim. Confirmed via `git log -S autoScaleTaskCount
-- infra/lib/backend-api-stack.ts`: the auto-scaling policy has been present
since Code Generation's very first commit. The row above has been corrected
to **Pass**; Q3's "Defer" answer in `environment-provisioning-questions.md`
is left as historical record (the human answered accurately given what they
were told) rather than rewritten, since altering a recorded human answer
after the fact would be worse than disclosing the mistake here.

## Outstanding follow-ups (tracked, not blocking this stage's closure)

- Add WAF rate-based rules to `u1`'s ALB before real user-facing load (Q2)
- Provision `u2-admin-api` to production — a separate environment-provisioning pass (Q6)
- Publish the SSM parameters `u2-admin-api`'s stack needs from `u1` (VPC id, ECS cluster name/security group, subnet ids) — required before `u2` can even attempt deployment
- Parameterize `u2-admin-api`'s hardcoded `availabilityZones` placeholder
- Provision dev/staging environments if/when pre-production validation becomes a priority (Q1)
- Automate ACM certificate issuance once the locality-brand/domain-creation workflow exists (Q5)

## Traceability

See `environment-provisioning-questions.md` for the full Q&A record backing
every deviation and deferral above. Upstream artifacts:
`u1-backend-api/infrastructure-design/infrastructure-specification.md`,
`u2-admin-api/infrastructure-design/infrastructure-specification.md`,
`deployment-pipeline/cd-config.md`.
