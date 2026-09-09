# Environment Provisioning — Questions

Conversation language: English

This stage formalizes environment provisioning for `u1-backend-api` and
`u2-admin-api`. Production for `u1-backend-api` was already provisioned and
verified live during this session (AWS account `774888248078`, `us-east-1`) —
these questions confirm known deviations from `infrastructure-specification.md`
and decide what (if anything) still needs doing before this stage's inventory
and validation report are written.

## Q1 — Scope: dev/staging environments

`infrastructure-specification.md` calls for dev, staging, and production as
three environment-parameterized stacks. Only **production** was provisioned
this session — an earlier explicit choice to deploy production only, skipping
dev/staging-first validation, given the urgency of getting a working
end-to-end deploy. Should this stage's inventory record dev/staging as
**not yet provisioned** (a deliberate, scoped deferral) rather than a gap?

- A. Yes — record dev/staging as deferred; production-only is the current scope
- B. Provision dev/staging now, as part of this stage
- C. Record dev/staging as deferred, but flag it as a near-term follow-up in the validation report
- X. Other (please specify)

[Answer]: A. Yes — record dev/staging as deferred; production-only is the current scope

## Q2 — Missing: AWS WAF on u1's ALB

The spec calls for WAF rate-based rules on `u1-backend-api`'s ALB (per-IP
thresholds on signup, password-reset, guest-link resolution, and lead-form
endpoints). None were implemented — the deployed stack relies solely on the
application's own in-memory token-bucket rate limiting (per `nfr-design`).
How should this gap be handled?

- A. Add the WAF rate-based rules now, before closing this stage
- B. Accept the in-app rate limiting as sufficient for now; record WAF as a deferred hardening item
- C. Add only the highest-priority rule (signup) now; defer the rest
- X. Other (please specify)

[Answer]: B. Accept the in-app rate limiting as sufficient for now; record WAF as a deferred hardening item

## Q3 — Missing: ECS auto-scaling policy

The spec calls for auto-scaling from 2 to 6 Fargate tasks on CPU>70% (or
request-count-per-target). The deployed stack sets a fixed `desiredCount: 2`
with no scaling policy at all. Add the auto-scaling policy now, or defer?

- A. Add the auto-scaling policy now
- B. Defer — current traffic doesn't yet justify it; record as a follow-up
- X. Other (please specify)

[Answer]: B. Defer — current traffic doesn't yet justify it; record as a follow-up

## Q4 — Deviation: DNS via external provider, not Route 53

The spec calls for Route 53 to host DNS. In practice, `api.guestguideiq.com`
was pointed at the ALB via a CNAME record added directly with the domain's
existing external DNS provider (the same one hosting the marketing site's
apex domain) — Route 53 was never provisioned. Should this deviation be
accepted going forward, or is migrating to Route 53 planned?

- A. Accept the external-DNS-provider approach permanently; update the spec to match reality
- B. Plan to migrate to Route 53 later; record as a follow-up
- X. Other (please specify)

[Answer]: A. Accept the external-DNS-provider approach permanently; update the spec to match reality

## Q5 — Deviation: ACM certificate requested manually, not programmatically

The spec describes certificates being requested programmatically once
`admin-api`'s locality-brand/domain-creation workflow (W4) completes. Since
that workflow doesn't exist yet (it's part of the not-yet-built frontend),
the current ACM certificate for `api.guestguideiq.com` was requested manually
via the AWS CLI, DNS-validated by hand, and hardcoded into
`infra/bin/backend-api.ts`'s `domainConfig`. Is this acceptable as the interim
state until the locality-brand workflow exists?

- A. Yes — acceptable interim state; automate once the locality-brand workflow is built
- B. No — automate certificate issuance now, ahead of the locality-brand workflow
- X. Other (please specify)

[Answer]: A. Yes — acceptable interim state; automate once the locality-brand workflow is built

## Q6 — u2-admin-api has never been deployed

Only `u1-backend-api` was deployed to AWS this session. `u2-admin-api` has
been synthesized and tested locally/in CI, but has no live AWS environment at
all — including the SSM parameters `u1`'s stack needs to publish
(`/guestguideiq/{env}/vpc-id`, ECS cluster name/security group, subnet ids)
for `u2` to actually consume them, and the hardcoded `availabilityZones`
placeholder in `u2`'s stack that still needs parameterizing. Should this
stage also provision `u2-admin-api` to production now, or is that explicitly
out of scope for this pass?

- A. Provision u2-admin-api now, as part of this stage
- B. Out of scope for this stage — u1 was the priority; u2's environment provisioning is a separate, later pass
- X. Other (please specify)

[Answer]: B. Out of scope for this stage — u1 was the priority; u2's environment provisioning is a separate, later pass

## Q7 — RDS deletion protection currently disabled

`deletionProtection` on the production RDS instance was temporarily set to
`false` during this session's bring-up (the stack repeatedly hit
`ROLLBACK_FAILED` because deletion protection blocked automatic rollback of a
still-in-progress create, before the stack ever reached `CREATE_COMPLETE`).
The stack has now reached `CREATE_COMPLETE` and is running stably in
production with real infrastructure. Should deletion protection be
re-enabled now?

- A. Yes — re-enable deletion protection now that the stack is stable
- B. Not yet — wait for a longer track record of stable deploys first
- X. Other (please specify)

[Answer]: A. Yes — re-enable deletion protection now that the stack is stable

## Consolidated Summary Confirmation

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
