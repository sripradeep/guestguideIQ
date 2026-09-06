#!/usr/bin/env bun
// Regression test for the "Status" cell hard-parse-failure bug.
//
// Repro (see the bug report this fixes): during a requirements-analysis
// recovery review (intent 260905-backend-services-spec, iteration 2), the
// reviewer agent appended a `## Review` section whose Findings table had a
// full explanatory sentence in the `Status` column instead of a bare token
// (e.g. `Resolved — FR3.5 (added) states the locality-brand is determined by
// the signup domain, per the human's Q22 answer (A); ...`). Before this fix,
// `validFindingStatus` required an exact match against the enum, so
// `parseReviewArtifact` threw `invalid finding status "..."` - a hard error
// that crashed `aidlc-review-brief.ts review` (and therefore the entire
// gate-presentation flow, since stage-protocol-reviewer.md requires that
// tool's stdout verbatim at every reviewer-backed gate). Because the review
// artifact was already frozen by aidlc-review-freeze.ts's terminal-receipt
// guard, there was no way to hand-fix the cell without a full human
// Request-Changes cycle - which itself needs a successfully rendered gate,
// producing a chicken-and-egg deadlock.
//
// The fix: recognize a valid status token followed by a real delimiter
// (whitespace, colon, hyphen, or em/en dash) as a prefix, fold the remainder
// into a display-only `statusDetail` that never affects the canonical
// `status` value (openness checks, disposition matching, and fingerprints
// all key off `status` alone), and render it back into the Status cell for
// human legibility instead of throwing.
import { test, expect } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  parseReviewArtifact,
  renderFindingsContext,
  renderReviewBrief,
  main,
} from "./aidlc-review-brief.ts";
import { type ReviewFingerprintStage } from "./aidlc-lib.ts";

// The exact malformed rows from the bug report (R-06's sentence lightly
// trimmed; the mechanism under test - the em-dash-delimited prefix and the
// long trailing prose - is preserved verbatim).
const REVIEW_SECTION_MALFORMED = `# Requirements

## Functional Requirements

FR3.5: Locality-brand is determined by the signup domain.
FR9.7: Locality-brand is set once at signup and does not change afterward.

## Review

**Verdict:** READY
**Reviewer:** aidlc-product-lead-agent
**Date:** 2026-01-01T00:00:00Z
**Iteration:** 2

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-06 | Major | requirements.md > FR3.5 | Locality-brand determination was unclear | Clarify how locality-brand is set | Resolved — FR3.5 (added) states the locality-brand is determined by the signup domain, per the human's Q22 answer (A); FR9.7 (added) confirms it is set once at signup and not expected to change afterward. FR3.5 does not conflict with the wizard steps in FR3.1-FR3.4. |
| R-07 | Major | requirements.md > FR9.7 | Whether locality-brand can change post-signup was unclear | State whether locality-brand is mutable after signup | Resolved — FR9.7 (added) confirms the locality-brand is fixed at signup and never revisited. |

### Summary

All findings addressed.
`;

test("parseReviewArtifact tolerates a Status cell with prose after the recognized token instead of throwing", () => {
  const context = parseReviewArtifact(
    REVIEW_SECTION_MALFORMED,
    "requirements.md",
  );
  expect(context).not.toBeNull();
  expect(context!.findings).toHaveLength(2);

  const r06 = context!.findings.find((f) => f.id === "R-06")!;
  expect(r06.status).toBe("Resolved");
  expect(r06.statusDetail).toBeDefined();
  expect(r06.statusDetail!.startsWith("FR3.5 (added) states")).toBe(true);

  const r07 = context!.findings.find((f) => f.id === "R-07")!;
  expect(r07.status).toBe("Resolved");
  expect(r07.statusDetail).toBeDefined();
  expect(r07.statusDetail!.startsWith("FR9.7 (added) confirms")).toBe(true);
});

test("parseReviewArtifact recognizes a colon delimiter too", () => {
  const content = `## Review

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Minor | a.md > X | Something | Fix it | Unresolved: still missing the acceptance criterion |
`;
  const context = parseReviewArtifact(content, "a.md");
  const finding = context!.findings[0];
  expect(finding.status).toBe("Unresolved");
  expect(finding.statusDetail).toBe("still missing the acceptance criterion");
  // The canonical status (not the prose) drives openness checks downstream.
  expect(finding.status === "New" || finding.status === "Unresolved").toBe(
    true,
  );
});

test("an extremely long trailing detail is truncated with a note rather than left unbounded", () => {
  const longSentence = "word ".repeat(80).trim();
  const content = `## Review

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Minor | a.md > X | Something | Fix it | Resolved — ${longSentence} |
`;
  const context = parseReviewArtifact(content, "a.md");
  const finding = context!.findings[0];
  expect(finding.status).toBe("Resolved");
  expect(finding.statusDetail!.length).toBeLessThan(longSentence.length);
  expect(finding.statusDetail!.endsWith("… (truncated)")).toBe(true);
});

