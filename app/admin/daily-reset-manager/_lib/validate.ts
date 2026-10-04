import { SECTIONS, type DailyResetRow } from "./types";

// Lightweight pre-publish content check (spec §43). Non-blocking — surfaces
// a "needs review" banner naming the problem, never prevents Nataly from
// publishing if she disagrees with the check.

const PLACEHOLDER_PATTERNS = [/lorem ipsum/i, /\btodo\b/i, /\[insert/i, /\bxxx\b/i, /placeholder/i];
const MAX_PLAIN_LENGTH = 400; // a one-line prompt/word shouldn't run to paragraphs
const MAX_RICHTEXT_LENGTH = 2500; // generous ceiling for a 2-4 paragraph section

export type ValidationIssue = { section: string; message: string };

export function validateContent(row: DailyResetRow): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const section of SECTIONS) {
    for (const field of section.fields) {
      const value = row[field.column as keyof DailyResetRow];
      const text = typeof value === "string" ? value : "";
      const plain = text.replace(/<[^>]+>/g, " ").trim();

      // scripture_text is allowed to be empty (needs_review flag covers
      // "AI wasn't confident enough to write the verse" on purpose).
      const isOptional = field.column === "scripture_text_en" || field.column === "scripture_text_es";
      if (!plain && !isOptional) {
        issues.push({ section: `${section.label} — ${field.label}`, message: "Empty" });
        continue;
      }
      if (PLACEHOLDER_PATTERNS.some((p) => p.test(plain))) {
        issues.push({ section: `${section.label} — ${field.label}`, message: "Looks like placeholder text" });
      }
      const ceiling = field.kind === "richtext" ? MAX_RICHTEXT_LENGTH : MAX_PLAIN_LENGTH;
      if (plain.length > ceiling) {
        issues.push({ section: `${section.label} — ${field.label}`, message: `Unusually long (${plain.length} chars)` });
      }
    }
  }

  if (row.needs_review) {
    issues.push({ section: "Scripture", message: "AI flagged this verse for review — confirm the text before publishing." });
  }

  return issues;
}
