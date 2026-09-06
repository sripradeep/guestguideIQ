#!/usr/bin/env bun
// Regression test for workspaceSourceState()'s multi-repo roof branch not
// resolving worktree context (aidlc-lib.ts).
//
// Bug report context: intent 260905-backend-services-spec is multi-repo
// (paired with a sibling repo), so workspaceSourceState() takes the
// `repos.length > 0` branch. That branch computed the roof's filesystem
// identity as:
//
//   filesystemSourceIdentity(projectDir, true, roofExcluded)
//
// hardcoding `carriesWorkspaceShell = true` unconditionally. The single-repo
// branch just above it does this correctly:
//
//   filesystemSourceIdentity(projectDir, worktreeContext?.carriesWorkspaceShell ?? true)
//
// first resolving `.aidlc/worktree-meta.json` via worktreeSourceExclusionContext.
//
// Why this matters even though `multiRepoRoofExcludedTopLevel` ALSO excludes
// every top-level directory (registered repos and, by design, anything else
// unless `.aidlc-source-paths.json` re-registers it): the wholesale
// `carriesWorkspaceShell && entry.name === "aidlc"` walker check
// (aidlc-lib.ts, the directory-walk's top-level shell exclusion) is
// UNCONDITIONAL - unlike the `excludedTopLevel`/multiRepoRoofExcludedTopLevel
// check right next to it, it has no `registeredPathRelevant` escape hatch. So
// once a real path is explicitly registered as source (a team's declared
// override for exactly this "we have real content under a directory that
// collides with the framework's own top-level `aidlc/` name" situation - the
// framework's own comments call out the analogous `src/aidlc/parser.ts`
// case), the hardcoded `true` still silently drops it from the fingerprint
// whenever `projectDir` is actually a Bolt worktree scoped to ONE repo
// (repoSelector set -> the real carriesWorkspaceShell is false, with a narrow
// exact-path exclusion list instead of the wholesale name exclusion). A
// registered path must win against the wholesale name-collision exclusion in
// that case; it could not, before this fix, no matter what the team
// registered.
//
// This test drives workspaceSourceFingerprint() against a throwaway fixture
// shaped like a repo-scoped Bolt worktree: `.aidlc/worktree-meta.json` with
// `repoSelector` set and `intentRecord` pointing at the mirrored record, a
// top-level `aidlc/` directory holding the mirrored record PLUS an explicitly
// REGISTERED real-source file that merely collides on the top-level name.
// Editing the mirrored record (the audit shard) must NOT move the
// fingerprint. Editing the registered file MUST move it - before the fix it
// could not, because the wholesale top-level `aidlc` exclusion caught it
// regardless of registration.
import { test, expect } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  appendIntentToRegistry,
  workspaceSourceFingerprint,
} from "./aidlc-lib.ts";

test("multi-repo workspaceSourceFingerprint resolves worktree context for the roof instead of hardcoding carriesWorkspaceShell=true", () => {
  const root = mkdtempSync(join(tmpdir(), "aidlc-multi-repo-worktree-"));
  const projectDir = realpathSync(root);
  try {
    const dirName = "backend-services-spec-deadbeef";
    const uuid = "deadbeef-0000-4000-8000-000000000001";
    // Register the intent WITH a repos row so intentRepos() takes the
    // multi-repo branch in workspaceSourceState().
    appendIntentToRegistry(projectDir, {
      uuid,
      slug: "backend-services-spec",
      dirName,
      repos: ["backend-repo"],
      status: "in-flight",
    });
    const intentRecord = `aidlc/spaces/default/intents/${dirName}`;
    const recordDir = join(projectDir, ...intentRecord.split("/"));
    mkdirSync(join(recordDir, "audit"), { recursive: true });
    const auditShard = join(recordDir, "audit", "shard.md");
    writeFileSync(auditShard, "# AI-DLC Audit Log\n\n## Session Start\n");

    // Shape this fixture root as a Bolt worktree scoped to ONE repo: the
    // sibling repo dir itself does not need to exist here (missing repos are
    // a stable, deliberate "<name>=missing" line - see workspaceSourceState).
    mkdirSync(join(projectDir, ".aidlc"), { recursive: true });
    writeFileSync(
      join(projectDir, ".aidlc", "worktree-meta.json"),
      JSON.stringify({ repoSelector: "backend-repo", intentRecord }),
    );

    // Real application content that happens to collide with the framework's
    // own top-level `aidlc/` shell name, OUTSIDE the mirrored record subpath -
    // and explicitly registered as source, the team's documented escape hatch
    // for exactly this collision.
    const collidingFile = join(projectDir, "aidlc", "README.md");
    writeFileSync(collidingFile, "v1\n");
    writeFileSync(
      join(projectDir, ".aidlc-source-paths.json"),
      JSON.stringify({ version: 1, paths: ["aidlc/README.md"] }),
    );

    const before = workspaceSourceFingerprint(
      projectDir,
      dirName,
      "default",
    );
    expect(before).not.toBeNull();

    // Editing the mirrored intent record (what a review-verdict audit write
    // does) must NOT move the fingerprint - it is the one thing the exact-path
    // exclusion is supposed to protect.
    writeFileSync(
      auditShard,
      "# AI-DLC Audit Log\n\n## Session Start\n\n## Human Turn\n",
    );
    const afterAuditWrite = workspaceSourceFingerprint(
      projectDir,
      dirName,
      "default",
    );
    expect(afterAuditWrite).toBe(before);

    // Editing the REGISTERED real-source file must move the fingerprint.
    // Before the fix, the hardcoded `carriesWorkspaceShell: true` wholesale-
    // excluded the entire top-level `aidlc/` directory by name unconditionally
    // - a check with no registered-path escape hatch - so this edit was
    // silently invisible no matter what `.aidlc-source-paths.json` declared.
    writeFileSync(collidingFile, "v2\n");
    const afterRealEdit = workspaceSourceFingerprint(
      projectDir,
      dirName,
      "default",
    );
    expect(afterRealEdit).not.toBeNull();
    expect(afterRealEdit).not.toBe(before);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
