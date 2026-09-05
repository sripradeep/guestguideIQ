// Regression coverage for the practices-promote formatting bug: wrapped
// multi-line bullets in discovered-rules.md were stamped once per PHYSICAL
// line instead of once per LOGICAL bullet, and the blank line separating a
// populated section from the next `## ` heading was dropped. Both bugs live
// in the two small, pure helpers below (parseMarkdownBullets and
// ensureBlankLineBeforeHeading), which handlePracticesPromote
// (aidlc-state.ts) composes with the existing appendUnderHeading to build
// project.md's `## Mandated` / `## Forbidden` sections. Testing the helpers
// directly avoids needing the full CLI's workflow/audit-lock machinery while
// still exercising the exact logic responsible for the bug.
//
// Run with: bun test .claude/tools/aidlc-lib.practices-promote.test.ts

import { describe, expect, test } from "bun:test";
import {
  appendUnderHeading,
  ensureBlankLineBeforeHeading,
  extractMarkdownSection,
  parseMarkdownBullets,
  replaceSection,
} from "./aidlc-lib.js";

describe("parseMarkdownBullets", () => {
  test("joins a soft-wrapped multi-line bullet into one logical rule", () => {
    const section = [
      "- ALWAYS require a green CI check — build, lint, test, and coverage — on",
      "every pull request touching the backend before it can merge; a failing",
      "build, a lint failure, a test failure, or a coverage drop below the",
      "affirmed floor blocks the merge until it is green (Q5, refining the",
      "quality agent's candidate mandate from Step 3).",
    ].join("\n");

    const bullets = parseMarkdownBullets(section);

    expect(bullets).toEqual([
      "- ALWAYS require a green CI check — build, lint, test, and coverage — on " +
        "every pull request touching the backend before it can merge; a failing " +
        "build, a lint failure, a test failure, or a coverage drop below the " +
        "affirmed floor blocks the merge until it is green (Q5, refining the " +
        "quality agent's candidate mandate from Step 3).",
    ]);
  });

  test("keeps consecutive wrapped bullets separate", () => {
    const section = [
      "- ALWAYS use short-lived feature branches merged via pull request after",
      "review for backend work — direct commits to `main` are not the team's",
      "chosen work style going forward (Q1).",
      "- ALWAYS build the new backend in its own separate repository, not as a",
      "folder or workspace inside the existing marketing-site repo (Q2).",
    ].join("\n");

    const bullets = parseMarkdownBullets(section);

    expect(bullets.length).toBe(2);
    expect(bullets[0]).toBe(
      "- ALWAYS use short-lived feature branches merged via pull request after " +
        "review for backend work — direct commits to `main` are not the team's " +
        "chosen work style going forward (Q1).",
    );
    expect(bullets[1]).toBe(
      "- ALWAYS build the new backend in its own separate repository, not as a " +
        "folder or workspace inside the existing marketing-site repo (Q2).",
    );
  });

  test("treats a blank line between bullets as a paragraph break, not a join", () => {
    const section = ["- NEVER do the thing.", "", "- NEVER do the other thing."].join(
      "\n",
    );

    expect(parseMarkdownBullets(section)).toEqual([
      "- NEVER do the thing.",
      "- NEVER do the other thing.",
    ]);
  });

  test("skips comment and heading-like lines without merging them into a bullet", () => {
    const section = [
      "<!-- Populated by practices-discovery affirmation gate. -->",
      "<!-- Format: NEVER [behavior] (affirmed [date]) -->",
      "",
      "- NEVER commit secrets.",
    ].join("\n");

    expect(parseMarkdownBullets(section)).toEqual(["- NEVER commit secrets."]);
  });

  test("returns an empty array for a section with no bullets", () => {
    const section = "<!-- Populated by practices-discovery affirmation gate. -->\n";
    expect(parseMarkdownBullets(section)).toEqual([]);
  });
});

