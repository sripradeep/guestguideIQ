**Collaborator:** aidlc-devsecops-agent

## Contribution

Reviewed `team-practices.md`, `discovered-rules.md`, and `evidence.md` against the repository evidence (`code-quality-assessment.md`, `dependencies.md`) with a security-pipeline lens: lint/format rules, SAST/DAST, secret scanning, dependency scanning, and supply-chain controls. The draft's overall framing (thin evidence, brownfield frontend, new backend from scratch) is accurate. My findings add security-specific detail the draft does not yet surface, since the current lead draft's "Code Style" section stops at formatter/linter and does not address the other four pipeline-security dimensions in scope for this review.

### 1. No security scanning of any kind exists today — this is a finding, not an absence to gloss over

Confirmed from `code-quality-assessment.md` and `dependencies.md`:
- **No SAST**: no Semgrep/CodeGuru/SonarQube/ESLint-security config anywhere in the repo; no `.github/workflows/` step runs any static analysis. `deploy.yml`'s only step is `npm run build`.
- **No secret scanning**: no `.gitleaks.toml`, no `git-secrets` hook config, no GitHub secret-scanning-related repo file (though GitHub's native secret scanning may be enabled server-side on the hosting account — this, like branch protection, is **not visible from repository file contents** and should be an explicit interview question, not assumed either way).
- **No dependency/vulnerability scanning**: confirmed by `dependencies.md` — no `npm audit` step in CI, no Dependabot config (`.github/dependabot.yml` absent), no Renovate config. Currently low-consequence given only two direct npm dependencies (`astro`, `@astrojs/sitemap`), but this will not remain true once a backend is added with its own dependency tree (server framework, ORM/DB driver, auth library, etc.).
- **No SBOM generation** — no Syft/Trivy/CycloneDX output anywhere.
- **No IaC scanning** — moot today (no IaC exists), but directly relevant to this intent since backend infrastructure will very likely introduce CloudFormation/CDK/Terraform, which should ship with `cfn-nag`/`Checkov`/`cdk-nag` from the first commit rather than retrofitted later.
- **No DAST** — moot today (no running application/API to attack), but becomes directly relevant the moment this intent's backend exposes HTTP endpoints.

This should be added to `team-practices.md` under `## Code Style` (or a new `## Security Tooling` subsection) as its own explicitly-labeled `[inferred]` finding, parallel in structure to the existing Formatter/Linter bullets — right now the draft only speaks to formatting/linting and is silent on the security-scanning dimensions entirely, which understates the gap.

### 2. Supply-chain posture: low current risk, but the transition point is now

`dependencies.md` correctly notes only two direct dependencies with no lockfile drift. That is accurate but is about to become obsolete the moment backend work starts: a server framework, database driver, auth/session library, and any AWS SDK usage will each pull in transitive trees an order of magnitude larger than the current site. Recommend flagging in `team-practices.md`'s Testing Posture / Deployment sections (or a new Security Tooling section) that **dependency scanning (Dependabot/Renovate + `npm audit` or Snyk in CI) should be a day-one decision for the backend**, not a retrofit — greenfield backend work is exactly the point at which adding this is nearly free, and retrofitting it onto an established dependency graph later is materially more disruptive (noisy first scan, backlog of pre-existing CVEs to triage).

### 3. Type-checking gap has a security dimension worth naming explicitly

The draft already correctly identifies (`team-practices.md` Testing Posture, and `code-quality-assessment.md` Linting section) that CI runs `astro build` not `astro check`, so type errors surface only as warnings. Worth adding: for a backend handling untrusted input, this class of gap (a check that exists but isn't wired as a blocking gate) is the same failure pattern that would let a security scanner exist without ever blocking a merge — i.e., "tool installed, not enforced" is a security anti-pattern independent of which tool it is. Recommend the interview confirm not just *which* scanners the team wants for the backend, but that each one is wired as a **blocking** CI gate (per org default: "linter run in CI before merge; failure blocks the PR"), not merely present and advisory.

### 4. Deployment topology gap has security implications beyond what's noted

The draft (`team-practices.md` Deployment) already flags the single-environment, no-staging, no-manual-approval deploy-on-merge model as an open interview question. Adding a security angle: for the current static site this is low-risk (no runtime, no secrets, no persistent data — confirmed by `code-quality-assessment.md`'s "Positive Findings," no secrets/credentials found anywhere in scanned source). That risk profile changes materially once a backend with persistent data, authentication, and likely secrets/credentials (DB connection strings, API keys, session signing keys) exists. Recommend the interview also cover: where will the backend's secrets live (AWS Secrets Manager / SSM Parameter Store per org security defaults — never in code, env files, or `site.config.ts`-style checked-in config), and does the org-default staging + manual-production-approval gate become mandatory once secrets and persistent state exist, even if the team elects to keep the frontend's lighter-weight model.

### 5. No conflicting or contradicted claims found

I did not find any factual claim in `team-practices.md`, `discovered-rules.md`, or `evidence.md` that contradicts the CodeKB evidence (`dependencies.md`, `code-quality-assessment.md`) from a security-tooling perspective. The draft's characterization of "CI is minimal" is, if anything, slightly generous from a security lens — it should explicitly enumerate the five missing scanning categories (SAST, DAST, secret scanning, dependency scanning, IaC scanning) rather than only naming lint/format and test/PR-gate gaps, since a reader of `team-practices.md` alone would not otherwise learn that zero security scanning exists.

## Positions

- AGREE: The draft's core inference — brownfield frontend has essentially no enforced quality or security tooling, and all defaults should be confirmed rather than assumed for the new backend — is well-supported by the evidence and correctly labeled `[inferred]`/`[unconfirmed]` throughout.
- AGREE: Flagging deployment topology (staging/manual-approval gate) as an open interview question rather than asserting the org default is the right call, and my addition (secrets-handling implications) is a refinement, not a disagreement.
- OBJECT: `team-practices.md`'s `## Code Style` section addresses only formatter/linter and is silent on SAST, DAST, secret scanning, dependency scanning, and IaC scanning — for a stage explicitly scoped to spec a new backend (which will have real attack surface, unlike the current static site), this is a gap in the draft's coverage, not just a missing nice-to-have. Recommend the lead add a `## Security Tooling` subsection (or expand Code Style) capturing the five-category gap identified above as explicit `[inferred]` findings, with each surfaced as an interview question for the new backend.
