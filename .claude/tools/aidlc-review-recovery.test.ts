#!/usr/bin/env bun
// Regression test for the advisory-class reviewer-recovery deadlock.
//
// Repro (see the bug report this fixes): an `advisory` stage (budget: 1
// normal pass) gets a READY verdict at iteration 1, the human clicks
// Request Changes (GATE_REJECTED), the artifact is edited to address the
// findings, and the documented one-time recovery review at the next ordinal
// (stage-protocol-reviewer.md §12a, "the engine permits exactly one recovery
// request at the next ordinal") should become reachable. Before the fix,
// `reviewAttemptWindow` treated GATE_REJECTED as an unconditional floor
// boundary: the pre-rejection terminal READY receipt fell out of the scan
// window before `freshReviewReceipts` ever saw it, so a later produces[]
// edit could never mark it `stale` (there was nothing left in view to
// invalidate) - `scopeStale` stayed permanently false for the rest of that
// attempt, `recoveryEligible` in aidlc-log.ts's handleReview never fired,
// and the review command hard-refused iteration 2 on the plain
// `iteration > budget` check instead. `aidlc-orchestrate.ts report
// --result revised` was then unreachable too, since the completion
// precondition (verifyReviewerPrecondition, aidlc-state.ts) reads the same
// receipts and saw neither a fresh verdict nor a legible stale one.
//
// This test drives the exact library-level sequence (STAGE_STARTED,
// REVIEW_REQUESTED/REVIEW_COMPLETED iteration 1, GATE_REJECTED, an
// ARTIFACT_UPDATED revision) through the real `freshReviewReceipts` /
// `reviewAttemptWindow` exports against a throwaway fixture workspace, using
// `reviewArtifactSnapshot` to compute real fingerprints so the fixture is
// byte-accurate rather than hand-guessed.
import { test, expect } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import {
  freshReviewReceipts,
  reviewAttemptWindow,
  reviewArtifactSnapshot,
  type ReviewFingerprintStage,
} from "./aidlc-lib.ts";

type TestStage = ReviewFingerprintStage & {
  reviewer: string;
  review_artifact: string;
  reviewer_max_iterations: number;
  review_class: "advisory" | "adversarial";
};

function auditBlock(
  event: string,
  timestamp: string,
  fields: Record<string, string>,
): string {
  let b = `\n## ${event}\n`;
  b += `**Timestamp**: ${timestamp}\n`;
  b += `**Event**: ${event}\n`;
  for (const [key, value] of Object.entries(fields)) {
    b += `**${key}**: ${value}\n`;
  }
  return `${b}\n---\n`;
}

function makeFixture(
  reviewClass: "advisory" | "adversarial" = "advisory",
): {
  root: string;
  stage: TestStage;
  artifactPath: string;
  auditPath: string;
  stateContent: string;
} {
  const root = mkdtempSync(join(tmpdir(), "aidlc-review-recovery-"));
  const intentDir = join(
    root,
    "aidlc",
    "spaces",
    "default",
    "intents",
    "demo-00000001",
  );
  mkdirSync(join(intentDir, "audit"), { recursive: true });
  const stageDir = join(intentDir, "inception", "requirements-analysis");
  mkdirSync(stageDir, { recursive: true });

  const stateContent =
    "# AI-DLC Workflow State\n\n" +
    "- **Current Stage**: requirements-analysis\n" +
    "- **Scope**: feature\n";
  writeFileSync(join(intentDir, "aidlc-state.md"), stateContent);

  // Mirrors requirements-analysis.md's real frontmatter (advisory, budget 1)
  // unless the caller asks for the adversarial (budget reviewer_max_iterations,
  // fresh-per-attempt) shape instead.
  const stage: TestStage = {
    slug: "requirements-analysis",
    phase: "inception",
    reviewer: "aidlc-product-lead-agent",
    review_artifact: "requirements",
    reviewer_max_iterations: 2,
    review_class: reviewClass,
    produces: ["requirements"],
  };

  const artifactPath = join(stageDir, "requirements.md");
  writeFileSync(artifactPath, "# Requirements\n\nOriginal content.\n");

  return {
    root,
    stage,
    artifactPath,
    auditPath: join(intentDir, "audit", "shard.md"),
    stateContent,
  };
}