describe("ensureBlankLineBeforeHeading", () => {
  test("inserts a blank line when the section is glued to the next heading", () => {
    const content = [
      "## Forbidden",
      "",
      "- NEVER deploy without approval. (affirmed 2026-09-05)",
      "## Mandated",
      "",
      "<!-- placeholder -->",
    ].join("\n");

    const fixed = ensureBlankLineBeforeHeading(content, "## Forbidden");

    expect(fixed).toBe(
      [
        "## Forbidden",
        "",
        "- NEVER deploy without approval. (affirmed 2026-09-05)",
        "",
        "## Mandated",
        "",
        "<!-- placeholder -->",
      ].join("\n"),
    );
  });

  test("is idempotent when exactly one blank line already separates the sections", () => {
    const content = [
      "## Forbidden",
      "",
      "- NEVER deploy without approval. (affirmed 2026-09-05)",
      "",
      "## Mandated",
    ].join("\n");

    expect(ensureBlankLineBeforeHeading(content, "## Forbidden")).toBe(content);
  });

  test("collapses multiple blank lines before the next heading down to one", () => {
    const content = [
      "## Forbidden",
      "",
      "- NEVER deploy without approval. (affirmed 2026-09-05)",
      "",
      "",
      "",
      "## Mandated",
    ].join("\n");

    expect(ensureBlankLineBeforeHeading(content, "## Forbidden")).toBe(
      [
        "## Forbidden",
        "",
        "- NEVER deploy without approval. (affirmed 2026-09-05)",
        "",
        "## Mandated",
      ].join("\n"),
    );
  });

  test("is a no-op when the heading is absent", () => {
    const content = "## Mandated\n\n- ALWAYS do the thing.\n";
    expect(ensureBlankLineBeforeHeading(content, "## Forbidden")).toBe(content);
  });

  test("is a no-op when the section is the last one in the file", () => {
    const content = "## Mandated\n\n- ALWAYS do the thing.\n";
    expect(ensureBlankLineBeforeHeading(content, "## Mandated")).toBe(content);
  });
});

describe("practices-promote's Mandated/Forbidden build sequence", () => {
  // Reproduces the exact bug report scenario end-to-end using the same two
  // helpers handlePracticesPromote composes with appendUnderHeading: a
  // wrapped multi-line draft bullet must land as ONE stamped line, and the
  // section must still end with exactly one blank line before the next
  // heading.
  test("stamps a wrapped bullet once and preserves the blank line before the next heading", () => {
    const discoveredForbiddenDraft = [
      "- NEVER merge a pull request touching the backend unless the build, lint,",
      "test, and coverage checks are all green (Q5).",
    ].join("\n");

    const projectMdTemplate = [
      "## Forbidden",
      "",
      "<!-- Populated by practices-discovery affirmation gate. -->",
      "",
      "## Mandated",
      "",
      "<!-- Populated by practices-discovery affirmation gate. -->",
    ].join("\n");

    const today = "2026-09-05";
    const rules = parseMarkdownBullets(discoveredForbiddenDraft);
    expect(rules.length).toBe(1);

    let result = projectMdTemplate;
    for (const rule of rules) {
      result = appendUnderHeading(result, "## Forbidden", `${rule} (affirmed ${today})\n`);
    }
    result = ensureBlankLineBeforeHeading(result, "## Forbidden");

    expect(result).toBe(
      [
        "## Forbidden",
        "",
        "<!-- Populated by practices-discovery affirmation gate. -->",
        "",
        "- NEVER merge a pull request touching the backend unless the build, lint, " +
          "test, and coverage checks are all green (Q5). (affirmed 2026-09-05)",
        "",
        "## Mandated",
        "",
        "<!-- Populated by practices-discovery affirmation gate. -->",
      ].join("\n"),
    );
    // Exactly one `(affirmed ...)` stamp for the whole bullet, not one per
    // wrapped physical line.
    expect(result.match(/\(affirmed 2026-09-05\)/g)?.length).toBe(1);
  });

  // team.md's five sections are whole-section replacements (replaceSection),
  // not per-bullet stamping — no repeated-stamp bug there. But the LAST
  // replaced heading can still glue its content to the section that follows
  // it in the target file, for a different reason: draftSection is extracted
  // up to the next `## ` heading IN THE DRAFT, so it carries a trailing
  // blank line only when the draft happens to have a further heading after
  // it. When the draft's last replaced section is also the draft's last
  // heading, draftSection has no trailing blank line, and replaceSection
  // drops it directly against the target's own next heading.
  test("replaceSection + ensureBlankLineBeforeHeading restores spacing when the draft ends without a trailing blank line", () => {
    const teamPracticesDraft =
      ["## Code Style", "", "- Use ESLint and Prettier, enforced as a blocking PR check."].join(
        "\n",
      ) + "\n"; // ordinary trailing newline, but no further heading after Code Style

    const teamMdTemplate = [
      "## Code Style",
      "",
      "<!-- Project-specific specialisation. -->",
      "",
      "## Forbidden",
      "",
      "<!-- Team-specific forbidden patterns -->",
    ].join("\n");

    const draftSection = extractMarkdownSection(teamPracticesDraft, "## Code Style");
    let result = replaceSection(teamMdTemplate, "## Code Style", draftSection);
    result = ensureBlankLineBeforeHeading(result, "## Code Style");

    expect(result).toBe(
      [
        "## Code Style",
        "",
        "- Use ESLint and Prettier, enforced as a blocking PR check.",
        "",
        "## Forbidden",
        "",
        "<!-- Team-specific forbidden patterns -->",
      ].join("\n"),
    );
  });
});
