# Feedback & Optimization — Drift Report

Conversation language: English

## Starting state (before this stage)


AWS Config's configuration recorder was active and recording
(`lastStatus: SUCCESS`, confirmed via `aws configservice
describe-configuration-recorder-status`), but **zero Config Rules were
attached** — so despite Config recording every resource's configuration
history, no automated compliance/drift evaluation was actually running.
`aws configservice get-compliance-summary-by-config-rule` returned 0
compliant and 0 non-compliant resources, confirming no rules existed to
evaluate against.

## Action taken this stage (Q2: add baseline Config Rules now)

Six AWS-managed Config Rules were added directly via
`aws configservice put-config-rule` (no Lambda required — all are
AWS-owned managed rule sources), matching the account's existing pattern
of CLI-provisioned account-level guardrails (Budget, GuardDuty, Access
Analyzer, etc., all set up the same way earlier this session):

| Rule name | Managed rule | Checks |
|---|---|---|
| `guestguideiq-s3_bucket_public_read_prohibited` | `S3_BUCKET_PUBLIC_READ_PROHIBITED` | No S3 bucket allows public read |
| `guestguideiq-s3_bucket_public_write_prohibited` | `S3_BUCKET_PUBLIC_WRITE_PROHIBITED` | No S3 bucket allows public write |
| `guestguideiq-rds_storage_encrypted` | `RDS_STORAGE_ENCRYPTED` | RDS instance storage is encrypted |
| `guestguideiq-rds_instance_public_access_check` | `RDS_INSTANCE_PUBLIC_ACCESS_CHECK` | RDS instance is not publicly accessible |
| `guestguideiq-iam_root_access_key_check` | `IAM_ROOT_ACCESS_KEY_CHECK` | No access keys exist on the root account |
| `guestguideiq-restricted_incoming_traffic` | `RESTRICTED_INCOMING_TRAFFIC` | No security group allows unrestricted ingress on sensitive ports |

All 6 confirmed `ConfigRuleState: ACTIVE` via `describe-config-rules`
immediately after creation.

## Evaluation status (honest, not assumed)

At the time this report was written, all 6 rules returned
`ComplianceType: INSUFFICIENT_DATA` via `describe-compliance-by-config-rule`
— AWS Config had not yet run its first evaluation pass (periodic
evaluation triggers can take up to several hours after a rule is created;
an on-demand `start-config-rules-evaluation` was attempted but hit
`LimitExceededException` from creating 6 rules in quick succession). **No
compliance/drift result is reported here because none exists yet** — this
is not being overstated as "all compliant" or glossed over.

## Follow-up (carried to `feedback-loop.md`)

Check `aws configservice describe-compliance-by-config-rule` again in a
few hours once the first evaluation pass completes, and address any
`NON_COMPLIANT` findings at that time. Given the infrastructure's
established state (RDS encrypted, S3 buckets already public-access-blocked
account-wide, no root access keys ever provisioned per this session's
earlier account-hardening work), a clean first pass is expected but not
yet confirmed.

## Traceability

See `feedback-optimization-questions.md` for the full Q&A record.
