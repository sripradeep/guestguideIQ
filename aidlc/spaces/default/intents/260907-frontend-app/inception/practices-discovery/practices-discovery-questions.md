# Practices Discovery — Interview

Re-run for the frontend intent. The baseline is the set of practices affirmed
on 2026-09-05 for the backend intent (`aidlc/spaces/default/memory/team.md`
and `project.md`). This interview settles which of those carry over to
frontend work, which need frontend-specific specialisation, and which do not
apply.

Sources feeding these questions: the lead draft (`team-practices.md`,
`discovered-rules.md`, `evidence.md`) and three independent reviews
(`contributions/aidlc-quality-agent.md`,
`contributions/aidlc-developer-agent.md`,
`contributions/aidlc-devsecops-agent.md`).

---

## Batch 1 — Way of Working, Walking Skeleton, carried-over practices, Code Style

### Q1. Where should the frontend code live?

The backend's answer (its own separate repository) was scoped explicitly to
the backend, so it does not settle this. The choice also decides whether a
shared API-types package between frontend and backend is even possible.

- A. Its own new repository, alongside the backend repo
- B. Inside the existing marketing-site repo (`guestguideIQ`)
- C. In the backend repo (`guestguideiq-app`) as a workspace/monorepo package
- X. Other (please specify)

[Answer]: A. Its own new repository, alongside the backend repo

### Q2. Build a thin end-to-end slice first?

A walking skeleton is a minimal version that runs the whole way through,
built first to prove the pieces connect before the real features go in. The
affirmed backend practice says yes and runs that first Bolt solo and gated.

- A. Yes — prove the Owner path (signup through to a published guide)
- B. Yes — prove the Guest path (open a stay link and view the guide)
- C. No — build the first Bolt like any other
- X. Other (please specify)

[Answer]: A. Yes - prove the Owner path (signup through to a published guide)

### Q3. Which affirmed backend practices carry over to the frontend unchanged?

Each of these is currently affirmed "for backend work". Select every one that
should apply to frontend work too.

- Short-lived feature branches merged via reviewed pull request
- Blocking linter + formatter as a required PR check from day one
- Automated dependency-vulnerability scanning from day one
- Automated secret scanning from day one
- A green CI check (build, lint, test, coverage) required before merge

[Answer]: All five - short-lived feature branches merged via reviewed pull request; blocking linter + formatter as a required PR check from day one; automated dependency-vulnerability scanning from day one; automated secret scanning from day one; a green CI check (build, lint, test, coverage) required before merge

### Q4. Frontend file-naming convention

The affirmed rule carries the marketing site's `camelCase.ts` for config and
data files, plus `PascalCase` for component-like constructs. The developer
review flagged that a component-framework frontend makes these collide: the
first component file would violate one of them.

- A. `PascalCase` for component files, `camelCase` for everything else
- B. `camelCase` throughout, including components
- C. Defer until the component framework is chosen
- X. Other (please specify)

[Answer]: A. `PascalCase` for component files, `camelCase` for everything else

---

## Batch 2 — Testing Posture, Deployment, security direction, backend prerequisites

(Presented after Batch 1 is answered.)

### Q5. What should frontend tests run against?

Every option has a prerequisite that does not exist today: production CORS
allows only the marketing site, and `ALLOWED_ORIGINS` is absent from the
backend's `.env.example`, so localhost cannot reach the API at all.

- A. Intercepted network (mocked) - no live backend
- B. Live staging backend
- C. Both - mocked network for unit/component tests, a thin live-backend E2E suite
- X. Other (please specify)

[Answer]: C. Both - mocked network for unit/component tests, a thin live-backend E2E suite

### Q6. Staging tier and manual approval before production, for the frontend?

- A. Yes - same as the backend (staging on merge, manual approval before production)
- B. Yes, but for the Owner app only; the Guest app deploys straight through
- C. No - deploy on merge to a single environment, like the marketing site
- X. Other (please specify)

[Answer]: A. Yes - same as the backend

### Q7. Token storage / same-origin proxy - settle now or at design?

The backend's CORS has `credentials` disabled, so cookie auth is impossible
and bearer tokens fall to the frontend, where an XSS yields a 7-day refresh
token with no revocation endpoint. A same-origin reverse proxy would fix both
this and the Host-header tenancy blocker.

- A. Aim for a same-origin proxy; record the intent now
- B. Defer to design (`nfr-design` / `infrastructure-design`), where hosting is chosen
- C. Accept bearer-token storage and its XSS exposure
- X. Other (please specify)

[Answer]: B. Defer to design

### Q8. Two backend prerequisites - how should they be handled?

No endpoint creates a `Stay`, so the Guest app has no supply side; and no
frontend origin - not even localhost - can call the API.

- A. Scope a backend follow-up to land before frontend Construction starts
- B. Carry into requirements-analysis as explicit prerequisites
- C. Handle during Construction, when each actually blocks a Bolt
- X. Other (please specify)

[Answer]: A. Scope a backend follow-up first

---

## Consolidated Summary Confirmation

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