test("a status with no recognized token and no delimiter is still rejected", () => {
  const content = `## Review

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Minor | a.md > X | Something | Fix it | Not sure yet |
`;
  expect(() => parseReviewArtifact(content, "a.md")).toThrow(
    /invalid finding status/,
  );
});

test("a token immediately followed by more letters (no delimiter) is not mis-parsed as that token", () => {
  const content = `## Review

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Minor | a.md > X | Something | Fix it | Newer requirement surfaced |
`;
  // "Newer requirement surfaced" must not be accepted as status "New" with
  // detail "er requirement surfaced" - there is no real delimiter after "New".
  expect(() => parseReviewArtifact(content, "a.md")).toThrow(
    /invalid finding status/,
  );
});

test("renderFindingsContext folds the detail back into the Status cell without breaking the table", () => {
  const context = parseReviewArtifact(
    REVIEW_SECTION_MALFORMED,
    "requirements.md",
  )!;
  const rendered = renderFindingsContext([context]);
  const r06Line = rendered.split("\n").find((line) => line.includes("R-06"))!;
  expect(r06Line).toContain("Resolved — FR3.5 (added) states");
  // Exactly six data cells plus the two delimiter pipes at the ends: seven
  // total "|" separators is wrong to assert directly since prose is pipe-free
  // here, but the row must still parse back into six cells.
  const cells = r06Line.trim().slice(1, -1).split("|");
  expect(cells).toHaveLength(6);
});

type TestStage = ReviewFingerprintStage & {
  reviewer: string;
  review_artifact: string;
  reviewer_max_iterations: number;
  review_class: "advisory" | "adversarial";
  name: string;
};

function makeFixture(): {
  root: string;
  stage: TestStage;
  artifactPath: string;
} {
  const root = mkdtempSync(join(tmpdir(), "aidlc-review-brief-"));
  const intentDir = join(
    root,
    "aidlc",
    "spaces",
    "default",
    "intents",
    "260905-backend-services-spec",
  );
  mkdirSync(join(intentDir, "audit"), { recursive: true });
  const stageDir = join(intentDir, "inception", "requirements-analysis");
  mkdirSync(stageDir, { recursive: true });

  writeFileSync(
    join(intentDir, "aidlc-state.md"),
    "# AI-DLC Workflow State\n\n" +
      "- **Current Stage**: requirements-analysis\n" +
      "- **Scope**: feature\n",
  );

  const stage: TestStage = {
    slug: "requirements-analysis",
    phase: "inception",
    name: "Requirements Analysis",
    reviewer: "aidlc-product-lead-agent",
    review_artifact: "requirements",
    reviewer_max_iterations: 2,
    review_class: "advisory",
    produces: ["requirements"],
  };

  const artifactPath = join(stageDir, "requirements.md");
  writeFileSync(artifactPath, REVIEW_SECTION_MALFORMED);

  return { root, stage, artifactPath };
}

test("renderReviewBrief renders the exact reported scenario end-to-end instead of crashing", () => {
  const { root, stage } = makeFixture();
  try {
    const brief = renderReviewBrief(root, stage, "revision");
    expect(brief).toContain("**Stage:** Requirements Analysis");
    expect(brief).toContain("R-06");
    expect(brief).toContain("R-07");
    expect(brief).toContain("Resolved — FR3.5 (added) states");
    // Both findings resolved -> no open findings remain.
    expect(brief).toContain(
      "**Review outcome:** No open findings remain.",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("aidlc-review-brief.ts `review` subcommand (the literal reported command) now succeeds", () => {
  const { root } = makeFixture();
  const chunks: string[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  // Capture stdout the same way the CLI's `main()` writes its brief, without
  // spawning a subprocess - `main` is the exact function `import.meta.main`
  // invokes for `bun .claude/tools/aidlc-review-brief.ts review ...`.
  (process.stdout.write as unknown) = ((chunk: string) => {
    chunks.push(String(chunk));
    return true;
  }) as typeof process.stdout.write;
  try {
    expect(() =>
      main([
        "review",
        "--stage",
        "requirements-analysis",
        "--why",
        "revision",
        "--project-dir",
        root,
      ])
    ).not.toThrow();
  } finally {
    process.stdout.write = originalWrite;
    rmSync(root, { recursive: true, force: true });
  }
  const output = chunks.join("");
  expect(output).toContain("R-06");
  expect(output).toContain("Resolved — FR3.5 (added) states");
});