test("advisory Request Changes + revision leaves the terminal receipt stale, not invisible", () => {
  const { root, stage, artifactPath, auditPath, stateContent } = makeFixture();
  try {
    let ts = 0;
    const nextTs = () => `2026-01-01T00:00:${String(ts++).padStart(2, "0")}Z`;
    let audit = "";
    const flush = () => writeFileSync(auditPath, audit);

    audit += auditBlock("STAGE_STARTED", nextTs(), {
      Stage: "requirements-analysis",
    });
    flush();

    // --- iteration 1: request ---
    const requestSnap = reviewArtifactSnapshot(root, stage);
    expect(requestSnap).not.toBeNull();
    const priorDigest =
      requestSnap!.appendix.length === 0
        ? "none"
        : `sha256:${createHash("sha256").update(requestSnap!.appendix).digest("hex")}`;
    audit += auditBlock("REVIEW_REQUESTED", nextTs(), {
      Stage: "requirements-analysis",
      Reviewer: "aidlc-product-lead-agent",
      Iteration: "1",
      "Artifact Fingerprint": requestSnap!.requestFingerprint,
      "Review Appendix Artifact": requestSnap!.appendixArtifact,
      "Review Appendix Offset": String(requestSnap!.appendixOffset),
      "Review Appendix Prior Digest": priorDigest,
      "Review Appendix Prior Length": String(requestSnap!.appendix.length),
    });
    flush();

    // Reviewer appends its terminal READY verdict.
    writeFileSync(
      artifactPath,
      "# Requirements\n\nOriginal content.\n\n" +
        "## Review\n**Verdict:** READY\n**Reviewer:** aidlc-product-lead-agent\n**Iteration:** 1\n",
    );
    const completedSnap = reviewArtifactSnapshot(root, stage);
    expect(completedSnap).not.toBeNull();
    audit += auditBlock("REVIEW_COMPLETED", nextTs(), {
      Stage: "requirements-analysis",
      Reviewer: "aidlc-product-lead-agent",
      Iteration: "1",
      Verdict: "READY",
      "Request Fingerprint": requestSnap!.requestFingerprint,
      "Artifact Fingerprint": completedSnap!.fingerprint,
      "Review Appendix Artifact": completedSnap!.appendixArtifact,
      "Review Appendix Offset": String(requestSnap!.appendixOffset),
      "Review Appendix Prior Digest": priorDigest,
      "Review Appendix Prior Length": String(requestSnap!.appendix.length),
    });
    flush();

    // Sanity: right after recording the READY verdict, coverage is fresh.
    let receipts = freshReviewReceipts(root, stateContent, stage);
    expect(receipts.stageVerdict).toBe("READY");
    expect(receipts.stageStale).toBe(false);

    // --- Human clicks Request Changes: GATE_REJECTED, nothing revised yet ---
    audit += auditBlock("GATE_REJECTED", nextTs(), {
      Stage: "requirements-analysis",
      Feedback: "fix R-01 and R-02",
    });
    flush();

    receipts = freshReviewReceipts(root, stateContent, stage);
    expect(receipts.stageVerdict).toBeNull();
    // The rejected receipt must be visibly STALE - not merely "not yet
    // reviewed" - or `recoveryEligible` in handleReview can never see it.
    expect(receipts.stageStale).toBe(true);
    expect(receipts.stageStaleProgress?.nextIteration).toBe(2);
    expect(receipts.stageStaleProgress?.recoverySpent).toBe(false);

    // --- Fix R-01 and R-02 (protocol's request-first delete removes the
    // stale `## Review` section along with the content edit) ---
    writeFileSync(artifactPath, "# Requirements\n\nFixed R-01 and R-02.\n");
    audit += auditBlock("ARTIFACT_UPDATED", nextTs(), {
      Tool: "Edit",
      File: artifactPath.replace(/\\/g, "/"),
    });
    flush();

    receipts = freshReviewReceipts(root, stateContent, stage);
    expect(receipts.stageStale).toBe(true);
    expect(receipts.stageStaleProgress?.nextIteration).toBe(2);

    // The floor must not have swallowed the pre-rejection request: the
    // recovery pass is documented to land "at the next ordinal" (2), which
    // requires iteration 1's REVIEW_REQUESTED to still be inside the window
    // aidlc-log.ts's reviewAttemptSummary counts from.
    const window = reviewAttemptWindow(root, stateContent, stage, {
      reviewClass: "advisory",
    });
    const requestsInWindow = window.events
      .slice(window.floorIdx + 1)
      .filter((e) => e.event === "REVIEW_REQUESTED").length;
    expect(requestsInWindow).toBe(1);

    // --- Recovery review at iteration 2: request, reviewer appends verdict,
    // and the receipt becomes fresh again (unblocking `report --result
    // revised`'s completion precondition) ---
    const recoverySnap = reviewArtifactSnapshot(root, stage);
    expect(recoverySnap).not.toBeNull();
    const recoveryPriorDigest =
      recoverySnap!.appendix.length === 0
        ? "none"
        : `sha256:${createHash("sha256").update(recoverySnap!.appendix).digest("hex")}`;
    audit += auditBlock("REVIEW_REQUESTED", nextTs(), {
      Stage: "requirements-analysis",
      Reviewer: "aidlc-product-lead-agent",
      Iteration: "2",
      Recovery: "stale-receipt",
      "Recovery Cause": "artifact",
      "Artifact Fingerprint": recoverySnap!.requestFingerprint,
      "Review Appendix Artifact": recoverySnap!.appendixArtifact,
      "Review Appendix Offset": String(recoverySnap!.appendixOffset),
      "Review Appendix Prior Digest": recoveryPriorDigest,
      "Review Appendix Prior Length": String(recoverySnap!.appendix.length),
    });
    flush();

    writeFileSync(
      artifactPath,
      "# Requirements\n\nFixed R-01 and R-02.\n\n" +
        "## Review\n**Verdict:** READY\n**Reviewer:** aidlc-product-lead-agent\n**Iteration:** 2\n",
    );
    const recoveryCompletedSnap = reviewArtifactSnapshot(root, stage);
    expect(recoveryCompletedSnap).not.toBeNull();
    audit += auditBlock("REVIEW_COMPLETED", nextTs(), {
      Stage: "requirements-analysis",
      Reviewer: "aidlc-product-lead-agent",
      Iteration: "2",
      Verdict: "READY",
      "Request Fingerprint": recoverySnap!.requestFingerprint,
      "Artifact Fingerprint": recoveryCompletedSnap!.fingerprint,
      "Review Appendix Artifact": recoveryCompletedSnap!.appendixArtifact,
      "Review Appendix Offset": String(recoverySnap!.appendixOffset),
      "Review Appendix Prior Digest": recoveryPriorDigest,
      "Review Appendix Prior Length": String(recoverySnap!.appendix.length),
    });
    flush();

    receipts = freshReviewReceipts(root, stateContent, stage);
    expect(receipts.stageVerdict).toBe("READY");
    expect(receipts.stageStale).toBe(false);
    expect(receipts.stageIteration).toBe(2);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("adversarial Request Changes still resets the attempt (no advisory exemption leak)", () => {
  // Guards the other side of the fix: the advisory exemption in
  // reviewAttemptWindow/reviewAttemptSummary must not leak into adversarial
  // stages, which rely on GATE_REJECTED resetting the floor to get a fresh
  // repair-loop budget "as at first entry" (stage-protocol-reviewer.md,
  // the Part 0 revision path) rather than the bounded one-shot recovery path.
  const { root, stage, artifactPath, auditPath, stateContent } =
    makeFixture("adversarial");
  try {
    let ts = 0;
    const nextTs = () => `2026-01-01T00:00:${String(ts++).padStart(2, "0")}Z`;
    let audit = "";
    const flush = () => writeFileSync(auditPath, audit);

    audit += auditBlock("STAGE_STARTED", nextTs(), {
      Stage: "requirements-analysis",
    });
    flush();

    const requestSnap = reviewArtifactSnapshot(root, stage)!;
    audit += auditBlock("REVIEW_REQUESTED", nextTs(), {
      Stage: "requirements-analysis",
      Reviewer: "aidlc-product-lead-agent",
      Iteration: "1",
      "Artifact Fingerprint": requestSnap.requestFingerprint,
      "Review Appendix Artifact": requestSnap.appendixArtifact,
      "Review Appendix Offset": String(requestSnap.appendixOffset),
      "Review Appendix Prior Digest": "none",
      "Review Appendix Prior Length": "0",
    });
    flush();

    writeFileSync(
      artifactPath,
      "# Requirements\n\nOriginal content.\n\n" +
        "## Review\n**Verdict:** NOT-READY\n**Reviewer:** aidlc-product-lead-agent\n**Iteration:** 1\n",
    );
    const completedSnap = reviewArtifactSnapshot(root, stage)!;
    audit += auditBlock("REVIEW_COMPLETED", nextTs(), {
      Stage: "requirements-analysis",
      Reviewer: "aidlc-product-lead-agent",
      Iteration: "1",
      Verdict: "NOT-READY",
      "Request Fingerprint": requestSnap.requestFingerprint,
      "Artifact Fingerprint": completedSnap.fingerprint,
      "Review Appendix Artifact": completedSnap.appendixArtifact,
      "Review Appendix Offset": String(requestSnap.appendixOffset),
      "Review Appendix Prior Digest": "none",
      "Review Appendix Prior Length": "0",
    });
    flush();

    // Human rejects, work gets revised.
    audit += auditBlock("GATE_REJECTED", nextTs(), {
      Stage: "requirements-analysis",
      Feedback: "address the findings",
    });
    flush();
    writeFileSync(artifactPath, "# Requirements\n\nRevised content.\n");
    audit += auditBlock("ARTIFACT_UPDATED", nextTs(), {
      Tool: "Edit",
      File: artifactPath.replace(/\\/g, "/"),
    });
    flush();

    // Unlike the advisory case, an adversarial GATE_REJECTED still resets the
    // floor: the pre-rejection request drops out of the window (a fresh
    // attempt gets a clean iteration-1 budget, not a "next ordinal" recovery
    // continuing from the old count), and the stale-receipt recovery signal
    // is correspondingly absent (there is no in-window receipt left for a
    // later edit to invalidate).
    const window = reviewAttemptWindow(root, stateContent, stage, {
      reviewClass: "adversarial",
    });
    const requestsInWindow = window.events
      .slice(window.floorIdx + 1)
      .filter((e) => e.event === "REVIEW_REQUESTED").length;
    expect(requestsInWindow).toBe(0);

    const receipts = freshReviewReceipts(root, stateContent, stage);
    expect(receipts.stageVerdict).toBeNull();
    expect(receipts.stageStale).toBe(false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("backward jump resets an advisory stage to a fresh attempt, not a stuck recovery deadlock", () => {
  // Repro: an advisory stage (budget 1) already used its one normal pass
  // AND its one bounded stale-receipt recovery pass (iteration 1
  // READY-with-findings -> GATE_REJECTED -> revision -> iteration 2
  // recovery READY) and was approved. Later, a `aidlc-jump.ts execute
  // --direction backward` resets this stage (its own `stages_reset` output
  // includes it) to fold in new information, and the artifact is edited
  // again post-jump. Unlike the same-attempt post-receipt-edit case above,
  // this is a NEW attempt: STAGE_JUMPED is an unconditional, class-agnostic
  // floor boundary in both reviewAttemptWindow (aidlc-lib.ts) and
  // reviewAttemptSummary (aidlc-log.ts) - it is not exempted for advisory
  // the way GATE_REJECTED is. So the pre-jump receipts and its already-spent
  // recovery pass must drop out of the window entirely, leaving a genuinely
  // fresh budget (iteration 1, no `Recovery: stale-receipt` flag needed) -
  // mirroring the "no advisory exemption leak" shape of the adversarial
  // GATE_REJECTED test above, but for the jump boundary specifically.
  const { root, stage, artifactPath, auditPath, stateContent } = makeFixture();
  try {
    let ts = 0;
    const nextTs = () => `2026-01-01T00:00:${String(ts++).padStart(2, "0")}Z`;
    let audit = "";
    const flush = () => writeFileSync(auditPath, audit);

    audit += auditBlock("STAGE_STARTED", nextTs(), {
      Stage: "requirements-analysis",
    });
    flush();

    // --- iteration 1: normal pass, READY-with-findings ---
    const requestSnap = reviewArtifactSnapshot(root, stage)!;
    audit += auditBlock("REVIEW_REQUESTED", nextTs(), {
      Stage: "requirements-analysis",
      Reviewer: "aidlc-product-lead-agent",
      Iteration: "1",
      "Artifact Fingerprint": requestSnap.requestFingerprint,
      "Review Appendix Artifact": requestSnap.appendixArtifact,
      "Review Appendix Offset": String(requestSnap.appendixOffset),
      "Review Appendix Prior Digest": "none",
      "Review Appendix Prior Length": "0",
    });
    flush();
    writeFileSync(
      artifactPath,
      "# Requirements\n\nOriginal content.\n\n" +
        "## Review\n**Verdict:** READY\n**Reviewer:** aidlc-product-lead-agent\n**Iteration:** 1\n",
    );
    const completedSnap = reviewArtifactSnapshot(root, stage)!;
    audit += auditBlock("REVIEW_COMPLETED", nextTs(), {
      Stage: "requirements-analysis",
      Reviewer: "aidlc-product-lead-agent",
      Iteration: "1",
      Verdict: "READY",
      "Request Fingerprint": requestSnap.requestFingerprint,
      "Artifact Fingerprint": completedSnap.fingerprint,
      "Review Appendix Artifact": completedSnap.appendixArtifact,
      "Review Appendix Offset": String(requestSnap.appendixOffset),
      "Review Appendix Prior Digest": "none",
      "Review Appendix Prior Length": "0",
    });
    flush();

    // --- Human Request Changes; revise; recovery pass at iteration 2 ---
    audit += auditBlock("GATE_REJECTED", nextTs(), {
      Stage: "requirements-analysis",
      Feedback: "fix R-01",
    });
    flush();
    writeFileSync(artifactPath, "# Requirements\n\nFixed R-01.\n");
    audit += auditBlock("ARTIFACT_UPDATED", nextTs(), {
      Tool: "Edit",
      File: artifactPath.replace(/\\/g, "/"),
    });
    flush();
    const recoverySnap = reviewArtifactSnapshot(root, stage)!;
    audit += auditBlock("REVIEW_REQUESTED", nextTs(), {
      Stage: "requirements-analysis",
      Reviewer: "aidlc-product-lead-agent",
      Iteration: "2",
      Recovery: "stale-receipt",
      "Recovery Cause": "artifact",
      "Artifact Fingerprint": recoverySnap.requestFingerprint,
      "Review Appendix Artifact": recoverySnap.appendixArtifact,
      "Review Appendix Offset": String(recoverySnap.appendixOffset),
      "Review Appendix Prior Digest": "none",
      "Review Appendix Prior Length": "0",
    });
    flush();
    writeFileSync(
      artifactPath,
      "# Requirements\n\nFixed R-01.\n\n" +
        "## Review\n**Verdict:** READY\n**Reviewer:** aidlc-product-lead-agent\n**Iteration:** 2\n",
    );
    const recoveryCompletedSnap = reviewArtifactSnapshot(root, stage)!;
    audit += auditBlock("REVIEW_COMPLETED", nextTs(), {
      Stage: "requirements-analysis",
      Reviewer: "aidlc-product-lead-agent",
      Iteration: "2",
      Verdict: "READY",
      "Request Fingerprint": recoverySnap.requestFingerprint,
      "Artifact Fingerprint": recoveryCompletedSnap.fingerprint,
      "Review Appendix Artifact": recoveryCompletedSnap.appendixArtifact,
      "Review Appendix Offset": String(recoverySnap.appendixOffset),
      "Review Appendix Prior Digest": "none",
      "Review Appendix Prior Length": "0",
    });
    flush();
    audit += auditBlock("GATE_APPROVED", nextTs(), {
      Stage: "requirements-analysis",
    });
    flush();

    // Sanity: the recovery pass is spent going into the jump.
    let receipts = freshReviewReceipts(root, stateContent, stage);
    expect(receipts.stageVerdict).toBe("READY");
    expect(receipts.stageStale).toBe(false);

    // --- New information arrives; a backward jump (aidlc-jump.ts execute)
    // resets this stage and re-enters it (mirrors STAGE_JUMPED + the
    // re-entry STAGE_STARTED that execute --direction backward emits for
    // its target) ---
    audit += auditBlock("STAGE_JUMPED", nextTs(), {
      Direction: "BACKWARD",
      Source: "domain-design",
      Target: "requirements-analysis",
      Scope: "feature",
    });
    flush();
    audit += auditBlock("STAGE_STARTED", nextTs(), {
      Stage: "requirements-analysis",
      Agent: "aidlc-product-agent",
    });
    flush();

    // The jump alone (before any new edit) already reads as a clean slate:
    // no verdict in view, and NOT "stale" - there is nothing left in the
    // window for a later edit to invalidate, which is the correct shape for
    // a brand new attempt rather than a carried-over stale receipt.
    receipts = freshReviewReceipts(root, stateContent, stage);
    expect(receipts.stageVerdict).toBeNull();
    expect(receipts.stageStale).toBe(false);

    // --- Fold in the new requirement post-jump ---
    writeFileSync(
      artifactPath,
      "# Requirements\n\nFixed R-01.\n\nFR9: locality branding.\n",
    );
    audit += auditBlock("ARTIFACT_UPDATED", nextTs(), {
      Tool: "Edit",
      File: artifactPath.replace(/\\/g, "/"),
    });
    flush();

    receipts = freshReviewReceipts(root, stateContent, stage);
    expect(receipts.stageVerdict).toBeNull();
    // Still not "stale": the pre-jump receipts (and the spent recovery pass
    // that would otherwise permanently deadlock further reviews) are OUT of
    // this attempt's window, not merely invalidated within it.
    expect(receipts.stageStale).toBe(false);

    // The window backing reviewAttemptSummary's requestCount in aidlc-log.ts
    // must show zero requests since the jump boundary - i.e. the next
    // review this stage requests is a normal iteration-1 pass on a fresh
    // budget, not iteration 3 continuing the pre-jump count (which would
    // incorrectly collide with the advisory budget of 1 and read as
    // permanently exhausted).
    const window = reviewAttemptWindow(root, stateContent, stage, {
      reviewClass: "advisory",
    });
    const requestsInWindow = window.events
      .slice(window.floorIdx + 1)
      .filter((e) => e.event === "REVIEW_REQUESTED").length;
    expect(requestsInWindow).toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
