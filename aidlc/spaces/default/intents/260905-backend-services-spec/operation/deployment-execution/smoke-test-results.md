# Deployment Execution — Smoke Test Results

Conversation language: English

Critical-path smoke checks, run directly against the live production ALB/domain
after deployment, not simulated.

| Check | Method | Result |
|---|---|---|
| Public health endpoint | `curl https://api.guestguideiq.com/health` | `200 {"status":"ok"}` |
| Database-connected health endpoint | `curl https://api.guestguideiq.com/health/ready` | `200 {"status":"ready"}` — confirms the app can actually reach and query PostgreSQL, not just that the process is alive |
| HTTP → HTTPS redirect | `curl -o /dev/null -w "%{http_code}" http://api.guestguideiq.com/health` | `301` |
| TLS certificate validity | `openssl s_client -connect api.guestguideiq.com:443` | Valid, `CN=api.guestguideiq.com`, expires 2027-03-23 |
| DNS resolution | `nslookup api.guestguideiq.com` (polled after the CNAME record was added) | Resolves to the ALB |
| ECS service health | `aws ecs describe-services` | `ACTIVE`, 2/2 tasks running |
| Post-deletion-protection-fix re-check | `curl https://api.guestguideiq.com/health` after Deployment 2 | `200 {"status":"ok"}` — confirms the property-only RDS update caused no disruption |

All critical-path checks passed. No synthetic/canary monitoring is configured
yet — that's Observability Setup's concern, not this stage's.
