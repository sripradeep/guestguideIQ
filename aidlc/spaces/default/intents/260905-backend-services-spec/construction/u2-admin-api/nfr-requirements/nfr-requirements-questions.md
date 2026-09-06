# NFR Requirements — Plan & Questions — u2-admin-api

`u2-admin-api` owns no entities and hosts only `Admin` — every capability is a thin, authenticated delegation into `u1-backend-api`'s internal API (`rules.md` BR1.1-BR1.6). Most of `u1-backend-api`'s NFR decisions (database, primary language ecosystem, observability approach) transfer here by consistency; this pass has three genuine questions specific to this Unit's own trust boundary — the reason it was split into its own Unit in the first place (Units Generation Q1).

---

## Q1: Language and framework for `admin-api`?

- A. Same as `u1-backend-api`: Node.js + TypeScript + Fastify — Recommended. `admin-api` is a thin delegation layer with no domain logic of its own (`rules.md`: 6 rules, all authorization/policy, zero validation); there is no technical reason to diverge, and a shared stack keeps the small team's tooling, linting, and CI pipeline uniform across both repos' deployable units (they remain two independently deployable services within the same overall codebase per Units Generation's chosen two-service split).
- B. A different stack, to reinforce the deployment/trust separation from `u1-backend-api` at the technology level too
- X. Other (please specify)

[Answer]: A. Same as `u1-backend-api`: Node.js + TypeScript + Fastify — Recommended. `admin-api` is a thin delegation layer with no domain logic of its own (`rules.md`: 6 rules, all authorization/policy, zero validation); there is no technical reason to diverge, and a shared stack keeps the small team's tooling, linting, and CI pipeline uniform across both repos' deployable units (they remain two independently deployable services within the same overall codebase per Units Generation's chosen two-service split).

---

## Q2: Ops-staff authentication mechanism for `admin-api` itself (BR1.1)?

This is the one identity question `u1-backend-api`'s NFR pass didn't answer — Property Owner/Guest auth there doesn't cover how ops staff authenticate to `admin-api`.

- A. Reuse the same JWT scheme as `u1-backend-api`, with an `ops` role claim scoped to `admin-api` only — Recommended for this stage. Reuses already-decided infrastructure (no second auth system to build/maintain) while still keeping `admin-api` a separately deployed, separately reachable service (the actual isolation the trust-boundary split was for, per Units Generation's rationale, is network/deployment separation — Admin's blast radius if compromised — not necessarily a second identity provider).
- B. A separate identity provider dedicated to ops staff (e.g. a dedicated IAM Identity Center / Cognito user pool) — stronger separation, appropriate if the team wants ops credentials to never share infrastructure with customer-facing auth at all, at the cost of a second system to build and maintain this early.
- X. Other (please specify)

[Answer]: A. Reuse the same JWT scheme as `u1-backend-api`, with an `ops` role claim scoped to `admin-api` only — Recommended for this stage. Reuses already-decided infrastructure (no second auth system to build/maintain) while still keeping `admin-api` a separately deployed, separately reachable service (the actual isolation the trust-boundary split was for, per Units Generation's rationale, is network/deployment separation — Admin's blast radius if compromised — not necessarily a second identity provider).

---

## Q3: Machine-to-machine credential for `admin-api` → `backend-api`'s internal API (Contract 1)?

The network isolation mechanism itself (VPN, private subnet, IP allowlist) is deferred to `infrastructure-design` (per `contract-summary.md`'s open question, reaffirmed in `u1-backend-api/nfr-requirements/security-requirements.md` NFR3.11) — this is the separate question of how the *calling service itself* proves its identity to the internal listener, regardless of which network path gets it there.

- A. A short-lived service JWT issued by `backend-api`'s own auth infrastructure, scoped to internal-only claims (distinct from both the ops-staff JWT in Q2 and the Property-Owner-facing JWT) — Recommended. Reuses the JWT mechanism already decided for `u1-backend-api`, avoiding a third distinct auth mechanism in the system, while still being a credential Property Owner/Guest tokens could never satisfy (different scope/claims, different issuing path).
- B. Mutual TLS (mTLS) client certificates — stronger cryptographic guarantee, but adds certificate issuance/rotation operational overhead this pre-launch phase may not yet justify.
- X. Other (please specify)

[Answer]: A. A short-lived service JWT issued by `backend-api`'s own auth infrastructure, scoped to internal-only claims (distinct from both the ops-staff JWT in Q2 and the Property-Owner-facing JWT) — Recommended. Reuses the JWT mechanism already decided for `u1-backend-api`, avoiding a third distinct auth mechanism in the system, while still being a credential Property Owner/Guest tokens could never satisfy (different scope/claims, different issuing path).

---

## Consolidated Summary Confirmation

- `admin-api` shares `u1-backend-api`'s language/framework stack (Q1), since it has no domain logic requiring a different one.
- Ops-staff authenticate via a role-scoped JWT reusing the same auth infrastructure as `u1-backend-api` (Q2) — the trust-boundary isolation from Units Generation is expressed as network/deployment separation, not a second identity provider.
- `admin-api` authenticates itself to `backend-api`'s internal API via a distinct, internal-only-scoped service JWT (Q3) — a third, narrower credential type than either customer or ops-staff tokens.
- All other NFR decisions (database — none needed here, since `Admin` owns no entities; observability approach; billing/LLM/event-source — not applicable to this Unit) inherit `u1-backend-api`'s decisions by reference rather than being re-litigated.
- `performance-requirements.md`, `security-requirements.md`, `scalability-requirements.md`, `reliability-requirements.md`, `observability-requirements.md`, `tech-stack-decisions.md`, and `traceability.json` will be generated reflecting all of the above — most categories will be markedly lighter than `u1-backend-api`'s given this Unit's much smaller surface (4 ops-only workflows, zero entities, ops-only traffic).

- Looks correct
- Request changes

[Answer]: Looks correct
