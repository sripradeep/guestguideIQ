#!/usr/bin/env bun
// Regression test for the unbindable-source-floor bug in
// aidlc-testing-posture.ts's Plan Approval -> Code Generation flow.
//
// An intent with no recorded `repos` row makes workspaceSourceState()
// (aidlc-lib.ts) take the repos.length === 0 legacy/single-repo fallback. When
// that fallback's source identity is unresolvable -- e.g. `.aidlc/
// worktree-meta.json` exists but cannot be parsed, mirroring "the git-based
// source-baseline computation can't resolve cleanly" -- workspaceSourceFingerprint()
// legitimately returns null, and the active Code Generation directive records
// `code_generation_source_sha256: "unbindable"` (UNBINDABLE_FINGERPRINT) as its
// authority.sourceFloor (see codeGenerationSourceFloorForPublication in
// aidlc-lib.ts).
//
// Five call sites in this module used to compare a LIVE
// workspaceSourceFingerprint(projectDir) result -- a real sha256 hash, or null
// on failure -- against that sourceFloor without checking for the
// UNBINDABLE_FINGERPRINT sentinel first. Since workspaceSourceFingerprint can
// never literally return the string "unbindable", every such comparison was a
// structural no-op that always failed whenever the source floor was
// legitimately unbindable, completely blocking Plan Approval for Code
// Generation on any such project (reproduced live on a real intent with no
// recorded `repos` row).
//
// This drives the real sequence -- decision (evidence) -> challenge ->
// response -> recordPlanApprovalReceipt -> evaluateCodeGenerationApproval ->
// beginCodeGeneration -- end to end against a throwaway fixture workspace and
// asserts it succeeds despite the source floor being unbindable throughout.
import { test, expect } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import {
  appendIntentToRegistry,
  workspaceSourceFingerprint,
  UNBINDABLE_FINGERPRINT,
  type ActiveDirectiveMarker,
} from "./aidlc-lib.ts";
import {
  resolveTestingPosture,
  renderTestingContract,
  resolveCodeGenerationAuthority,
  approvalFingerprint,
  codeGenerationRecordDir,
  codeGenerationPlanApprovalQuestionEvidence,
  recordPlanApprovalChallenge,
  recordPlanApprovalHumanResponse,
  recordPlanApprovalReceipt,
  evaluateCodeGenerationApproval,
  beginCodeGeneration,
} from "./aidlc-testing-posture.ts";

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf-8").digest("hex");
}

