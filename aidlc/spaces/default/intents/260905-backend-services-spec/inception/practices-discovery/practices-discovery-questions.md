# Practices Discovery — Interview Questions

These questions cover the five areas of `team-practices.md`: Way of Working, Walking Skeleton, Testing Posture, Deployment, and Code Style. They ask only what the repository evidence and the three specialist reviews (quality, developer, devsecops) could not establish on their own — see `evidence.md` for the full trace.

---

## Q1: Repository work style

Your git history shows solo, linear commits straight to `main` — no feature branches, no pull requests visible. Going forward, how should contributors work?

- A. Commit directly to `main` (fast-moving, no required review)
- B. Always use short-lived feature branches, merged via pull request after review
- C. Feature branches for larger backend changes; small fixes can go straight to `main`
- X. Other (please specify)

[Answer]: B. Always use short-lived feature branches, merged via pull request after review

---

## Q2: Where the backend code lives

Should the new backend live in this repository, or on its own?

- A. Same repo, in a new folder (e.g. `server/`) alongside the existing site
- B. Same repo, converted into an npm workspace (frontend and backend as separate packages)
- C. A separate repository
- X. Other (please specify)

[Answer]: C. A separate repository

---

## Q3: Walking skeleton

Build a thin end-to-end slice first? A walking skeleton is a minimal version that runs the whole way through — e.g. one real API route reachable from the site — built first to prove the pieces connect before the real features go in.

- A. Yes
- B. No
- X. Other (please specify)

[Answer]: A. Yes

---

## Q4: Testing approach

There's no existing backend to inherit a testing convention from. What approach do you want for the new backend?

- A. Test-driven: write the test before the code it tests
- B. Behavior-driven: write out the scenario (given/when/then) before implementing, then add lower-level tests after
- C. Test-after: implement each part, then write its tests
- D. A mix — e.g. behavior scenarios written first, with unit tests added after implementation
- X. Other (please specify)

[Answer]: B. Behavior-driven: write out the scenario (given/when/then) before implementing, then add lower-level tests after

---

## Q5: Blocking CI checks on pull requests

Right now nothing blocks a change from being deployed even if the build is broken — there's no automated check before a merge or deploy. For the new backend, should every pull request be blocked from merging unless the build, lint, and tests all pass?

- A. Yes — require a green check (build + lint + test + coverage) before merge
- B. No — keep deploying without an automated gate
- X. Other (please specify)

[Answer]: A. Yes — require a green check (build + lint + test + coverage) before merge

---

## Q6: Deployment topology for the backend

Every push to `main` currently deploys straight to the live production site — no staging environment, no approval step. The new backend will introduce real data and likely logins, which raises the stakes of a bad deploy. What do you want for it?

- A. Add a staging environment with manual approval before production (the safer default)
- B. Keep the current model: push to `main` deploys straight to production
- C. Add a staging environment, but auto-promote to production without a manual approval step
- X. Other (please specify)

[Answer]: A. Add a staging environment with manual approval before production (the safer default)

---

## Q7: Dependency and secret scanning

The site today has zero automated security scanning — reasonable for a static site with no secrets or database. The new backend will likely hold credentials (database connection, API keys). Do you want automated dependency-vulnerability scanning and secret scanning set up from day one?

- A. Yes, set up both from day one (recommended)
- B. Just dependency-vulnerability scanning for now
- C. Handle it later, once the backend takes shape
- X. Other (please specify)

[Answer]: A. Yes, set up both from day one (recommended)

---

## Q8: Linting and formatting enforcement

Nothing today enforces a code formatter or linter on this repo — style is just followed by convention. For the new backend, how strict do you want to be?

- A. Set up a linter + formatter and enforce them as a blocking PR check from day one
- B. Set up a linter + formatter, but keep them advisory only (warnings, not blocking)
- C. Skip formal tooling for now
- X. Other (please specify)

[Answer]: A. Set up a linter + formatter and enforce them as a blocking PR check from day one

---

## Consolidated Summary Confirmation

- Looks correct
- Request changes

[Answer]: Looks correct
