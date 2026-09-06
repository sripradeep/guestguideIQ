#!/usr/bin/env bun
// Regression test for aidlc-plan-approval-guard.ts's trusted-record-target
// resolution not supporting multi-unit Code Generation stage completion.
//
// Bug report context: for a Code Generation stage with 2+ units, the guard's
// mutation-check branch derived the ONLY trusted record dir from the active
// directive marker's single `unit` field, never from every unit applicable to
// the stage. Once one unit's own code-generation is marked complete, the
// engine's active directive only ever points at the OTHER (still
// in-progress) unit - so if that completed unit's review receipt then goes
// stale, there was no in-band way to write a fresh `## Review` appendix to
// that unit's own code-generation-plan.md: the guard refused every
// Edit/Write to it, citing "for unit <other-unit>".
//
// The fix widens trust from "only the active directive's unit" to "every
// unit gatherApprovalEvidence/knownUnits() consider applicable to this stage
// attempt" (plus the stage-level dir). This drives the exported, pure,
// filesystem-only outsideTrustedCodeGenerationRecord/
// trustedCodeGenerationRecordDirs helpers directly - no directive/state/
// session machinery needed to exercise this exact boundary - covering:
//   (a) writes to the current unit's directory still work
//   (b) writes to another unit's directory listed in `units` now work
//   (c) writes to a unit's directory NOT listed in `units` are still refused
//   (d) writes outside any unit's code-generation directory are still refused
import { test, expect } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  outsideTrustedCodeGenerationRecord,
  trustedCodeGenerationRecordDirs,
} from "./aidlc-plan-approval-guard.ts";
import { codeGenerationRecordDir } from "../tools/aidlc-testing-posture.ts";

function withFixture(run: (projectDir: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), "aidlc-plan-approval-guard-"));
  const projectDir = realpathSync(root);
  try {
    run(projectDir);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("trustedCodeGenerationRecordDirs resolves one dir per unit, plus the stage-level dir for unit: null", () => {
  withFixture((projectDir) => {
    const dirs = trustedCodeGenerationRecordDirs(projectDir, [
      { unit: null },
      { unit: "u1-backend-api" },
      { unit: "u2-admin-api" },
    ]);
    expect(dirs).toEqual([
      codeGenerationRecordDir(projectDir, null),
      codeGenerationRecordDir(projectDir, "u1-backend-api"),
      codeGenerationRecordDir(projectDir, "u2-admin-api"),
    ]);
  });
});

test("(a) a write to the active directive's own unit directory is trusted", () => {
  withFixture((projectDir) => {
    const units = [{ unit: "u1-backend-api" }, { unit: "u2-admin-api" }];
    mkdirSync(codeGenerationRecordDir(projectDir, "u1-backend-api"), {
      recursive: true,
    });
    const target = join(
      codeGenerationRecordDir(projectDir, "u1-backend-api"),
      "code-generation-plan.md",
    );
    expect(
      outsideTrustedCodeGenerationRecord(projectDir, [target], units),
    ).toBeUndefined();
  });
});

test("(b) a write to a DIFFERENT unit's directory, listed in `units`, is now trusted", () => {
  withFixture((projectDir) => {
    // Mirrors the reported deadlock: u1 is complete (its receipt went
    // stale), u2 is the currently active directive's unit. `units` still
    // lists both (gatherApprovalEvidence/knownUnits enumerates every
    // applicable unit, not just the active one).
    const units = [{ unit: "u1-backend-api" }, { unit: "u2-admin-api" }];
    mkdirSync(codeGenerationRecordDir(projectDir, "u1-backend-api"), {
      recursive: true,
    });
    const target = join(
      codeGenerationRecordDir(projectDir, "u1-backend-api"),
      "code-generation-plan.md",
    );
    // The active directive names u2, not u1 - the exact mismatch the bug
    // report describes. Trust must come from the full `units` set, not from
    // which single unit happens to be active.
    expect(
      outsideTrustedCodeGenerationRecord(projectDir, [target], units),
    ).toBeUndefined();
  });
});

test("(c) a write to a unit's directory NOT listed in `units` is still refused", () => {
  withFixture((projectDir) => {
    const units = [{ unit: "u1-backend-api" }, { unit: "u2-admin-api" }];
    mkdirSync(codeGenerationRecordDir(projectDir, "u3-unrelated-unit"), {
      recursive: true,
    });
    const target = join(
      codeGenerationRecordDir(projectDir, "u3-unrelated-unit"),
      "code-generation-plan.md",
    );
    expect(
      outsideTrustedCodeGenerationRecord(projectDir, [target], units),
    ).toBe(target);
  });
});

test("(d) a write outside every unit's code-generation directory is still refused", () => {
  withFixture((projectDir) => {
    const units = [{ unit: "u1-backend-api" }, { unit: "u2-admin-api" }];
    mkdirSync(join(projectDir, "src"), { recursive: true });
    const target = join(projectDir, "src", "index.ts");
    expect(
      outsideTrustedCodeGenerationRecord(projectDir, [target], units),
    ).toBe(target);
  });
});

test("multiple targets: trusted only when EVERY target is within some unit's directory", () => {
  withFixture((projectDir) => {
    const units = [{ unit: "u1-backend-api" }, { unit: "u2-admin-api" }];
    mkdirSync(codeGenerationRecordDir(projectDir, "u1-backend-api"), {
      recursive: true,
    });
    mkdirSync(codeGenerationRecordDir(projectDir, "u2-admin-api"), {
      recursive: true,
    });
    const trustedA = join(
      codeGenerationRecordDir(projectDir, "u1-backend-api"),
      "code-generation-plan.md",
    );
    const trustedB = join(
      codeGenerationRecordDir(projectDir, "u2-admin-api"),
      "unit-test-instructions.md",
    );
    expect(
      outsideTrustedCodeGenerationRecord(
        projectDir,
        [trustedA, trustedB],
        units,
      ),
    ).toBeUndefined();

    const untrusted = join(projectDir, "src", "index.ts");
    mkdirSync(join(projectDir, "src"), { recursive: true });
    expect(
      outsideTrustedCodeGenerationRecord(
        projectDir,
        [trustedA, untrusted],
        units,
      ),
    ).toBe(untrusted);
  });
});