test("Plan Approval -> Code Generation succeeds when the source floor is legitimately unbindable (no recorded repos row)", () => {
  const root = mkdtempSync(join(tmpdir(), "aidlc-unbindable-source-"));
  const projectDir = realpathSync(root);
  try {
    // 1. Force workspaceSourceFingerprint() to legitimately return null. An
    // intent with no recorded `repos` row takes the repos.length === 0
    // fallback in workspaceSourceState(), which fails closed when
    // `.aidlc/worktree-meta.json` exists but cannot be parsed.
    mkdirSync(join(projectDir, ".aidlc"), { recursive: true });
    writeFileSync(
      join(projectDir, ".aidlc", "worktree-meta.json"),
      "{not valid json",
    );
    expect(workspaceSourceFingerprint(projectDir)).toBeNull();

    // 2. Register exactly one intent with NO `repos` field (intentRepos()
    // then returns []), and its record dir so activeIntent() auto-selects it
    // as the lone record.
    const dirName = "260905-backend-services-spec-deadbeef";
    const uuid = "deadbeef-0000-4000-8000-000000000000";
    appendIntentToRegistry(projectDir, {
      uuid,
      slug: "backend-services-spec",
      dirName,
      status: "in-flight",
    });
    const recordDir = join(
      projectDir,
      "aidlc",
      "spaces",
      "default",
      "intents",
      dirName,
    );
    mkdirSync(recordDir, { recursive: true });
    const stateContent =
      "# AI-DLC Workflow State\n\n" +
      "- **Current Stage**: code-generation\n" +
      "- **Scope**: feature\n";
    writeFileSync(join(recordDir, "aidlc-state.md"), stateContent);

    // 3. Hand-write the active directive marker the way `next` would publish
    // it for code-generation when the source floor cannot bind: literally
    // "unbindable" (UNBINDABLE_FINGERPRINT), stage-level (no `unit`).
    const stateSha256 = sha256Hex(stateContent);
    const marker: ActiveDirectiveMarker = {
      version: 2,
      stage: "code-generation",
      state_sha256: stateSha256,
      project_sha256: sha256Hex(projectDir),
      intent_uuid: uuid,
      state_present: true,
      code_generation_source_sha256: UNBINDABLE_FINGERPRINT,
      owner_session: "test-session",
      owner_epoch: 0,
      context_epoch: 0,
      kind: "run-stage",
      revision: 1,
      delivery: "issued",
      needs_rehydrate: false,
      event_sequence: 0,
      human_sequence: 0,
      engine_sequence: 0,
      conversation_sequence: 0,
      stop_count: 0,
      active_attempt: {
        command_kind: "next",
        command_sha256: sha256Hex("test-command"),
        issued_state_sha256: stateSha256,
        session_id: "test-session",
        owner_epoch: 0,
        context_epoch: 0,
        status: "settled",
      },
    };
    writeFileSync(
      join(recordDir, ".aidlc-active-directive.json"),
      `${JSON.stringify(marker, null, 2)}\n`,
    );

    const target = { unit: null };
    const authority = resolveCodeGenerationAuthority(projectDir, target);
    expect(authority.sourceFloor).toBe(UNBINDABLE_FINGERPRINT);

    // 4. Real plan + instructions + Testing Contract, and a questions file
    // carrying the matching approval fingerprint (mirrors the `fingerprint`
    // CLI subcommand's own computation, done before the question is asked).
    const stageDir = codeGenerationRecordDir(projectDir, null);
    mkdirSync(stageDir, { recursive: true });
    const contract = resolveTestingPosture(projectDir);
    const planBody =
      "# Code Generation Plan\n\nImplement the thing.\n\n" +
      renderTestingContract(contract);
    const instructionsBody =
      "# Unit Test Instructions\n\nCover the happy path and two edge cases.\n";
    writeFileSync(join(stageDir, "code-generation-plan.md"), planBody);
    writeFileSync(
      join(stageDir, "unit-test-instructions.md"),
      instructionsBody,
    );
    const fingerprint = approvalFingerprint(
      planBody,
      instructionsBody,
      contract.contract_sha256,
      authority,
    );
    const questionsPath = join(stageDir, "code-generation-questions.md");
    const questionsFor = (answer: string) =>
      "# Code Generation Questions\n\n" +
      "## Plan Approval\n\n" +
      "Approve the plan above?\n\n" +
      `[Answer]: ${answer}\n` +
      `[Approval Fingerprint]: ${fingerprint}\n`;
    writeFileSync(questionsPath, questionsFor(""));

    const session = "test-session";

    // 5. decision -> challenge.
    const decisionEvidence = codeGenerationPlanApprovalQuestionEvidence(
      projectDir,
      target,
      questionsPath,
      "",
    );
    recordPlanApprovalChallenge(projectDir, decisionEvidence, session, [
      "Approve Plan",
      "Request Changes",
    ]);

    // 6. response -- the human's literal chat reply.
    expect(
      recordPlanApprovalHumanResponse(projectDir, session, "Approve Plan")
        .recorded,
    ).toBe(true);

    // 7. The conductor records the answer on the questions file, then
    // recordPlanApprovalReceipt() -- the first two of the five previously
    // broken call sites (the pre-write and post-write source checks).
    writeFileSync(questionsPath, questionsFor("Approve Plan"));
    const answerEvidence = codeGenerationPlanApprovalQuestionEvidence(
      projectDir,
      target,
      questionsPath,
      "Approve Plan",
    );
    expect(() =>
      recordPlanApprovalReceipt(
        projectDir,
        answerEvidence,
        session,
        "Approve Plan",
      ),
    ).not.toThrow();

    // 8. evaluateCodeGenerationApproval() -- the third previously broken site
    // (receiptValid).
    const approval = evaluateCodeGenerationApproval(projectDir, target);
    expect(approval.reason).toBe("approved");
    expect(approval.ok).toBe(true);
    expect(approval.receiptValid).toBe(true);

    // 9. beginCodeGeneration() -- the fourth and fifth previously broken
    // sites (the source-before and source-after checks around the
    // generation boundary).
    expect(() => beginCodeGeneration(projectDir, target)).not.toThrow();

    // The live workspace source was unresolvable throughout; the sentinel
    // guard is what let every check above pass despite that.
    expect(workspaceSourceFingerprint(projectDir)).toBeNull();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
