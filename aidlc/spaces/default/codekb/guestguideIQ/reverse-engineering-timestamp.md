# Reverse Engineering Timestamp — guestguideIQ

- **Date performed**: 2026-09-05
- **Intent**: `260905-backend-services-spec`
- **Repo**: `guestguideIQ` (workspace root, unrecorded project-root repo)
- **Git commit at time of scan**: `2812203810e465cf17d8e98a13967f173794baec`
  ("Install AI-DLC workflow engine (AWS Labs)")
- **Scan kind**: `full` — first scan of this repo, `NO_STORE` (no prior CodeKB
  entry existed for `guestguideIQ`). Full-repo enumeration was performed
  (directory listing across the entire repo excluding `.git`, `node_modules`,
  and the `aidlc/` workspace tree) to confirm no source surface beyond what is
  listed in `Scan Coverage` exists.
- **Performed by**: developer-agent (code scan) → architect-agent (synthesis
  into this CodeKB entry), per the reverse-engineering pipeline (link 2 of 2).

## Scope of Analysis

```yaml
scope_version: 1
kind: full
intent: 260905-backend-services-spec
fingerprint: 630e6bbddd8a89b5e198b8c751f24b17bf192657
analyzed:
  paths:
    - ./
  components:
    - Site Shell
    - Page Routes
    - Lead Capture Forms
    - Experience Content
    - Site Configuration
    - Build & Deployment Pipeline
shallow:
  paths:
    - .astro/
    - dist/
    - .claude/
    - .mcp.json
    - node_modules/
```
